import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import Papa from "papaparse";
import { mapEvabootRow, type ImportedContact } from "@/lib/import/evaboot";
import { planImport, type ExistingContact, type PlannedItem } from "@/lib/import/plan";
import { dateFromFileName } from "@/lib/tenure";

const DIR = join(import.meta.dirname, "..", "..", "..", "sample-data");
const AMEX_ACCOUNT = "acct-amex";
const JPMC_ACCOUNT = "acct-jpm";

function load(fileName: string) {
  const exportDate = dateFromFileName(fileName);
  if (!exportDate) throw new Error(`No export date in ${fileName}`);
  const parsed = Papa.parse<Record<string, string>>(readFileSync(join(DIR, fileName), "utf8"), {
    header: true,
    skipEmptyLines: "greedy",
  });
  return {
    exportDate,
    rows: parsed.data.map((raw) => {
      const contact = mapEvabootRow(raw, exportDate);
      const accountId = contact.company.domain === "jpmorganchase.com" ? JPMC_ACCOUNT : AMEX_ACCOUNT;
      return { contact, accountId };
    }),
  };
}

/** The records the first import would have written, so the second export has something to compare to. */
function asExisting(rows: { contact: ImportedContact; accountId: string | null }[]): ExistingContact[] {
  return rows.map(({ contact, accountId }, i) => ({
    id: `existing-${i}`,
    account_id: accountId,
    linkedin_uid: contact.linkedin_uid,
    email: contact.email,
    first_name: contact.first_name,
    last_name: contact.last_name,
    statuses: [],
    title: contact.title,
    headline: contact.headline,
    summary: contact.summary,
    job_description: contact.job_description,
    location: contact.location,
    linkedin_public_url: contact.linkedin_public_url,
    role_start: contact.role_start,
    company_start: contact.company_start,
  }));
}

const byName = (plan: PlannedItem[], rows: { contact: ImportedContact }[], name: string) => {
  const index = rows.findIndex((r) => `${r.contact.first_name} ${r.contact.last_name}` === name);
  expect(index).toBeGreaterThanOrEqual(0);
  return plan[index];
};

describe("re-importing an updated AMEX export", () => {
  const first = load("amex_leads_10_7_2026.csv");
  const second = load("amex_leads_10_7_2026_reexport.csv");
  const firstPlan = planImport(first.rows, []);
  const existing = asExisting(first.rows.filter((_, i) => firstPlan[i].action === "create"));
  const plan = planImport(second.rows, existing);

  it("keeps the same export date so nothing drifts", () => {
    expect(first.exportDate).toBe("2026-10-07");
    expect(second.exportDate).toBe("2026-10-07");
  });

  it("the first import would have created everyone plus the collapsed duplicate", () => {
    expect(firstPlan.filter((p) => p.action === "create")).toHaveLength(42);
    expect(firstPlan.filter((p) => p.action === "unchanged")).toHaveLength(1);
    expect(existing).toHaveLength(42);
  });

  it("shows exactly three decisions and one new hire", () => {
    const updates = plan.filter((p) => p.action === "update");
    expect(updates).toHaveLength(3);
    expect(plan.filter((p) => p.action === "create")).toHaveLength(1);
    expect(plan.filter((p) => p.action === "review")).toHaveLength(0);
    expect(plan.filter((p) => p.action === "error")).toHaveLength(0);
    // 42 people carried over from the first export, one new hire, and two in-file duplicate rows.
    expect(plan).toHaveLength(45);
  });

  it("leaves everyone who did not change alone", () => {
    const untouched = plan.filter((p) => p.action === "unchanged");
    expect(untouched).toHaveLength(41);
    expect(untouched.map((p) => p.matchReason)).toContain("Duplicate row in this file");
    // Everyone else matched on their LinkedIn ID, not on a guess.
    expect(untouched.filter((p) => p.matchReason === "LinkedIn ID")).toHaveLength(39);
  });

  it("offers the promotion as a title change plus a new role start", () => {
    const item = byName(plan, second.rows, "David Chen");
    expect(item.action).toBe("update");
    expect(item.matchReason).toBe("LinkedIn ID");
    expect(item.diff.map((d) => d.field)).toEqual(["title", "role_start"]);
    const [title, roleStart] = item.diff;
    expect(title.before).toBe("VP of Engineering, Cloud Infrastructure");
    expect(title.after).toBe("SVP, Cloud Infrastructure");
    expect(title.defaultAccept).toBe(true);
    expect(roleStart.note).toBe("New role start date: likely a new position.");
  });

  it("never overwrites a stored email unless the seller asks for it", () => {
    const item = byName(plan, second.rows, "Priya Sharma");
    expect(item.action).toBe("update");
    expect(item.diff.map((d) => d.field)).toEqual(["email"]);
    expect(item.diff[0].before).toBe("priya.sharma@aexp.com");
    expect(item.diff[0].after).toBe("p.sharma@aexp.com");
    expect(item.diff[0].defaultAccept).toBe(false);
  });

  it("flags a move to another company as No Longer at Company", () => {
    const item = byName(plan, second.rows, "Thomas Reilly");
    expect(item.action).toBe("update");
    expect(item.diff.map((d) => d.field)).toEqual(["company"]);
    expect(item.diff[0].after).toBe(JPMC_ACCOUNT);
    expect(item.diff[0].note).toBe(
      "Different company in this export. Accepting marks the stored contact as No Longer at Company.",
    );
  });

  it("treats a person who was not in the last export as a new record", () => {
    const item = byName(plan, second.rows, "Alexis Fontaine");
    expect(item.action).toBe("create");
    expect(item.diff).toEqual([]);
  });
});
