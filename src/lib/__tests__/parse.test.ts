import { describe, expect, it } from "vitest";
import { buildFilter, highlightTerms, parseQuery } from "@/lib/search/parse";

describe("parseQuery", () => {
  it("returns an empty AND for an empty query", () => {
    expect(parseQuery("   ")).toEqual({ t: "and", c: [] });
  });

  it("ANDs adjacent terms", () => {
    expect(parseQuery('Manager AND AI')).toEqual({
      t: "and",
      c: [
        { t: "text", v: "Manager" },
        { t: "text", v: "AI" },
      ],
    });
    expect(parseQuery("manager ai")).toEqual(parseQuery("manager AND ai"));
  });

  it("gives AND higher precedence than OR", () => {
    expect(parseQuery("a OR b c")).toEqual({
      t: "or",
      c: [
        { t: "text", v: "a" },
        { t: "and", c: [{ t: "text", v: "b" }, { t: "text", v: "c" }] },
      ],
    });
  });

  it("handles groups, phrases, NOT and minus", () => {
    expect(parseQuery('(snowflake OR "machine learning") -intern NOT title:contractor')).toEqual({
      t: "and",
      c: [
        { t: "or", c: [{ t: "text", v: "snowflake" }, { t: "text", v: "machine learning" }] },
        { t: "not", c: { t: "text", v: "intern" } },
        { t: "not", c: { t: "field", f: "title", v: "contractor" } },
      ],
    });
  });

  it("parses quoted field values and aliases", () => {
    expect(parseQuery('-status:"Do Not Contact"')).toEqual({
      t: "not",
      c: { t: "field", f: "status", v: "Do Not Contact" },
    });
    expect(parseQuery("company:carvana")).toEqual({ t: "field", f: "account", v: "carvana" });
  });

  it("supports prefix search", () => {
    expect(parseQuery("data*")).toEqual({ t: "text", v: "data", prefix: true });
  });

  it("maps seniority values to stored codes", () => {
    expect(parseQuery("seniority:C-Level")).toEqual({ t: "in", f: "seniority", v: ["c_level"] });
  });

  it("understands is: and has: shortcuts", () => {
    expect(parseQuery("is:key has:email contacted:no")).toEqual({
      t: "and",
      c: [
        { t: "bool", f: "is_key", v: true },
        { t: "bool", f: "has_email", v: true },
        { t: "bool", f: "contacted", v: false },
      ],
    });
  });

  it("treats lowercase and/or as words and unknown fields as text", () => {
    expect(parseQuery("rock and roll")).toEqual({
      t: "and",
      c: [{ t: "text", v: "rock" }, { t: "text", v: "and" }, { t: "text", v: "roll" }],
    });
    expect(parseQuery("foo:bar")).toEqual({ t: "text", v: "foo:bar" });
  });

  it("tolerates unbalanced parentheses", () => {
    expect(parseQuery("(a OR b")).toEqual({ t: "or", c: [{ t: "text", v: "a" }, { t: "text", v: "b" }] });
    expect(parseQuery("a) b")).toEqual({ t: "and", c: [{ t: "text", v: "a" }, { t: "text", v: "b" }] });
  });

  it("keeps hyphenated words intact", () => {
    expect(parseQuery("e-commerce")).toEqual({ t: "text", v: "e-commerce" });
  });
});

describe("buildFilter", () => {
  it("combines the query with facets", () => {
    const f = buildFilter("ai", { seniority: ["manager"], excludeStatuses: ["Do Not Contact"], keyOnly: true });
    expect(f).toEqual({
      t: "and",
      c: [
        { t: "text", v: "ai" },
        { t: "in", f: "seniority", v: ["manager"] },
        { t: "not", c: { t: "in", f: "statuses", v: ["Do Not Contact"] } },
        { t: "bool", f: "is_key", v: true },
      ],
    });
  });
});

describe("highlightTerms", () => {
  it("collects positive terms only", () => {
    expect(highlightTerms(parseQuery("ai -intern title:manager"))).toEqual(["ai", "manager"]);
  });
});
