import { describe, expect, it } from "vitest";
import { extractJson } from "@/lib/ai/client";
import { isValidProposal, type InferenceProposal } from "@/lib/inference/queue";
import { DEFAULT_PROMPTS } from "@/lib/defaults";
import { MODELS } from "@/lib/constants";

describe("extractJson", () => {
  it("parses raw JSON and fenced JSON", () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
    expect(extractJson("```json\n{\"a\":1}\n```")).toEqual({ a: 1 });
    expect(extractJson("```\n[1, 2]\n```")).toEqual([1, 2]);
  });

  it("recovers JSON from surrounding prose", () => {
    expect(extractJson('Here is the result: {"a": {"b": 2}} — done.')).toEqual({ a: { b: 2 } });
    expect(extractJson("Preamble text.\n{\"ok\": true}")).toEqual({ ok: true });
  });

  it("throws on non-JSON output", () => {
    expect(() => extractJson("I could not answer that.")).toThrow();
    expect(() => extractJson("{not valid}")).toThrow();
  });
});

describe("isValidProposal", () => {
  const base = {
    subject_type: "contact",
    subject_id: "c1",
    kind: "persona",
    value: { personas: ["EB"] },
  } satisfies InferenceProposal;

  it("accepts well-formed proposals", () => {
    expect(isValidProposal(base)).toBe(true);
    expect(isValidProposal({ ...base, confidence: "secondhand", source: "ai" })).toBe(true);
  });

  it("rejects unknown kinds, bad confidence, and empty values", () => {
    expect(isValidProposal({ ...base, kind: "teleport" as InferenceProposal["kind"] })).toBe(false);
    expect(isValidProposal({ ...base, confidence: "maybe" as never })).toBe(false);
    expect(isValidProposal({ ...base, value: {} })).toBe(false);
    expect(isValidProposal({ ...base, subject_id: "" })).toBe(false);
    expect(isValidProposal({ ...base, subject_type: "company" as never })).toBe(false);
  });
});

describe("default prompts", () => {
  it("has unique keys with valid models and versions", () => {
    const keys = DEFAULT_PROMPTS.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const p of DEFAULT_PROMPTS) {
      expect(MODELS.some((m) => m.value === p.model), `${p.key} model`).toBe(true);
      expect(p.version).toBeGreaterThanOrEqual(1);
      expect(p.system_prompt.length).toBeGreaterThan(50);
    }
  });

  it("carries the upgraded and new Phase 5 prompts", () => {
    const byKey = new Map(DEFAULT_PROMPTS.map((p) => [p.key, p]));
    expect(byKey.get("import_inference")?.version).toBeGreaterThanOrEqual(2);
    expect(byKey.get("contact_classification")?.version).toBeGreaterThanOrEqual(2);
    expect(byKey.get("chat_assistant")?.version).toBeGreaterThanOrEqual(2);
    expect(byKey.get("context_extraction")?.version).toBeGreaterThanOrEqual(2);
    expect(byKey.get("key_person_brief")?.model).toBe("claude-opus-5-5");
    expect(byKey.get("research_extract")?.model).toBe("claude-opus-5-5");
  });

  it("uses the current persona taxonomy in the classification prompts", () => {
    const taxonomy = ["EB", "CH", "DM", "BS", "TECH", "INFOSEC", "EVAL", "FIN", "PROC", "LEGAL", "COACH", "PARTNER"];
    for (const key of ["import_inference", "contact_classification", "context_extraction"]) {
      const p = DEFAULT_PROMPTS.find((x) => x.key === key);
      expect(p, key).toBeTruthy();
      for (const code of taxonomy) expect(p!.system_prompt, `${key} names ${code}`).toContain(code);
    }
    // The legacy taxonomy must be gone everywhere.
    for (const p of DEFAULT_PROMPTS) {
      expect(p.system_prompt).not.toContain("DevOps");
      expect(p.system_prompt).not.toContain("Influencer/Coach");
    }
  });
});
