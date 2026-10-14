/**
 * Pure ingest logic: the zod contracts both AI calls must satisfy, and the
 * entity resolution that verifies the model's matches against real contacts.
 * Everything here is deterministic and unit-tested; the server action wires it
 * to Supabase and the AI client. The model proposes, code disposes: a match
 * that does not verify exactly is treated as a new person, never a fuzzy write.
 */
import { z } from "zod";
import { INFERENCE_KINDS } from "@/lib/inference/queue";

export const CALL_TYPES = ["discovery", "adaptive_non_discovery", "partner_or_internal", "personal_note"] as const;
export type CallType = (typeof CALL_TYPES)[number];

export const CALL_TYPE_LABELS: Record<CallType, string> = {
  discovery: "Discovery call",
  adaptive_non_discovery: "Non-discovery call",
  partner_or_internal: "Partner / internal",
  personal_note: "Personal note",
};

// ───────────────────────── Call-notes response ─────────────────────────

export const notesResponseSchema = z.object({
  call_type: z.enum(CALL_TYPES),
  notes_markdown: z.string().min(1).max(30000),
});
export type NotesResponse = z.infer<typeof notesResponseSchema>;

// ───────────────────────── Extraction response ─────────────────────────

const evidenceItem = z.object({
  claim: z.string().min(1).max(2000),
  source_label: z.string().max(300).optional(),
  source_url: z.string().max(1000).optional(),
  confidence: z.enum(["confirmed", "secondhand", "unverified", "inference"]).optional(),
});

export const proposalItem = z.object({
  kind: z.enum(INFERENCE_KINDS),
  value: z.record(z.string(), z.unknown()),
  confidence: z.enum(["confirmed", "secondhand", "unverified", "inference"]).optional(),
  evidence: z.array(evidenceItem).max(10).optional(),
  rationale: z.string().max(2000).optional(),
});
export type ExtractedProposal = z.infer<typeof proposalItem>;

export const extractedPerson = z.object({
  name: z.string().min(1).max(300),
  /** The model's claim about who this is; re-verified below against exact names. */
  match: z.string().max(300).nullable().optional(),
  email: z.string().max(320).nullable().optional(),
  linkedin_url: z.string().max(500).nullable().optional(),
  title: z.string().max(300).nullable().optional(),
  org: z.string().max(300).nullable().optional(),
  /** A dated note for this person's timeline; appended on ingest, never replaced. */
  note: z.string().max(8000).nullable().optional(),
  proposals: z.array(proposalItem).max(20).optional(),
});
export type ExtractedPerson = z.infer<typeof extractedPerson>;

export const nextStepItem = z.object({
  person: z.string().max(300).nullable().optional(),
  text: z.string().min(1).max(1000),
  due: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  committed: z.boolean().optional(),
});

export const extractionResponseSchema = z.object({
  people: z.array(extractedPerson).max(30).default([]),
  account_proposals: z.array(proposalItem).max(20).default([]),
  next_steps: z.array(nextStepItem).max(20).default([]),
});
export type ExtractionResponse = z.infer<typeof extractionResponseSchema>;

/**
 * What the document row stores in `extraction`: the parsed response with every
 * person's code-verified contact id (null until they exist or are created),
 * plus a `created` map of people the seller has added since the ingest.
 */
export const storedExtractionSchema = extractionResponseSchema.extend({
  people: z.array(extractedPerson.extend({ contact_id: z.string().nullable() })).max(30),
  created: z.record(z.string(), z.string()).optional(),
});
export type StoredExtraction = z.infer<typeof storedExtractionSchema>;

// ───────────────────────── Entity resolution ─────────────────────────

export type MatchableContact = {
  id: string;
  full_name: string;
  email: string | null;
  linkedin_public_url: string | null;
};

const norm = (s: string | null | undefined) => (s ?? "").trim().toLowerCase();
const sameUrl = (a: string | null | undefined, b: string | null | undefined) =>
  !!a && !!b && norm(a).replace(/\/+$/, "") === norm(b).replace(/\/+$/, "");

export type MatchedBy = "match" | "email" | "linkedin" | "name";

/**
 * Verifies the model's claimed match first, then exact identifiers, then exact
 * names. Never fuzzy: a person who does not resolve exactly is new, and
 * creating them re-checks for name collisions in the action.
 */
export function resolvePerson(
  person: Pick<ExtractedPerson, "name" | "match" | "email" | "linkedin_url">,
  contacts: MatchableContact[],
): { contactId: string; matchedBy: MatchedBy } | { contactId: null } {
  if (person.match) {
    const byMatch = contacts.find((c) => norm(c.full_name) === norm(person.match));
    if (byMatch) return { contactId: byMatch.id, matchedBy: "match" };
  }
  if (person.email) {
    const byEmail = contacts.find((c) => norm(c.email) === norm(person.email));
    if (byEmail) return { contactId: byEmail.id, matchedBy: "email" };
  }
  if (person.linkedin_url) {
    const byUrl = contacts.find((c) => sameUrl(c.linkedin_public_url, person.linkedin_url));
    if (byUrl) return { contactId: byUrl.id, matchedBy: "linkedin" };
  }
  const byName = contacts.find((c) => norm(c.full_name) === norm(person.name));
  if (byName) return { contactId: byName.id, matchedBy: "name" };
  return { contactId: null };
}

/** The AI names people as spoken; contacts store first/last. */
export function splitFullName(name: string): { first_name: string; last_name: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { first_name: parts[0] ?? "", last_name: "" };
  return { first_name: parts[0] ?? "", last_name: parts.slice(1).join(" ") };
}

/** Evidence straight from the model lands here with a confidence on every claim. */
export function normalizeEvidence(
  items: ExtractedProposal["evidence"],
): { claim: string; source_label?: string; source_url?: string; confidence: "confirmed" | "secondhand" | "unverified" | "inference" }[] {
  return (items ?? []).map((e) => ({ ...e, confidence: e.confidence ?? "inference" }));
}
