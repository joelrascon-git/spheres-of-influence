import { deriveStartDate } from "@/lib/tenure";
import type { Seniority } from "@/lib/constants";

/** One Evaboot export row, normalized into the fields the app stores. */
export type ImportedContact = {
  linkedin_uid: string | null;
  linkedin_public_url: string | null;
  sales_nav_url: string | null;
  first_name: string;
  last_name: string;
  title: string | null;
  headline: string | null;
  summary: string | null;
  job_description: string | null;
  location: string | null;
  email: string | null;
  email_provider_status: string | null;
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
  suggested_seniority: Seniority | null;
  company: ImportedCompany;
  raw: Record<string, string>;
};

export type ImportedCompany = {
  name: string | null;
  domain: string | null;
  website: string | null;
  linkedin_company_id: string | null;
  industry: string | null;
  employee_count: number | null;
  description: string | null;
  specialities: string | null;
  company_type: string | null;
  hq: string | null;
  hq_full_address: string | null;
  year_founded: number | null;
  revenue_min_musd: number | null;
  revenue_max_musd: number | null;
  employee_growth: Record<string, number>;
  department_headcounts: Record<string, number>;
};

const NULLISH = new Set(["", "na", "n/a", "none", "null", "undefined", "-"]);

export function clean(v: unknown): string | null {
  if (v == null) return null;
  // Evaboot exports are often UTF-8 read as Latin-1; repair the common bullet/quote mojibake.
  const s = repairMojibake(String(v)).trim();
  return NULLISH.has(s.toLowerCase()) ? null : s;
}

// Windows-1252 code points for bytes 0x80-0x9F, so text decoded as cp1252 can be turned back into bytes.
const CP1252: Record<number, number> = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87,
  0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a, 0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91,
  0x2019: 0x92, 0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02dc: 0x98,
  0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c, 0x017e: 0x9e, 0x0178: 0x9f,
};
const utf8 = new TextDecoder("utf-8", { fatal: true });

/** Repairs UTF-8 text that was mis-decoded as Latin-1/Windows-1252 (e.g. "â€¢" back to "•"). */
export function repairMojibake(s: string): string {
  if (!/[\u00c2-\u00f4][\u0080-\u00bf\u0152-\u2122]/.test(s)) return s;
  const bytes: number[] = [];
  for (const ch of s) {
    const code = ch.codePointAt(0)!;
    if (code <= 0xff) bytes.push(code);
    else if (CP1252[code] != null) bytes.push(CP1252[code]);
    else return s;
  }
  try {
    return utf8.decode(new Uint8Array(bytes));
  } catch {
    return s;
  }
}

