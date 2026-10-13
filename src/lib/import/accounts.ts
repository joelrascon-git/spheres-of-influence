/**
 * Account matching for imports: pure functions so every distinct company in an
 * export lands on the right account without per-company database queries.
 *
 * Ladder: domain → LinkedIn company id → exact name → conservative variant fold.
 * The fold relies on "distinctive words": legal suffixes, geography and filler are
 * stripped, so "American Express Banking corporation" and "American Express India
 * Private Limited (AEIPL)" share American Express' distinctive words {american,
 * express} and fold in, while "Wells Fargo", "Arlo" and "American Express /
 * Accertify" keep their own accounts. "American Express Global Business Travel" is
 * protected by its distinctive "travel" word: it never folds into American Express
 * or vice versa.
 */
import type { ImportedCompany } from "@/lib/import/evaboot";

export type ExistingAccount = {
  id: string;
  name: string;
  domain: string | null;
  linkedin_company_id: string | null;
};

export type AccountMatchReason = "domain" | "linkedin_company_id" | "exact_name" | "variant";

export type AccountDecision = { accountId: string; reason: AccountMatchReason } | null;

/** Words that carry no identity: legal suffixes, geography, org filler. */
const GENERIC_NAME_WORDS = new Set([
  "a", "an", "and", "the", "of", "at", "for",
  "inc", "incorporated", "corp", "corporation", "llc", "ltd", "limited", "plc",
  "co", "company", "companies", "group", "holdings", "holding", "pvt", "private", "public",
  "international", "intl", "global", "worldwide", "usa", "us", "uk", "india", "emea", "apac",
  "bank", "banking", "financial", "financials", "services", "service", "solutions",
  "business", "technologies", "technology", "systems", "digital", "software",
  "ex",
]);

export function normalizeDomain(domain: string | null | undefined): string | null {
  const d = domain?.toLowerCase().trim().replace(/^www\./, "");
  return d ? d : null;
}

/** Lower-cased name tokens with parentheticals stripped: "…(AEIPL)" stops being a word. */
export function nameTokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean);
}

export function distinctiveTokens(name: string): string[] {
  return nameTokens(name).filter((t) => !GENERIC_NAME_WORDS.has(t));
}

/** Per-row account key: the strongest identifier the export row carries. */
export function companyKey(company: ImportedCompany): string {
  return normalizeDomain(company.domain) ?? company.linkedin_company_id ?? nameTokens(company.name ?? "").join(" ");
}

/** Amex GBT is a separate company and out of scope for the AmEx pursuit. */
export function isGbtCompany(company: ImportedCompany): boolean {
  const domain = normalizeDomain(company.domain);
  if (domain && /(^|\.)amexgbt\.com$/.test(domain)) return true;
  return /global business travel/.test((company.name ?? "").toLowerCase());
}

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((t) => b.includes(t));

/**
 * The account one export company belongs to, or null to create a new account.
 * Ties between equally-distinctive accounts resolve to the name sharing more raw
 * words with the incoming company, then to the first account for stability.
 */
export function matchAccount(company: ImportedCompany, accounts: ExistingAccount[]): AccountDecision {
  const domain = normalizeDomain(company.domain);
  if (domain) {
    const hit = accounts.find((a) => normalizeDomain(a.domain) === domain);
    if (hit) return { accountId: hit.id, reason: "domain" };
  }
  if (company.linkedin_company_id) {
    const hit = accounts.find((a) => a.linkedin_company_id === company.linkedin_company_id);
    if (hit) return { accountId: hit.id, reason: "linkedin_company_id" };
  }
  const raw = nameTokens(company.name ?? "");
  if (!raw.length) return null;
  const exact = accounts.find((a) => a.name && sameSet(nameTokens(a.name), raw));
  if (exact) return { accountId: exact.id, reason: "exact_name" };

  // Variant fold: same distinctive words, so the extra words are generic.
  const distinctive = distinctiveTokens(company.name ?? "");
  if (distinctive.length) {
    const folds = accounts
      .filter((a) => a.name && sameSet(distinctiveTokens(a.name), distinctive))
      .map((a) => ({ account: a, overlap: nameTokens(a.name).filter((t) => raw.includes(t)).length }))
      .sort((x, y) => y.overlap - x.overlap || x.account.id.localeCompare(y.account.id));
    if (folds.length) return { accountId: folds[0].account.id, reason: "variant" };
  }
  return null;
}

export type AccountPlan = {
  /** The per-row account key this plan resolves (domain → LinkedIn id → name tokens). */
  key: string;
  company: ImportedCompany;
  /** Existing account matched, if any. */
  match: AccountDecision;
  /** Another plan's new account this key reuses: same brand, variant name. */
  reuseKey: string | null;
  /** True when the company is Amex GBT: its account is tagged out of scope. */
  outOfScope: boolean;
};

const virtualOf = (plan: AccountPlan): ExistingAccount => ({
  id: plan.key,
  name: plan.company.name ?? plan.key,
  domain: plan.company.domain,
  linkedin_company_id: plan.company.linkedin_company_id,
});

/**
 * Resolve every distinct company in the file in one pass. Strong keys (domain or
 * LinkedIn company id) are matched first; name-only keys then try the same ladder
 * against both existing accounts and the accounts this import is about to create.
 */
export function planAccounts(
  companies: Map<string, ImportedCompany>,
  existing: ExistingAccount[],
): AccountPlan[] {
  const plans: AccountPlan[] = [];
  const resolve = (key: string, company: ImportedCompany): AccountPlan => {
    const match = matchAccount(company, existing);
    if (match) return { key, company, match, reuseKey: null, outOfScope: isGbtCompany(company) };
    // No existing account: fold into an account an earlier plan creates.
    for (const plan of plans) {
      if (matchAccount(company, [virtualOf(plan)])) {
        return { key, company, match: null, reuseKey: plan.reuseKey ?? plan.key, outOfScope: isGbtCompany(company) };
      }
    }
    return { key, company, match: null, reuseKey: null, outOfScope: isGbtCompany(company) };
  };

  const entries = [...companies.entries()];
  const strong = entries.filter(([, c]) => normalizeDomain(c.domain) || c.linkedin_company_id);
  const weak = entries.filter(([, c]) => !normalizeDomain(c.domain) && !c.linkedin_company_id);
  for (const [key, company] of [...strong, ...weak]) plans.push(resolve(key, company));
  return plans;
}
