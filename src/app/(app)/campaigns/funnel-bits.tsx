import { CAMPAIGN_TYPES, FUNNEL_LABELS, FUNNEL_STAGES, isNetNew, type FunnelStage } from "@/lib/workflow/campaigns";

/** A campaign with its member rows embedded, as the list and account panels fetch it. */
export type CampaignRow = {
  id: string;
  account_id: string | null;
  name: string;
  type: string;
  status: "planning" | "active" | "done";
  event_date: string | null;
  created_at: string;
  accounts: { id: string; name: string } | null;
  campaign_members: { contact_account_id: string | null; funnel_stage: FunnelStage }[];
};

/** One line of chips: who's at each funnel stage, plus the net-new count. */
export function FunnelChips({ campaign }: { campaign: CampaignRow }) {
  const counts = new Map<FunnelStage, number>();
  for (const m of campaign.campaign_members) counts.set(m.funnel_stage, (counts.get(m.funnel_stage) ?? 0) + 1);
  const netNew = campaign.campaign_members.filter((m) => isNetNew(campaign.account_id, m.contact_account_id)).length;
  const chips = FUNNEL_STAGES.flatMap((stage) => {
    const n = counts.get(stage) ?? 0;
    return n ? [`${n} ${FUNNEL_LABELS[stage]}`] : [];
  });
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
      {chips.length ? (
        chips.map((c) => (
          <span key={c} className="rounded bg-muted px-1.5 py-0.5">
            {c}
          </span>
        ))
      ) : (
        <span className="italic">no members yet</span>
      )}
      {netNew > 0 && (
        <span className="rounded border border-green-500/40 bg-green-500/10 px-1.5 py-0.5 font-medium text-green-600">
          {netNew} net-new
        </span>
      )}
    </span>
  );
}

export const TYPE_LABEL = (type: string) => CAMPAIGN_TYPES.find((t) => t.value === type)?.label ?? type;
