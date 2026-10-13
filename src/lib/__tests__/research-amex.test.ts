import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CHAMPION_FLAG,
  CONFIDENCE,
  DOC_TYPES,
  ENTITY_TYPES,
  ORG_FIT,
  PERSONA_CODES,
  PERSONA_STATUS,
  PROGRAM_FIT,
  RESEARCH_CONFIDENCE,
  SENIORITY_LEVELS,
} from "@/lib/constants";
import {
  EB_CONTACT_KEY,
  PRIMARY_ACCOUNT_CODE,
  RESEARCH_ACCOUNTS,
  RESEARCH_CHALLENGES,
  RESEARCH_CONTACTS,
  RESEARCH_DOCS,
  RESEARCH_EDGES,
  RESEARCH_INITIATIVES,
  RESEARCH_ORGS,
  researchContactByKey,
} from "@/lib/research/amex";

/**
 * Referential integrity for the research corpus-as-code. The migration relies on
 * every cross-reference (parents, program links, reporting lines) resolving, so a
 * typo in a code fails here before it can half-apply in the database.
 */

const accountCodes = new Set(RESEARCH_ACCOUNTS.map((a) => a.code));
const orgCodes = new Set(RESEARCH_ORGS.map((o) => o.code));
const initiativeCodes = new Set(RESEARCH_INITIATIVES.map((i) => i.code));
const challengeCodes = new Set(RESEARCH_CHALLENGES.map((c) => c.code));
const contactKeys = new Set(RESEARCH_CONTACTS.map((c) => c.key));

const expectUnique = (values: string[], what: string) =>
  expect(new Set(values).size, `${what} must be unique`).toBe(values.length);

/** Parent chains must terminate at a root without revisiting any node. */
const expectAcyclic = (codes: string[], parentOf: (code: string) => string | null, what: string) => {
  for (const code of codes) {
    const seen = new Set<string>([code]);
    let parent = parentOf(code);
    while (parent) {
      if (seen.has(parent)) throw new Error(`${what} ${code}: cycle through ${parent}`);
      seen.add(parent);
      parent = parentOf(parent);
    }
  }
};

describe("research dataset: accounts", () => {
  it("has unique codes and at least one match key each", () => {
    expectUnique(
      RESEARCH_ACCOUNTS.map((a) => a.code),
      "account codes",
    );
    for (const a of RESEARCH_ACCOUNTS) {
      expect(a.match_domains.length + a.match_names.length, `${a.code} needs a join key`).toBeGreaterThan(0);
    }
  });

  it("keeps the entity tree resolvable and acyclic", () => {
    for (const a of RESEARCH_ACCOUNTS) {
      expect(ENTITY_TYPES.some((t) => t.value === a.entity_type), `${a.code} entity_type`).toBe(true);
      expect(a.parent_code === null || accountCodes.has(a.parent_code), `${a.code} parent`).toBe(true);
      expect(a.parent_code !== a.code, `${a.code} self-parent`).toBe(true);
    }
    expectAcyclic(
      RESEARCH_ACCOUNTS.map((a) => a.code),
      (code) => RESEARCH_ACCOUNTS.find((a) => a.code === code)?.parent_code ?? null,
      "account",
    );
  });

  it("marks GBT as a separate, out-of-scope company", () => {
    const gbt = RESEARCH_ACCOUNTS.find((a) => a.code === "GBT");
    expect(gbt?.entity_type).toBe("separate_company");
    expect(gbt?.out_of_scope).toBe(true);
    expect(gbt?.match_domains).toContain("go.amexgbt.com");
  });

  it("includes the primary account with its canonical domain", () => {
    const axp = RESEARCH_ACCOUNTS.find((a) => a.code === PRIMARY_ACCOUNT_CODE);
    expect(axp?.match_domains).toContain("americanexpress.com");
  });
});

