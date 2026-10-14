"use server";

import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/data";
import { aiCompleteJson, aiConfigured, getStoredPrompt } from "@/lib/ai/client";
import { queueInferences, type InferenceProposal } from "@/lib/inference/queue";
import { markdownToHtml } from "@/lib/markdown";
import type { ActionResult } from "@/app/(app)/contacts/actions";
import {
  CALL_TYPE_LABELS,
  extractionResponseSchema,
  normalizeEvidence,
  notesResponseSchema,
  resolvePerson,
  splitFullName,
  storedExtractionSchema,
  type ExtractedProposal,
  type StoredExtraction,
} from "@/lib/ingest/extract";

const MAX_SOURCE = 200_000;
const CONTEXT_CONTACTS = 300;
const KB_CHARS = 6000;

const ingestInput = z.object({
  account_id: z.uuid(),
  title: z.string().max(300).optional(),
  text: z.string().min(50).max(MAX_SOURCE),
});

/** Fails the document (keeping the raw source) and returns the error for the toast. */
async function markFailed(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  documentId: string,
  message: string,
): Promise<ActionResult> {
  await supabase
    .from("documents")
    .update({ status: "failed", error: message.slice(0, 1000) })
    .eq("id", documentId);
  revalidatePath("/ingest");
  revalidatePath(`/ingest/${documentId}`);
  return { ok: false, error: message };
}

function proposalsFor(
  subjectId: string,
  subjectType: "contact" | "account",
  items: ExtractedProposal[] | undefined,
  documentId: string,
): InferenceProposal[] {
  return (items ?? []).map((pr) => ({
    subject_type: subjectType,
    subject_id: subjectId,
    kind: pr.kind,
    value: pr.value,
    confidence: pr.confidence,
    evidence: normalizeEvidence(pr.evidence),
    rationale: pr.rationale,
    source: "ai",
    documentId,
  }));
}

/**
 * The live moment: paste a transcript or note, and the pipeline runs in one
 * action — raw source stored first, call type + notes generated, extraction
 * resolved against the account's real contacts. Notes append (they are the
 * seller's own record); every structured change waits in the review queue.
 */
