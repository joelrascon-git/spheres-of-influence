import { describe, expect, it } from "vitest";
import { dateFromFileName, deriveStartDate, formatDuration, monthsBetween, tenure } from "@/lib/tenure";

describe("deriveStartDate", () => {
  it("subtracts years and months from the export date", () => {
    expect(deriveStartDate("2026-08-24", 2, 4)).toBe("2024-04-24");
    expect(deriveStartDate("2026-08-24", 0, 7)).toBe("2026-01-24");
  });
  it("clamps to the end of shorter months", () => {
    expect(deriveStartDate("2026-03-31", 0, 1)).toBe("2026-02-28");
  });
  it("returns null when tenure is unknown", () => {
    expect(deriveStartDate("2026-08-24", null, null)).toBeNull();
  });
});

describe("tenure", () => {
  it("formats current and overall tenure from live dates", () => {
    const t = tenure("2024-06-07", "2019-07-07", "2026-10-07");
    expect(t.label).toBe("Current: 2 Years & 4 Months / Overall: 7 Years & 3 Months");
    expect(t.short).toBe("2y 4mo / 7y 3mo");
  });
  it("keeps counting after import", () => {
    const start = deriveStartDate("2026-08-24", 1, 7)!;
    expect(tenure(start, null, "2026-10-24").roleMonths).toBe(21);
  });
  it("flags a recent role change at a long-tenured company", () => {
    expect(tenure("2026-03-01", "2018-01-01", "2026-10-07").isChangeAgent).toBe(true);
    expect(tenure("2020-03-01", "2018-01-01", "2026-10-07").isChangeAgent).toBe(false);
  });
  it("handles singular units and zero", () => {
    expect(formatDuration(13)).toBe("1 Year & 1 Month");
    expect(formatDuration(0)).toBe("< 1 Month");
    expect(formatDuration(24)).toBe("2 Years");
  });
  it("does not count a partial month", () => {
    expect(monthsBetween("2026-01-24", "2026-02-23")).toBe(0);
    expect(monthsBetween("2026-01-24", "2026-02-24")).toBe(1);
  });
});

describe("dateFromFileName", () => {
  it("reads US-style dates from Evaboot export names", () => {
    expect(dateFromFileName("Carvana - Meeting - 8_24_2026.csv")).toBe("2026-08-24");
  });
  it("reads ISO dates", () => {
    expect(dateFromFileName("export-2026-09-01.csv")).toBe("2026-09-01");
  });
  it("rejects impossible dates", () => {
    expect(dateFromFileName("13_45_2026.csv")).toBeNull();
    expect(dateFromFileName("contacts.csv")).toBeNull();
  });
});
