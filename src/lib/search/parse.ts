/**
 * Boolean query parser for contact search.
 *
 *   manager AND AI                       both words, anywhere in the profile
 *   "machine learning" OR ML             phrase or word
 *   title:manager -status:"Do Not Contact"
 *   (snowflake OR databricks) NOT title:intern
 *   data*                                prefix match
 *   is:key  has:email  has:manager  has:org  contacted:no
 *
 * Operators are uppercase AND / OR / NOT (also && || and a leading -). Adjacent terms are ANDed.
 * The output AST is compiled to SQL by public.compile_contact_filter.
 */

export type FilterNode =
  | { t: "and"; c: FilterNode[] }
  | { t: "or"; c: FilterNode[] }
  | { t: "not"; c: FilterNode }
  | { t: "text"; v: string; prefix?: boolean }
  | { t: "field"; f: string; v: string; prefix?: boolean }
  | { t: "in"; f: string; v: string[] }
  | { t: "bool"; f: string; v: boolean }
  | { t: "range"; f: string; min?: number; max?: number };

export const SEARCH_FIELDS: Record<string, string> = {
  name: "name",
  title: "title",
  headline: "headline",
  summary: "summary",
  about: "summary",
  job: "job",
  description: "job",
  location: "location",
  loc: "location",
  notes: "notes",
  note: "notes",
  tag: "tag",
  tags: "tag",
  email: "email",
  industry: "industry",
  org: "org",
  account: "account",
  company: "account",
  status: "status",
  persona: "persona",
  seniority: "seniority",
  level: "seniority_level",
  buying_role: "buying_role",
  role: "buying_role",
  engage_stage: "engage_stage",
  stage: "engage_stage",
};

const SENIORITY_ALIASES: Record<string, string> = {
  "c-level": "c_level",
  clevel: "c_level",
  "c level": "c_level",
  exec: "c_level",
  vp: "vp",
  director: "director",
  manager: "manager",
  ic: "ic",
};

