"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/data";
import { applyInference, describeInferenceValue, undoInferenceWrite, type UndoPayload } from "@/lib/inference/apply";
import type { ActionResult } from "@/app/(app)/contacts/actions";
import type { Inference } from "@/lib/types";

const SUBJECT_PAGE: Record<Inference["subject_type"], (id: string) => string[]> = {
  contact: (id) => [`/contacts/${id}`],
  account: (id) => [`/accounts/${id}`],
  org: () => ["/contacts"],
  initiative: () => ["/contacts"],
  challenge: () => ["/contacts"],
};

function revalidateInferenceSurfaces(inf: Pick<Inference, "subject_type" | "subject_id">) {
  for (const p of SUBJECT_PAGE[inf.subject_type](inf.subject_id)) revalidatePath(p);
  revalidatePath("/inferences");
  revalidatePath("/contacts");
  revalidatePath("/");
}

type Supabase = Awaited<ReturnType<typeof requireUser>>["supabase"];

/**
 * Accepts one proposal with a given client: applies it to its subject, then
 * marks it accepted. A proposal whose names no longer resolve is an error,
 * never a silent write.
 */
async function acceptWith(supabase: Supabase, id: string): Promise<ActionResult<{ written: boolean }>> {
  const { data: inf } = await supabase.from("inferences").select("*").eq("id", id).maybeSingle();
  if (!inf) return { ok: false, error: "That proposal no longer exists." };
  const row = inf as Inference;
  if (row.status !== "pending") return { ok: false, error: "That proposal was already reviewed." };

  const applied = await applyInference(supabase, row);
  if (!applied.ok) return { ok: false, error: applied.error };

  const { error } = await supabase
    .from("inferences")
    .update({ status: "accepted", resolved_at: new Date().toISOString(), undo: applied.undo })
    .eq("id", id)
    .eq("status", "pending");
  if (error) return { ok: false, error: error.message };
  await logActivity(
    supabase,
    row.subject_type,
    row.subject_id,
    "inference_accepted",
    { kind: row.kind, value: describeInferenceValue(row.kind, row.value), source: row.source },
    "manual",
  );
  revalidateInferenceSurfaces(row);
  return { ok: true, data: { written: applied.written } };
}

export async function acceptInference(id: string): Promise<ActionResult<{ written: boolean }>> {
  const { supabase } = await requireUser();
  return acceptWith(supabase, id);
}

/** Rejects a proposal: nothing is written; the row is kept for the audit trail. */
export async function rejectInference(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data: inf } = await supabase
    .from("inferences")
    .update({ status: "rejected", resolved_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending")
    .select("subject_type, subject_id")
    .maybeSingle();
  if (inf) revalidateInferenceSurfaces(inf as Pick<Inference, "subject_type" | "subject_id">);
  return { ok: true };
}

/**
 * Reverts one accepted proposal: restores the pre-accept snapshot captured at
 * write time, then returns the proposal to pending so it can be re-reviewed.
 * The activity log keeps both halves of the audit trail.
 */
export async function undoInference(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data: inf } = await supabase.from("inferences").select("*").eq("id", id).maybeSingle();
  if (!inf) return { ok: false, error: "That proposal no longer exists." };
  const row = inf as Inference;
  if (row.status !== "accepted") return { ok: false, error: "Only accepted proposals can be undone." };
  if (!row.undo) return { ok: false, error: "This acceptance predates undo, so there is no snapshot to restore." };

  const undone = await undoInferenceWrite(supabase, row, row.undo as UndoPayload);
  if (!undone.ok) return { ok: false, error: undone.error };

  const { error } = await supabase
    .from("inferences")
    .update({ status: "pending", resolved_at: null, undo: null })
    .eq("id", id)
    .eq("status", "accepted");
  if (error) return { ok: false, error: error.message };
  await logActivity(
    supabase,
    row.subject_type,
    row.subject_id,
    "inference_undone",
    { kind: row.kind, value: describeInferenceValue(row.kind, row.value), source: row.source },
    "manual",
  );
  revalidateInferenceSurfaces(row);
  return { ok: true };
}

export type BulkFilter = { kind?: string; confidence?: string; source?: string };

const BULK_CAP = 500;

/**
 * Accepts every pending proposal matching the filter (capped). Proposals that
 * fail to apply are left pending so the seller can see why; the rest are
 * accepted and written through.
 */
export async function bulkAcceptInferences(filter: BulkFilter): Promise<ActionResult<{ applied: number; failed: number; errors: string[] }>> {
  const { supabase } = await requireUser();
  let q = supabase
    .from("inferences")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(BULK_CAP);
  if (filter.kind) q = q.eq("kind", filter.kind);
  if (filter.confidence) q = q.eq("confidence", filter.confidence);
  if (filter.source) q = q.eq("source", filter.source);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };

  const rows = (data ?? []) as Inference[];
  const errors: string[] = [];
  let applied = 0;
  for (const row of rows) {
    const r = await acceptWith(supabase, row.id);
    if (r.ok) applied++;
    else errors.push(r.error);
  }
  if (applied > 0) revalidatePath("/inferences");
  const failed = rows.length - applied;
  return { ok: true, data: { applied, failed, errors: [...new Set(errors)].slice(0, 10) } };
}