describe("research dataset: orgs", () => {
  it("has unique codes resolving to real accounts", () => {
    expectUnique(
      RESEARCH_ORGS.map((o) => o.code),
      "org codes",
    );
    for (const o of RESEARCH_ORGS) {
      expect(accountCodes.has(o.account_code), `org ${o.code} account`).toBe(true);
      expect(o.parent_code === null || orgCodes.has(o.parent_code), `org ${o.code} parent`).toBe(true);
    }
    expectAcyclic(
      RESEARCH_ORGS.map((o) => o.code),
      (code) => RESEARCH_ORGS.find((o) => o.code === code)?.parent_code ?? null,
      "org",
    );
  });

  it("carries valid research attributions", () => {
    for (const o of RESEARCH_ORGS) {
      if (o.factory_fit) expect(ORG_FIT.some((f) => f.value === o.factory_fit), `org ${o.code} fit`).toBe(true);
      if (o.confidence)
        expect(RESEARCH_CONFIDENCE.some((c) => c.value === o.confidence), `org ${o.code} confidence`).toBe(true);
      for (const code of o.initiative_codes)
        expect(initiativeCodes.has(code), `org ${o.code} initiative ${code}`).toBe(true);
      for (const code of o.challenge_codes)
        expect(challengeCodes.has(code), `org ${o.code} challenge ${code}`).toBe(true);
    }
  });
});

