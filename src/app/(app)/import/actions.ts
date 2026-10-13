"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { aiComplete, aiConfigured, getStoredPrompt } from "@/lib/ai/client";
import { diffContact, type ExistingContact, type FieldDiff } from "@/lib/import/plan";
import {
  applyItem,
  createImportBatch,
  enrichNextSlice,
  ITEM_COLUMNS,
  planImportFile,
  progressCounts,
  CHUNK_MS,
  CHUNK_ROWS,
  type ApplyProgress,
  type EnrichProgress,
  type ImportItemRow,
  type ItemPayload,
  EXISTING_COLUMNS,
} from "@/lib/import/apply-core";
import type { OrgRef } from "@/lib/inference/orgs";
import { REVIEW_GROUPS, withGroup } from "./review-groups";
import type { ActionResult } from "@/app/(app)/contacts/actions";

export type { ApplyProgress, EnrichProgress } from "@/lib/import/apply-core";

export async function startImport(formData: FormData): Promise<ActionResult<{ batchId: string }>> {
  const { supabase } = await requireUser();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Pick a CSV file." };
  if (file.size > 20 * 1024 * 1024) return { ok: false, error: "File is larger than 20 MB. Split the export." };

  const plannedFile = await planImportFile(
    supabase,
    await file.text(),
    file.name,
    String(formData.get("export_date") ?? ""),
  );
  if ("error" in plannedFile) return { ok: false, error: plannedFile.error };

  let batchId: string;
  try {
    ({ batchId } = await createImportBatch(
      supabase,
      file.name,
      plannedFile.contacts,
      plannedFile.planned,
      plannedFile.accountIdFor,
      plannedFile.exportDate,
    ));
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not create the import." };
  }
  revalidatePath("/import");
  return { ok: true, data: { batchId } };
}

// ───────── Review actions ─────────

export async function setItemDecision(
  itemId: string,
  decision: "accept" | "skip" | "pending",
): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("import_items")
    .update({ decision })
    .eq("id", itemId)
    .select("batch_id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/import/${data.batch_id}`);
  return { ok: true };
}

/** Bulk include/exclude for one review group (see review-groups.ts). Merge decisions are never overwritten. */
export async function setBulkDecision(
  batchId: string,
  group: string,
  decision: "accept" | "skip",
): Promise<ActionResult<{ updated: number }>> {
  const { supabase } = await requireUser();
  const spec = REVIEW_GROUPS.find((g) => g.key === group);
  if (!spec) return { ok: false, error: "Unknown review group." };
  const { count, error } = await withGroup(
    supabase
      .from("import_items")
      .update({ decision }, { count: "exact" })
      .eq("batch_id", batchId)
      .neq("decision", "merge"),
    spec,
  );
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/import/${batchId}`);
  return { ok: true, data: { updated: count ?? 0 } };
}

/** Toggle whether one field diff will be applied. Persists into the item's stored diff. */
export async function setDiffAccept(itemId: string, field: string, accept: boolean): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data: item } = await supabase.from("import_items").select("diff").eq("id", itemId).maybeSingle();
  if (!item) return { ok: false, error: "Import item not found." };
  const diff = (item.diff as FieldDiff[]).map((d) => (d.field === field ? { ...d, accept } : d));
  const { data, error } = await supabase
    .from("import_items")
    .update({ diff })
    .eq("id", itemId)
    .select("batch_id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/import/${data.batch_id}`);
  return { ok: true };
}

/** Resolves an ambiguous same-name row: recompute its diff against the chosen contact. */
export async function chooseMergeTarget(
  itemId: string,
  contactId: string | null,
): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data: item } = await supabase.from("import_items").select("payload, batch_id").eq("id", itemId).maybeSingle();
  if (!item) return { ok: false, error: "Import item not found." };
  const batchId = item.batch_id;
  if (!contactId) {
    const { error } = await supabase
      .from("import_items")
      .update({ decision: "pending", merge_into_contact_id: null, matched_contact_id: null, diff: [] })
      .eq("id", itemId);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/import/${batchId}`);
    return { ok: true };
  }
  const { data: existing } = await supabase
    .from("contacts")
    .select(EXISTING_COLUMNS)
    .eq("id", contactId)
    .maybeSingle();
  if (!existing) return { ok: false, error: "That contact no longer exists." };
  const payload = item.payload as ItemPayload;
  const diff = diffContact(existing as unknown as ExistingContact, payload.contact, payload.account_id);
  const { error } = await supabase
    .from("import_items")
    .update({ decision: "merge", merge_into_contact_id: contactId, diff })
    .eq("id", itemId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/import/${batchId}`);
  return { ok: true };
}

