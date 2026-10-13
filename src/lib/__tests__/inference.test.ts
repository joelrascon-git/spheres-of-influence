import { describe, expect, it } from "vitest";
import { classifyContact } from "@/lib/inference/classify";
import { normalizeTitle, seniorityLevel } from "@/lib/inference/title";
import { influenceScore, importBaselineScore } from "@/lib/inference/score";
import { assignOrg, type OrgRef } from "@/lib/inference/orgs";

const AMEX = "American Express";
const level = (title: string, company = AMEX) => seniorityLevel({ title, companyName: company });

describe("normalizeTitle", () => {
  it("expands title abbreviations to full words", () => {
    expect(normalizeTitle("EVP & CIO")).toContain("executive vice president");
    expect(normalizeTitle("EVP & CIO")).toContain("chief information officer");
    expect(normalizeTitle("SVP, Enterprise AI Platforms")).toContain("senior vice president");
    expect(normalizeTitle("VP, DevEx")).toContain("developer experience");
  });
});

describe("seniorityLevel (golden cases from the persona knowledge base)", () => {
  it("levels C-suite and group presidents as L1", () => {
    expect(level("EVP & Chief Information Officer (AXP and AENB)")).toBe("L1");
    expect(level("Group President, U.S. Consumer Services")).toBe("L1");
    expect(level("Chairman & CEO")).toBe("L1");
    expect(level("Chief Information Security Officer")).toBe("L1");
    expect(level("Chief Data Officer")).toBe("L1");
  });

  it("caps SVP C-seats at L2 while EVP C-seats are L1", () => {
    expect(level("SVP & CIO, Global Commercial Services Technology")).toBe("L2");
    expect(level("EVP – Cobrand, Product Development and AI Transformation Office")).toBe("L2");
    expect(level("SVP, Enterprise AI Platforms")).toBe("L2");
  });

  it("uses the corporate ladder at AmEx: VP is L3", () => {
    expect(level("VP, Developer Enablement")).toBe("L3");
    expect(level("VP, Engineering")).toBe("L3");
    expect(level("VP, Enterprise Data Platforms")).toBe("L3");
    expect(level("Engineering Director")).toBe("L4");
    expect(level("Senior Manager, Risk Technology")).toBe("L5");
  });

  it("demotes VP to L5 at investment banks", () => {
    expect(level("Vice President", "Goldman Sachs")).toBe("L5");
    expect(level("Vice President", "Wells Fargo")).toBe("L5");
    expect(level("Managing Director", "JPMorgan Chase")).toBe("L2");
  });

  it("maps the technical career path", () => {
    expect(level("Distinguished Engineer")).toBe("L3");
    expect(level("Principal Engineer")).toBe("L4");
    expect(level("Staff Engineer (Kubernetes, Istio)")).toBe("L5");
    expect(level("Senior Staff Software Engineer")).toBe("L5");
  });

  it("does not level a Chief of Staff as C-suite", () => {
    expect(level("Chief of Staff, Office of the CIO")).toBe("L3");
  });

  it("returns null when the title carries no seniority signal", () => {
    expect(level("Global Strategic Partnerships")).toBeNull();
  });
});

