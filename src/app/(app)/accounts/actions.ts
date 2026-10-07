"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/data";
import type { ActionResult } from "@/app/(app)/contacts/actions";

const nullableText = (max: number) => z.string().max(max).nullable();

const accountPatch = z
  .object({
    name: z.string().min(1).max(200),
    domain: z.string().max(200).nullable(),
    website: z.string().max(500).nullable(),
    industry: nullableText(200),
    employee_count: z.number().int().nullable(),
    engineer_count: z.number().int().nullable(),
    hq: nullableText(500),
    description: nullableText(20000),
    specialities: nullableText(2000),
    company_type: nullableText(200),
    year_founded: z.number().int().nullable(),
    parent_account_id: z.uuid().nullable(),
    parent_relationship: z.enum(["independent", "semi_autonomous", "centralized", "unknown"]),
    parent_relationship_notes: nullableText(2000),
    why_anything: nullableText(60000),
    why_factory: nullableText(60000),
    why_now: nullableText(60000),
    custom_fields: z.record(z.string(), z.unknown()),
  })
  .partial();

export async function updateAccount(id: string, patch: z.input<typeof accountPatch>): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const parsed = accountPatch.safeParse(patch);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid update" };
  if (parsed.data.parent_account_id === id) return { ok: false, error: "An account can't be its own parent." };
  const { error } = await supabase.from("accounts").update(parsed.data).eq("id", id);
  if (error) return { ok: false, error: error.message };
  await logActivity(supabase, "account", id, "update", parsed.data);
  revalidatePath(`/accounts/${id}`);
  revalidatePath("/accounts");
  return { ok: true };
}

export async function createAccount(input: z.input<typeof accountPatch>): Promise<ActionResult<{ id: string }>> {
  const { supabase } = await requireUser();
  const parsed = accountPatch.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid account" };
  const { data, error } = await supabase
    .from("accounts")
    .insert(parsed.data)
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  await logActivity(supabase, "account", data.id, "create", parsed.data);
  revalidatePath("/accounts");
  return { ok: true, data: { id: data.id } };
}

export async function deleteAccount(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  // Contacts survive with their account cleared; orgs and notes cascade.
  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  await logActivity(supabase, "account", id, "delete");
  revalidatePath("/accounts");
  return { ok: true };
}

// ───────── Orgs ─────────

const orgPatch = z
  .object({
    account_id: z.uuid(),
    parent_org_id: z.uuid().nullable(),
    name: z.string().min(1).max(200),
    aliases: z.array(z.string().max(200)).max(30),
    description: nullableText(2000),
    status: z.enum(["confirmed", "inferred"]),
    notes: nullableText(60000),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .nullable(),
    sort_order: z.number().int(),
  })
  .partial();

async function wouldCreateOrgCycle(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  orgId: string,
  parentId: string,
): Promise<boolean> {
  let current: string | null = parentId;
  const seen = new Set<string>();
  while (current) {
    if (current === orgId) return true;
    if (seen.has(current)) return true;
    seen.add(current);
    const res: { data: { parent_org_id: string | null } | null } = await supabase
      .from("orgs")
      .select("parent_org_id")
      .eq("id", current)
      .maybeSingle();
    current = res.data?.parent_org_id ?? null;
  }
  return false;
}

export async function createOrg(input: z.input<typeof orgPatch>): Promise<ActionResult<{ id: string }>> {
  const { supabase } = await requireUser();
  const parsed = orgPatch.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid org" };
  const { account_id, ...values } = parsed.data;
  const { data, error } = await supabase.from("orgs").insert({ ...values, account_id }).select("id").single();
  if (error) return { ok: false, error: error.message };
  await logActivity(supabase, "org", data.id, "create", parsed.data);
  revalidatePath(`/accounts/${account_id}`);
  return { ok: true, data: { id: data.id } };
}

export async function updateOrg(id: string, patch: z.input<typeof orgPatch>): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const parsed = orgPatch.safeParse(patch);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid update" };
  const values: Record<string, unknown> = { ...parsed.data };
  if (values.parent_org_id) {
    if (values.parent_org_id === id) return { ok: false, error: "An org can't be its own parent." };
    if (await wouldCreateOrgCycle(supabase, id, values.parent_org_id as string))
      return { ok: false, error: "That would create a loop in the org tree." };
  }
  const { data, error } = await supabase
    .from("orgs")
    .update(values)
    .eq("id", id)
    .select("account_id")
    .single();
  if (error) return { ok: false, error: error.message };
  await logActivity(supabase, "org", id, "update", parsed.data);
  revalidatePath(`/accounts/${data.account_id}`);
  return { ok: true };
}

export async function deleteOrg(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("orgs").delete().eq("id", id).select("account_id").single();
  if (error) return { ok: false, error: error.message };
  await logActivity(supabase, "org", id, "delete");
  revalidatePath(`/accounts/${data.account_id}`);
  return { ok: true };
}
