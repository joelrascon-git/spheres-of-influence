import { describe, expect, it } from "vitest";
import { campaignPatch, FUNNEL_STAGES, isNetNew, newCampaign } from "@/lib/workflow/campaigns";

describe("isNetNew", () => {
  it("flags members from a different account than the campaign's", () => {
    expect(isNetNew("acct-a", "acct-b")).toBe(true);
    expect(isNetNew("acct-a", "acct-a")).toBe(false);
  });

  it("never flags multi-account campaigns or unlinked people", () => {
    expect(isNetNew(null, "acct-a")).toBe(false);
    expect(isNetNew("acct-a", null)).toBe(false);
    expect(isNetNew(null, null)).toBe(false);
  });
});

describe("campaign schemas", () => {
  it("creates campaigns with an optional account and strict dates", () => {
    expect(newCampaign.parse({ account_id: null, name: "AMEX exec dinner", type: "event_dinner" })).toMatchObject({
      name: "AMEX exec dinner",
    });
    expect(
      newCampaign.parse({ account_id: "10000000-0000-1000-8000-000000000001", name: "Break-in", type: "account_break_in", event_date: "2026-10-20" }),
    ).toMatchObject({ event_date: "2026-10-20" });
    expect(newCampaign.safeParse({ account_id: null, name: "", type: "outbound" }).success).toBe(false);
    expect(newCampaign.safeParse({ account_id: null, name: "x", type: "hackathon" }).success).toBe(false);
    expect(newCampaign.safeParse({ account_id: null, name: "x", type: "outbound", event_date: "tomorrow" }).success).toBe(false);
  });

  it("patches campaigns partially and rejects unknown statuses", () => {
    expect(campaignPatch.parse({ status: "active" })).toEqual({ status: "active" });
    expect(campaignPatch.parse({})).toEqual({});
    expect(campaignPatch.safeParse({ status: "maybe" }).success).toBe(false);
  });

  it("keeps the funnel ladder ordered", () => {
    expect(FUNNEL_STAGES).toEqual(["invited", "registered", "attended", "engaged", "declined", "no_show"]);
  });
});
