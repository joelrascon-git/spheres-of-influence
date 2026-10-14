import { describe, expect, it } from "vitest";
import {
  EMPTY_LAYOUT,
  defaultPeopleIds,
  hierarchyAccounts,
  layoutWithElk,
  matchStyleRule,
  normalizeLayout,
  peopleIds,
  reportingEdgeStyle,
  type InfluenceLink,
} from "@/lib/canvas/graph";
import type { Account, StyleRule } from "@/lib/types";

const contact = (id: string, extra: Partial<Parameters<typeof defaultPeopleIds>[0][number]> = {}) => ({
  id,
  is_key: false,
  influence_score: null,
  persona_status: null,
  reports_to_id: null,
  ...extra,
});

describe("defaultPeopleIds", () => {
  const influences: InfluenceLink[] = [
    { from_contact_id: "a", to_contact_id: "z" },
  ];

  it("includes key contacts, high influence, research-validated, and the reporting forest", () => {
    const ids = defaultPeopleIds(
      [
        contact("key", { is_key: true }),
        contact("hot", { influence_score: 75 }),
        contact("warm", { influence_score: 59 }),
        contact("researched", { persona_status: "validated" }),
        contact("assumed", { persona_status: "assumed" }),
        contact("report", { reports_to_id: "boss" }),
        contact("lonely"),
      ],
      influences,
    );
    expect(ids.has("key")).toBe(true);
    expect(ids.has("hot")).toBe(true);
    expect(ids.has("warm")).toBe(false);
    expect(ids.has("researched")).toBe(true);
    expect(ids.has("assumed")).toBe(false);
    expect(ids.has("report")).toBe(true);
    expect(ids.has("boss")).toBe(true); // the manager joins because someone reports to them
    expect(ids.has("lonely")).toBe(false);
  });

  it("includes influence participants even when nothing else marks them", () => {
    const ids = defaultPeopleIds([contact("a"), contact("z")], influences);
    expect(ids.has("a")).toBe(true);
    expect(ids.has("z")).toBe(true);
  });
});

describe("peopleIds", () => {
  it("adds manual additions and removes manual hides, hides winning", () => {
    const ids = peopleIds([contact("key", { is_key: true })], [], {
      ...EMPTY_LAYOUT,
      added: ["lonely", "key"],
      hidden: ["key", "extra"],
    });
    expect(ids.has("lonely")).toBe(true);
    expect(ids.has("key")).toBe(false); // explicitly removed beats every other rule
    expect(ids.has("extra")).toBe(false);
  });
});

describe("reportingEdgeStyle", () => {
  it("maps confidence to the spec's line styles", () => {
    expect(reportingEdgeStyle("confirmed").strokeDasharray).toBeUndefined();
    expect(reportingEdgeStyle("medium")).toEqual({ strokeDasharray: "8 4" });
    expect(reportingEdgeStyle("low")).toEqual({ strokeDasharray: "2 4" });
    expect(reportingEdgeStyle(null)).toEqual({ strokeDasharray: "8 4" });
  });
});

describe("hierarchyAccounts", () => {
  const acct = (id: string, parent: string | null): Account =>
    ({ id, parent_account_id: parent } as unknown as Account);

  it("returns the account, its ancestors, and every descendant", () => {
    const all = [
      acct("amex", null),
      acct("aenb", "amex"),
      acct("gbt", "amex"),
      acct("payments", "aenb"),
      acct("wells", null),
      acct("wells-sub", "wells"),
    ];
    const family = hierarchyAccounts(all, "aenb");
    const ids = family.map((a) => a.id).sort();
    expect(ids).toEqual(["aenb", "amex", "payments"]);
  });
});

describe("matchStyleRule", () => {
  const rule = (name: string, value: string, opts: Partial<StyleRule> = {}): StyleRule =>
    ({
      id: name,
      name,
      field: "statuses",
      operator: "contains",
      value,
      style: {},
      priority: 50,
      enabled: true,
      ...opts,
    }) as StyleRule;

  it("matches a contained status and respects priority order and the enabled flag", () => {
    const rules = [
      rule("dnc", "Do Not Contact", { priority: 90 }),
      rule("gone", "No Longer at Company", { priority: 100 }),
      rule("disabled", "Working", { enabled: false }),
    ];
    expect(matchStyleRule(rules, ["Working", "No Longer at Company"])?.name).toBe("gone");
    expect(matchStyleRule(rules, ["Do Not Contact"])?.name).toBe("dnc");
    expect(matchStyleRule(rules, ["Working"])).toBeNull(); // disabled rules never apply
    expect(matchStyleRule(rules, [])).toBeNull();
  });

  it("equals only matches a single-status contact", () => {
    const rules = [rule("exactly", "Working", { operator: "equals" })];
    expect(matchStyleRule(rules, ["Working"])?.name).toBe("exactly");
    expect(matchStyleRule(rules, ["Working", "Nurture"])).toBeNull();
  });
});

describe("normalizeLayout", () => {
  it("keeps finite positions and string id lists, drops everything malformed", () => {
    const layout = normalizeLayout({
      positions: {
        ok: { x: 1, y: 2 },
        bad: { x: "left", y: 2 },
        nan: { x: Number.NaN, y: 2 },
      },
      added: ["a", 5, null],
      hidden: "nope",
    });
    expect(layout.positions).toEqual({ ok: { x: 1, y: 2 } });
    expect(layout.added).toEqual(["a"]);
    expect(layout.hidden).toEqual([]);
  });

  it("handles null rows", () => {
    expect(normalizeLayout(null)).toEqual(EMPTY_LAYOUT);
  });
});

describe("layoutWithElk", () => {
  it("places group children inside their group, in group-relative coordinates", async () => {
    const out = await layoutWithElk(
      [
        { id: "org:a", width: 320, height: 200, group: true },
        { id: "org:b", width: 320, height: 200, group: true },
        { id: "boss", width: 220, height: 78, parentNode: "org:a" },
        { id: "report", width: 220, height: 78, parentNode: "org:a" },
        { id: "peer", width: 220, height: 78, parentNode: "org:b" },
        { id: "loose", width: 220, height: 78 },
      ],
      [
        { id: "r1", sources: ["boss"], targets: ["report"] },
        { id: "r2", sources: ["boss"], targets: ["peer"] },
      ],
    );
    for (const [child, group] of [["boss", "org:a"], ["report", "org:a"], ["peer", "org:b"]] as const) {
      const c = out[child];
      const g = out[group];
      expect(c.x).toBeGreaterThanOrEqual(0);
      expect(c.y).toBeGreaterThanOrEqual(0);
      expect(c.x + c.width).toBeLessThanOrEqual(g.width);
      expect(c.y + c.height).toBeLessThanOrEqual(g.height);
    }
    // The org header padding keeps cards below the label.
    expect(out.boss.y).toBeGreaterThanOrEqual(36);
    expect(out.report.y).toBeGreaterThan(out.boss.y);
    expect(out.loose).toBeDefined();
  });
});
