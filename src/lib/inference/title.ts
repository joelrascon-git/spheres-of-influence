/**
 * Deterministic title parsing, ported from the persona knowledge base:
 * abbreviation normalization (§7), the L1–L6 seniority ladder with industry quirks,
 * and the keyword → function-bucket lexicon with default personas (§7.3).
 *
 * Everything here is pure and testable: the same title always produces the same
 * answer. Nothing from a title alone may set persona_status above "assumed" or
 * champion_flag above "potential" (rules 2 and 3 of the knowledge base).
 */
import type { PersonaCode, SeniorityLevelValue } from "@/lib/constants";

// ───────────────────────── Abbreviation expansion ─────────────────────────

const ABBREVIATIONS: Record<string, string> = {
  svp: "senior vice president",
  evp: "executive vice president",
  avp: "assistant vice president",
  vp: "vice president",
  ceo: "chief executive officer",
  cio: "chief information officer",
  cto: "chief technology officer",
  ciso: "chief information security officer",
  cdo: "chief data officer",
  coo: "chief operating officer",
  cfo: "chief financial officer",
  cro: "chief risk officer",
  clo: "chief legal officer",
  cmo: "chief marketing officer",
  cao: "chief audit executive",
  devex: "developer experience",
  genai: "generative ai",
  sdet: "software design engineer in test",
  devsecops: "development security operations",
};

/** Lowercase text with common title abbreviations expanded to full words. */
export function normalizeTitle(input: string | null | undefined): string {
  if (!input) return "";
  const lower = input.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, " ").trim();
  return lower
    .split(/(\s+|[,&/()]|\bv\b)/)
    .map((tok) => (tok in ABBREVIATIONS ? ABBREVIATIONS[tok] : tok))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

// ───────────────────────── Seniority ladder (§7.1) ─────────────────────────

/** Firms where "Vice President" is a mid-level title, not an executive one (§7.2). */
const INVESTMENT_BANKS = [
  "goldman",
  "jpmorgan",
  "jp morgan",
  "morgan stanley",
  "citi",
  "citibank",
  "bank of america",
  "bofa",
  "barclays",
  "ubs",
  "hsbc",
  "deutsche bank",
  "credit suisse",
  "wells fargo",
  "bajp",
];

export function isInvestmentBank(companyName: string | null | undefined): boolean {
  if (!companyName) return false;
  const c = companyName.toLowerCase();
  return INVESTMENT_BANKS.some((b) => c.includes(b));
}

const has = (text: string, re: RegExp) => re.test(text);

