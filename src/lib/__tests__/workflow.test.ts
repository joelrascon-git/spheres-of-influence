import { describe, expect, it } from "vitest";
import { ITEM_STATUSES, MEDDPICC_ELEMENTS, opportunityPatch, slugifyElement, taskInput } from "@/lib/workflow/qualify";

describe("slugifyElement", () => {
  it("slugs labels into stable keys", () => {
    expect(slugifyElement("Security review")).toBe("security_review");
    expect(slugifyElement("  Paper  Process! ")).toBe("paper_process");
    expect(slugifyElement("???")).toBe("element");
  });

  it("bounds the key length", () => {
    expect(slugifyElement("a".repeat(80)).length).toBeLessThanOrEqual(40);
  });
});

describe("MEDDPICC_ELEMENTS", () => {
  it("seeds the eight elements with unique keys", () => {
    const keys = MEDDPICC_ELEMENTS.map((e) => e.key);
    expect(new Set(keys).size).toBe(8);
    expect(keys).toContain("economic_buyer");
    expect(keys).toContain("paper_process");
  });

  it("keeps the item status ladder", () => {
    expect(ITEM_STATUSES).toEqual(["unknown", "identified", "validated"]);
  });
});

describe("workflow schemas", () => {
  it("parses task input with optional links and strict dates", () => {
    expect(taskInput.parse({ title: "Send the deck" })).toMatchObject({ title: "Send the deck" });
    expect(taskInput.safeParse({ title: "" }).success).toBe(false);
    expect(taskInput.safeParse({ title: "x", due_date: "tomorrow" }).success).toBe(false);
    expect(taskInput.parse({ title: "x", due_date: "2026-10-20", account_id: null })).toMatchObject({
      due_date: "2026-10-20",
      account_id: null,
    });
  });

  it("patches opportunities partially and rejects negative amounts", () => {
    expect(opportunityPatch.parse({ status: "won" })).toEqual({ status: "won" });
    expect(opportunityPatch.parse({})).toEqual({});
    expect(opportunityPatch.safeParse({ amount: -5 }).success).toBe(false);
    expect(opportunityPatch.safeParse({ status: "maybe" }).success).toBe(false);
  });
});