describe("classifyContact", () => {
  const classify = (title: string, headline?: string) => classifyContact({ title, headline, companyName: AMEX });

  it("assigns the golden persona sets from the applied AmEx table", () => {
    const ravi = classify("EVP & Chief Information Officer (AXP and AENB)");
    expect(ravi.seniority_level).toBe("L1");
    expect(ravi.seniority).toBe("c_level");
    expect(ravi.function_bucket).toBe(1);
    expect(ravi.personas).toEqual(["EB", "DM"]);
    expect(ravi.can_veto).toBe(true);

    const swartz = classify("VP, Developer Enablement", "Developer Experience at American Express");
    expect(swartz.seniority_level).toBe("L3");
    expect(swartz.function_bucket).toBe(3);
    expect(swartz.personas).toEqual(["DM", "CH", "TECH"]);
    // CH may appear as an assumed bucket default, but a title never earns the
    // champion flag (rule 3) — that comes from evidence via ground truth or AI.
    expect(swartz.champion_flag).toBe("none");

    const formica = classify("VP, Engineering");
    expect(formica.function_bucket).toBe(4);
    expect(formica.personas).toEqual(["DM", "CH", "EVAL"]);

    const berta = classify("SVP, Enterprise AI Platforms");
    expect(berta.seniority_level).toBe("L2");
    expect(berta.function_bucket).toBe(2);
    expect(berta.personas).toEqual(["TECH", "BS", "DM"]);

    const reznik = classify("Chief Information Security Officer");
    expect(reznik.function_bucket).toBe(8);
    expect(reznik.personas).toEqual(["INFOSEC"]);
    expect(reznik.can_veto).toBe(true);

    const cane = classify("Distinguished Engineer");
    expect(cane.function_bucket).toBe(6);
    expect(cane.personas).toEqual(["TECH", "COACH"]);
    expect(cane.ic_track).toBe(true);

    const gonzalez = classify("SVP, Chief Procurement Officer");
    expect(gonzalez.personas).toEqual(["PROC"]);
    expect(gonzalez.can_veto).toBe(true);

    const leCaillec = classify("Chief Financial Officer");
    expect(leCaillec.personas).toEqual(["FIN"]);
    expect(leCaillec.can_veto).toBe(true);
  });

  it("never earns a champion flag or above-assumed status from a title", () => {
    const c = classify("VP, Developer Enablement");
    expect(c.personas).toContain("CH"); // CH may be an assumed bucket default…
    expect(c.champion_flag).toBe("none"); // …but the flag itself needs evidence
    expect(c.persona_status).toBe("assumed");
    const noCh = classify("Chief Financial Officer");
    expect(noCh.champion_flag).toBe("none");
  });

  it("suppresses weak bucket matches behind negative keywords", () => {
    const c = classify("Talent Acquisition Recruiter");
    expect(c.function_bucket).toBeNull();
    expect(c.personas).toEqual([]);
  });

  it("assigns an org only on a unique distinctive alias", () => {
    const orgs: OrgRef[] = [
      { id: "ets", name: "Enterprise Technology Services", aliases: ["ets", "office of the cio"] },
      { id: "tris", name: "Technology Risk & Information Security", aliases: ["information security"] },
      { id: "devex", name: "Developer Experience", aliases: ["developer enablement"] },
      { id: "ai", name: "Enterprise AI Platforms", aliases: ["ai platforms"] },
    ];
    const swartz = classifyContact({
      title: "VP, Developer Enablement",
      headline: "Developer Experience at American Express",
      companyName: AMEX,
      orgs,
    });
    expect(swartz.org?.orgId).toBe("devex");

    const berta = classifyContact({ title: "SVP, Enterprise AI Platforms", companyName: AMEX, orgs });
    expect(berta.org?.orgId).toBe("ai");

    // "ets" is too short to assign anything on its own.
    expect(assignOrg("Engineer within ETS", orgs)).toBeNull();
    expect(assignOrg("Program Manager, Governance", orgs)).toBeNull();
  });
});

describe("influenceScore", () => {
  it("matches the §8.2 formula for a fresh L1 import", () => {
    // 0.35*100 + 0.25*20 + 0.20*20 + 0.10*100 + 0.10*20 = 56
    expect(importBaselineScore({ level: "L1" })).toBe(56);
    // 0.35*70 + 5 + 4 + 10 + 2 = 45.5 → 46
    expect(importBaselineScore({ level: "L3" })).toBe(46);
  });

  it("uses the IC authority table for the technical career path", () => {
    // Distinguished (L3 IC, authority 60): 21 + 5 + 4 + 10 + 2 = 42
    expect(importBaselineScore({ level: "L3", icTrack: true })).toBe(42);
    // Fellow (L2 IC, authority 70): 24.5 + 5 + 4 + 10 + 2 = 45.5 → 46
    expect(importBaselineScore({ level: "L2", icTrack: true })).toBe(46);
  });

  it("rewards ground truth: owned initiatives, EB proximity, warm access", () => {
    expect(
      influenceScore({ level: "L1", initiativeFit: "owns", proximityToEb: "eb", evidence: "confirmed", access: "warm" }),
    ).toBe(96); // 35 + 25 + 20 + 10 + 6
    // 0.35*70 + 0.25*60 + 0.20*80 + 0.10*70 + 0.10*20 = 24.5+15+16+7+2 = 64.5 → 65
    expect(
      influenceScore({ level: "L3", initiativeFit: "adjacent", proximityToEb: "direct_report", evidence: "secondhand" }),
    ).toBe(65);
  });

  it("returns null without a level", () => {
    expect(influenceScore({ level: null, initiativeFit: "none", proximityToEb: "unknown", evidence: "inference" })).toBeNull();
  });
});
