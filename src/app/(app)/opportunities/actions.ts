"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/data";
import { MEDDPICC_ELEMENTS, opportunityPatch, slugifyElement, taskInput } from "@/lib/workflow/qualify";
import type { ActionResult } from "@/app/(app)/contacts/actions";

// ───────────────────────── Opportunities ─────────────────────────

const newOpportunity = z.object({
  account_id: z.uuid(),
  name: z.string().min(1).max(200),
  template_id: z.uuid().optional(),
});

/**
 * Creates a deal and its qualification board in one shot: the board's elements
 * come from the chosen template (MEDDPICC by default), copied per deal so the
 * seller can rename, hide or add elements without touching the template.
 */
export async function createOpportunity(input: z.input<typeof newOpportunity>): Promise<ActionResult<{ id: string }>> {
  const { supabase } = await requireUser();
  const parsed = newOpportunity.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Name the opportunity and pick its account." };
  const { account_id, name, template_id } = parsed.data;

  let elements: { key: string; label: string }[] = MEDDPICC_ELEMENTS.map((e) => ({ ...e }));
  if (template_id) {
    const { data: tpl } = await supabase
      .from("qualification_templates")
      .select("elements")
      .eq("id", template_id)
      .maybeSingle();
    if (tpl && Array.isArray(tpl.elements) && tpl.elements.length) elements = tpl.elements;
  } else {
    const { data: tpl } = await supabase
      .from("qualification_templates")
      .select("elements")
      .eq("is_default", true)
      .limit(1)
      .maybeSingle();
    if (tpl && Array.isArray(tpl.elements) && tpl.elements.length) elements = tpl.elements;
  }

  const { data: opp, error } = await supabase
    .from("opportunities")
    .insert({ account_id, name, template_id: template_id ?? null })
    .select("id")
    .single();
  if (error || !opp) return { ok: false, error: error?.message ?? "Could not create the opportunity." };

  const { error: itemsError } = await supabase.from("qualification_items").insert(
    elements.map((e, i) => ({
      opportunity_id: opp.id,
      key: e.key,
      label: e.label,
      sort_order: i,
    })),
  );
  if (itemsError) return { ok: false, error: itemsError.message };

  await logActivity(supabase, "account", account_id, "opportunity_created", { name }, "manual");
  revalidatePath(`/accounts/${account_id}`);
  return { ok: true, data: { id: opp.id } };
}

export async function updateOpportunity(id: string, patch: z.input<typeof opportunityPatch>): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const parsed = opportunityPatch.safeParse(patch);
  if (!parsed.success) return { ok: false, error: "Check the opportunity fields — something didn't parse." };
  const clean = Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== undefined));
  if (!Object.keys(clean).length) return { ok: true };
  const { data, error } = await supabase
    .from("opportunities")
    .update(clean)
    .eq("id", id)
    .select("account_id")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/opportunities/${id}`);
  if (data?.account_id) revalidatePath(`/accounts/${data.account_id}`);
  return { ok: true };
}

export async function deleteOpportunity(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("opportunities")
    .delete()
    .eq("id", id)
    .select("account_id")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (data?.account_id) revalidatePath(`/accounts/${data.account_id}`);
  revalidatePath("/opportunities");
  return { ok: true };
}

// ───────────────────────── Qualification board ─────────────────────────

const itemPatch = z
  .object({
    status: z.enum(["unknown", "identified", "validated"]),
    summary: z.string().max(5000).nullable(),
    label: z.string().min(1).max(100),
    hidden: z.boolean(),
  })
  .partial();

export async function setQualificationItem(itemId: string, patch: z.input<typeof itemPatch>): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const parsed = itemPatch.safeParse(patch);
  if (!parsed.success) return { ok: false, error: "That board change didn't parse." };
  const clean = Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== undefined));
  if (!Object.keys(clean).length) return { ok: true };
  const { data, error } = await supabase
    .from("qualification_items")
    .update(clean)
    .eq("id", itemId)
    .select("opportunity_id")
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "That element no longer exists." };
  revalidatePath(`/opportunities/${data.opportunity_id}`);
  return { ok: true };
}

/** Adds a custom element to one deal's board; the slug key keeps it addressable. */
export async function addQualificationElement(opportunityId: string, label: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const clean = label.trim().slice(0, 100);
  if (!clean) return { ok: false, error: "Name the element." };
  const key = slugifyElement(clean);
  const { data: existing } = await supabase
    .from("qualification_items")
    .select("id")
    .eq("opportunity_id", opportunityId)
    .eq("key", key)
    .maybeSingle();
  if (existing) return { ok: false, error: `“${clean}” is already on the board.` };
  const { data: max } = await supabase
    .from("qualification_items")
    .select("sort_order")
    .eq("opportunity_id", opportunityId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase.from("qualification_items").insert({
    opportunity_id: opportunityId,
    key,
    label: clean,
    sort_order: (max?.sort_order ?? 0) + 1,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/opportunities/${opportunityId}`);
  return { ok: true };
}

const evidenceInput = z.object({
  note: z.string().min(1).max(2000),
  contact_id: z.uuid().nullable().optional(),
});

export async function addQualificationEvidence(itemId: string, input: z.input<typeof evidenceInput>): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const parsed = evidenceInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Evidence needs a note." };
  const { data, error } = await supabase
    .from("qualification_evidence")
    .insert({ item_id: itemId, note: parsed.data.note, contact_id: parsed.data.contact_id ?? null })
    .select("qualification_items(opportunity_id)")
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "Could not add the evidence." };
  const row = data as unknown as { qualification_items: { opportunity_id: string } | null };
  if (row.qualification_items) revalidatePath(`/opportunities/${row.qualification_items.opportunity_id}`);
  return { ok: true };
}

export async function deleteQualificationEvidence(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("qualification_evidence")
    .delete()
    .eq("id", id)
    .select("qualification_items(opportunity_id)")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  const row = (data ?? null) as { qualification_items: { opportunity_id: string } | null } | null;
  if (row?.qualification_items) revalidatePath(`/opportunities/${row.qualification_items.opportunity_id}`);
  return { ok: true };
}

// ───────────────────────── Tasks ─────────────────────────

/** Creates a task; anything can be linked (account, person, deal, source document). */
export async function createTask(input: z.input<typeof taskInput>): Promise<ActionResult<{ id: string }>> {
  const { supabase } = await requireUser();
  const parsed = taskInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Tasks need a title." };
  const { error } = await supabase.from("tasks").insert(parsed.data);
  if (error) return { ok: false, error: error.message };
  if (parsed.data.account_id) revalidatePath(`/accounts/${parsed.data.account_id}`);
  if (parsed.data.opportunity_id) revalidatePath(`/opportunities/${parsed.data.opportunity_id}`);
  revalidatePath("/");
  return { ok: true };
}

export async function setTaskStatus(id: string, status: "open" | "done" | "dismissed"): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", id)
    .select("account_id, opportunity_id")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (data?.account_id) revalidatePath(`/accounts/${data.account_id}`);
  if (data?.opportunity_id) revalidatePath(`/opportunities/${data.opportunity_id}`);
  revalidatePath("/");
  return { ok: true };
}
