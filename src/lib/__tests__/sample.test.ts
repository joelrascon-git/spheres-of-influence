import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import Papa from "papaparse";
import { mapEvabootRow, missingHeaders, repairMojibake } from "@/lib/import/evaboot";
import { planImport } from "@/lib/import/plan";
import { dateFromFileName } from "@/lib/tenure";

const CSV_PATH = join(import.meta.dirname, "..", "..", "..", "sample-data", "amex_leads_10_7_2026.csv");
const FILE_NAME = "amex_leads_10_7_2026.csv";

/** The bundled American Express sample export must flow through the real import path. */
describe("sample AMEX export", () => {
  const text = readFileSync(CSV_PATH, "utf8");
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: "greedy" });
  const headers = parsed.meta.fields ?? [];
  const exportDate = dateFromFileName(FILE_NAME)!;
  const contacts = parsed.data.map((r) => mapEvabootRow(r, exportDate));
  const planned = planImport(
    contacts.map((contact) => ({ contact, accountId: "acct-1" })),
    [],
  );

  it("has the columns an Evaboot export needs", () => {
    expect(missingHeaders(headers)).toEqual([]);
    expect(parsed.data.length).toBeGreaterThan(35);
  });

  it("picks the export date out of the file name so tenure is anchored", () => {
    expect(exportDate).toBe("2026-10-07");
  });

  it("maps every row to a named contact with an identity", () => {
    for (const c of contacts) {
      expect(c.first_name + c.last_name).not.toBe("");
      expect(c.linkedin_uid).toMatch(/^ACw/);
      expect(c.company.domain).toBe("aexp.com");
      expect(c.company.name).toBe("American Express");
      expect(c.company.employee_count).toBe(74000);
    }
  });

  it("derives start dates from reported tenure", () => {
    // 3 years 2 months in position as of 2026-10-07.
    const anna = contacts[0];
    expect(anna.first_name).toBe("Anna");
    expect(anna.role_start).toBe("2023-08-07");
    // 14 years 0 months in company.
    expect(anna.company_start).toBe("2012-10-07");
  });

  it("suggests seniority from titles", () => {
    expect(contacts.find((c) => c.last_name === "Torres")?.suggested_seniority).toBe("c_level");
    expect(contacts.find((c) => c.last_name === "Chen")?.suggested_seniority).toBe("vp");
    expect(contacts.find((c) => c.last_name === "Gonzalez")?.suggested_seniority).toBe("director");
    expect(contacts.find((c) => c.last_name === "Sharma")?.suggested_seniority).toBe("manager");
    expect(contacts.find((c) => c.last_name === "Reilly")?.suggested_seniority).toBe("ic");
  });

  it("repairs mojibake bullets from the raw export", () => {
    const james = contacts.find((c) => c.last_name === "O'Brien")!;
    expect(repairMojibake(james.headline ?? "")).toContain("•");
  });

  it("flags change agents: short role after a long stay", () => {
    const agents = contacts.filter(
      (c) =>
        c.role_start != null &&
        c.company_start != null &&
        // Same math as tenure(): role ≤ 12 months, company ≥ 36 months.
        (Number(exportDate.slice(0, 4)) - Number(c.role_start.slice(0, 4))) * 12 <= 1,
    );
    const names = contacts
      .filter((c) => {
        if (!c.role_start || !c.company_start) return false;
        const months = (from: string) =>
          (Number(exportDate.slice(0, 4)) - Number(from.slice(0, 4))) * 12 +
          (Number(exportDate.slice(5, 7)) - Number(from.slice(5, 7)));
        return months(c.role_start) <= 12 && months(c.company_start) >= 36;
      })
      .map((c) => `${c.first_name} ${c.last_name}`);
    expect(names).toContain("James O'Brien");
    expect(names.length).toBeGreaterThanOrEqual(5);
    void agents;
  });

  it("collapses the in-file duplicate row and plans everyone else as a create", () => {
    expect(planned.filter((p) => p.action === "unchanged").map((p) => p.matchReason)).toContain(
      "Duplicate row in this file",
    );
    expect(planned.filter((p) => p.action === "create").length).toBe(contacts.length - 1);
  });

  it("seeds email quality from the provider status", () => {
    const statuses = new Set(contacts.map((c) => c.email_provider_status));
    expect(statuses.has("safe")).toBe(true);
    expect(statuses.has("riskier")).toBe(true);
    expect(statuses.has("invalid")).toBe(true);
  });
});
