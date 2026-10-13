"use server";

import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/data";
import { geocodeCached, placeColumns } from "@/lib/geocode-server";
import type { Place } from "@/lib/geocode";
import { aiCompleteJson, aiConfigured, getStoredPrompt } from "@/lib/ai/client";
import { queueInferences, type InferenceProposal } from "@/lib/inference/queue";
import { markdownToHtml } from "@/lib/markdown";
import { getContact } from "@/lib/data";

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

const quality = z.enum(["good", "questionable", "bad"]).nullable();
const confidence = z.enum(["confirmed", "medium", "low"]).nullable();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable();
const text = z.string().max(20000).nullable();

// Seller-editable contact columns. Anything not listed here cannot be written from the UI.
const contactPatch = z
  .object({
    first_name: z.string().max(200),
    last_name: z.string().max(200),
    title: text,
    headline: text,
    summary: text,
    job_description: text,
    location: text,
    email: z.string().max(320).nullable(),
    email_quality: quality,
    phone: z.string().max(60).nullable(),
    phone_quality: quality,
    seniority: z.enum(["c_level", "vp", "director", "manager", "ic"]).nullable(),
    is_key: z.boolean(),
    key_reasoning: text,
    personas: z.array(z.string().max(100)).max(30),
    statuses: z.array(z.string().max(100)).max(30),
    last_contacted: isoDate,
    account_id: z.uuid().nullable(),
    org_id: z.uuid().nullable(),
    reports_to_id: z.uuid().nullable(),
    reports_to_confidence: confidence,
    reports_to_evidence: text,
    role_start: isoDate,
    company_start: isoDate,
    linkedin_uid: z.string().max(200).nullable(),
    linkedin_public_url: z.string().max(500).nullable(),
    personal_details: z.record(z.string(), z.string().max(2000)),
    custom_fields: z.record(z.string(), z.unknown()),
  })
  .partial();

export type ContactPatch = z.infer<typeof contactPatch>;

function revalidateContact(id: string) {
  revalidatePath(`/contacts/${id}`);
  revalidatePath("/contacts");
}

async function wouldCreateCycle(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  contactId: string,
  managerId: string,
): Promise<boolean> {
  let current: string | null = managerId;
  const seen = new Set<string>();
  while (current) {
    if (current === contactId) return true;
    if (seen.has(current)) return true;
    seen.add(current);
    const res: { data: { reports_to_id: string | null } | null } = await supabase
      .from("contacts")
      .select("reports_to_id")
      .eq("id", current)
      .maybeSingle();
    current = res.data?.reports_to_id ?? null;
  }
  return false;
}

export async function updateContact(id: string, patch: ContactPatch, place?: Place | null): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const parsed = contactPatch.safeParse(patch);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid update" };
  const values: Record<string, unknown> = { ...parsed.data };

  if (values.reports_to_id) {
    if (values.reports_to_id === id) return { ok: false, error: "A contact can't report to themselves." };
    if (await wouldCreateCycle(supabase, id, values.reports_to_id as string)) {
      return { ok: false, error: "That would create a reporting loop." };
    }
    if (!("reports_to_confidence" in values)) values.reports_to_confidence = "confirmed";
  }
  if ("reports_to_id" in values && values.reports_to_id === null) {
    values.reports_to_confidence = null;
  }
  if ("location" in values) {
    Object.assign(values, placeColumns(place !== undefined ? place : await geocodeCached(supabase, values.location as string | null)));
  }
  if ("org_id" in values && values.org_id) {
    // Keep account in sync with the org's account.
    const { data: org } = await supabase.from("orgs").select("account_id").eq("id", values.org_id).maybeSingle();
    if (org) values.account_id = org.account_id;
  }

  const { error } = await supabase.from("contacts").update(values).eq("id", id);
  if (error) return { ok: false, error: error.message };
  await logActivity(supabase, "contact", id, "update", parsed.data);
  revalidateContact(id);
  return { ok: true };
}

const newContact = z.object({
  first_name: z.string().min(1).max(200),
  last_name: z.string().max(200).default(""),
  title: z.string().max(500).nullable().optional(),
  account_id: z.uuid().nullable().optional(),
  org_id: z.uuid().nullable().optional(),
  email: z.string().max(320).nullable().optional(),
  location: z.string().max(500).nullable().optional(),
});

