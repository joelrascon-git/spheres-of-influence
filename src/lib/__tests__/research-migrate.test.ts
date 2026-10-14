import { describe, expect, it } from "vitest";
import {
  initiativeFitOf,
  matchResearchAccount,
  matchResearchContact,
  proximityToEb,
  researchInfluenceScore,
  researchNameKey,
  strongestEvidence,
  type ExistingContactRow,
} from "@/lib/research/migrate";
import {
  EB_CONTACT_KEY,
  RESEARCH_ACCOUNTS,
  RESEARCH_CONTACTS,
  researchContactByKey,
  type ResearchContact,
} from "@/lib/research/amex";

/** A minimal valid research contact; overrides carry the case under test. */
const mk = (overrides: Partial<ResearchContact> & Pick<ResearchContact, "key">): ResearchContact => ({
  first_name: "A",
  last_name: "Person",
  title: null,
  account_code: "AXP",
  org_code: null,
  linkedin_url: null,
  location: null,
  seniority_level: "L3",
  function_bucket: 4,
  primary_persona: "TECH",
  secondary_personas: [],
  persona_status: "assumed",
  champion_flag: "none",
  can_veto: false,
  buying_role: null,
  evidence: [],
  gaps: [],
  is_key: false,
  key_reasoning: null,
  priority_rank: null,
  statuses: [],
  reports_to_key: null,
  reports_to_confidence: null,
  reports_to_evidence: null,
  initiative_links: [],
  challenge_links: [],
  ic_track: false,
  not_in_export: false,
  ...overrides,
});

const contact = (id: string, over: Partial<ExistingContactRow> = {}): ExistingContactRow => ({
  id,
  first_name: "A",
  last_name: "Person",
  linkedin_public_url: null,
  account_id: "axp",
  statuses: [],
  evidence: [],
  gaps: [],
  ...over,
});

describe("researchNameKey", () => {
  it("strips punctuation, drops parentheticals and folds case", () => {
    expect(researchNameKey("Amex Canada Co. / Amex Bank of Canada")).toBe("amex canada co amex bank of canada");
    expect(researchNameKey("American Express (AXP)")).toBe("american express");
  });
});

describe("matchResearchAccount", () => {
  const axp = { id: "axp", name: "American Express", domain: "americanexpress.com" };
  const gbt = { id: "gbt", name: "American Express Global Business Travel", domain: "go.amexgbt.com" };
  const byName = (code: string) => {
    const r = RESEARCH_ACCOUNTS.find((a) => a.code === code)!;
    return { match_domains: r.match_domains, match_names: r.match_names };
  };

  it("matches by exact domain and normalizes www", () => {
    expect(matchResearchAccount(byName("AXP"), [axp, gbt])?.id).toBe("axp");
    expect(matchResearchAccount(byName("GBT"), [gbt])?.id).toBe("gbt");
    expect(matchResearchAccount(byName("AXP"), [{ ...axp, domain: "www.americanexpress.com" }])?.id).toBe("axp");
  });

  it("matches by exact name", () => {
    const aenb = { id: "aenb", name: "American Express National Bank", domain: null };
    expect(matchResearchAccount(byName("AENB"), [axp, aenb])?.id).toBe("aenb");
  });

  it("never variant-folds distinct entities onto the parent", () => {
    // The bank must not collapse onto "American Express" the way import variants do.
    expect(matchResearchAccount(byName("AENB"), [axp])).toBeNull();
    expect(matchResearchAccount(byName("AMEX_CANADA"), [axp])).toBeNull();
    expect(matchResearchAccount(byName("AMEX_INDIA"), [axp])).toBeNull();
  });

  it("never lets two research entities claim the same account", () => {
    expect(matchResearchAccount(byName("AXP"), [axp], new Set(["axp"]))).toBeNull();
  });

  it("no research alias collapses onto another entity's name", () => {
    const keys = new Map<string, string>();
    for (const a of RESEARCH_ACCOUNTS)
      for (const n of a.match_names) {
        const k = researchNameKey(n);
        expect(keys.get(k) ?? a.code, `${a.code} alias "${n}"`).toBe(a.code);
        keys.set(k, a.code);
      }
  });

  it("returns null when nothing matches", () => {
    expect(matchResearchAccount(byName("SWISSCARD"), [axp, gbt])).toBeNull();
  });
});