describe("research dataset: programs", () => {
  it("has unique codes across initiatives and challenges", () => {
    expectUnique(
      RESEARCH_INITIATIVES.map((i) => i.code),
      "initiative codes",
    );
    expectUnique(
      RESEARCH_CHALLENGES.map((c) => c.code),
      "challenge codes",
    );
    const overlap = [...initiativeCodes].filter((c) => challengeCodes.has(c));
    expect(overlap).toEqual([]);
  });

  it("carries complete, valid program records", () => {
    for (const p of [...RESEARCH_INITIATIVES, ...RESEARCH_CHALLENGES]) {
      expect(p.name.length, `${p.code} name`).toBeGreaterThan(0);
      expect(p.summary.length, `${p.code} summary`).toBeGreaterThan(0);
      expect(p.factory_hypothesis.length, `${p.code} hypothesis`).toBeGreaterThan(0);
      expect(PROGRAM_FIT.some((f) => f.value === p.factory_fit), `${p.code} fit`).toBe(true);
      expect(RESEARCH_CONFIDENCE.some((c) => c.value === p.confidence), `${p.code} confidence`).toBe(true);
      expect(p.rank, `${p.code} rank`).toBeGreaterThanOrEqual(1);
      for (const d of p.key_dates) expect(d.date, `${p.code} date ${d.label}`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      for (const s of p.sources) {
        expect(s.label.length, `${p.code} source label`).toBeGreaterThan(0);
        expect(s.url, `${p.code} source url`).toMatch(/^https?:\/\//);
      }
      for (const code of p.org_codes) expect(orgCodes.has(code), `${p.code} org ${code}`).toBe(true);
    }
    for (const i of RESEARCH_INITIATIVES) expect(i.solving_for, `${i.code} solving_for`).toBeTruthy();
  });
});

describe("research dataset: contacts", () => {
  it("has unique keys with resolvable accounts, orgs and reporting lines", () => {
    expectUnique(
      RESEARCH_CONTACTS.map((c) => c.key),
      "contact keys",
    );
    for (const c of RESEARCH_CONTACTS) {
      expect(c.first_name.length + c.last_name.length, `${c.key} name`).toBeGreaterThan(0);
      expect(accountCodes.has(c.account_code), `${c.key} account`).toBe(true);
      expect(c.org_code === null || orgCodes.has(c.org_code), `${c.key} org`).toBe(true);
      expect(c.reports_to_key === null || contactKeys.has(c.reports_to_key), `${c.key} reports_to`).toBe(true);
      if (c.reports_to_key) expect(c.reports_to_confidence, `${c.key} reports_to confidence`).toBeTruthy();
    }
    expectAcyclic(
      RESEARCH_CONTACTS.map((c) => c.key),
      (key) => researchContactByKey(key)?.reports_to_key ?? null,
      "contact",
    );
  });

  it("uses only valid enum values", () => {
    const personas = PERSONA_CODES.map((p) => p.code);
    for (const c of RESEARCH_CONTACTS) {
      expect(c.seniority_level === null || SENIORITY_LEVELS.some((l) => l.value === c.seniority_level), `${c.key} level`).toBe(true);
      expect(c.function_bucket === null || (c.function_bucket >= 1 && c.function_bucket <= 20), `${c.key} bucket`).toBe(true);
      expect(c.primary_persona === null || personas.includes(c.primary_persona), `${c.key} primary`).toBe(true);
      for (const p of c.secondary_personas) expect(personas.includes(p), `${c.key} secondary ${p}`).toBe(true);
      expect(PERSONA_STATUS.some((s) => s.value === c.persona_status), `${c.key} persona_status`).toBe(true);
      expect(CHAMPION_FLAG.some((f) => f.value === c.champion_flag), `${c.key} champion_flag`).toBe(true);
      expect(c.primary_persona !== null || c.persona_status === "assumed", `${c.key} persona without status`).toBe(true);
      for (const e of c.evidence) {
        expect(e.claim.length, `${c.key} evidence claim`).toBeGreaterThan(0);
        expect(RESEARCH_CONFIDENCE.some((r) => r.value === e.confidence), `${c.key} evidence confidence`).toBe(true);
      }
      if (c.reports_to_confidence)
        expect(CONFIDENCE.some((r) => r.value === c.reports_to_confidence), `${c.key} reports_to_confidence`).toBe(true);
    }
  });

  it("links every contact to real initiatives and challenges", () => {
    for (const c of RESEARCH_CONTACTS) {
      for (const l of c.initiative_links) {
        expect(initiativeCodes.has(l.code), `${c.key} initiative ${l.code}`).toBe(true);
        expect(["documented", "inferred"]).toContain(l.strength);
      }
      for (const l of c.challenge_links) {
        expect(challengeCodes.has(l.code), `${c.key} challenge ${l.code}`).toBe(true);
        expect(["documented", "inferred"]).toContain(l.strength);
      }
    }
  });

  it("keeps the priority list exactly ranks 1–10, all key contacts", () => {
    const ranked = RESEARCH_CONTACTS.filter((c) => c.priority_rank !== null);
    expect(ranked.map((c) => c.priority_rank).sort((a, b) => a! - b!)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (const c of ranked) {
      expect(c.is_key, `${c.key} ranked`).toBe(true);
      expect(c.key_reasoning, `${c.key} key_reasoning`).toBeTruthy();
    }
  });

  it("flags the Economic Buyer at rank 1 and scopes GBT contacts out", () => {
    const eb = researchContactByKey(EB_CONTACT_KEY);
    expect(eb?.primary_persona).toBe("EB");
    expect(eb?.priority_rank).toBe(1);
    const gbtAccount = RESEARCH_ACCOUNTS.find((a) => a.code === "GBT");
    for (const c of RESEARCH_CONTACTS.filter((x) => x.account_code === "GBT")) {
      expect(gbtAccount?.out_of_scope, "GBT is out of scope").toBe(true);
      expect(c.statuses, `${c.key} at GBT is out of scope`).toContain("Out of Scope");
    }
  });
});

describe("research dataset: influence edges", () => {
  it("resolves both endpoints with valid strength and confidence", () => {
    for (const e of RESEARCH_EDGES) {
      expect(contactKeys.has(e.from_key), `edge from ${e.from_key}`).toBe(true);
      expect(contactKeys.has(e.to_key), `edge to ${e.to_key}`).toBe(true);
      expect(e.from_key !== e.to_key, "self edge").toBe(true);
      expect(["high", "medium", "low"]).toContain(e.strength);
      expect(CONFIDENCE.some((c) => c.value === e.confidence), `edge ${e.from_key} confidence`).toBe(true);
      expect(e.evidence.length).toBeGreaterThan(0);
    }
  });
});

describe("research dataset: research docs", () => {
  it("has unique keys, valid types, and every corpus file on disk", () => {
    expectUnique(
      RESEARCH_DOCS.map((d) => d.key),
      "doc keys",
    );
    for (const d of RESEARCH_DOCS) {
      expect(DOC_TYPES.some((t) => t.value === d.doc_type), `doc ${d.key} type`).toBe(true);
      const file = path.join(process.cwd(), "content", "research", d.file_name);
      expect(existsSync(file), `content/research/${d.file_name}`).toBe(true);
    }
  });

  it("scopes account docs to the primary account and seller docs apart", () => {
    const accountDocs = RESEARCH_DOCS.filter((d) => d.scope === "account");
    const sellerDocs = RESEARCH_DOCS.filter((d) => d.scope === "seller");
    expect(accountDocs.length).toBe(5);
    expect(sellerDocs.map((d) => d.key).sort()).toEqual(["personas", "product_kb"]);
  });
});