export async function createContact(input: z.input<typeof newContact>): Promise<ActionResult<{ id: string }>> {
  const { supabase } = await requireUser();
  const parsed = newContact.safeParse(input);
  if (!parsed.success) return { ok: false, error: "First name is required." };
  const values: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.location) Object.assign(values, placeColumns(await geocodeCached(supabase, parsed.data.location)));
  const { data, error } = await supabase.from("contacts").insert(values).select("id").single();
  if (error) return { ok: false, error: error.message };
  await logActivity(supabase, "contact", data.id, "create", parsed.data);
  revalidatePath("/contacts");
  return { ok: true, data: { id: data.id } };
}

export async function deleteContact(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  await logActivity(supabase, "contact", id, "delete");
  revalidatePath("/contacts");
  return { ok: true };
}

export async function bulkUpdateContacts(ids: string[], patch: Pick<ContactPatch, "statuses" | "seniority" | "org_id" | "is_key">, mode: "set" | "add" | "remove" = "set"): Promise<ActionResult> {
  const { supabase } = await requireUser();
  if (ids.length === 0) return { ok: true };
  if (patch.statuses && mode !== "set") {
    const { data } = await supabase.from("contacts").select("id, statuses").in("id", ids);
    for (const c of data ?? []) {
      const cur = new Set<string>(c.statuses);
      for (const s of patch.statuses) {
        if (mode === "add") cur.add(s);
        else cur.delete(s);
      }
      await supabase.from("contacts").update({ statuses: [...cur] }).eq("id", c.id);
    }
  } else {
    const parsed = contactPatch.safeParse(patch);
    if (!parsed.success) return { ok: false, error: "Invalid update" };
    const { error } = await supabase.from("contacts").update(parsed.data).in("id", ids);
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath("/contacts");
  return { ok: true };
}

// ───────── Notes ─────────

export async function addNote(target: { contact_id?: string; account_id?: string; org_id?: string }, bodyHtml: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  if (!bodyHtml.replace(/<[^>]*>/g, "").trim()) return { ok: false, error: "Note is empty." };
  const { data, error } = await supabase.from("notes").insert({ ...target, body_html: bodyHtml }).select("id").single();
  if (error) return { ok: false, error: error.message };
  if (target.contact_id) {
    await logActivity(supabase, "contact", target.contact_id, "note_added", { note_id: data.id });
    revalidateContact(target.contact_id);
  }
  await revalidateNoteParents(supabase, target);
  return { ok: true };
}

/** Notes on accounts and orgs live on the account page, so revalidate that path. */
async function revalidateNoteParents(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  target: { contact_id?: string | null; account_id?: string | null; org_id?: string | null },
) {
  if (target.account_id) revalidatePath(`/accounts/${target.account_id}`);
  if (target.org_id) {
    const { data: org } = await supabase.from("orgs").select("account_id").eq("id", target.org_id).maybeSingle();
    if (org) revalidatePath(`/accounts/${org.account_id}`);
  }
}

export async function updateNote(id: string, bodyHtml: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("notes").update({ body_html: bodyHtml }).eq("id", id).select("contact_id, account_id, org_id").single();
  if (error) return { ok: false, error: error.message };
  if (data.contact_id) revalidateContact(data.contact_id);
  await revalidateNoteParents(supabase, data);
  return { ok: true };
}

export async function deleteNote(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("notes").delete().eq("id", id).select("contact_id, account_id, org_id").single();
  if (error) return { ok: false, error: error.message };
  if (data.contact_id) revalidateContact(data.contact_id);
  await revalidateNoteParents(supabase, data);
  return { ok: true };
}

// ───────── Tags ─────────

export async function setContactTags(contactId: string, tagIds: string[]): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data: current } = await supabase.from("contact_tags").select("tag_id").eq("contact_id", contactId);
  const have = new Set((current ?? []).map((r) => r.tag_id as string));
  const want = new Set(tagIds);
  const add = [...want].filter((t) => !have.has(t));
  const remove = [...have].filter((t) => !want.has(t));
  if (add.length) {
    const { error } = await supabase.from("contact_tags").insert(add.map((tag_id) => ({ contact_id: contactId, tag_id })));
    if (error) return { ok: false, error: error.message };
  }
  if (remove.length) await supabase.from("contact_tags").delete().eq("contact_id", contactId).in("tag_id", remove);
  if (add.length || remove.length) await logActivity(supabase, "contact", contactId, "tags", { add, remove });
  revalidateContact(contactId);
  revalidatePath("/tags");
  return { ok: true };
}

