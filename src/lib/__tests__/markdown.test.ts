import { describe, expect, it } from "vitest";
import { markdownToHtml } from "@/lib/markdown";

/**
 * Golden cases for the corpus renderer. The corpus uses a stable markdown subset,
 * so exact output matters: research docs are rendered once and stored as HTML.
 */
describe("markdownToHtml", () => {
  it("renders headings at their level", () => {
    expect(markdownToHtml("# AmEx")).toBe("<h1>AmEx</h1>");
    expect(markdownToHtml("### Factory <b>")).toBe("<h3>Factory &lt;b&gt;</h3>");
  });

  it("joins consecutive paragraph lines and escapes HTML", () => {
    expect(markdownToHtml("Hello world\nSecond line")).toBe("<p>Hello world<br/>Second line</p>");
    expect(markdownToHtml("<script>alert(1)</script>")).toBe("<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>");
    expect(markdownToHtml("A & B")).toBe("<p>A &amp; B</p>");
  });

  it("renders bold and italics inside paragraphs and headings", () => {
    expect(markdownToHtml("This is **bold** text")).toBe("<p>This is <strong>bold</strong> text</p>");
    expect(markdownToHtml("a *slanted* b")).toBe("<p>a <em>slanted</em> b</p>");
    expect(markdownToHtml("## A **b** c")).toBe("<h2>A <strong>b</strong> c</h2>");
  });

  it("keeps code spans literal, protected from other inline markup", () => {
    expect(markdownToHtml("Use `go build` here")).toBe("<p>Use <code>go build</code> here</p>");
    expect(markdownToHtml("Run `**not bold**` now")).toBe("<p>Run <code>**not bold**</code> now</p>");
    expect(markdownToHtml("Use `<b>` here")).toBe("<p>Use <code>&lt;b&gt;</code> here</p>");
  });

  it("renders links with the safe schemes allowlist", () => {
    expect(markdownToHtml("[AmEx](https://americanexpress.com)")).toBe(
      '<p><a href="https://americanexpress.com" rel="noopener noreferrer" target="_blank">AmEx</a></p>',
    );
    expect(markdownToHtml("[x](javascript:alert)")).toBe(
      '<p><a href="#" rel="noopener noreferrer" target="_blank">x</a></p>',
    );
    // Bold inside link text survives because links are replaced before emphasis.
    expect(markdownToHtml("[**AmEx**](https://americanexpress.com)")).toBe(
      '<p><a href="https://americanexpress.com" rel="noopener noreferrer" target="_blank"><strong>AmEx</strong></a></p>',
    );
  });

  it("renders tables with a header row and separator", () => {
    const md = ["| Org | Rank |", "| --- | --- |", "| ETS | 1 |", "| TRIS | 9 |"].join("\n");
    expect(markdownToHtml(md)).toBe(
      "<table><thead><tr><th>Org</th><th>Rank</th></tr></thead>" +
        "<tbody><tr><td>ETS</td><td>1</td></tr><tr><td>TRIS</td><td>9</td></tr></tbody></table>",
    );
  });

  it("renders flat and nested lists, ordered and not", () => {
    expect(markdownToHtml("- one\n- two")).toBe("<ul><li>one</li><li>two</li></ul>");
    expect(markdownToHtml("1. first\n2. second")).toBe("<ol><li>first</li><li>second</li></ol>");
    // One nesting level per two spaces of indent.
    expect(markdownToHtml("- one\n- two\n  - nested")).toBe(
      "<ul><li>one</li><li>two</li><ul><li>nested</li></ul></ul>",
    );
  });

  it("renders blockquotes recursively and code fences escaped", () => {
    expect(markdownToHtml("> quoted **bold**")).toBe("<blockquote><p>quoted <strong>bold</strong></p></blockquote>");
    expect(markdownToHtml("```\nconst x = \"<b>\";\n```")).toBe('<pre><code>const x = &quot;&lt;b&gt;&quot;;</code></pre>');
  });

  it("renders a bare rule as hr and skips blank lines between blocks", () => {
    expect(markdownToHtml("---")).toBe("<hr/>");
    expect(markdownToHtml("a\n\n\nb")).toBe("<p>a</p>\n<p>b</p>");
    expect(markdownToHtml("")).toBe("");
  });
});