/** The finer L1–L6 ladder from the persona knowledge base. */
export function seniorityLevel(input: {
  title?: string | null;
  headline?: string | null;
  companyName?: string | null;
}): SeniorityLevelValue | null {
  // Profile headlines often repeat the title but can add the real seniority.
  const text = normalizeTitle(`${input.title ?? ""} ${input.headline ?? ""}`);
  if (!text) return null;
  const bank = isInvestmentBank(input.companyName);

  // Chief of Staff: influence without C-suite authority (§7.2) — never leveled as L1.
  if (has(text, /\bchief of staff\b/)) return "L3";

  // A C-seat combined with EVP is enterprise-wide (L1); with SVP it caps at L2.
  const chiefSeat = has(text, /\bchief\b/) || has(text, /\bceo\b/);
  if (chiefSeat && has(text, /\bexecutive vice president\b/)) return "L1";
  if (chiefSeat && has(text, /\bsenior vice president\b/)) return "L2";

  // A bare "president" is L1 only when it is not part of "vice president".
  const withoutVp = text.replace(/vice president/g, " ");
  if (chiefSeat || has(text, /\bgroup president\b/) || has(withoutVp, /\bpresident\b/)) return "L1";
  if (has(text, /\bexecutive vice president\b/)) return "L2";
  if (has(text, /\bsenior managing director\b/)) return bank ? "L2" : "L1";
  if (has(text, /\bmanaging director\b/)) return bank ? "L2" : "L1";
  if (has(text, /\bunit (cio|chief information officer)\b/)) return "L2";
  if (has(text, /\bsenior vice president\b/)) return "L2";
  if (has(text, /\bfellow\b/)) return "L2";
  if (has(text, /\bassistant vice president\b/)) return "L5";
  if (has(text, /\bvice president\b/)) return bank ? "L5" : "L3";
  if (has(text, /\bdistinguished\b/)) return "L3";
  if (has(text, /\bprincipal (engineer|architect|director|scientist)\b/)) return "L4";
  if (has(text, /\bprincipal\b/)) return "L4";
  if (has(text, /\bhead of\b/)) return "L3";
  // Acquired-company founders keep "CEO/CTO/Founder" on LinkedIn; inside the parent
  // they are treated as executives of their business (§7.2), not enterprise C-suite.
  if (has(text, /\b(co-)?founder\b/)) return "L3";
  if (has(text, /\b(senior )?director\b/)) return "L4";
  if (has(text, /\barchitect\b/)) return "L4";
  if (has(text, /\bleader\b/)) return "L4";
  if (has(text, /\bstaff(?!ing)\b/)) return "L5";
  if (has(text, /\b(senior )?manager\b/)) return "L5";
  if (has(text, /\bproduct owner\b/)) return "L5";
  if (has(text, /\b(lead|team lead|tech lead)\b/)) return "L5";
  if (
    has(
      text,
      /\b(engineer|developer|analyst|specialist|associate|scientist|consultant|administrator|technician|designer|programmer|researcher)\b/,
    )
  ) {
    return "L6";
  }
  return null;
}

/** L1–L6 mapped onto the coarser stored seniority used by lists and facets. */
export function legacySeniority(level: SeniorityLevelValue | null): "c_level" | "vp" | "director" | "manager" | "ic" | null {
  switch (level) {
    case "L1":
      return "c_level";
    case "L2":
    case "L3":
      return "vp";
    case "L4":
      return "director";
    case "L5":
      return "manager";
    case "L6":
      return "ic";
    default:
      return null;
  }
}

/** The technical career path overrides authority in the influence formula (§8.2). */
export function isIcTrack(input: { title?: string | null; headline?: string | null }): boolean {
  const text = normalizeTitle(`${input.title ?? ""} ${input.headline ?? ""}`);
  return has(text, /\b(fellow|distinguished|principal (engineer|architect|scientist)|staff engineer)\b/);
}

// ───────────────────────── Function buckets (§7.3) ─────────────────────────

/**
 * Buckets from the keyword lexicon, ordered by specificity so that, for example,
 * "Chief Information Security Officer" lands in InfoSec (8) rather than the
 * generic chief-information bucket (1). Ties resolve to the earlier bucket.
 */
