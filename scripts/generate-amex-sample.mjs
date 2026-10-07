// Generates a realistic American Express Evaboot-style sample export so the import
// pipeline can be exercised end-to-end without waiting for a real Amex export.
// Run: node scripts/generate-amex-sample.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const HEADERS = [
  "Matches Filters", "No Match Reasons", "First Name", "Last Name", "Current Job", "Email", "Email Status",
  "Linkedin URL Public", "Linkedin URL Unique ID", "Sales Navigator URL", "Is Open Profile", "Company Name",
  "Company Domain", "Company Linkedin URL Unique ID", "Company Employee Exact Count", "Company Employee Range",
  "Company Industry", "Company Description", "Company Specialities", "Company Profile Picture",
  "Company Website URL", "Company Type", "Company Location", "Company Year Founded", "Department Headcounts",
  "Sales Team Size", "Business Development Size", "Profile Headline", "Profile Summary", "Job Description",
  "Current Jobs Number", "Connections", "Is Open To Work", "Is Premium", "Location", "Profile Industry",
  "Profile Picture", "Full Name", "Years in Position", "Months in Position", "Years in Company",
  "Months in Company", "Company Revenue Min (Millions USD)", "Company Revenue Max (Millions USD)",
  "Company Employee Growth 6 Months (%)", "Company Employee Growth 1 Year (%)",
  "Company Employee Growth 2 Years (%)", "Company Headquarters (Full Address)", "Total Positions Count",
  "Job Seeker Badge", "Company Revenue Currency", "Posting Frequency", "InMail Restriction Status",
  "Has New Position",
];

const COMPANY = {
  "Company Name": "American Express",
  "Company Domain": "aexp.com",
  "Company Linkedin URL Unique ID": "https://www.linkedin.com/company/1239",
  "Company Employee Exact Count": "74000",
  "Company Employee Range": "10001+",
  "Company Industry": "Financial Services",
  "Company Description":
    "American Express is a globally integrated payments company, providing customers with access to products, insights and experiences that enrich lives and build business success.",
  "Company Specialities": "payments, credit cards, travel services, financial services, digital banking",
  "Company Profile Picture": "https://media.licdn.com/dms/image/v2/C560BAQEG1stEwGtYAA/company-logo.jpg",
  "Company Website URL": "http://www.americanexpress.com",
  "Company Type": "Public Company",
  "Company Location": "New York, New York, United States",
  "Company Year Founded": "1850",
  "Department Headcounts":
    "Engineering: 12000\nInformation Technology: 9500\nBusiness Development: 3400\nLegal: 1200\nSales: 2900",
  "Sales Team Size": "2900",
  "Business Development Size": "3400",
  "Company Revenue Min (Millions USD)": "60000",
  "Company Revenue Max (Millions USD)": "70000",
  "Company Employee Growth 6 Months (%)": "1",
  "Company Employee Growth 1 Year (%)": "2",
  "Company Employee Growth 2 Years (%)": "4",
  "Company Headquarters (Full Address)": "200 Vesey St, New York, New York, 10282, United States",
  "Company Revenue Currency": "USD",
};

const BASE = {
  "Matches Filters": "YES",
  "No Match Reasons": "None",
  "Is Open Profile": "False",
  "Is Open To Work": "False",
  "Is Premium": "False",
  "Current Jobs Number": "1",
  "Total Positions Count": "1",
  "Job Seeker Badge": "None",
  "Posting Frequency": "Low",
  "InMail Restriction Status": "None",
  "Has New Position": "No",
  "Profile Industry": "Financial Services",
};

