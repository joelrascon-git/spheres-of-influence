/**
 * Pure campaign helpers: the vocabulary every surface shares, and the zod
 * contracts the actions validate against. Net-new detection stays in code: a
 * member from an account other than the campaign's is the flag.
 */
import { z } from "zod";

export const CAMPAIGN_TYPES = [
  { value: "outbound", label: "Outbound" },
  { value: "event_dinner", label: "Event / dinner" },
  { value: "account_break_in", label: "Account break-in" },
  { value: "partner_cosell", label: "Partner co-sell" },
  { value: "webinar", label: "Webinar" },
] as const;
export type CampaignType = (typeof CAMPAIGN_TYPES)[number]["value"];

export const CAMPAIGN_STATUSES = ["planning", "active", "done"] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

/** The funnel, ordered; the page's summary counts follow this order. */
export const FUNNEL_STAGES = ["invited", "registered", "attended", "engaged", "declined", "no_show"] as const;
export type FunnelStage = (typeof FUNNEL_STAGES)[number];

export const FUNNEL_LABELS: Record<FunnelStage, string> = {
  invited: "Invited",
  registered: "Registered",
  attended: "Attended",
  engaged: "Engaged",
  declined: "Declined",
  no_show: "No-show",
};

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable()
  .optional();

export const newCampaign = z.object({
  account_id: z.uuid().nullable(),
  name: z.string().min(1).max(200),
  type: z.enum(CAMPAIGN_TYPES.map((t) => t.value) as [CampaignType, ...CampaignType[]]),
  event_date: isoDate,
  messaging: z.string().max(10000).nullable().optional(),
});

export type NewCampaign = z.input<typeof newCampaign>;

export const campaignPatch = z
  .object({
    name: z.string().min(1).max(200),
    type: z.enum(CAMPAIGN_TYPES.map((t) => t.value) as [CampaignType, ...CampaignType[]]),
    status: z.enum(CAMPAIGN_STATUSES),
    event_date: isoDate,
    messaging: z.string().max(10000).nullable(),
  })
  .partial();

export type CampaignPatch = z.input<typeof campaignPatch>;

/** A member from a different account than the campaign's is net-new. */
export function isNetNew(campaignAccountId: string | null, memberAccountId: string | null): boolean {
  if (!campaignAccountId || !memberAccountId) return false;
  return campaignAccountId !== memberAccountId;
}
