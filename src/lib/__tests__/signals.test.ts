import { describe, expect, it } from "vitest";
import { hashUrl, keepCitedSignals, normalizeUrl, scanResult, SIGNAL_STATUSES, type ScanSignal } from "@/lib/workflow/signals";

const one: ScanSignal = {
  title: "AmEx launches agent platform",
  summary: "What happened, factually.",
  so_what: "Their governance reviewers are Factory's audience.",
  source_name: "AmEx newsroom",
  source_url: "https://www.americanexpress.com/en-us/newsroom/article.html",
  source_date: "2026-10-01",
  relevance: 4,
};

describe("normalizeUrl", () => {
  it("treats host case and trailing slashes as the same page", () => {
    expect(normalizeUrl("https://News.example.com/posts/1/")).toBe("https://news.example.com/posts/1");
    expect(normalizeUrl("https://news.example.com/posts/1///")).toBe("https://news.example.com/posts/1");
  });

  it("drops query strings (utm noise) and survives junk", () => {
    expect(normalizeUrl("https://x.com/a?b=1&utm_source=rss")).toBe("https://x.com/a");
    expect(normalizeUrl("https://x.com/a#fragment")).toBe("https://x.com/a");
    expect(normalizeUrl("not a url")).toBe("not a url");
  });
});

describe("hashUrl", () => {
  it("is stable and collapses the same page written differently", () => {
    expect(hashUrl("https://x.com/a/")).toBe(hashUrl("https://X.com/a"));
    expect(hashUrl("https://x.com/a")).not.toBe(hashUrl("https://x.com/b"));
  });
});

describe("scanResult", () => {
  it("accepts a well-formed signal and bounds relevance", () => {
    expect(scanResult.parse([one])).toEqual([one]);
    expect(scanResult.safeParse([{ ...one, relevance: 0 }]).success).toBe(false);
    expect(scanResult.safeParse([{ ...one, relevance: 6 }]).success).toBe(false);
    expect(scanResult.safeParse([{ ...one, source_url: "not a url" }]).success).toBe(false);
  });

  it("requires the so-what and allows a missing date", () => {
    expect(scanResult.safeParse([{ ...one, so_what: "" }]).success).toBe(false);
    expect(scanResult.safeParse([{ ...one, source_date: null }]).success).toBe(true);
  });
});

describe("keepCitedSignals", () => {
  const cited = "https://news.example.com/posts/1";

  it("keeps only signals whose source the search actually fetched", () => {
    const { kept, dropped } = keepCitedSignals(
      [{ ...one, source_url: `${cited}/` }, { ...one, title: "Uncited", source_url: "https://made-up.example.com/x" }],
      new Set([cited]),
      new Set(),
    );
    expect(kept).toEqual([{ ...one, source_url: `${cited}/` }]);
    expect(dropped).toBe(1);
  });

  it("drops URLs already stored and repeats within the batch", () => {
    const both = [
      { ...one, source_url: cited },
      { ...one, source_url: cited },
    ];
    const first = keepCitedSignals(both, new Set([cited]), new Set());
    expect(first.kept).toHaveLength(1);
    expect(first.dropped).toBe(1);
    const second = keepCitedSignals(both, new Set([cited]), new Set([cited]));
    expect(second.kept).toHaveLength(0);
    expect(second.dropped).toBe(2);
  });
});

describe("signal statuses", () => {
  it("keeps the ladder", () => {
    expect(SIGNAL_STATUSES).toEqual(["new", "linked", "dismissed"]);
  });
});
