export const SENIORITY = [
  { value: "c_level", label: "C-Level" },
  { value: "vp", label: "VP" },
  { value: "director", label: "Director" },
  { value: "manager", label: "Manager" },
  { value: "ic", label: "IC" },
] as const;
export type Seniority = (typeof SENIORITY)[number]["value"];

export const seniorityLabel = (v: string | null | undefined) =>
  SENIORITY.find((s) => s.value === v)?.label ?? "";

export const DEFAULT_PERSONAS = [
  "Economic Buyer",
  "Decision Maker",
  "Champion",
  "Influencer/Coach",
  "Business",
  "Technical",
  "InfoSec",
  "DevOps",
  "Legal",
  "Procurement",
];

export const DEFAULT_STATUSES = [
  "Working",
  "Connected - F/U",
  "Connected - Meeting Set",
  "Connected - Relationship Made",
  "Nurture",
  "Do Not Contact",
  "No Longer at Company",
];

export const STATUS = {
  doNotContact: "Do Not Contact",
  gone: "No Longer at Company",
} as const;

export const QUALITY = [
  { value: "good", label: "Good", color: "bg-status-good" },
  { value: "questionable", label: "Questionable", color: "bg-status-warn" },
  { value: "bad", label: "Bad", color: "bg-status-bad" },
] as const;
export type Quality = (typeof QUALITY)[number]["value"];

export const CONFIDENCE = [
  { value: "confirmed", label: "Confirmed" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
] as const;
export type Confidence = (typeof CONFIDENCE)[number]["value"];

export const ORG_STATUS = [
  { value: "confirmed", label: "Confirmed" },
  { value: "inferred", label: "Inferred" },
] as const;

export const PARENT_RELATIONSHIP = [
  { value: "independent", label: "Independent", hint: "Makes its own buying decisions" },
  { value: "semi_autonomous", label: "Semi-autonomous", hint: "Some decisions local, large ones go to the parent" },
  { value: "centralized", label: "Centralized", hint: "Buys through the parent organization" },
  { value: "unknown", label: "Unknown", hint: "Not yet known" },
] as const;

export const MODELS = [
  { value: "claude-opus-5-5", label: "Claude Opus 5.5 (complex reasoning)" },
  { value: "claude-sonnet-5-5", label: "Claude Sonnet 5.5 (fast, routine)" },
  { value: "claude-fable-5-1", label: "Claude Fable 5.1 (deepest reasoning, slowest)" },
] as const;
