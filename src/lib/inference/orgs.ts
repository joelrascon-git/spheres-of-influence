/**
 * Deterministic org assignment: match a profile's text against org names and
 * aliases. Only a unique, distinctive alias match yields an assignment; anything
 * ambiguous or weak is left for the inference queue instead of being guessed.
 */
import { normalizeTitle } from "@/lib/inference/title";

export type OrgRef = { id: string; name: string; aliases?: string[] };

export type OrgMatch = { orgId: string; alias: string };

const MIN_ALIAS_LENGTH = 4;

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// JS-compatible word boundaries (\m/\M are Postgres-only): boundary only where the
// alias edge is a word character, so ".net" and "c++" still match.
const wordBoundary = (alias: string) => {
  const start = /^\w/.test(alias) ? "(?<![\\w])" : "";
  const end = /\w$/.test(alias) ? "(?![\\w])" : "";
  return new RegExp(`${start}${escape(alias)}${end}`, "i");
};

/**
 * All orgs whose name or alias appears in the text, best (longest) alias per org.
 * Order: longest matched alias first.
 */
export function orgCandidates(text: string, orgs: OrgRef[]): OrgMatch[] {
  const haystack = normalizeTitle(text);
  if (!haystack) return [];
  const out: OrgMatch[] = [];
  for (const org of orgs) {
    const names = [org.name, ...(org.aliases ?? [])];
    let best: string | null = null;
    for (const alias of names) {
      const a = alias.toLowerCase().trim();
      if (a.length < MIN_ALIAS_LENGTH) continue;
      if (wordBoundary(a).test(haystack) && (!best || a.length > best.length)) best = a;
    }
    if (best) out.push({ orgId: org.id, alias: best });
  }
  return out.sort((x, y) => y.alias.length - x.alias.length);
}

/**
 * The org a profile belongs to, or null when the evidence is weak or split.
 * Ties between equally-long aliases from different orgs count as ambiguous.
 */
export function assignOrg(text: string, orgs: OrgRef[]): OrgMatch | null {
  const candidates = orgCandidates(text, orgs);
  if (!candidates.length) return null;
  const top = candidates[0];
  const tied = candidates.filter((c) => c.alias.length === top.alias.length);
  if (tied.length > 1) return null;
  return top;
}