// Realistic titles spread across the orgs a strategic AE would map: data platform,
// cloud, AI, InfoSec, payments, risk, procurement. Tenures chosen so several rows
// land on the "change agent" profile (short role, long company).
const PEOPLE = [
  ["Anna", "Kowalski", "SVP, Enterprise Data Platform", "Enterprise Data Platform executive at American Express", "NYC", 3, 2, 14, 0, "safe", 2500, "ACwAAACEwrgBHZwFjLEdlttsSziRY1lQxSj4z3"],
  ["David", "Chen", "VP of Engineering, Cloud Infrastructure", "Building Amex's next-generation cloud platform", "Phoenix", 1, 4, 9, 2, "safe", 3100, "ACwAACK8wSIB8LjTghuXq6hK51dkycs1RWYAEtA"],
  ["Maria", "Gonzalez", "Director, AI Research", "Applied ML research for payments risk and personalization", "NYC", 2, 1, 6, 5, "safe", 890, "ACwAAE5KwMIB8pXthJuYr2sL64elzBd1XRYaGtB"],
  ["James", "O'Brien", "Distinguished Engineer", "Systems architecture â€¢ event-driven platforms â€¢ payments modernization", "NYC", 0, 8, 21, 3, "safe", 4400, "ACwAAH7LwQIB9qZuiKv0t1uM86fmaEf2UTaHdC"],
  ["Priya", "Sharma", "Senior Manager, Data Engineering", "Leading the batch-to-streaming migration on the data platform team", "Phoenix", 4, 5, 4, 5, "riskier", 620, "ACwAAJ9MxRIB1rYvlLx2u3vN97gpbGa3VUbIeD"],
  ["Michael", "Torres", "Chief Technology Officer", "CTO at American Express", "NYC", 2, 6, 18, 1, "safe", 5000, "ACwAAL4NySIB2sZwmMy3v4wO08hqcHb4WVcJfE"],
  ["Sarah", "Whitfield", "VP, Information Security", "CISO organization leader â€¢ cloud security â€¢ zero trust", "Salt Lake City", 3, 0, 11, 4, "safe", 1900, "ACwAAN0PzTIB3tXvnNz4w5xP19irfIc5XWdKgF"],
  ["Robert", "Kim", "Director, Enterprise Architecture", "Payments enterprise architecture and technology strategy", "NYC", 1, 2, 7, 7, "riskier", 1100, "ACwAAP2QaUIB4uYwoOa5x6yQ20jsgJd6YXeLhG"],
  ["Linda", "Park", "Senior Engineering Manager, Payments Platform", "Payments platform engineering, consumer card products", "Phoenix", 2, 3, 5, 0, "safe", 780, "ACwAAR3RbVIB5vXppPb6y7zR31kthKe7ZYfMiH"],
  ["Thomas", "Reilly", "Staff Software Engineer, Core Payments", "Core payments ledger and settlement engineering", "NYC", 5, 1, 5, 1, "invalid", 340, "ACwAAT4ScWIB6wYqqQc7z8sS42luiLf8AZgNjI"],
  ["Aisha", "Mohammed", "Director of Machine Learning Engineering", "ML platform, model governance and real-time inference", "Fort Lauderdale", 0, 10, 8, 6, "safe", 1400, "ACwAAV5UdXIB7xZrrRd8t9tT53mujMg9BAaOkJ"],
  ["Kevin", "O'Malley", "VP, Digital Payments", "Digital wallets, P2P and digital card experiences", "NYC", 6, 0, 15, 2, "safe", 2700, "ACwAAX6VeYIB8ySssSe9u0uU64nvkNh0CBbPlK"],
  ["Rachel", "Stein", "Senior Counsel, Technology Transactions", "Technology procurement and SaaS negotiations", "NYC", 2, 0, 3, 3, "safe", 410, "ACwAAZ7WfZIB9zTttTf0v1vV75owkOi1DCcQmN"],
  ["Daniel", "Brooks", "Engineering Director, Mobile", "Mobile app engineering for the Amex consumer app", "Phoenix", 1, 0, 1, 0, "riskier", 520, "ACwAAb8XgAIB0aUuuUg1w2wW86pxpLj2EDdRnL"],
  ["Jennifer", "Liu", "Chief Data and Analytics Officer", "Chief Data and Analytics Officer at American Express", "NYC", 1, 1, 5, 4, "safe", 3800, "ACwAAd9YhBIB1bVvvVh2x3xX97qyqMk3FEeSoM"],
  ["Carlos", "Mendez", "Senior Data Engineer, Risk Analytics", "Risk data pipelines, regulatory reporting, Spark and dbt", "Phoenix", 3, 7, 3, 7, "", 260, "ACwAAf0ZiCIB2cWwwWi3y4yY08rzLn4GFFtPnL"],
  ["Emily", "Watson", "Product Director, Commercial Card", "Commercial payments product strategy", "NYC", 4, 2, 12, 0, "safe", 1600, "ACwAAh1AjDIB3dXxxXj4z5zZ19sasO5HGGuQoN"],
  ["Marcus", "Johnson", "InfoSec Engineer, Identity", "Identity and access engineering, workforce zero trust", "Salt Lake City", 2, 5, 2, 5, "safe", 300, "ACwAAj2BkEIB4eYyyYk5a6aA26tbtP6IHHvRpO"],
  ["Hannah", "Schmidt", "VP, Global Network Engineering", "Global network services engineering at American Express", "Fort Lauderdale", 7, 2, 22, 5, "safe", 2900, "ACwAAl3ClFIB5fZzzZl6b7bB37ucuQ7JIIwSqP"],
  ["Alejandro", "Ruiz", "Manager, Cloud FinOps", "Cloud economics, unit cost and FinOps automation", "Phoenix", 0, 7, 6, 3, "safe", 450, "ACwAAn4DmGIB6gAaaAm7c8cC48vdvR8KJJxTrQ"],
  ["Nicole", "Tran", "Senior Architect, Event Streaming", "Event streaming backbone â€¢ Kafka â€¢ exactly-once processing", "NYC", 3, 0, 10, 8, "riskier", 700, "ACwAAp5EnHIB7hBbbBn8d9dD59wewS9LKKYUsR"],
  ["Gregory", "White", "SVP, Technology Risk", "Technology risk and resilience across the enterprise", "NYC", 5, 0, 16, 4, "safe", 2100, "ACwAAr6FoIIB8iCccCo9e0eE60xfxTaMLLZVtS"],
  ["Fatima", "Hassan", "Data Science Manager", "Credit decisioning models and champion-challenger frameworks", "Phoenix", 2, 2, 4, 1, "safe", 610, "ACwAAt7GpJIB9jDddDp0f1fF71ygyUbNMMaWuT"],
  ["Steven", "Cho", "Staff Engineer, Observability", "Observability platform, SLOs and telemetry pipelines", "Salt Lake City", 1, 5, 3, 2, "", 280, "ACwAAv8HqKIB0kEeeEq1g2gG82zhzVcONNbXvU"],
  ["Olivia", "Bennett", "Director, Software Supply Chain Security", "Securing the path from commit to cloud at Amex", "NYC", 0, 11, 9, 6, "safe", 950, "ACwAAx9IrLIB1lFffFr2h3hH93iijaWdOOcYwV"],
  ["Paul", "Nakamura", "VP, Core Technology Modernization", "Mainframe-to-cloud modernization for core payments", "Phoenix", 2, 8, 13, 3, "safe", 1800, "ACwAAz0JsMIB2mGggGs3i4iI04jjjbXePPdZxW"],
  ["Diana", "Foster", "Agile Coach, Technology", "Engineering ways of working across payments and data", "NYC", 4, 0, 4, 0, "riskier", 730, "ACwAAB1KtNIB3nHhhHt4j5jJ15kkkcYfQQeAyX"],
  ["Ibrahim", "Diallo", "Principal Engineer, Payments Modernization", "Ledger redesign and double-entry payment processing", "NYC", 3, 3, 6, 2, "safe", 1300, "ACwAAC2LuOIB4oIiiIu5k6kK26llldZgRRfBzY"],
  ["Katherine", "Hayes", "Deputy CISO", "Deputy CISO at American Express â€¢ security strategy", "NYC", 1, 9, 8, 0, "safe", 2400, "ACwAAD3MvPIB5pJjjJv6l7lL37mmmeAhSSgCaZ"],
  ["Benjamin", "Alvarez", "Senior Manager, API Platform", "Enterprise API gateway and developer portal", "Phoenix", 2, 0, 7, 5, "safe", 560, "ACwAAE4NwQIB6qKkkKw7m8mM48nnnfBiTThDbA"],
  ["Grace", "Kim", "Director, Data Governance", "Data governance, lineage and privacy engineering", "Fort Lauderdale", 3, 1, 3, 1, "safe", 640, "ACwAAF5OxRIB7rLllLx8n9nN59ooogCjUUcEcB"],
  ["Victor", "Petrov", "Engineering Manager, Mainframe Transformation", "30 years of COBOL, now transforming it", "Phoenix", 6, 3, 24, 8, "safe", 380, "ACwAAG6PySIB8sMmmMy9o0oO60ppphDkVVdFdC"],
  ["Amara", "Okafor", "VP, Developer Experience", "Inner-source, platform DX and developer productivity", "NYC", 0, 9, 12, 1, "safe", 1750, "ACwAAH7QzTIB9tNnnNz0p1pP71qqqiElWWeGeD"],
  ["Jonathan", "Silver", "Procurement Director, Technology", "Technology sourcing and vendor management", "NYC", 3, 0, 9, 9, "safe", 1000, "ACwAAI8RaUIB0uOooOa1q2qQ82rrrjFmXXfHfE"],
  ["Mei-Ling", "Zhang", "Senior Architect, Hybrid Cloud", "Hybrid cloud architecture â€¢ OpenShift â€¢ regulatory workloads", "Phoenix", 4, 6, 10, 2, "safe", 1220, "ACwAAJ9SbVIB1vPppPb2r3rR93ssskGnYYgIgF"],
  ["Ryan", "Gallagher", "Manager, Cyber Defense Operations", "SOC detection engineering and threat hunting", "Salt Lake City", 1, 3, 2, 4, "safe", 240, "ACwAAK0TcWIB2wQqqQc3s4sS04ttthHoZZhJhG"],
  ["Sofia", "Rossi", "Head of Design Systems", "Design systems and platform front-ends", "NYC", 2, 7, 5, 0, "riskier", 800, "ACwAAL1UdXIB3xRrrRd4t5tT15uuuiIpAaKkH"],
  ["Nathan", "Cole", "Staff Engineer, Fraud Detection ML", "Real-time fraud scoring at 30ms p99", "Phoenix", 2, 9, 4, 6, "safe", 520, "ACwAAM2VeYIB4ySssSe5u6uU26vvvjJqBbLiI"],
  ["Uma", "Patel", "Director, Enterprise Data Strategy", "Enterprise data strategy and the data operating model", "NYC", 5, 8, 19, 4, "safe", 1450, "ACwAAN3WfZIB5zTttTf6v7vV37wwwkKrCcMjJ"],
  ["Lucas", "Meyer", "Senior Site Reliability Engineer", "SRE for the merchant platform", "Fort Lauderdale", 1, 2, 6, 5, "", 310, "ACwAAO4XgAIB6aUuuUg7w8wW48xxxlLsDdNkK"],
  ["Christina", "Yang", "Legal Counsel, Data Privacy", "Global data privacy counsel for technology programs", "NYC", 2, 4, 6, 1, "safe", 530, "ACwAAP5YhBIB7bVvvVh8x9xX59yyyfMtEeOlL"],
  ["Erik", "Johansson", "VP, Merchant Platform Engineering", "Merchant-facing digital products and APIs", "Phoenix", 3, 5, 11, 8, "safe", 2050, "ACwAAQ6ZiCIB8cWwwWi9y0yY60zzznNuFfPmM"],
];