export async function bulkTag(contactIds: string[], tagId: string, remove = false): Promise<ActionResult> {
  const { supabase } = await requireUser();
  if (remove) {
    await supabase.from("contact_tags").delete().eq("tag_id", tagId).in("contact_id", contactIds);
  } else {
    await supabase
      .from("contact_tags")
      .upsert(contactIds.map((contact_id) => ({ contact_id, tag_id: tagId })), { onConflict: "contact_id,tag_id", ignoreDuplicates: true });
  }
  revalidatePath("/contacts");
  revalidatePath("/tags");
  return { ok: true };
}

// ───────── Influence ─────────

const influenceInput = z.object({
  from_contact_id: z.uuid(),
  to_contact_id: z.uuid(),
  strength: z.enum(["high", "medium", "low"]).default("medium"),
  confidence: z.enum(["confirmed", "medium", "low"]).default("medium"),
  evidence: z.string().max(5000).nullable().optional(),
});

export async function upsertInfluence(input: z.input<typeof influenceInput>): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const parsed = influenceInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Pick who they influence." };
  if (parsed.data.from_contact_id === parsed.data.to_contact_id) return { ok: false, error: "Someone can't influence themselves." };
  const { error } = await supabase.from("influences").upsert(parsed.data, { onConflict: "from_contact_id,to_contact_id" });
  if (error) return { ok: false, error: error.message };
  await logActivity(supabase, "contact", parsed.data.from_contact_id, "influence", parsed.data);
  revalidateContact(parsed.data.from_contact_id);
  revalidateContact(parsed.data.to_contact_id);
  return { ok: true };
}

export async function deleteInfluence(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("influences").delete().eq("id", id).select("from_contact_id, to_contact_id").single();
  if (error) return { ok: false, error: error.message };
  revalidateContact(data.from_contact_id);
  revalidateContact(data.to_contact_id);
  return { ok: true };
}

// ───────── Saved views ─────────

export async function saveView(name: string, surface: "contacts" | "canvas" | "map", query: string, filters: Record<string, unknown>): Promise<ActionResult> {
  const { supabase } = await requireUser();
  if (!name.trim()) return { ok: false, error: "Name the view." };
  const { error } = await supabase.from("saved_views").insert({ name: name.trim(), surface, query, filters });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/contacts");
  return { ok: true };
}

export async function deleteView(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  await supabase.from("saved_views").delete().eq("id", id);
  revalidatePath("/contacts");
  return { ok: true };
}

// ───────── AI brief ─────────

const briefProposal = z.object({
  kind: z.enum([
    "persona",
    "seniority_level",
    "org_assignment",
    "key_person",
    "reporting_line",
    "initiative_link",
    "challenge_link",
    "field",
    "summary",
  ]),
  value: z.record(z.string(), z.unknown()),
  confidence: z.enum(["confirmed", "secondhand", "unverified", "inference"]).optional(),
  evidence: z
    .array(
      z.object({
        claim: z.string(),
        source_label: z.string().optional(),
        source_url: z.string().optional(),
        confidence: z.enum(["confirmed", "secondhand", "unverified", "inference"]).optional(),
      }),
    )
    .optional(),
  rationale: z.string().optional(),
});

const briefResponse = z.object({
  brief_markdown: z.string().min(1).max(20000),
  proposals: z.array(briefProposal).max(30).default([]),
});

/**
 * Briefs one contact against the workspace's knowledge: an appended note with the
 * brief, plus field-level proposals in the inference review queue. The AI never
 * writes contact fields directly.
 */
