import { describe, expect, it } from "vitest";
import type { ImportedCompany } from "@/lib/import/evaboot";
import {
  companyKey,
  isGbtCompany,
  matchAccount,
  planAccounts,
  type ExistingAccount,
} from "@/lib/import/accounts";

/** The company column values as they appear in the real AmEx export. */
const co = (name: string, domain: string | null = null, liId: string | null = null): ImportedCompany => ({
  name,
  domain,
  website: null,
  linkedin_company_id: liId,
  industry: null,
  employee_count: null,
  description: null,
  specialities: null,
  company_type: null,
  hq: null,
  hq_full_address: null,
  year_founded: null,
  revenue_min_musd: null,
  revenue_max_musd: null,
  employee_growth: {},
  department_headcounts: {},
});

const AXP: ExistingAccount = { id: "axp", name: "American Express", domain: "americanexpress.com", linkedin_company_id: "1277" };
const GBT: ExistingAccount = { id: "gbt", name: "American Express Global Business Travel", domain: "go.amexgbt.com", linkedin_company_id: "9291107" };

describe("matchAccount", () => {
  it("matches by domain before anything else", () => {
    expect(matchAccount(co("American Express Business", "americanexpress.com", "2419120"), [AXP])).toEqual({
      accountId: "axp",
      reason: "domain",
    });
  });
  it("matches by LinkedIn company id when the domain is unknown", () => {
    expect(matchAccount(co("Whatever", null, "9291107"), [GBT])).toEqual({ accountId: "gbt", reason: "linkedin_company_id" });
  });
  it("matches an exact normalized name", () => {
    expect(matchAccount(co("American Express"), [AXP, GBT])).toEqual({ accountId: "axp", reason: "exact_name" });
  });
  it("folds AmEx name variants onto American Express", () => {
    for (const name of [
      "American Express Banking corporation",
      "American Express India Private Limited (AEIPL)",
      "American Express Banking Corp, India.",
      "Ex American Express",
    ]) {
      expect(matchAccount(co(name), [AXP, GBT])).toEqual({ accountId: "axp", reason: "variant" });
    }
  });
  it("folds a GBT name onto GBT, never onto American Express", () => {
    expect(matchAccount(co("American Express Business Travel"), [AXP, GBT])).toEqual({
      accountId: "gbt",
      reason: "variant",
    });
    // Without a GBT account to catch it, the row stays its own company rather
    // than polluting American Express: "travel" is a distinctive word.
    expect(matchAccount(co("American Express Business Travel"), [AXP])).toBeNull();
    expect(matchAccount(co("American Express"), [GBT])).toBeNull();
  });
  it("keeps genuinely different companies separate", () => {
    for (const name of ["Wells Fargo", "Citizens", "Kestra Holdings", "Arlo", "American Express / Accertify"]) {
      expect(matchAccount(co(name), [AXP, GBT])).toBeNull();
    }
  });
  it("prefers the account whose name shares more words when several fold", () => {
    const banking: ExistingAccount = { id: "aebc", name: "American Express Banking", domain: null, linkedin_company_id: null };
    expect(matchAccount(co("American Express Banking corporation"), [AXP, banking])).toEqual({
      accountId: "aebc",
      reason: "variant",
    });
  });
});

describe("isGbtCompany", () => {
  it("recognizes GBT by domain and by name", () => {
    expect(isGbtCompany(co("American Express Global Business Travel", "go.amexgbt.com", "9291107"))).toBe(true);
    expect(isGbtCompany(co("Egencia, an American Express Global Business Travel Company"))).toBe(true);
    expect(isGbtCompany(co("American Express", "americanexpress.com"))).toBe(false);
  });
});

describe("planAccounts", () => {
  /** The 15 distinct company keys of the real 681-row export, in file order. */
  const REAL_FILE = [
    co("American Express", "americanexpress.com", "1277"),
    co("American Express Global Business Travel", "go.amexgbt.com", "9291107"),
    co("American Express"),
    co("Wells Fargo", "wellsfargo.com", "1235"),
    co("American Express Banking corporation"),
    co("American Express India Private Limited (AEIPL)"),
    co("American Express / Accertify"),
    co("Egencia, an American Express Global Business Travel Company"),
    co("Kestra Holdings", "kestraholdings.com", "77964521"),
    co("Citizens", "citizensbank.com", "163062"),
    co("Arlo", "meetarlo.ai", "107438690"),
    co("Ex American Express"),
    co("Egencia", "egencia.com", "2750"),
    co("American Express Business Travel"),
    co("American Express Banking Corp, India."),
  ];
  const companies = new Map(REAL_FILE.map((c) => [companyKey(c), c]));

  it("folds the real export's variants into 9 accounts on a fresh database", () => {
    const plans = planAccounts(companies, []);
    const creations = plans.filter((p) => !p.match && !p.reuseKey);
    expect(creations.map((p) => p.company.name)).toEqual([
      "American Express",
      "American Express Global Business Travel",
      "Wells Fargo",
      "Kestra Holdings",
      "Citizens",
      "Arlo",
      "Egencia",
      "American Express / Accertify",
      "Egencia, an American Express Global Business Travel Company",
    ]);
    const byKey = new Map(plans.map((p) => [p.key, p]));
    const axp = companyKey(REAL_FILE[0]);
    expect(byKey.get(companyKey(REAL_FILE[2]))?.reuseKey).toBe(axp); // "American Express"
    expect(byKey.get(companyKey(REAL_FILE[11]))?.reuseKey).toBe(axp); // "Ex American Express"
    expect(byKey.get(companyKey(REAL_FILE[13]))?.reuseKey).toBe(companyKey(REAL_FILE[1])); // → GBT
    expect(plans.filter((p) => p.outOfScope).map((p) => p.company.name)).toEqual([
      "American Express Global Business Travel",
      "Egencia, an American Express Global Business Travel Company",
    ]);
  });

  it("matches the AmEx tree against existing accounts after the research migration", () => {
    const plans = planAccounts(companies, [AXP, GBT]);
    const byName = new Map(plans.map((p) => [p.company.name as string, p]));
    expect(byName.get("American Express Business Travel")?.match?.accountId).toBe("gbt");
    expect(byName.get("Ex American Express")?.match?.accountId).toBe("axp");
    expect(plans.filter((p) => p.match?.reason === "variant")).toHaveLength(5);
    expect(plans.filter((p) => p.match?.reason === "exact_name")).toHaveLength(1);
    // Unrelated companies still get their own accounts.
    expect(plans.filter((p) => !p.match).map((p) => p.company.name).sort()).toEqual([
      "American Express / Accertify",
      "Arlo",
      "Citizens",
      "Egencia",
      "Egencia, an American Express Global Business Travel Company",
      "Kestra Holdings",
      "Wells Fargo",
    ]);
  });
});
