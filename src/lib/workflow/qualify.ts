/**
 * Pure workflow helpers for the qualification board. The MEDDPICC element set
 * seeds each seller's default template; slugs keep per-deal custom elements
 * addressable without ever colliding with the template keys.
 */
import { z } from "zod";

/** MEDDPICC is the default qualification framework, seeded as a template. */
export const MEDDPICC_ELEMENTS = [
  { key: "metrics", label: "Metrics" },
  { key: "economic_buyer", label: "Economic Buyer" },
  { key: "decision_criteria", label: "Decision Criteria" },
  { key: "decision_process", label: "Decision Process" },
  { key: "paper_process", label: "Paper Process" },
  { key: "identify_pain", label: "Identify Pain" },
  { key: "champion", label: "Champion" },
  { key: "competition", label: "Competition" },
] as const;

export const ITEM_STATUSES = ["unknown", "identified", "validated"] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export const OPPORTUNITY_STATUSES = ["open", "won", "lost", "paused"] as const;
export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

/** Status label shown on the board pills. */
export const ITEM_STATUS_META: Record<ItemStatus, { label: string; className: string }> = {
  unknown: { label: "?", className: "border-border bg-muted text-muted-foreground" },
  identified: { label: "ID", className: "border-blue-500/40 bg-blue-500/10 text-blue-600" },
  validated: { label: "VAL", className: "border-green-500/40 bg-green-500/10 text-green-600" },
};

/** Slug for a custom element: lowercase, underscores, bounded length. */
export function slugifyElement(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || "element";
}

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable()
  .optional();

export const opportunityPatch = z
  .object({
    name: z.string().min(1).max(200),
    status: z.enum(OPPORTUNITY_STATUSES),
    amount: z.number().nonnegative().max(1e12).nullable(),
    close_date: isoDate,
    next_step: z.string().max(2000).nullable(),
    notes: z.string().max(20000).nullable(),
  })
  .partial();

export type OpportunityPatch = z.input<typeof opportunityPatch>;

export const taskInput = z.object({
  title: z.string().min(1).max(500),
  details: z.string().max(5000).nullable().optional(),
  account_id: z.uuid().nullable().optional(),
  contact_id: z.uuid().nullable().optional(),
  opportunity_id: z.uuid().nullable().optional(),
  document_id: z.uuid().nullable().optional(),
  due_date: isoDate,
});

export type TaskInput = z.input<typeof taskInput>;