export async function ingestDocument(input: z.input<typeof ingestInput>): Promise<ActionResult<{ documentId: string }>> {
  const { supabase, user } = await requireUser();
  const parsed = ingestInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Paste at least 50 characters of transcript or notes (200k max)." };
  const { account_id, title, text } = parsed.data;
  if (!aiConfigured()) return { ok: false, error: "AI is not configured. Add ANTHROPIC_API_KEY to .env.local and restart." };

  const { data: account } = (await supabase.from("accounts").select("id, name").eq("id", account_id).maybeSingle()) as {
    data: { id: string; name: string } | null;
  };
  if (!account) return { ok: false, error: "Account not found." };

  // The raw source is stored before any model call: provenance survives failures.
  const { data: doc, error: docError } = await supabase
    .from("documents")
    .insert({ account_id, title: title?.trim() || "Untitled source", raw_text: text, status: "processing" })
    .select("id")
    .single();
  if (docError || !doc) return { ok: false, error: docError?.message ?? "Could not store the source." };

  const [orgRows, contactRows, initiativeRows, challengeRows, kbRows] = await Promise.all([
    supabase.from("orgs").select("name, aliases, buying_role").eq("account_id", account_id),
    supabase
      .from("contacts")
      .select("id, full_name, title, email, linkedin_public_url, org_id, personas, seniority_level, is_key")
      .eq("account_id", account_id)
      .order("is_key", { ascending: false })
      .limit(CONTEXT_CONTACTS),
    supabase.from("initiatives").select("code, name").eq("account_id", account_id),
    supabase.from("challenges").select("code, name").eq("account_id", account_id),
    supabase
      .from("research_docs")
      .select("title, body_text")
      .eq("scope", "seller")
      .in("doc_type", ["product_kb", "personas"])
      .order("doc_type")
      .limit(2),
  ]);
  const orgs = orgRows.data ?? [];
  const contacts = contactRows.data ?? [];
  const kb = (kbRows.data ?? []).map((d) => ({ title: d.title as string, text: (d.body_text ?? "").slice(0, KB_CHARS) }));

  const source = { title: title?.trim() || "Untitled source", text };
  let notes, extraction;
  try {
    const notesPrompt = await getStoredPrompt(supabase, "call_notes");
    notes = notesResponseSchema.parse(
      await aiCompleteJson<unknown>({
        model: notesPrompt.model,
        system: notesPrompt.system_prompt,
        user: JSON.stringify({ account: account.name, factory_knowledge_base: kb, source }),
        maxTokens: 8192,
      }),
    );
    const extractPrompt = await getStoredPrompt(supabase, "context_extraction");
    extraction = extractionResponseSchema.parse(
      await aiCompleteJson<unknown>({
        model: extractPrompt.model,
        system: extractPrompt.system_prompt,
        user: JSON.stringify({
          account,
          orgs,
          contacts: contacts.map((c) => ({
            full_name: c.full_name as string,
            title: c.title as string | null,
            email: c.email as string | null,
            linkedin_url: c.linkedin_public_url as string | null,
          })),
          initiatives: initiativeRows.data ?? [],
          challenges: challengeRows.data ?? [],
          source,
        }),
        maxTokens: 8192,
      }),
    );
  } catch (e) {
    return markFailed(supabase, doc.id, e instanceof Error ? e.message : "The AI call failed.");
  }

  // Entity resolution: the model proposes matches, code verifies them exactly.
  const stored: StoredExtraction = {
    ...extraction,
    people: extraction.people.map((p) => ({ ...p, contact_id: resolvePerson(p, contacts).contactId })),
    created: {},
  };

  const docTitle = title?.trim() || `${account.name} — ${CALL_TYPE_LABELS[notes.call_type]}`;
  const today = format(new Date(), "MMM d, yyyy");
  const notesHtml = markdownToHtml(notes.notes_markdown);

  // Auto-apply the notes only: they are the call's own record and append-only.
  // Every structured change below goes to the review queue.
  const { error: noteError } = await supabase.from("notes").insert({
    account_id,
    body_html: `<h3>Call notes — ${docTitle} — ${today}</h3>\n${notesHtml}`,
    source: "ai",
  });
  if (noteError) return markFailed(supabase, doc.id, `Notes were generated but not saved: ${noteError.message}`);

  const proposals: InferenceProposal[] = [
    ...proposalsFor(account_id, "account", extraction.account_proposals, doc.id),
  ];
  for (const p of stored.people) {
    if (!p.contact_id) continue;
    proposals.push(...proposalsFor(p.contact_id, "contact", p.proposals, doc.id));
    if (p.note?.trim()) {
      await supabase.from("notes").insert({
        contact_id: p.contact_id,
        body_html: `<h3>${docTitle} — ${today}</h3>\n${markdownToHtml(p.note)}`,
        source: "ai",
      });
    }
  }
  let queued = 0;
  try {
    queued = await queueInferences(supabase, user.id, proposals);
  } catch (e) {
    return markFailed(supabase, doc.id, e instanceof Error ? e.message : "Queueing the proposals failed.");
  }

  const { error: updateError } = await supabase
    .from("documents")
    .update({ title: docTitle, call_type: notes.call_type, notes_html: notesHtml, extraction: stored, status: "done" })
    .eq("id", doc.id);
  if (updateError) return markFailed(supabase, doc.id, `Saving the document failed: ${updateError.message}`);

  await logActivity(
    supabase,
    "account",
    account_id,
    "ingest",
    { document_id: doc.id, call_type: notes.call_type, queued },
    "ai",
  );
  revalidatePath("/ingest");
  revalidatePath(`/ingest/${doc.id}`);
  revalidatePath(`/accounts/${account_id}`);
  revalidatePath("/inferences");
  revalidatePath("/contacts");
  return { ok: true, data: { documentId: doc.id } };
}

/**
 * Creates a contact for a person the extraction found but could not match, and
 * only then queues their proposals — they finally have a subject to attach to.
 * The stored extraction is the authority; the client sends only the name.
 */
