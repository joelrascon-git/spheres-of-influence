/**
 * Minimal markdown → HTML for the research corpus. The corpus uses a stable subset
 * (headings, tables, lists, blockquotes, fences, links, emphasis), so this stays
 * small and deterministic rather than pulling in a full parser. Everything is
 * escaped first; generated HTML is safe to inject as-is.
 */

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Inline markup: code spans (protected), links, bold, italics. */
function inlineMarkdown(raw: string): string {
  const codes: string[] = [];
  let s = escapeHtml(raw);
  s = s.replace(/`([^`]+)`/g, (_m, c: string) => {
    codes.push(`<code>${c}</code>`);
    return `\u0000${codes.length - 1}\u0000`;
  });
  // Links [text](url) — url scheme allowlisted so raw text can't inject javascript:.
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text: string, url: string) => {
    const safe = /^(https?:|mailto:|#)/i.test(url) ? url : "#";
    return `<a href="${escapeHtml(safe)}" rel="noopener noreferrer" target="_blank">${text}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*\w])\*([^*\s][^*\n]*?)\*(?!\*)/g, "$1<em>$2</em>");
  s = s.replace(/(^|\W)_([^_\s][^_\n]*?)_(?=\W|$)/g, "$1<em>$2</em>");
  s = s.replace(/\u0000(\d+)\u0000/g, (_m, i: string) => codes[Number(i)] ?? "");
  return s;
}

const isTableRow = (line: string) => /^\s*\|.*\|\s*$/.test(line);
const isTableSeparator = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .every((c) => /^:?-{3,}:?$/.test(c.trim()));

function tableRowCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());
}

function renderTable(head: string[], body: string[][]): string {
  const th = head.map((c) => `<th>${inlineMarkdown(c)}</th>`).join("");
  const rows = body
    .map((r) => `<tr>${r.map((c) => `<td>${inlineMarkdown(c)}</td>`).join("")}</tr>`)
    .join("");
  return `<table><thead><tr>${th}</tr></thead><tbody>${rows}</tbody></table>`;
}

const listMarker = (line: string) => {
  const m = line.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
  if (!m) return null;
  return { indent: Math.floor(m[1].replace(/\t/g, "  ").length / 2), ordered: /\d/.test(m[2]), text: m[3] };
};

/** Render a run of consecutive list lines, honoring one nesting level per two spaces. */
function renderList(lines: string[]): string {
  const items: { indent: number; ordered: boolean; text: string }[] = lines.map(listMarker).filter(Boolean) as {
    indent: number;
    ordered: boolean;
    text: string;
  }[];
  const out: string[] = [];
  const stack: { indent: number; ordered: boolean; html: string[] }[] = [];
  const closeTo = (indent: number) => {
    while (stack.length && stack[stack.length - 1].indent > indent) {
      const list = stack.pop()!;
      const html = `<${list.ordered ? "ol" : "ul"}>${list.html.join("")}</${list.ordered ? "ol" : "ul"}>`;
      // A nested list closes inside its parent, so it renders where it appeared.
      const parent = stack[stack.length - 1];
      if (parent) parent.html.push(html);
      else out.push(html);
    }
  };
  for (const item of items) {
    closeTo(item.indent);
    const top = stack[stack.length - 1];
    if (!top || top.indent < item.indent || top.ordered !== item.ordered) {
      stack.push({ indent: item.indent, ordered: item.ordered, html: [] });
    }
    stack[stack.length - 1].html.push(`<li>${inlineMarkdown(item.text)}</li>`);
  }
  closeTo(-1);
  return out.join("");
}

export function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    // Fenced code block.
    if (/^\s*```/.test(line)) {
      i++;
      const code: string[] = [];
      while (i < lines.length && !/^\s*```/.test(lines[i])) code.push(lines[i++]);
      i++; // closing fence
      out.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
      continue;
    }

    // Heading.
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      out.push(`<h${level}>${inlineMarkdown(h[2].trim())}</h${level}>`);
      i++;
      continue;
    }

    // Horizontal rule (a bare --- line; table separators start with |).
    if (/^(-{3,}|_{3,}|\*{3,})$/.test(line.trim())) {
      out.push("<hr/>");
      i++;
      continue;
    }

    // Table: header row followed by a separator row. The separator is consumed, not rendered.
    if (isTableRow(line) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const body: string[][] = [];
      let j = i + 2;
      while (j < lines.length && isTableRow(lines[j])) body.push(tableRowCells(lines[j++]));
      out.push(renderTable(tableRowCells(line), body));
      i = j;
      continue;
    }

    // Blockquote: strip "> " and recurse over the inner content.
    if (/^>\s?/.test(line)) {
      const inner: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) inner.push(lines[i++].replace(/^>\s?/, ""));
      out.push(`<blockquote>${markdownToHtml(inner.join("\n"))}</blockquote>`);
      continue;
    }

    // List run.
    if (listMarker(line)) {
      const run: string[] = [];
      while (i < lines.length && listMarker(lines[i])) run.push(lines[i++]);
      out.push(renderList(run));
      continue;
    }

    // Paragraph: consecutive plain lines.
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^\s*```/.test(lines[i]) &&
      !/^(#{1,6})\s/.test(lines[i]) &&
      !/^(-{3,}|_{3,}|\*{3,})$/.test(lines[i].trim()) &&
      !isTableRow(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !listMarker(lines[i])
    )
      para.push(lines[i++]);
    out.push(`<p>${para.map((l) => inlineMarkdown(l.trim())).join("<br/>")}</p>`);
  }

  return out.join("\n");
}
