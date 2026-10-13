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

// Persona taxonomy from the Factory sales-cycle knowledge base. Codes are stored on
// contacts.personas and everywhere else; labels come from the persona catalog.
export const PERSONA_CODES = [
  { code: "EB", name: "Economic Buyer", weight: 10, canVeto: true, meddpicc: "E – Economic Buyer", sort: 1 },
  { code: "CH", name: "Champion", weight: 9, canVeto: false, meddpicc: "C – Champion", sort: 2 },
  { code: "DM", name: "Decision Maker", weight: 9, canVeto: false, meddpicc: "D – Decision Criteria / Process", sort: 3 },
  { code: "BS", name: "Business Sponsor", weight: 8, canVeto: false, meddpicc: "M – Metrics; I – Pain", sort: 4 },
  { code: "TECH", name: "Technical", weight: 7, canVeto: true, meddpicc: "D – Decision Criteria", sort: 5 },
  { code: "INFOSEC", name: "InfoSec", weight: 7, canVeto: true, meddpicc: "P – Paper Process", sort: 6 },
  { code: "EVAL", name: "Evaluator", weight: 6, canVeto: false, meddpicc: "M – Metrics", sort: 7 },
  { code: "FIN", name: "Finance", weight: 5, canVeto: true, meddpicc: "E – Economic Buyer", sort: 8 },
  { code: "PROC", name: "Procurement", weight: 5, canVeto: true, meddpicc: "P – Paper Process", sort: 9 },
  { code: "LEGAL", name: "Legal", weight: 5, canVeto: true, meddpicc: "P – Paper Process", sort: 10 },
  { code: "COACH", name: "Coach / Influencer", weight: 5, canVeto: false, meddpicc: "C – pre-Champion", sort: 11 },
  { code: "PARTNER", name: "Partner", weight: 4, canVeto: false, meddpicc: "Competition; Decision Process", sort: 12 },
] as const;
export type PersonaCode = (typeof PERSONA_CODES)[number]["code"];
export const personaName = (code: string | null | undefined) =>
  PERSONA_CODES.find((p) => p.code === code)?.name ?? code ?? "";

// Kept for one release so seeded field options can be recognized and upgraded in place.
export const LEGACY_PERSONAS = [
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
  "Out of Scope",
  "Deprioritized",
];

// Kept for one release so seeded status options can be recognized and upgraded in place.
export const LEGACY_STATUSES = [
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
  outOfScope: "Out of Scope",
  deprioritized: "Deprioritized",
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

// Seniority levels from the persona knowledge base: a finer ladder than `seniority`.
export const SENIORITY_LEVELS = [
  { value: "L1", label: "L1 · Executive / C-suite" },
  { value: "L2", label: "L2 · Senior executive (EVP, SVP)" },
  { value: "L3", label: "L3 · Executive (VP, Distinguished)" },
  { value: "L4", label: "L4 · Senior management (Director, Principal)" },
  { value: "L5", label: "L5 · Management (Manager, Staff)" },
  { value: "L6", label: "L6 · Individual contributor" },
] as const;
export type SeniorityLevelValue = (typeof SENIORITY_LEVELS)[number]["value"];

// Confidence taxonomy used across the research corpus, imports and AI proposals.
export const RESEARCH_CONFIDENCE = [
  { value: "confirmed", label: "Confirmed", hint: "Primary source (company IR, SEC, own post)" },
  { value: "secondhand", label: "Secondhand", hint: "Reputable press or data aggregator" },
  { value: "unverified", label: "Unverified", hint: "Carried forward, not re-confirmed" },
  { value: "inference", label: "Inference", hint: "Analyst reasoning" },
] as const;
export type ResearchConfidence = (typeof RESEARCH_CONFIDENCE)[number]["value"];

export const PERSONA_STATUS = [
  { value: "assumed", label: "Assumed", hint: "From title only" },
  { value: "indicated", label: "Indicated", hint: "Supported by cited evidence" },
  { value: "validated", label: "Validated", hint: "Confirmed by deal-team experience" },
] as const;
export type PersonaStatusValue = (typeof PERSONA_STATUS)[number]["value"];

export const CHAMPION_FLAG = [
  { value: "none", label: "None" },
  { value: "potential", label: "Potential" },
  { value: "validated", label: "Validated" },
] as const;
export type ChampionFlagValue = (typeof CHAMPION_FLAG)[number]["value"];

export const ORG_FIT = [
  { value: "very_high", label: "Very High" },
  { value: "high", label: "High" },
  { value: "medium_high", label: "Medium–High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
] as const;
export type OrgFitValue = (typeof ORG_FIT)[number]["value"];

export const PROGRAM_FIT = [
  { value: "very_strong", label: "Very strong" },
  { value: "strong", label: "Strong" },
  { value: "medium_strong", label: "Medium-strong" },
  { value: "medium", label: "Medium" },
  { value: "weak", label: "Weak" },
] as const;
export type ProgramFitValue = (typeof PROGRAM_FIT)[number]["value"];

export const ENTITY_TYPES = [
  { value: "parent", label: "Parent company" },
  { value: "operating_sub", label: "Principal operating subsidiary" },
  { value: "regulated_bank", label: "Regulated bank" },
  { value: "jv", label: "Joint venture" },
  { value: "acquired_product", label: "Acquired product company" },
  { value: "other_sub", label: "Other subsidiary" },
  { value: "partner", label: "Partner organization" },
  { value: "separate_company", label: "Separate company (out of scope)" },
] as const;
export type EntityTypeValue = (typeof ENTITY_TYPES)[number]["value"];

export const DOC_TYPES = [
  { value: "entity_map", label: "Entity map" },
  { value: "org_map", label: "Org map" },
  { value: "key_contacts", label: "Key contacts" },
  { value: "initiatives", label: "Initiatives" },
  { value: "challenges", label: "Challenges & pains" },
  { value: "product_kb", label: "Product knowledge base" },
  { value: "personas", label: "Persona rules" },
  { value: "research", label: "Research" },
  { value: "other", label: "Other" },
] as const;
export type DocTypeValue = (typeof DOC_TYPES)[number]["value"];

export const ENGAGE_STAGES = [
  "Prospect",
  "Discovery",
  "Qualify",
  "Pilot design",
  "Pilot",
  "Security review",
  "Business case",
  "Paper",
  "Close",
  "Expansion",
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
