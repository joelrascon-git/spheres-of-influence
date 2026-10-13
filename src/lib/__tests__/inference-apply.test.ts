import { describe, expect, it } from "vitest";
import {
  describeInferenceValue,
  evidenceTextOf,
  reportingConfidenceFrom,
  writePlanFor,
} from "@/lib/inference/apply";
import type { Inference } from "@/lib/types";

const plan = (subjectType: Inference["subject_type"], kind: Inference["kind"], value: Record<string, unknown>) =>
  writePlanFor(subjectType, kind, value);

describe("writePlanFor", () => {
  it("maps persona proposals to a merge that upgrades persona status", () => {
    expect(plan("contact", "persona", { personas: ["EB", "CH"] })).toEqual({
      plan: { type: "array", field: "personas", op: "add", values: ["EB", "CH"], upgradePersonaStatus: true },
    });
  });

  it("drops persona codes outside the taxonomy and rejects empty sets", () => {
    expect(plan("contact", "persona", { personas: ["EB", "Wizard"] })).toEqual({
      plan: { type: "array", field: "personas", op: "add", values: ["EB"], upgradePersonaStatus: true },
    });
    expect(plan("contact", "persona", { personas: ["Wizard"] })).toEqual({ error: "No valid persona codes in the proposal." });
    expect(plan("contact", "persona", {})).toEqual({ error: "No valid persona codes in the proposal." });
  });

  it("validates seniority levels against the L1–L6 ladder", () => {
    expect(plan("contact", "seniority_level", { seniority_level: "L4" })).toEqual({
      plan: { type: "patch", patch: { seniority_level: "L4" } },
    });
    expect(plan("contact", "seniority_level", { seniority_level: "L9" })).toEqual({
      error: "Seniority level must be one of L1–L6.",
    });
  });

  it("carries key-person reasoning into the patch", () => {
    expect(plan("contact", "key_person", { is_key: true, key_reasoning: "Owns the platform budget." })).toEqual({
      plan: { type: "patch", patch: { is_key: true, key_reasoning: "Owns the platform budget." } },
    });
    expect(plan("contact", "key_person", { key_reasoning: "no flag" })).toEqual({
      error: "Key-person proposals need is_key: true or false.",
    });
  });

  it("reads org and manager names from either key", () => {
    expect(plan("contact", "org_assignment", { org: "Enterprise Technology Services (ETS)" })).toEqual({
      plan: { type: "org", org: "Enterprise Technology Services (ETS)" },
    });
    expect(plan("contact", "org_assignment", { org_id: "00000000-0000-0000-0000-000000000001" })).toEqual({
      plan: { type: "org", org: "00000000-0000-0000-0000-000000000001" },
    });
    expect(plan("contact", "reporting_line", { reports_to: "Jane Doe", reports_to_confidence: "secondhand" })).toEqual({
      plan: { type: "manager", name: "Jane Doe", confidence: "secondhand" },
    });
  });

  it("links programs by code or name", () => {
    expect(plan("contact", "initiative_link", { code: "I3" })).toEqual({
      plan: { type: "program_link", program: "initiative", code: "I3" },
    });
    expect(plan("contact", "challenge_link", { name: "Mainframe drag" })).toEqual({
      plan: { type: "program_link", program: "challenge", code: "Mainframe drag" },
    });
    expect(plan("contact", "initiative_link", {})).toEqual({ error: "No initiative code in the proposal." });
  });

  it("writes only allowlisted fields per subject type", () => {
    expect(plan("contact", "field", { field: "statuses", value: ["No Longer at Company"], mode: "add" })).toEqual({
      plan: { type: "array", field: "statuses", op: "add", values: ["No Longer at Company"], upgradePersonaStatus: false },
    });
    expect(plan("account", "field", { field: "why_now", value: "Board mandate on AI in 2026." })).toEqual({
      plan: { type: "patch", patch: { why_now: "Board mandate on AI in 2026." } },
    });
    expect(plan("contact", "field", { field: "title", value: "CTO" })).toEqual({
      error: "“title” is not a field proposals can write.",
    });
    expect(plan("org", "field", { field: "factory_fit", value: "very_high" })).toEqual({
      plan: { type: "patch", patch: { factory_fit: "very_high" } },
    });
    expect(plan("org", "field", { field: "factory_fit", value: "amazing" })).toEqual({
      error: "“amazing” is not a valid factory_fit.",
    });
    expect(plan("initiative", "field", { field: "rank", value: 3 })).toEqual({
      error: "“rank” is not a field proposals can write.",
    });
  });

  it("rejects contact-only kinds on other subjects, and treats summary as informational", () => {
    expect(plan("account", "persona", { personas: ["EB"] })).toEqual({
      error: "“persona” proposals only apply to contacts.",
    });
    expect(plan("challenge", "reporting_line", { reports_to: "Jane Doe" })).toEqual({
      error: "“reporting_line” proposals only apply to contacts.",
    });
    expect(plan("account", "summary", { summary: "Entity tree mapped." })).toEqual({ plan: { type: "none" } });
  });
});

describe("reportingConfidenceFrom", () => {
  it("maps the corpus scale onto the UI scale", () => {
    expect(reportingConfidenceFrom("confirmed")).toBe("confirmed");
    expect(reportingConfidenceFrom("secondhand")).toBe("medium");
    expect(reportingConfidenceFrom("inference")).toBe("low");
    expect(reportingConfidenceFrom(undefined)).toBe("low");
  });
});

describe("evidenceTextOf", () => {
  it("joins claims and rationale with bullets", () => {
    expect(
      evidenceTextOf(
        [
          { claim: "Says “reporting to the CTO” in his summary", confidence: "confirmed" },
          { claim: "Org chart lists him under Technology", confidence: "secondhand" },
        ],
        "Consistent with the org map.",
      ),
    ).toBe("Says “reporting to the CTO” in his summary • Org chart lists him under Technology • Consistent with the org map.");
  });

  it("returns null with nothing to say", () => {
    expect(evidenceTextOf([], null)).toBeNull();
  });
});

describe("describeInferenceValue", () => {
  it("writes one human line per kind", () => {
    expect(describeInferenceValue("persona", { personas: ["EB", "CH"] })).toBe("Personas: EB, CH");
    expect(describeInferenceValue("seniority_level", { seniority_level: "L2" })).toBe("Seniority level: L2");
    expect(describeInferenceValue("org_assignment", { org: "Enterprise Technology Services (ETS)" })).toBe(
      "Org: Enterprise Technology Services (ETS)",
    );
    expect(describeInferenceValue("key_person", { is_key: true, key_reasoning: "Owns the budget" })).toBe(
      "Mark key — Owns the budget",
    );
    expect(describeInferenceValue("reporting_line", { reports_to: "Jane Doe" })).toBe("Reports to Jane Doe");
    expect(describeInferenceValue("initiative_link", { code: "I1" })).toBe("Initiative: I1");
    expect(describeInferenceValue("challenge_link", { code: "Ch2" })).toBe("Challenge: Ch2");
    expect(describeInferenceValue("field", { field: "statuses", value: ["No Longer at Company"], mode: "add" })).toBe(
      "statuses += No Longer at Company",
    );
    expect(describeInferenceValue("summary", { summary: "x".repeat(200) })).toBe(`${"x".repeat(90)}…`);
  });
});
