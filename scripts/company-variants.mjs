// Dev utility: tally the distinct companies in an Evaboot export to exercise the account matcher.
// Usage: node scripts/company-variants.mjs "/path/to/AmEx - Evaboot Export.csv"
import { readFileSync } from "node:fs";
import Papa from "papaparse";

const file = process.argv[2];
const text = readFileSync(file, "utf8");
const parsed = Papa.parse(text, { header: true, skipEmptyLines: "greedy" });
const rows = (parsed.data ?? []).filter((r) => Object.keys(r).length > 0);

const get = (row, name) => {
  const key = Object.keys(row).find((k) => k.toLowerCase().replace(/[^a-z0-9]/g, "") === name.toLowerCase().replace(/[^a-z0-9]/g, ""));
  const v = key ? (row[key] ?? "").toString().trim() : "";
  return v && v !== "NA" ? v : "";
};

const companies = new Map();
for (const r of rows) {
  const name = get(r, "Company Name");
  const domain = get(r, "Company Domain").toLowerCase().replace(/^www\./, "");
  const liId = get(r, "Company Linkedin URL Unique ID").match(/linkedin\.com\/(?:company|sales\/lead|sales\/people)\/([^/?#,]+)/i)?.[1] ?? "";
  const key = domain || liId || name.toLowerCase();
  const entry = companies.get(key) ?? { key, names: new Map(), domains: new Map(), liIds: new Map(), count: 0 };
  entry.count++;
  entry.names.set(name, (entry.names.get(name) ?? 0) + 1);
  entry.domains.set(domain, (entry.domains.get(domain) ?? 0) + 1);
  entry.liIds.set(liId, (entry.liIds.get(liId) ?? 0) + 1);
  companies.set(key, entry);
}

const fmt = (m) => [...m.entries()].map(([k, n]) => `${k || "∅"}×${n}`).join(", ");
const sorted = [...companies.values()].sort((a, b) => b.count - a.count);
console.log(`rows=${rows.length} distinct-company-keys=${sorted.length}\n`);
for (const c of sorted) {
  console.log(`${String(c.count).padStart(4)}  key=${c.key}`);
  console.log(`        name: ${fmt(c.names)}`);
  console.log(`        domain: ${fmt(c.domains)}   liId: ${fmt(c.liIds)}`);
}
