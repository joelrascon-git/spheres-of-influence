import type {
  ChampionFlagValue,
  Confidence,
  DocTypeValue,
  EntityTypeValue,
  OrgFitValue,
  PersonaStatusValue,
  ProgramFitValue,
  Quality,
  ResearchConfidence,
  Seniority,
  SeniorityLevelValue,
} from "@/lib/constants";

/** A single sourced claim about a person, org or account, with its confidence. */
export type Evidence = {
  claim: string;
  source_url?: string;
  source_label?: string;
  confidence: ResearchConfidence;
};

/** A cited source from the research corpus. */
export type Source = { label: string; url: string };

export type ProgramLink = {
  code: string;
  strength: "documented" | "inferred";
  note?: string;
};

export type Account = {
  id: string;
  name: string;
  domain: string | null;
  website: string | null;
  linkedin_company_id: string | null;
  parent_account_id: string | null;
  parent_relationship: "independent" | "semi_autonomous" | "centralized" | "unknown";
  parent_relationship_notes: string | null;
  industry: string | null;
  employee_count: number | null;
  engineer_count: number | null;
  hq: string | null;
  hq_lat: number | null;
  hq_lng: number | null;
  description: string | null;
  specialities: string | null;
  company_type: string | null;
  year_founded: number | null;
  revenue_min_musd: number | null;
  revenue_max_musd: number | null;
  employee_growth: Record<string, number>;
  department_headcounts: Record<string, number>;
  logo_path: string | null;
  why_anything: string | null;
  why_factory: string | null;
  why_now: string | null;
  notes: string | null;
  sumble_org_id: number | null;
  sumble_data: Record<string, unknown>;
  sumble_fetched_at: string | null;
  custom_fields: Record<string, unknown>;
  entity_type: EntityTypeValue | null;
  out_of_scope: boolean;
  created_at: string;
  updated_at: string;
};

export type Org = {
  id: string;
  account_id: string;
  parent_org_id: string | null;
  name: string;
  aliases: string[];
  description: string | null;
  status: "confirmed" | "inferred";
  notes: string | null;
  color: string | null;
  sort_order: number;
  factory_fit: OrgFitValue | null;
  buying_role: string | null;
  rank: number | null;
  confidence: ResearchConfidence | null;
  created_at: string;
  updated_at: string;
};

