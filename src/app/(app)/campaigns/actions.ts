"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { campaignPatch, newCampaign } from "@/lib/workflow/campaigns";
import type { ActionResult } from "@/app/(app)/contacts/actions";

function revalidateCampaign(campaignId: string, accountId: string | null) {
  revalidatePath(`/campaigns/${campaignId}`);
  if (accountId) revalidatePath(`/accounts/${accountId}`);
}

/** Creates a campaign; the account scoping decides net-new flags later. */
export async function createCampaign(input: z.input<typeof newCampaign>): Promise<ActionResult<{ id: string }>> {
  const { supabase } = await requireUser();
  const parsed = newCampaign.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Name the campaign and pick a type." };
  const { data: campaign, error } = await supabase.from("campaigns").insert(parsed.data).select("id").single();
  if (error || !campaign) return { ok: false, error: error?.message ?? "Could not create the campaign." };
  if (parsed.data.account_id) revalidatePath(`/accounts/${parsed.data.account_id}`);
  revalidatePath("/campaigns");
  return { ok: true, data: { id: campaign.id } };
}

export async function updateCampaign(id: string, patch: z.input<typeof campaignPatch>): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const parsed = campaignPatch.safeParse(patch);
  if (!parsed.success) return { ok: false, error: "That campaign change didn't parse." };
  const clean = Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== undefined));
  if (!Object.keys(clean).length) return { ok: true };
  const { data, error } = await supabase.from("campaigns").update(clean).eq("id", id).select("account_id").maybeSingle();
  if (error) return { ok: false, error: error.message };
  revalidateCampaign(id, (data as { account_id: string | null } | null)?.account_id ?? null);
  return { ok: true };
}

export async function deleteCampaign(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("campaigns").delete().eq("id", id).select("account_id").maybeSingle();
  if (error) return { ok: false, error: error.message };
  const accountId = (data as { account_id: string | null } | null)?.account_id ?? null;
  if (accountId) revalidatePath(`/accounts/${accountId}`);
  revalidatePath("/campaigns");
  return { ok: true };
}

const memberInput = z.object({
  campaign_id: z.uuid(),
  contact_id: z.uuid(),
});

/** Adds a person to the funnel, snapshotting their account for net-new flags. */
export async function addCampaignMember(input: z.input<typeof memberInput>): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const parsed = memberInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Pick a person to add." };
  const { data: contact } = (await supabase
    .from("contacts")
    .select("id, account_id")
    .eq("id", parsed.data.contact_id)
    .maybeSingle()) as { data: { id: string; account_id: string | null } | null };
  if (!contact) return { ok: false, error: "That contact no longer exists." };
  const { data: campaign } = (await supabase
    .from("campaigns")
    .select("account_id")
    .eq("id", parsed.data.campaign_id)
    .maybeSingle()) as { data: { account_id: string | null } | null };
  if (!campaign) return { ok: false, error: "That campaign no longer exists." };

  const { error } = await supabase.from("campaign_members").upsert(
    {
      campaign_id: parsed.data.campaign_id,
      contact_id: contact.id,
      contact_account_id: contact.account_id,
    },
    { onConflict: "campaign_id,contact_id", ignoreDuplicates: true },
  );
  if (error) return { ok: false, error: error.message };
  revalidateCampaign(parsed.data.campaign_id, campaign.account_id);
  return { ok: true };
}

export async function setMemberStage(id: string, stage: "invited" | "registered" | "attended" | "engaged" | "declined" | "no_show"): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("campaign_members")
    .update({ funnel_stage: stage })
    .eq("id", id)
    .select("campaign_id, campaigns(account_id)")
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "That member no longer exists." };
  const row = data as unknown as { campaign_id: string; campaigns: { account_id: string | null } | null };
  revalidateCampaign(row.campaign_id, row.campaigns?.account_id ?? null);
  return { ok: true };
}

/** Records what happened with this person, e.g. "wants a follow-up demo". */
export async function setMemberOutcome(id: string, outcome: string | null): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const clean = outcome && outcome.trim() ? outcome.trim().slice(0, 500) : null;
  const { data, error } = await supabase
    .from("campaign_members")
    .update({ outcome: clean })
    .eq("id", id)
    .select("campaign_id, campaigns(account_id)")
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "That member no longer exists." };
  const row = data as unknown as { campaign_id: string; campaigns: { account_id: string | null } | null };
  revalidateCampaign(row.campaign_id, row.campaigns?.account_id ?? null);
  return { ok: true };
}

export async function removeCampaignMember(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("campaign_members")
    .delete()
    .eq("id", id)
    .select("campaign_id, campaigns(account_id)")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  const row = (data ?? null) as { campaign_id: string; campaigns: { account_id: string | null } | null } | null;
  if (row) revalidateCampaign(row.campaign_id, row.campaigns?.account_id ?? null);
  return { ok: true };
}