type Token =
  | { k: "lparen" }
  | { k: "rparen" }
  | { k: "and" }
  | { k: "or" }
  | { k: "not" }
  | { k: "term"; field?: string; value: string; quoted: boolean };

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const s = input;
  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === "(") {
      tokens.push({ k: "lparen" });
      i++;
      continue;
    }
    if (ch === ")") {
      tokens.push({ k: "rparen" });
      i++;
      continue;
    }
    if (s.startsWith("&&", i)) {
      tokens.push({ k: "and" });
      i += 2;
      continue;
    }
    if (s.startsWith("||", i)) {
      tokens.push({ k: "or" });
      i += 2;
      continue;
    }
    // A leading minus negates the next term or group.
    if (ch === "-" && (i === 0 || /[\s(]/.test(s[i - 1])) && i + 1 < s.length && !/\s/.test(s[i + 1])) {
      tokens.push({ k: "not" });
      i++;
      continue;
    }
    if (ch === '"') {
      const end = s.indexOf('"', i + 1);
      const value = end === -1 ? s.slice(i + 1) : s.slice(i + 1, end);
      tokens.push({ k: "term", value, quoted: true });
      i = end === -1 ? s.length : end + 1;
      continue;
    }
    // Bare word, possibly field:value or field:"quoted value".
    let j = i;
    while (j < s.length && !/[\s()"]/.test(s[j])) j++;
    const word = s.slice(i, j);
    if (word.endsWith(":") && s[j] === '"') {
      const end = s.indexOf('"', j + 1);
      const value = end === -1 ? s.slice(j + 1) : s.slice(j + 1, end);
      tokens.push({ k: "term", field: word.slice(0, -1).toLowerCase(), value, quoted: true });
      i = end === -1 ? s.length : end + 1;
      continue;
    }
    i = j;
    if (word === "AND") tokens.push({ k: "and" });
    else if (word === "OR") tokens.push({ k: "or" });
    else if (word === "NOT") tokens.push({ k: "not" });
    else {
      const colon = word.indexOf(":");
      if (colon > 0 && colon < word.length - 1) {
        tokens.push({
          k: "term",
          field: word.slice(0, colon).toLowerCase(),
          value: word.slice(colon + 1),
          quoted: false,
        });
      } else if (word.length) {
        tokens.push({ k: "term", value: word, quoted: false });
      }
    }
  }
  return tokens;
}

function termToNode(tok: Extract<Token, { k: "term" }>): FilterNode | null {
  let value = tok.value.trim();
  if (!value) return null;
  let prefix = false;
  if (!tok.quoted && value.length > 1 && value.endsWith("*")) {
    prefix = true;
    value = value.slice(0, -1);
  }
  const field = tok.field;
  if (field === "is" || field === "has") {
    const v = value.toLowerCase();
    if (field === "is" && (v === "key" || v === "starred" || v === "favorite")) return { t: "bool", f: "is_key", v: true };
    if (field === "has" && ["email", "phone", "manager", "org"].includes(v)) return { t: "bool", f: `has_${v}`, v: true };
  }
  if (field === "contacted") {
    const v = value.toLowerCase();
    return { t: "bool", f: "contacted", v: ["yes", "true", "y", "1"].includes(v) };
  }
  if (field && SEARCH_FIELDS[field]) {
    const f = SEARCH_FIELDS[field];
    if (f === "seniority") {
      const mapped = SENIORITY_ALIASES[value.toLowerCase()];
      if (mapped) return { t: "in", f: "seniority", v: [mapped] };
    }
    return prefix ? { t: "field", f, v: value, prefix } : { t: "field", f, v: value };
  }
  // Unknown field prefix: treat the whole thing as free text (e.g. a URL or "c:drive").
  const text = field ? `${field}:${value}` : value;
  return prefix ? { t: "text", v: text, prefix } : { t: "text", v: text };
}

export function parseQuery(input: string): FilterNode {
  const tokens = tokenize(input);
  let pos = 0;

  const peek = () => tokens[pos];

  function parseOr(): FilterNode | null {
    const items: FilterNode[] = [];
    const first = parseAnd();
    if (first) items.push(first);
    while (peek()?.k === "or") {
      pos++;
      const next = parseAnd();
      if (next) items.push(next);
    }
    if (items.length === 0) return null;
    return items.length === 1 ? items[0] : { t: "or", c: items };
  }

  function parseAnd(): FilterNode | null {
    const items: FilterNode[] = [];
    for (;;) {
      const tok = peek();
      if (!tok || tok.k === "or" || tok.k === "rparen") break;
      if (tok.k === "and") {
        pos++;
        continue;
      }
      const node = parseUnary();
      if (node) items.push(node);
    }
    if (items.length === 0) return null;
    return items.length === 1 ? items[0] : { t: "and", c: items };
  }

  function parseUnary(): FilterNode | null {
    const tok = peek();
    if (!tok) return null;
    if (tok.k === "not") {
      pos++;
      const inner = parseUnary();
      return inner ? { t: "not", c: inner } : null;
    }
    return parsePrimary();
  }

  function parsePrimary(): FilterNode | null {
    const tok = peek();
    if (!tok) return null;
    if (tok.k === "lparen") {
      pos++;
      const inner = parseOr();
      if (peek()?.k === "rparen") pos++;
      return inner;
    }
    if (tok.k === "rparen") {
      pos++;
      return null;
    }
    pos++;
    if (tok.k === "term") return termToNode(tok);
    return null;
  }

  const nodes: FilterNode[] = [];
  while (pos < tokens.length) {
    const n = parseOr();
    if (n) nodes.push(n);
    // Skip a stray closing paren so the rest of the query still parses.
    if (peek()?.k === "rparen") pos++;
  }
  if (nodes.length === 0) return { t: "and", c: [] };
  return nodes.length === 1 ? nodes[0] : { t: "and", c: nodes };
}

/** Structured facet filters from the filter bar, combined with the parsed query. */
export type Facets = {
  accountIds?: string[];
  orgIds?: string[];
  seniority?: string[];
  personas?: string[];
  statuses?: string[];
  excludeStatuses?: string[];
  tagIds?: string[];
  excludeTagIds?: string[];
  cities?: string[];
  keyOnly?: boolean;
  hasEmail?: boolean;
  hasManager?: boolean;
  noOrg?: boolean;
  changeAgents?: boolean;
  roleMonthsMax?: number;
  notContactedDays?: number;
};

export function buildFilter(query: string, facets: Facets = {}): FilterNode {
  const parts: FilterNode[] = [];
  const q = parseQuery(query);
  if (!(q.t === "and" && q.c.length === 0)) parts.push(q);
  const inF = (f: string, v?: string[]) => {
    if (v && v.length) parts.push({ t: "in", f, v });
  };
  inF("account_id", facets.accountIds);
  inF("org_id", facets.orgIds);
  inF("seniority", facets.seniority);
  inF("personas", facets.personas);
  inF("statuses", facets.statuses);
  inF("tag_id", facets.tagIds);
  inF("location_city", facets.cities);
  if (facets.excludeStatuses?.length) parts.push({ t: "not", c: { t: "in", f: "statuses", v: facets.excludeStatuses } });
  if (facets.excludeTagIds?.length) parts.push({ t: "not", c: { t: "in", f: "tag_id", v: facets.excludeTagIds } });
  if (facets.keyOnly) parts.push({ t: "bool", f: "is_key", v: true });
  if (facets.hasEmail) parts.push({ t: "bool", f: "has_email", v: true });
  if (facets.hasManager) parts.push({ t: "bool", f: "has_manager", v: true });
  if (facets.noOrg) parts.push({ t: "bool", f: "has_org", v: false });
  if (facets.changeAgents) {
    parts.push({ t: "range", f: "role_months", max: 12 });
    parts.push({ t: "range", f: "company_months", min: 36 });
  }
  if (facets.roleMonthsMax != null) parts.push({ t: "range", f: "role_months", max: facets.roleMonthsMax });
  if (facets.notContactedDays != null) {
    parts.push({
      t: "or",
      c: [
        { t: "bool", f: "contacted", v: false },
        { t: "range", f: "contacted_days", min: facets.notContactedDays },
      ],
    });
  }
  return { t: "and", c: parts };
}

/** Collects positive free-text and field terms, used to highlight matches in results. */
export function highlightTerms(node: FilterNode, negated = false): string[] {
  switch (node.t) {
    case "and":
    case "or":
      return node.c.flatMap((c) => highlightTerms(c, negated));
    case "not":
      return highlightTerms(node.c, !negated);
    case "text":
    case "field":
      return negated ? [] : [node.v];
    default:
      return [];
  }
}