export type Contact = {
  id: string;
  account_id: string | null;
  org_id: string | null;
  linkedin_uid: string | null;
  linkedin_public_url: string | null;
  sales_nav_url: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  title: string | null;
  headline: string | null;
  summary: string | null;
  job_description: string | null;
  location: string | null;
  location_lat: number | null;
  location_lng: number | null;
  location_city: string | null;
  location_region: string | null;
  location_country: string | null;
  avatar_path: string | null;
  avatar_source_url: string | null;
  profile_industry: string | null;
  connections: number | null;
  is_premium: boolean | null;
  is_open_profile: boolean | null;
  is_open_to_work: boolean | null;
  current_jobs_count: number | null;
  total_positions_count: number | null;
  role_start: string | null;
  company_start: string | null;
  email: string | null;
  email_quality: Quality | null;
  email_provider_status: string | null;
  phone: string | null;
  phone_quality: Quality | null;
  seniority: Seniority | null;
  seniority_level: SeniorityLevelValue | null;
  function_bucket: number | null;
  persona_status: PersonaStatusValue | null;
  champion_flag: ChampionFlagValue;
  can_veto: boolean | null;
  influence_score: number | null;
  engage_stage: string | null;
  buying_role: string | null;
  evidence: Evidence[];
  gaps: string[];
  is_key: boolean;
  key_reasoning: string | null;
  personas: string[];
  statuses: string[];
  last_contacted: string | null;
  reports_to_id: string | null;
  reports_to_confidence: Confidence | null;
  reports_to_evidence: string | null;
  personal_details: Record<string, string>;
  custom_fields: Record<string, unknown>;
  evaboot_raw: Record<string, string>;
  sumble_person_id: number | null;
  sumble_data: Record<string, unknown>;
  last_imported_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Influence = {
  id: string;
  from_contact_id: string;
  to_contact_id: string;
  strength: "high" | "medium" | "low";
  confidence: Confidence;
  evidence: string | null;
  source: string;
  created_at: string;
  updated_at: string;
};

export type ResearchDoc = {
  id: string;
  account_id: string | null;
  scope: "account" | "seller";
  doc_type: DocTypeValue;
  title: string;
  body_html: string;
  body_text: string;
  source_file_path: string | null;
  source_file_name: string | null;
  created_at: string;
  updated_at: string;
};

export type Initiative = {
  id: string;
  account_id: string;
  code: string;
  name: string;
  summary: string | null;
  why_it_matters: string | null;
  solving_for: string | null;
  factory_fit: ProgramFitValue | null;
  factory_hypothesis: string | null;
  technologies: string[];
  key_dates: { label: string; date: string }[];
  rank: number | null;
  confidence: ResearchConfidence | null;
  sources: Source[];
  doc_id: string | null;
  notes: string | null;
  custom_fields: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type Challenge = {
  id: string;
  account_id: string;
  code: string;
  name: string;
  summary: string | null;
  why_it_matters: string | null;
  impact: string | null;
  entity: string | null;
  factory_fit: ProgramFitValue | null;
  factory_hypothesis: string | null;
  key_dates: { label: string; date: string }[];
  rank: number | null;
  confidence: ResearchConfidence | null;
  sources: Source[];
  doc_id: string | null;
  notes: string | null;
  custom_fields: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

/** A confidence-scored proposal awaiting human review; accepted ones write to the subject. */
export type Inference = {
  id: string;
  subject_type: "contact" | "org" | "account" | "initiative" | "challenge";
  subject_id: string;
  kind:
    | "persona"
    | "seniority_level"
    | "org_assignment"
    | "key_person"
    | "reporting_line"
    | "initiative_link"
    | "challenge_link"
    | "field"
    | "summary"
    | "influence_edge";
  value: Record<string, unknown>;
  confidence: ResearchConfidence;
  evidence: Evidence[];
  rationale: string | null;
  status: "pending" | "accepted" | "rejected";
  source: "research" | "import" | "ai" | "manual";
  /** The pre-accept snapshot an undo restores; null when there was nothing to capture. */
  undo: Record<string, unknown> | null;
  document_id: string | null;
  created_at: string;
  resolved_at: string | null;
};

export type PersonaCatalogEntry = {
  id: string;
  code: string;
  name: string;
  definition: string | null;
  one_liner: string | null;
  weight: number;
  can_veto: boolean;
  meddpicc: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Note = {
  id: string;
  contact_id: string | null;
  account_id: string | null;
  org_id: string | null;
  body_html: string;
  body_text: string;
  source: "manual" | "ai" | "import";
  created_at: string;
  updated_at: string;
};

export type Tag = {
  id: string;
  name: string;
  description: string;
  color: string;
  created_at: string;
  updated_at: string;
};

/** One ingested source (transcript, voice note, free-form note) with its AI output. */
export type IngestDocument = {
  id: string;
  account_id: string;
  title: string;
  raw_text: string;
  call_type: string;
  notes_html: string;
  extraction: Record<string, unknown>;
  status: "processing" | "done" | "failed";
  error: string | null;
  created_at: string;
  updated_at: string;
};

export type FieldType =
  | "text"
  | "long_text"
  | "rich_text"
  | "number"
  | "date"
  | "select"
  | "multi_select"
  | "boolean"
  | "url"
  | "email"
  | "phone";

export type FieldDefinition = {
  id: string;
  entity: "contact" | "account" | "org";
  key: string;
  label: string;
  field_type: FieldType;
  options: string[];
  is_system: boolean;
  show_in_profile: boolean;
  show_in_list: boolean;
  show_on_canvas: boolean;
  sort_order: number;
  help_text: string | null;
};

export type Prompt = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  model: string;
  system_prompt: string;
  version: number;
  updated_at: string;
};

export type StyleRule = {
  id: string;
  name: string;
  field: string;
  operator: "contains" | "equals" | "is_true" | "is_empty";
  value: string | null;
  style: { border?: string; background?: string; opacity?: number; grayscale?: boolean; badge?: string };
  priority: number;
  enabled: boolean;
};