describe("matchResearchContact", () => {
  const research = { first_name: "Howard", last_name: "Grosfield", linkedin_url: "https://www.linkedin.com/in/howard-grosfield-711b1ab1/" };

  it("matches by public profile URL slug", () => {
    const existing = contact("h1", { linkedin_public_url: "https://www.linkedin.com/in/howard-grosfield-711b1ab1/" });
    expect(matchResearchContact(research, [contact("x"), existing])).toEqual({ row: existing, reason: "url" });
  });

  it("matches by a unique name when the URL is absent", () => {
    const ravi = { first_name: "Ravi", last_name: "Radhakrishnan", linkedin_url: null };
    const existing = contact("r1", { first_name: "Ravi", last_name: "Radhakrishnan" });
    expect(matchResearchContact(ravi, [contact("x"), existing])).toEqual({ row: existing, reason: "name" });
  });

  it("never auto-merges an ambiguous name", () => {
    const two = [
      contact("a", { first_name: "A", last_name: "Person" }),
      contact("b", { first_name: "A", last_name: "Person", account_id: "axp-2" }),
    ];
    expect(matchResearchContact({ first_name: "A", last_name: "Person", linkedin_url: null }, two)).toEqual({
      ambiguous: true,
    });
  });

  it("keeps names outside the researched account family apart", () => {
    const elsewhere = contact("w", { first_name: "Ravi", last_name: "Radhakrishnan", account_id: "wells-fargo" });
    const ravi = { first_name: "Ravi", last_name: "Radhakrishnan", linkedin_url: null };
    expect(matchResearchContact(ravi, [elsewhere], new Set(["axp"]))).toBeNull();
    // Unassigned contacts stay eligible.
    const unassigned = contact("u", { first_name: "Ravi", last_name: "Radhakrishnan", account_id: null });
    expect(matchResearchContact(ravi, [unassigned], new Set(["axp"]))).toEqual({ row: unassigned, reason: "name" });
  });

  it("returns null when nothing matches", () => {
    expect(matchResearchContact(research, [contact("x")])).toBeNull();
  });
});

describe("proximityToEb", () => {
  const byKey = (contacts: ResearchContact[]) => {
    const map = new Map(contacts.map((c) => [c.key, c]));
    return (key: string) => map.get(key);
  };

  it("walks the reporting chain to the Economic Buyer", () => {
    const eb = mk({ key: EB_CONTACT_KEY });
    const a = mk({ key: "a", reports_to_key: EB_CONTACT_KEY });
    const b = mk({ key: "b", reports_to_key: "a" });
    const c = mk({ key: "c", reports_to_key: "b" });
    const lookup = byKey([eb, a, b, c]);
    expect(proximityToEb(eb, lookup)).toBe("eb");
    expect(proximityToEb(a, lookup)).toBe("direct_report");
    expect(proximityToEb(b, lookup)).toBe("two_levels");
    expect(proximityToEb(c, lookup)).toBe("other"); // three levels no longer counts
  });

  it("treats broken chains and cycles as other", () => {
    const orphan = mk({ key: "o", reports_to_key: "ghost" });
    expect(proximityToEb(orphan, byKey([orphan]))).toBe("other");
    const x = mk({ key: "x", reports_to_key: "y" });
    const y = mk({ key: "y", reports_to_key: "x" });
    expect(proximityToEb(x, byKey([x, y]))).toBe("other");
  });

  it("places the corpus's own CIO one hop from its real reporting line", () => {
    // McGowan reports directly to Radhakrishnan, the EB.
    const mcgowan = researchContactByKey("david-mcgowan")!;
    expect(proximityToEb(mcgowan, researchContactByKey)).toBe("direct_report");
  });
});

describe("initiativeFitOf", () => {
  it("ranks documented ownership above adjacency", () => {
    expect(initiativeFitOf(mk({ key: "a", initiative_links: [{ code: "I1", strength: "documented" }] }))).toBe("owns");
    expect(initiativeFitOf(mk({ key: "b", initiative_links: [{ code: "I1", strength: "inferred" }] }))).toBe("adjacent");
    expect(initiativeFitOf(mk({ key: "c", challenge_links: [{ code: "Ch1", strength: "documented" }] }))).toBe("adjacent");
    expect(initiativeFitOf(mk({ key: "d" }))).toBe("none");
  });
});

describe("strongestEvidence", () => {
  it("keeps the strongest confidence, defaulting to inference", () => {
    expect(strongestEvidence(mk({ key: "a", evidence: [
      { claim: "x", confidence: "secondhand" },
      { claim: "y", confidence: "unverified" },
      { claim: "z", confidence: "inference" },
    ] }))).toBe("secondhand");
    expect(strongestEvidence(mk({ key: "a", evidence: [{ claim: "x", confidence: "confirmed" }] }))).toBe("confirmed");
    expect(strongestEvidence(mk({ key: "a" }))).toBe("inference");
  });
});

describe("researchInfluenceScore", () => {
  it("scores the corpus's Economic Buyer at 92 and highest in the account", () => {
    const eb = researchContactByKey(EB_CONTACT_KEY)!;
    expect(researchInfluenceScore(eb)).toBe(92);
    const scores = RESEARCH_CONTACTS.map((c) => researchInfluenceScore(c)).filter((s): s is number => s != null);
    expect(Math.max(...scores)).toBe(researchInfluenceScore(eb));
  });

  it("keeps every score inside 0–100 or null", () => {
    for (const c of RESEARCH_CONTACTS) {
      const score = researchInfluenceScore(c);
      if (score == null) {
        expect(c.seniority_level, `${c.key} unscored`).toBeNull();
      } else {
        expect(score, `${c.key} score`).toBeGreaterThanOrEqual(0);
        expect(score, `${c.key} score`).toBeLessThanOrEqual(100);
      }
    }
  });

  it("gives the technical career path less authority at the same level", () => {
    const base = { key: "a", seniority_level: "L3" as const, reports_to_key: EB_CONTACT_KEY };
    const manager = researchInfluenceScore(mk({ ...base, ic_track: false }));
    const fellow = researchInfluenceScore(mk({ ...base, ic_track: true }));
    expect(manager).not.toBeNull();
    expect(fellow).not.toBeNull();
    expect(fellow!).toBeLessThan(manager!);
  });
});