const BUCKETS: { bucket: number; re: RegExp; personas: PersonaCode[] }[] = [
  { bucket: 8, re: /\b(ciso|security|cyber|appsec|devsecops|biso|vendor security)\b/, personas: ["INFOSEC"] },
  {
    bucket: 9,
    re: /\b(model risk|mrm|responsible ai|ai governance|technology risk|operational risk|chief risk officer|\bcro\b|compliance|\baudit)\b/,
    personas: ["INFOSEC", "LEGAL"],
  },
  {
    bucket: 16,
    re: /\b(procurement|sourcing|supply management|vendor management|supplier|category manager)\b/,
    personas: ["PROC"],
  },
  { bucket: 17, re: /\b(counsel|legal|privacy|\bdpo\b|contracts|general counsel)\b/, personas: ["LEGAL"] },
  { bucket: 15, re: /\b(cfo|finance|financial officer|fp&a|finops|controller)\b/, personas: ["FIN"] },
  {
    bucket: 1,
    re: /\b(cio|chief information officer|cto|chief technology officer|chief digital officer|unit cio|technology officer)\b/,
    personas: ["EB", "DM"],
  },
  {
    bucket: 7,
    re: /\b(chief of staff|office of the cio|technology strategy|\btbm\b|\bpmo\b|technology operations)\b/,
    personas: ["COACH"],
  },
  { bucket: 12, re: /\b(data platforms?|data engineering|chief data|analytics engineering)\b/, personas: ["BS", "TECH"] },
  {
    bucket: 3,
    re: /\b(developer experience|developer productivity|engineering productivity|developer enablement|enablement|engineering effectiveness|platform engineering|developer platforms?|paved road|inner source|devops|continuous integration|continuous delivery|build and release|\bscm\b|github|gitlab)\b/,
    personas: ["DM", "CH", "TECH"],
  },
  {
    bucket: 11,
    re: /\b(sre|reliability|production engineering|incident|observability|infrastructure|cloud operations|cloud engineering|site reliability)\b/,
    personas: ["DM", "TECH"],
  },
  { bucket: 10, re: /\b(quality engineering|\bqa\b|software testing|\btest engineer\b|sdet)\b/, personas: ["DM", "EVAL"] },
  {
    bucket: 2,
    re: /\b(artificial intelligence|generative|genai|\bllm\b|agentic|agent platforms?|machine learning|ai transformation|ai coe|ai platforms?|ai engineering)\b/,
    personas: ["TECH", "BS", "DM"],
  },
  {
    bucket: 6,
    re: /\b(architect|architecture|fellow|distinguished|principal engineer|staff engineer)\b/,
    personas: ["TECH", "COACH"],
  },
  { bucket: 14, re: /\b(product management|chief product|product owner|\bproduct\b)\b/, personas: ["BS", "COACH"] },
  {
    bucket: 5,
    re: /\b(modernization|legacy|mainframe|cobol|migration|transformation|rationalization)\b/,
    personas: ["BS", "CH"],
  },
  {
    bucket: 4,
    re: /\b(software engineering|engineering|software development|application development|sdlc|software developer)\b/,
    personas: ["DM", "CH", "EVAL"],
  },
  {
    bucket: 13,
    re: /\b(general manager|\bcoo\b|chief operating|chief transformation|remediation|(?<!vice )president)\b/,
    personas: ["BS"],
  },
  {
    bucket: 18,
    re: /\b(colleague experience|human resources|\bhr\b|talent|learning and development|people team)\b/,
    personas: ["COACH"],
  },
];

/**
 * Negative / deprioritize keywords (§7.3): external-facing or adjacent roles that a
 * naive keyword match would over-classify. Strong c-suite, AI-platform and security
 * signals still win; otherwise the title gets no default personas.
 */
const NEGATIVE =
  /\b(developer relations|sales engineer|it service desk|end-user computing|marketing technology|recruiter|talent acquisition)\b/;
const STRONG_OVERRIDE = [1, 2, 8];

export type BucketResult = { bucket: number; personas: PersonaCode[] } | null;

/** First (most specific) lexicon match for the bucket, with its default personas. */
export function functionBucket(input: { title?: string | null; headline?: string | null }): BucketResult {
  const text = normalizeTitle(`${input.title ?? ""} ${input.headline ?? ""}`);
  if (!text) return null;
  const negative = has(text, NEGATIVE);
  for (const b of BUCKETS) {
    if (!has(text, b.re)) continue;
    if (negative && !STRONG_OVERRIDE.includes(b.bucket)) return null;
    return { bucket: b.bucket, personas: b.personas };
  }
  return null;
}

/**
 * Buckets whose personas hold hard veto power in a Factory deal (§2, §5):
 * InfoSec, risk/governance, Finance, Procurement, Legal, and the CIO office.
 */
const VETO_BUCKETS = new Set([1, 8, 9, 15, 16, 17]);

export function bucketCanVeto(bucket: number | null): boolean {
  return bucket != null && VETO_BUCKETS.has(bucket);
}
