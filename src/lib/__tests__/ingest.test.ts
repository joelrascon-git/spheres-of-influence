import { describe, expect, it } from "vitest";
import {
  CALL_TYPE_LABELS,
  extractionResponseSchema,
  notesResponseSchema,
  normalizeEvidence,
  resolvePerson,
  splitFullName,
  storedExtractionSchema,
  type MatchableContact,
} from "@/lib/ingest/extract";

const contacts: MatchableContact[] = [
  { id: "c1", full_name: "Priya Sharma", email: "priya@amex.example", linkedin_public_url: "https://linkedin.com/in/priya-sharma" },
  { id: "c2", full_name: "Dan Kowalski", email: null, linkedin_public_url: "https://linkedin.com/in/dan-kowalski/" },
  { id: "c3", full_name: "Ana María Ruiz", email: "ana@other.example", linkedin_public_url: null },
];

describe("notesResponseSchema", () => {
  it("accepts a classified response with markdown notes", () => {
    const r = notesResponseSchema.parse({
      call_type: "discovery",
      notes_markdown: "## Attendees\n- Priya Sharma (VP Platform)\n- Dan Kowalski (Director, DevEx)",
    });
    expect(r.call_type).toBe("discovery");
  });

  it("rejects call types outside the taxonomy and empty notes", () => {
    expect(notesResponseSchema.safeParse({ call_type: "cold_call", notes_markdown: "x" }).success).toBe(false);
    expect(notesResponseSchema.safeParse({ call_type: "discovery", notes_markdown: "" }).success).toBe(false);
  });
});

describe("extractionResponseSchema", () => {
  it("defaults the arrays and accepts influence_edge proposals", () => {
    const r = extractionResponseSchema.parse({
      people: [
        {
          name: "Priya Sharma",
          match: "Priya Sharma",
          note: "## Discussed\n- Pilot scoping",
          proposals: [
            {
              kind: "influence_edge",
              value: { to: "Dan Kowalski", strength: "high" },
              confidence: "confirmed",
              evidence: [{ claim: "“Dan runs everything through Priya.”" }],
            },
          ],
        },
      ],
    });
    expect(r.account_proposals).toEqual([]);
    expect(r.next_steps).toEqual([]);
    expect(r.people[0]!.proposals![0]!.kind).toBe("influence_edge");
  });

  it("rejects proposals with unknown kinds, keeping bad model output out of the queue", () => {
    expect(
      extractionResponseSchema.safeParse({ people: [{ name: "X", proposals: [{ kind: "vibe", value: {} }] }] }).success,
    ).toBe(false);
  });

  it("keeps the stored extraction round-trippable with contact ids and created map", () => {
    const stored = storedExtractionSchema.parse({
      people: [{ name: "Nadia Novak", contact_id: null, proposals: [] }],
      account_proposals: [],
      next_steps: [{ text: "Send the deck", committed: true }],
      created: { "Nadia Novak": "c9" },
    });
    expect(stored.created).toEqual({ "Nadia Novak": "c9" });
    expect(stored.people[0]!.contact_id).toBeNull();
  });
});

describe("resolvePerson", () => {
  it("accepts a verified exact-name match", () => {
    expect(resolvePerson({ name: "Priya", match: "Priya Sharma" }, contacts)).toEqual({ contactId: "c1", matchedBy: "match" });
  });

  it("drops a hallucinated match and falls back to exact identifiers", () => {
    expect(resolvePerson({ name: "Someone New", match: "Wizard of Oz", email: "priya@amex.example" }, contacts)).toEqual({
      contactId: "c1",
      matchedBy: "email",
    });
  });

  it("matches linkedin urls ignoring a trailing slash", () => {
    expect(
      resolvePerson({ name: "Unknown", linkedin_url: "https://linkedin.com/in/dan-kowalski" }, contacts),
    ).toEqual({ contactId: "c2", matchedBy: "linkedin" });
  });

  it("matches names case-insensitively, including accents", () => {
    expect(resolvePerson({ name: "ana maría ruiz" }, contacts)).toEqual({ contactId: "c3", matchedBy: "name" });
  });

  it("returns null rather than fuzzy-matching", () => {
    expect(resolvePerson({ name: "Priya" }, contacts).contactId).toBeNull();
    expect(resolvePerson({ name: "Dan Kowalski Jr." }, contacts).contactId).toBeNull();
  });
});

describe("splitFullName", () => {
  it("splits first and last, keeping multi-word surnames", () => {
    expect(splitFullName("Priya Sharma")).toEqual({ first_name: "Priya", last_name: "Sharma" });
    expect(splitFullName("Ludwig van Beethoven")).toEqual({ first_name: "Ludwig", last_name: "van Beethoven" });
    expect(splitFullName("Cher")).toEqual({ first_name: "Cher", last_name: "" });
    expect(splitFullName("  Extra   Spaces  ")).toEqual({ first_name: "Extra", last_name: "Spaces" });
  });
});

describe("normalizeEvidence", () => {
  it("fills in inference confidence for bare claims", () => {
    expect(normalizeEvidence([{ claim: "Quote" }])).toEqual([{ claim: "Quote", confidence: "inference" }]);
    expect(normalizeEvidence(undefined)).toEqual([]);
  });
});

describe("CALL_TYPE_LABELS", () => {
  it("labels every call type", () => {
    expect(Object.keys(CALL_TYPE_LABELS).sort()).toEqual([
      "adaptive_non_discovery",
      "discovery",
      "partner_or_internal",
      "personal_note",
    ]);
  });
});
