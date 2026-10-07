import type { ImportedContact } from "@/lib/import/evaboot";
import { monthsBetween } from "@/lib/tenure";

/**
 * Only these fields come from LinkedIn/Evaboot. Everything else on a contact (status, persona,
 * notes, tags, reporting lines, quality dots...) belongs to the seller and is never touched by an import.
 */
export const DIFFABLE_FIELDS = [
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "title", label: "Title" },
  { key: "headline", label: "Profile Headline" },
  { key: "summary", label: "Profile Summary" },
  { key: "job_description", label: "Job Description" },
  { key: "location", label: "Location" },
  { key: "email", label: "Email" },
  { key: "linkedin_public_url", label: "LinkedIn URL" },
  { key: "role_start", label: "Role Start" },
  { key: "company_start", label: "Company Start" },
] as const;

/** Refreshed on every import without review because they are low-signal or rotate constantly. */
export const SILENT_FIELDS = [
  "sales_nav_url",
  "avatar_source_url",
  "profile_industry",
  "connections",
  "is_premium",
  "is_open_profile",
  "is_open_to_work",
  "current_jobs_count",
  "total_positions_count",
  "email_provider_status",
] as const;

export type DiffKey = (typeof DIFFABLE_FIELDS)[number]["key"] | "company";

export type FieldDiff = {
  field: DiffKey;
  label: string;
  before: string | null;
  after: string | null;
  /** Pre-checked in the review UI. False when applying would overwrite something the seller likely set. */
  defaultAccept: boolean;
  /** The seller's checkbox decision in the review UI; undefined means fall back to defaultAccept. */
  accept?: boolean;
  note?: string;
};

export type ExistingContact = {
  id: string;
  account_id: string | null;
  linkedin_uid: string | null;
  email: string | null;
  first_name: string;
  last_name: string;
  statuses: string[];
} & Partial<Record<(typeof DIFFABLE_FIELDS)[number]["key"], string | null>>;

export type PlannedItem = {
  rowIndex: number;
  action: "create" | "update" | "unchanged" | "review" | "error";
  matchReason: string | null;
  matchedContactId: string | null;
  candidateContactIds: string[];
  diff: FieldDiff[];
  error?: string;
};

const norm = (v: string | null | undefined) => (v ?? "").replace(/\s+/g, " ").trim();
const nameKey = (first: string, last: string) =>
  `${first} ${last}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** Re-derived start dates drift by a month between exports because Evaboot reports whole months. */
const START_DATE_TOLERANCE_MONTHS = 1;

function datesEquivalent(a: string | null, b: string | null): boolean {
  if (!a || !b) return a === b;
  const [early, late] = a < b ? [a, b] : [b, a];
  return monthsBetween(early, late) <= START_DATE_TOLERANCE_MONTHS;
}

export function diffContact(
  existing: ExistingContact,
  incoming: ImportedContact,
  incomingAccountId: string | null,
): FieldDiff[] {
  const diffs: FieldDiff[] = [];
  for (const { key, label } of DIFFABLE_FIELDS) {
    const before = (existing[key] ?? null) as string | null;
    const after = (incoming[key] ?? null) as string | null;
    if (after == null) continue; // A blank in the export never erases stored data.
    if (key === "role_start" || key === "company_start") {
      if (datesEquivalent(before, after)) continue;
    } else if (norm(before) === norm(after)) {
      continue;
    }
    let defaultAccept = true;
    let note: string | undefined;
    if (key === "email" && before) {
      defaultAccept = false;
      note = "Keeps your current email unless you accept.";
    }
    if (key === "role_start") note = "New role start date: likely a new position.";
    diffs.push({ field: key, label, before, after, defaultAccept, note });
  }
  if (incomingAccountId && existing.account_id && incomingAccountId !== existing.account_id) {
    diffs.push({
      field: "company",
      label: "Company",
      before: existing.account_id,
      after: incomingAccountId,
      defaultAccept: true,
      note: "Different company in this export. Accepting marks the stored contact as No Longer at Company.",
    });
  }
  return diffs;
}

export function planImport(
  rows: { contact: ImportedContact; accountId: string | null }[],
  existing: ExistingContact[],
): PlannedItem[] {
  const byUid = new Map<string, ExistingContact>();
  const byEmail = new Map<string, ExistingContact>();
  const byName = new Map<string, ExistingContact[]>();
  for (const c of existing) {
    if (c.linkedin_uid) byUid.set(c.linkedin_uid, c);
    if (c.email) byEmail.set(c.email.toLowerCase(), c);
    const k = nameKey(c.first_name, c.last_name);
    if (k) byName.set(k, [...(byName.get(k) ?? []), c]);
  }
  const seenUids = new Set<string>();

  return rows.map(({ contact, accountId }, rowIndex): PlannedItem => {
    if (!contact.first_name && !contact.last_name) {
      return { rowIndex, action: "error", matchReason: null, matchedContactId: null, candidateContactIds: [], diff: [], error: "Missing name" };
    }
    if (contact.linkedin_uid) {
      if (seenUids.has(contact.linkedin_uid)) {
        return { rowIndex, action: "unchanged", matchReason: "Duplicate row in this file", matchedContactId: null, candidateContactIds: [], diff: [] };
      }
      seenUids.add(contact.linkedin_uid);
    }

    const exact =
      (contact.linkedin_uid && byUid.get(contact.linkedin_uid)) ||
      (contact.email && byEmail.get(contact.email.toLowerCase())) ||
      null;
    if (exact) {
      const reason = contact.linkedin_uid && exact.linkedin_uid === contact.linkedin_uid ? "LinkedIn ID" : "Email";
      const diff = diffContact(exact, contact, accountId);
      return {
        rowIndex,
        action: diff.length ? "update" : "unchanged",
        matchReason: reason,
        matchedContactId: exact.id,
        candidateContactIds: [],
        diff,
      };
    }

    // Same name without a shared identifier is ambiguous: let the seller decide.
    const candidates = (byName.get(nameKey(contact.first_name, contact.last_name)) ?? []).filter(
      (c) => !c.linkedin_uid || !contact.linkedin_uid || c.linkedin_uid !== contact.linkedin_uid,
    );
    if (candidates.length) {
      return {
        rowIndex,
        action: "review",
        matchReason: "Same name, different or missing LinkedIn ID",
        matchedContactId: null,
        candidateContactIds: candidates.map((c) => c.id),
        diff: [],
      };
    }
    return { rowIndex, action: "create", matchReason: null, matchedContactId: null, candidateContactIds: [], diff: [] };
  });
}
