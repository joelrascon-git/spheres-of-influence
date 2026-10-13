/**
 * The inference review queue: confidence-scored proposals that wait for human
 * review. Every AI feature writes here — never directly to contacts, orgs or
 * accounts. `sanitizeProposal` is pure so its validation rules are testable.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Evidence } from "@/lib/types";

export const INFERENCE_KINDS = [
  "persona",
  "seniority_level",
  "org_assignment",
  "key_person",
  "reporting_line",
  "initiative_link",
  "challenge_link",
  "field",
  "summary",
] as const;
export type InferenceKind = (typeof INFERENCE_KINDS)[number];

export const INFERENCE_SUBJECT_TYPES = ["contact", "org", "account", "initiative", "challenge"] as const;
export type InferenceSubjectType = (typeof INFERENCE_SUBJECT_TYPES)[number];

/** The corpus confidence taxonomy, as the inferences table stores it. */
const CONFIDENCES = ["confirmed", "secondhand", "unverified", "inference"] as const;
type InferenceConfidence = (typeof CONFIDENCES)[number];

export type InferenceProposal = {
  subject_type: InferenceSubjectType;
  subject_id: string;
  kind: InferenceKind;
  value: Record<string, unknown>;
  /** Defaults to "inference": an unreviewed proposal is never "confirmed". */
  confidence?: InferenceConfidence;
  evidence?: Evidence[];
  rationale?: string;
  source?: "research" | "import" | "ai" | "manual";
};

/** Valid enum check shared by the queue and unit tests. */
export function isValidProposal(p: InferenceProposal): boolean {
  return (
    INFERENCE_SUBJECT_TYPES.includes(p.subject_type) &&
    INFERENCE_KINDS.includes(p.kind) &&
    !!p.subject_id &&
    typeof p.value === "object" &&
    p.value !== null &&
    Object.keys(p.value).length > 0 &&
    (p.confidence === undefined || (CONFIDENCES as readonly string[]).includes(p.confidence))
  );
}

/**
 * Insert proposals for review. Returns the number queued; invalid entries are
 * dropped (they are model output, and a malformed proposal must never block
 * the well-formed ones behind it).
 */
export async function queueInferences(
  supabase: SupabaseClient,
  userId: string,
  proposals: InferenceProposal[],
): Promise<number> {
  const rows = proposals.filter(isValidProposal).map((p) => ({
    owner_id: userId,
    subject_type: p.subject_type,
    subject_id: p.subject_id,
    kind: p.kind,
    value: p.value,
    confidence: p.confidence ?? "inference",
    evidence: p.evidence ?? [],
    rationale: p.rationale ?? null,
    source: p.source ?? "ai",
  }));
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await supabase.from("inferences").insert(rows.slice(i, i + 200));
    if (error) throw new Error(`Inference queue: ${error.message}`);
  }
  return rows.length;
}
