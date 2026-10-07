// Builds a second American Express export out of the first one, so the import review screen
// has something real to compare against. Same export date on purpose: nothing drifts, so every
// diff you see is a change someone actually made. Run: node scripts/generate-amex-update.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import Papa from "papaparse";

const dir = join(import.meta.dirname, "..", "sample-data");
const source = join(dir, "amex_leads_10_7_2026.csv");
const target = join(dir, "amex_leads_10_7_2026_reexport.csv");

const parsed = Papa.parse(readFileSync(source, "utf8"), { header: true, skipEmptyLines: "greedy" });
/** @type {Record<string, string>[]} */
const rows = parsed.data;
const fields = parsed.meta.fields ?? [];

// The export stores the full profile URL here, so match on the trailing member id.
const find = (id) => {
  const row = rows.find((r) => (r["Linkedin URL Unique ID"] ?? "").endsWith(id));
  if (!row) throw new Error(`No row with LinkedIn ID ${id}`);
  return row;
};

// 1. Promotion: new title, tenure in position restarts.
const david = find("ACwAACK8wSIB8LjTghuXq6hK51dkycs1RWYAEtA");
david["Current Job"] = "SVP, Cloud Infrastructure";
david["Years in Position"] = "0";
david["Months in Position"] = "3";

// 2. New work email. The review screen leaves this unchecked by default so an import
//    can never quietly overwrite an address you were already using.
const priya = find("ACwAAJ9MxRIB1rYvlLx2u3vN97gpbGa3VUbIeD");
priya["Email"] = "p.sharma@aexp.com";
priya["Email Status"] = "safe";

// 3. Moved to another company: same person, same LinkedIn ID, new employer.
const thomas = find("ACwAAT4ScWIB6wYqqQc7z8sS42luiLf8AZgNjI");
thomas["Email"] = "";
thomas["Email Status"] = "";
thomas["Company Name"] = "JPMorgan Chase & Co.";
thomas["Company Domain"] = "jpmorganchase.com";
thomas["Company Linkedin URL Unique ID"] = "https://www.linkedin.com/company/1024";
thomas["Company Website URL"] = "https://www.jpmorganchase.com";
thomas["Company Employee Exact Count"] = "316043";
thomas["Company Employee Range"] = "10001+";
thomas["Company Location"] = "New York, New York, United States";
thomas["Company Year Founded"] = "1799";

// 4. Hired since the last export: nothing to match against, so this row is a plain create.
// Company facts come from an existing American Express row; only the person changes.
const template = rows[0];
const newHire = {
  ...Object.fromEntries(fields.map((f) => [f, template[f] ?? ""])),
  "First Name": "Alexis",
  "Last Name": "Fontaine",
  "Full Name": "Alexis Fontaine",
  "Current Job": "Director, Cloud Security",
  "Profile Headline": "Cloud security architecture for regulated workloads",
  "Profile Summary":
    "Cloud security architecture for regulated workloads. Director, Cloud Security at American Express.",
  Email: "alexis.fontaine@aexp.com",
  "Email Status": "safe",
  "Linkedin URL Public": "https://www.linkedin.com/in/alexis-fontaine",
  "Linkedin URL Unique ID": "https://www.linkedin.com/in/ACwAAS1TzUIB1xKllLm8o9oO71ssslPtKKcMjN",
  "Sales Navigator URL": "https://www.linkedin.com/sales/lead/ACwAAS1TzUIB1xKllLm8o9oO71ssslPtKKcMjN",
  "Profile Picture": "",
  Location: "Phoenix, Arizona, United States",
  Connections: "480",
  "Years in Position": "1",
  "Months in Position": "2",
  "Years in Company": "7",
  "Months in Company": "4",
  "Total Positions Count": "4",
};
rows.push(newHire);

// Keep the in-file duplicate that the first export already carries, so dedupe still runs.
rows.push({ ...rows[0], "Profile Headline": "SVP, Enterprise Data & AI Platforms at American Express" });

writeFileSync(target, Papa.unparse(rows, { fields, newline: "\n" }));
console.log(`Wrote ${rows.length} rows to ${target}`);
console.log("Changed rows: David Chen (promotion), Priya Sharma (new email), Thomas Reilly (moved to JPMorgan Chase), Alexis Fontaine (new hire)");