export async function createContactFromExtraction(
  documentId: string,
  personName: string,
): Promise<ActionResult<{ contactId: string }>> {
  const { supabase, user } = await requireUser();
  if (!documentId || !personName.trim()) return { ok: false, error: "Pick a person to add." };
  const { data: docRow } = (await supabase
    .from("documents")
    .select("id, account_id, status, extraction")
    .eq("id", documentId)
    .maybeSingle()) as {
    data: { id: string; account_id: string; status: string; extraction: Record<string, unknown> } | null;
  };
  if (!docRow || docRow.status !== "done") return { ok: false, error: "This document has no extraction to apply." };
  const stored = storedExtractionSchema.safeParse(docRow.extraction);
  if (!stored.success) return { ok: false, error: "This document has no extraction to apply." };
  const person = stored.data.people.find((p) => p.name === personName.trim() && !p.contact_id);
  if (!person) return { ok: false, error: "That person is not waiting in this document." };

  // Exact-name guard: matches the resolution rules — link, don't duplicate.
  const { data: accountContacts } = await supabase
    .from("contacts")
    .select("id, full_name")
    .eq("account_id", docRow.account_id);
  const want = person.name.toLowerCase();
  const existing = (accountContacts ?? []).find((c) => c.full_name.toLowerCase() === want);
  if (existing) return { ok: false, error: `${existing.full_name} already exists in this account.` };

  let org_id: string | null = null;
  if (person.org) {
    const { data: orgs } = await supabase.from("orgs").select("id, name, aliases").eq("account_id", docRow.account_id);
    const orgWant = person.org.toLowerCase();
    const o = (orgs ?? []).find(
      (o: { id: string; name: string; aliases: string[] }) =>
        o.name.toLowerCase() === orgWant || o.aliases.some((a) => a.toLowerCase() === orgWant),
    );
    if (o) org_id = o.id;
  }

  const { first_name, last_name } = splitFullName(person.name);
  const { data: contact, error } = (await supabase
    .from("contacts")
    .insert({
      account_id: docRow.account_id,
      org_id,
      first_name,
      last_name,
      title: person.title ?? null,
      email: person.email ?? null,
      linkedin_public_url: person.linkedin_url ?? null,
    })
    .select("id")
    .single()) as { data: { id: string }; error: { message: string } | null };
  if (error || !contact) return { ok: false, error: error?.message ?? "Could not create the contact." };

  await queueInferences(supabase, user.id, proposalsFor(contact.id, "contact", person.proposals, documentId));
  if (person.note?.trim()) {
    const today = format(new Date(), "MMM d, yyyy");
    await supabase.from("notes").insert({
      contact_id: contact.id,
      body_html: `<h3>Added from ingest — ${today}</h3>\n${markdownToHtml(person.note)}`,
      source: "ai",
    });
  }

  const people = stored.data.people.map((p) => (p.name === person.name ? { ...p, contact_id: contact.id } : p));
  await supabase
    .from("documents")
    .update({ extraction: { ...stored.data, people, created: { ...(stored.data.created ?? {}), [person.name]: contact.id } } })
    .eq("id", documentId);

  await logActivity(supabase, "contact", contact.id, "created_from_ingest", { document_id: documentId }, "ai");
  revalidatePath(`/ingest/${documentId}`);
  revalidatePath(`/accounts/${docRow.account_id}`);
  revalidatePath("/contacts");
  revalidatePath("/inferences");
  return { ok: true, data: { contactId: contact.id } };
}

/** Removes a failed or unwanted source. Proposals keep their audit trail. */
export async function deleteDocument(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data, error } = (await supabase
    .from("documents")
    .delete()
    .eq("id", id)
    .select("account_id")
    .maybeSingle()) as { data: { account_id: string } | null; error: { message: string } | null };
  if (error) return { ok: false, error: error.message };
  if (data?.account_id) revalidatePath(`/accounts/${data.account_id}`);
  revalidatePath("/ingest");
  return { ok: true };
}