export async function generateContactBrief(contactId: string): Promise<ActionResult<{ queued: number }>> {
  const { supabase, user } = await requireUser();
  if (!aiConfigured())
    return { ok: false, error: "AI is not configured. Add ANTHROPIC_API_KEY to .env.local and restart." };
  const contact = await getContact(supabase, contactId);
  if (!contact) return { ok: false, error: "Contact not found." };

  const [accountRes, orgRes, managerRes, initiativeRes, challengeRes, personaRes] = await Promise.all([
    contact.account_id
      ? supabase
          .from("accounts")
          .select("name, entity_type, why_anything, why_factory, why_now, notes")
          .eq("id", contact.account_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    contact.org_id
      ? supabase.from("orgs").select("name, factory_fit, buying_role, rank").eq("id", contact.org_id).maybeSingle()
      : Promise.resolve({ data: null }),
    contact.reports_to_id
      ? supabase.from("contacts").select("full_name, title").eq("id", contact.reports_to_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("contact_initiatives")
      .select("strength, initiatives ( code, name, summary, factory_fit )")
      .eq("contact_id", contactId),
    supabase
      .from("contact_challenges")
      .select("strength, challenges ( code, name, summary, factory_fit )")
      .eq("contact_id", contactId),
    contact.personas.length
      ? supabase
          .from("persona_catalog")
          .select("code, name, definition, one_liner")
          .in("code", contact.personas)
      : Promise.resolve({ data: [] }),
  ]);

  const context = {
    contact: {
      name: contact.full_name,
      title: contact.title,
      headline: contact.headline,
      summary: contact.summary,
      job_description: contact.job_description,
      location: contact.location,
      seniority: contact.seniority,
      seniority_level: contact.seniority_level,
      personas: contact.personas,
      persona_status: contact.persona_status,
      champion_flag: contact.champion_flag,
      can_veto: contact.can_veto,
      influence_score: contact.influence_score,
      is_key: contact.is_key,
      key_reasoning: contact.key_reasoning,
      buying_role: contact.buying_role,
      engage_stage: contact.engage_stage,
      evidence: contact.evidence,
      gaps: contact.gaps,
    },
    reports_to: managerRes.data ? { name: (managerRes.data as { full_name: string }).full_name } : null,
    account: accountRes.data,
    org: orgRes.data,
    linked_initiatives: (initiativeRes.data ?? []).map((r) => ({
      strength: (r as { strength: string }).strength,
      ...(r as unknown as { initiatives: Record<string, string> }).initiatives,
    })),
    linked_challenges: (challengeRes.data ?? []).map((r) => ({
      strength: (r as { strength: string }).strength,
      ...(r as unknown as { challenges: Record<string, string> }).challenges,
    })),
    persona_definitions: personaRes.data ?? [],
    seller_note:
      "Reason with this context only. Ground claims in the evidence; mark anything less as inferred.",
  };

  let brief;
  try {
    const prompt = await getStoredPrompt(supabase, "key_person_brief");
    brief = briefResponse.parse(
      await aiCompleteJson<unknown>({ model: prompt.model, system: prompt.system_prompt, user: JSON.stringify(context) }),
    );
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "The AI brief failed." };
  }

  const bodyHtml =
    `<h3>AI brief — ${format(new Date(), "MMM d, yyyy")}</h3>\n` +
    markdownToHtml(brief.brief_markdown) +
    `\n<p><em>Proposals from this brief are waiting in the review queue.</em></p>`;
  const { error: noteError } = await supabase
    .from("notes")
    .insert({ contact_id: contactId, body_html: bodyHtml, source: "ai" });
  if (noteError) return { ok: false, error: noteError.message };

  const proposals: InferenceProposal[] = brief.proposals.map((p) => ({
    subject_type: "contact",
    subject_id: contactId,
    kind: p.kind,
    value: p.value,
    confidence: p.confidence,
    evidence: (p.evidence ?? []).map((e) => ({ ...e, confidence: e.confidence ?? "inference" })),
    rationale: p.rationale,
    source: "ai",
  }));
  const queued = await queueInferences(supabase, user.id, proposals);

  await logActivity(supabase, "contact", contactId, "ai_brief", { queued }, "ai");
  revalidateContact(contactId);
  return { ok: true, data: { queued } };
}