export async function discardImport(batchId: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("import_batches").update({ status: "discarded" }).eq("id", batchId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/import/${batchId}`);
  revalidatePath("/import");
  return { ok: true };
}

// ───────── Apply (chunked, resumable) ─────────

/**
 * Apply the next slice of an import. The client loops this action until done;
 * each call processes up to CHUNK_ROWS unprocessed rows and returns live counts,
 * so an interrupted apply (reload, timeout, tab close) resumes where it stopped.
 */
export async function applyImportChunk(batchId: string): Promise<ActionResult<ApplyProgress>> {
  const { supabase, user } = await requireUser();
  const { data: batch } = await supabase.from("import_batches").select("id, status").eq("id", batchId).maybeSingle();
  if (!batch) return { ok: false, error: "Import not found." };
  if (batch.status === "discarded") return { ok: false, error: "This import was discarded." };
  if (batch.status === "applied") return { ok: true, data: await progressCounts(supabase, batchId) };
  if (batch.status === "review") {
    await supabase.from("import_batches").update({ status: "applying" }).eq("id", batchId);
  }

  const { data: rawItems } = await supabase
    .from("import_items")
    .select(ITEM_COLUMNS)
    .eq("batch_id", batchId)
    .filter("processed_at", "is", null)
    .order("row_index")
    .limit(CHUNK_ROWS);
  const items = (rawItems ?? []) as unknown as ImportItemRow[];

  const now = new Date().toISOString();
  const deadline = Date.now() + CHUNK_MS;
  const orgsCache = new Map<string, OrgRef[]>();

  for (const item of items) {
    // Stop in time so a call never outlives its request; the next chunk resumes.
    if (Date.now() > deadline) break;
    let contactId: string | null = null;
    let error: string | null = item.error;
    let decision = item.decision;
    if (item.action !== "error" && item.decision !== "skip" && item.decision !== "pending") {
      try {
        contactId = await applyItem(supabase, user.id, batchId, item, orgsCache);
      } catch (e) {
        error = e instanceof Error ? e.message : "Failed to apply row";
        decision = "skip";
      }
    }
    await supabase
      .from("import_items")
      .update({ processed_at: now, applied_contact_id: contactId, error, decision })
      .eq("id", item.id);
  }

  const progress = await progressCounts(supabase, batchId);
  if (progress.done) {
    await supabase
      .from("import_batches")
      .update({
        status: "applied",
        applied_at: now,
        stats: { applied: progress.applied, skipped: progress.skipped, errors: progress.errors },
      })
      .eq("id", batchId);
    revalidatePath(`/import/${batchId}`);
    revalidatePath("/import");
    revalidatePath("/contacts");
    revalidatePath("/accounts");
  }
  return { ok: true, data: progress };
}

// ───────── AI: per-row explanations and post-import enrichment ─────────

/** Explains one row's diff in seller terms. Read-only: writes nothing. */
export async function explainImportChange(itemId: string): Promise<ActionResult<{ explanation: string }>> {
  const { supabase } = await requireUser();
  if (!aiConfigured())
    return { ok: false, error: "AI is not configured. Add ANTHROPIC_API_KEY to .env.local and restart." };
  const { data: raw } = await supabase
    .from("import_items")
    .select("id, full_name, payload, diff, match_reason")
    .eq("id", itemId)
    .maybeSingle();
  if (!raw) return { ok: false, error: "Import row not found." };
  const item = raw as unknown as { id: string; full_name: string | null; payload: ItemPayload; diff: FieldDiff[]; match_reason: string | null };
  if (!item.diff?.length) return { ok: false, error: "Nothing changed on this row." };

  // Company diffs carry account ids; the model needs names.
  const accountIds = item.diff.filter((d) => d.field === "company").flatMap((d) => [d.before, d.after]);
  const names = new Map<string, string>();
  for (let i = 0; i < accountIds.length; i += 400) {
    const chunk = accountIds.slice(i, i + 400).filter(Boolean) as string[];
    if (!chunk.length) continue;
    const { data } = await supabase.from("accounts").select("id, name").in("id", chunk);
    for (const a of data ?? []) names.set((a as { id: string }).id, (a as { name: string }).name);
  }
  const changes = item.diff.map((d) => ({
    field: d.field,
    label: d.label,
    before: d.field === "company" ? (names.get(d.before ?? "") ?? d.before) : d.before,
    after: d.field === "company" ? (names.get(d.after ?? "") ?? d.after) : d.after,
  }));

  const prompt = await getStoredPrompt(supabase, "import_change_summary");
  const explanation = await aiComplete({
    model: prompt.model,
    system: prompt.system_prompt,
    user: JSON.stringify({
      person: item.full_name,
      matched_by: item.match_reason,
      profile: {
        title: item.payload.contact.title,
        headline: item.payload.contact.headline,
        summary: item.payload.contact.summary,
        location: item.payload.contact.location,
        role_start: item.payload.contact.role_start,
        company_start: item.payload.contact.company_start,
      },
      changes,
    }),
  });
  return { ok: true, data: { explanation: explanation.trim() } };
}

/**
 * Enrich the next slice of an applied import (see apply-core). The client loops
 * this action like applyImportChunk; progress lives in the batch stats.
 */
export async function enrichImportChunk(batchId: string): Promise<ActionResult<EnrichProgress>> {
  const { supabase, user } = await requireUser();
  if (!aiConfigured())
    return { ok: false, error: "AI is not configured. Add ANTHROPIC_API_KEY to .env.local and restart." };
  const r = await enrichNextSlice(supabase, user.id, batchId);
  if ("error" in r) return { ok: false, error: r.error };
  return { ok: true, data: r.progress };
}