function num(v: unknown): number | null {
  const s = clean(v);
  if (s == null) return null;
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function bool(v: unknown): boolean | null {
  const s = clean(v)?.toLowerCase();
  if (s == null) return null;
  if (["true", "yes", "y", "1"].includes(s)) return true;
  if (["false", "no", "n", "0"].includes(s)) return false;
  return null;
}

/** Last path segment of a LinkedIn URL: the immutable member id (ACwAA...) or a company number. */
export function linkedinIdFromUrl(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/linkedin\.com\/(?:in|company|sales\/lead|sales\/people)\/([^/?#,]+)/i);
  if (m) return decodeURIComponent(m[1]);
  return null;
}

export function parseHeadcounts(v: unknown): Record<string, number> {
  const s = clean(v);
  const out: Record<string, number> = {};
  if (!s) return out;
  for (const line of s.split(/\r?\n|;/)) {
    const m = line.match(/^\s*([^:]+?)\s*:\s*([\d,]+)\s*$/);
    if (m) out[m[1]] = Number(m[2].replace(/,/g, ""));
  }
  return out;
}

export function inferSeniority(title: string | null): Seniority | null {
  if (!title) return null;
  const t = title.toLowerCase();
  if (/\b(chief|ceo|cto|cio|cfo|coo|ciso|cdo|cpo|cmo|president|founder)\b/.test(t)) return "c_level";
  if (/\b(svp|evp|avp|vp|vice president)\b/.test(t)) return "vp";
  if (/\b(director|head of)\b/.test(t)) return "director";
  if (/\b(manager|mgr|team lead)\b/.test(t)) return "manager";
  return "ic";
}

/** Case- and spacing-insensitive header lookup so minor column-name changes don't break imports. */
function getter(row: Record<string, string>) {
  const index = new Map<string, string>();
  for (const k of Object.keys(row)) index.set(normalizeHeader(k), k);
  return (...names: string[]) => {
    for (const n of names) {
      const key = index.get(normalizeHeader(n));
      if (key != null) return row[key];
    }
    return undefined;
  };
}

export function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export const REQUIRED_HEADERS = ["First Name", "Last Name"];

export function missingHeaders(headers: string[]): string[] {
  const have = new Set(headers.map(normalizeHeader));
  return REQUIRED_HEADERS.filter((h) => !have.has(normalizeHeader(h)));
}

export function mapEvabootRow(row: Record<string, string>, exportDate: string): ImportedContact {
  const g = getter(row);
  const uniqueUrl = clean(g("Linkedin URL Unique ID", "LinkedIn Unique ID"));
  const salesNav = clean(g("Sales Navigator URL"));
  const uid = linkedinIdFromUrl(uniqueUrl) ?? linkedinIdFromUrl(salesNav);
  const title = clean(g("Current Job", "Job Title", "Title"));
  const companyUniqueUrl = clean(g("Company Linkedin URL Unique ID", "Company LinkedIn URL"));
  const domain = clean(g("Company Domain"))?.toLowerCase().replace(/^www\./, "") ?? null;

  const raw: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    const c = clean(v);
    if (c != null) raw[k] = c;
  }

  return {
    linkedin_uid: uid,
    linkedin_public_url: clean(g("Linkedin URL Public", "LinkedIn URL", "Linkedin URL")),
    sales_nav_url: salesNav,
    first_name: clean(g("First Name")) ?? "",
    last_name: clean(g("Last Name")) ?? "",
    title,
    headline: clean(g("Profile Headline", "Headline")),
    summary: clean(g("Profile Summary", "Summary")),
    job_description: clean(g("Job Description")),
    location: clean(g("Location")),
    email: clean(g("Email"))?.toLowerCase() ?? null,
    email_provider_status: clean(g("Email Status")),
    avatar_source_url: clean(g("Profile Picture", "Profile Picture URL")),
    profile_industry: clean(g("Profile Industry")),
    connections: num(g("Connections")),
    is_premium: bool(g("Is Premium")),
    is_open_profile: bool(g("Is Open Profile")),
    is_open_to_work: bool(g("Is Open To Work")),
    current_jobs_count: num(g("Current Jobs Number")),
    total_positions_count: num(g("Total Positions Count")),
    role_start: deriveStartDate(exportDate, num(g("Years in Position")), num(g("Months in Position"))),
    company_start: deriveStartDate(exportDate, num(g("Years in Company")), num(g("Months in Company"))),
    suggested_seniority: inferSeniority(title),
    company: {
      name: clean(g("Company Name")),
      domain,
      website: clean(g("Company Website URL")),
      linkedin_company_id: linkedinIdFromUrl(companyUniqueUrl),
      industry: clean(g("Company Industry")),
      employee_count: num(g("Company Employee Exact Count")),
      description: clean(g("Company Description")),
      specialities: clean(g("Company Specialities")),
      company_type: clean(g("Company Type")),
      hq: clean(g("Company Location")),
      hq_full_address: clean(g("Company Headquarters (Full Address)")),
      year_founded: num(g("Company Year Founded")),
      revenue_min_musd: num(g("Company Revenue Min (Millions USD)")),
      revenue_max_musd: num(g("Company Revenue Max (Millions USD)")),
      employee_growth: Object.fromEntries(
        (
          [
            ["6m", num(g("Company Employee Growth 6 Months (%)"))],
            ["1y", num(g("Company Employee Growth 1 Year (%)"))],
            ["2y", num(g("Company Employee Growth 2 Years (%)"))],
          ] as const
        ).filter(([, v]) => v != null),
      ) as Record<string, number>,
      department_headcounts: parseHeadcounts(g("Department Headcounts")),
    },
    raw,
  };
}

/** Evaboot's deliverability verdict seeds the email dot; the seller can change it after. */
export function emailQualityFromProvider(status: string | null): "good" | "questionable" | "bad" | null {
  const s = status?.toLowerCase();
  if (!s) return null;
  if (s === "safe" || s === "valid") return "good";
  if (s === "riskier" || s === "risky" || s === "catch-all" || s === "catch_all") return "questionable";
  if (s === "invalid" || s === "bad") return "bad";
  return null;
}