const LOCATIONS = {
  NYC: "New York, New York, United States",
  Phoenix: "Phoenix, Arizona, United States",
  "Salt Lake City": "Salt Lake City, Utah, United States",
  "Fort Lauderdale": "Fort Lauderdale, Florida, United States",
};

let uidCounter = 0;

function rowFor(p) {
  const [first, last, title, headline, loc, rY, rM, cY, cM, emailStatus, connections, liUid] = p;
  const location = LOCATIONS[loc];
  const email = emailStatus === "" ? "" : `${first.toLowerCase().replace(/['-]/g, "")}.${last.toLowerCase().replace(/['-]/g, "")}@aexp.com`;
  const row = {
    ...BASE,
    ...COMPANY,
    "First Name": first,
    "Last Name": last,
    "Full Name": `${first} ${last}`,
    "Current Job": title,
    "Profile Headline": headline,
    "Profile Summary": `${headline}. ${title} at American Express focused on ${title.toLowerCase().replace(/^(svp|vp|director|senior manager|manager|staff engineer|principal engineer|distinguished engineer|senior architect|senior engineer|senior data engineer|senior site reliability engineer|senior counsel|legal counsel|engineering director|engineering manager|deputy ciso|agile coach|procurement director|head of design systems)[,]?\s*/i, "delivery")} for the enterprise.`,
    "Job Description": "",
    "Email": email,
    "Email Status": emailStatus,
    "Linkedin URL Public": `https://www.linkedin.com/in/${first.toLowerCase().replace(/['-]/g, "")}-${last.toLowerCase().replace(/['-]/g, "")}`,
    "Linkedin URL Unique ID": `https://www.linkedin.com/in/${liUid}`,
    "Sales Navigator URL": `https://www.linkedin.com/sales/lead/${liUid}`,
    "Location": location,
    "Connections": String(connections),
    "Profile Picture": connections > 400 ? `https://media.licdn.com/dms/image/v2/D56${uidCounter}AQ/${first.slice(0, 4).toLowerCase()}${last.slice(0, 4).toLowerCase()}/profile.jpg` : "",
    "Years in Position": String(rY),
    "Months in Position": String(rM),
    "Years in Company": String(cY),
    "Months in Company": String(cM),
    "Total Positions Count": String(Math.min(9, cY + 2)),
  };
  return HEADERS.reduce((acc, h) => ({ ...acc, [h]: row[h] ?? "" }), {});
}

const rows = PEOPLE.map(rowFor);
// A duplicate row (same LinkedIn ID) exercises the in-file dedupe → "unchanged".
rows.push({ ...rows[0], "Profile Headline": "SVP, Enterprise Data & AI Platforms at American Express" });

const csvEscape = (v) => {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = [HEADERS.join(","), ...rows.map((r) => HEADERS.map((h) => csvEscape(r[h])).join(","))].join("\n");

const outDir = join(import.meta.dirname, "..", "sample-data");
mkdirSync(outDir, { recursive: true });
const out = join(outDir, "amex_leads_10_7_2026.csv");
writeFileSync(out, csv);
console.log(`Wrote ${rows.length} rows to ${out}`);
console.log("Change agents (short role, long company):", PEOPLE.filter((p) => p[5] * 12 + p[6] <= 12 && p[7] * 12 + p[8] >= 36).map((p) => `${p[0]} ${p[1]}`).join(", "));
