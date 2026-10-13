import { describe, expect, it } from "vitest";
import Papa from "papaparse";
import {
  emailQualityFromProvider,
  inferSeniority,
  linkedinIdFromUrl,
  mapEvabootRow,
  missingHeaders,
  parseHeadcounts,
  repairMojibake,
} from "@/lib/import/evaboot";
import { planImport, type ExistingContact } from "@/lib/import/plan";
import { normalizeLocationQuery, placeFromPhoton } from "@/lib/geocode";
import { EVABOOT_HEADERS, HAROLD, ROBERT } from "./fixtures";

const EXPORT = "2026-08-24";

describe("mapEvabootRow", () => {
  const c = mapEvabootRow(ROBERT, EXPORT);

  it("maps identity and profile fields", () => {
    expect(c.linkedin_uid).toBe("ACwAAACEwrgBHZwFjLEdlttsSziRY1lQxSj4z3g");
    expect(c.first_name).toBe("Robert");
    expect(c.title).toBe("Data Platform Architect");
    expect(c.headline).toBe("Enterprise Data Architect");
    expect(c.location).toBe("Glendale, Arizona, United States");
    expect(c.connections).toBe(619);
    expect(c.is_open_profile).toBe(false);
  });

  it("treats NA and blanks as missing", () => {
    expect(mapEvabootRow(HAROLD, EXPORT).summary).toBeNull();
    expect(c.job_description).toBeNull();
  });

  it("repairs mis-decoded bullets", () => {
    expect(c.summary).toContain("•");
    expect(repairMojibake("plain text")).toBe("plain text");
    expect(repairMojibake("Caf\u00c3\u00a9")).toBe("Café");
  });

  it("derives start dates for live tenure", () => {
    expect(c.role_start).toBe("2017-01-24");
    expect(mapEvabootRow(HAROLD, EXPORT).company_start).toBe("2022-06-24");
  });

  it("maps company firmographics", () => {
    expect(c.company.name).toBe("Carvana");
    expect(c.company.domain).toBe("carvana.com");
    expect(c.company.linkedin_company_id).toBe("3143455");
    expect(c.company.employee_count).toBe(8398);
    expect(c.company.department_headcounts.Engineering).toBe(670);
    expect(c.company.employee_growth).toEqual({ "6m": 4, "1y": 11, "2y": 24 });
  });

  it("is tolerant of header casing", () => {
    const lower = Object.fromEntries(Object.entries(ROBERT).map(([k, v]) => [k.toLowerCase(), v]));
    expect(mapEvabootRow(lower, EXPORT).linkedin_uid).toBe(c.linkedin_uid);
  });
});

describe("helpers", () => {
  it("extracts LinkedIn ids", () => {
    expect(linkedinIdFromUrl("https://www.linkedin.com/sales/lead/ACwAAB,NAME_SEARCH")).toBe("ACwAAB");
    expect(linkedinIdFromUrl("not a url")).toBeNull();
  });
  it("parses department headcounts", () => {
    expect(parseHeadcounts("Legal: 259\nSales: 1,446")).toEqual({ Legal: 259, Sales: 1446 });
  });
  it("infers seniority from titles", () => {
    expect(inferSeniority("Sr. Manager Data Engineering, Analytics")).toBe("manager");
    expect(inferSeniority("SVP, Engineering")).toBe("vp");
    expect(inferSeniority("Chief Technology Officer")).toBe("c_level");
    expect(inferSeniority("Head of Data")).toBe("director");
    expect(inferSeniority("Principal Data Engineer")).toBe("ic");
  });
  it("maps Evaboot email status to a quality dot", () => {
    expect(emailQualityFromProvider("safe")).toBe("good");
    expect(emailQualityFromProvider("riskier")).toBe("questionable");
    expect(emailQualityFromProvider(null)).toBeNull();
  });
  it("detects missing required headers", () => {
    expect(missingHeaders(EVABOOT_HEADERS)).toEqual([]);
    expect(missingHeaders(["Email"])).toEqual(["First Name", "Last Name"]);
  });
  it("round-trips a real CSV with multiline cells", () => {
    const csv = Papa.unparse([ROBERT, HAROLD], { columns: EVABOOT_HEADERS });
    const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true });
    expect(parsed.data).toHaveLength(2);
    expect(mapEvabootRow(parsed.data[1], EXPORT).company.department_headcounts.Engineering).toBe(670);
  });
});

describe("planImport", () => {
  const robert = mapEvabootRow(ROBERT, EXPORT);
  const existing: ExistingContact = {
    id: "c1",
    account_id: "acct",
    linkedin_uid: robert.linkedin_uid,
    email: "robert.mason@carvana.com",
    first_name: "Robert",
    last_name: "Mason",
    statuses: ["Working"],
    title: "Data Platform Architect",
    headline: "Enterprise Data Architect",
    summary: robert.summary,
    job_description: null,
    location: "Glendale, Arizona, United States",
    linkedin_public_url: robert.linkedin_public_url,
    role_start: "2017-02-10",
    company_start: robert.company_start,
  };

  it("creates unseen contacts", () => {
    expect(planImport([{ contact: robert, accountId: "acct" }], [])[0].action).toBe("create");
  });

  it("marks identical rows unchanged, tolerating start-date drift", () => {
    const [item] = planImport([{ contact: robert, accountId: "acct" }], [existing]);
    expect(item.action).toBe("unchanged");
    expect(item.matchReason).toBe("LinkedIn ID");
  });

  it("reports changed LinkedIn fields only", () => {
    const promoted = { ...robert, title: "Chief Data Architect", role_start: "2026-06-24" };
    const [item] = planImport([{ contact: promoted, accountId: "acct" }], [existing]);
    expect(item.action).toBe("update");
    expect(item.diff.map((d) => d.field)).toEqual(["title", "role_start"]);
  });

  it("never erases data with blanks and protects a seller-set email", () => {
    const blank = { ...robert, headline: null, email: "rmason@carvana.com" };
    const [item] = planImport([{ contact: blank, accountId: "acct" }], [existing]);
    expect(item.diff.find((d) => d.field === "headline")).toBeUndefined();
    expect(item.diff.find((d) => d.field === "email")?.defaultAccept).toBe(false);
  });

  it("flags a company change", () => {
    const [item] = planImport([{ contact: robert, accountId: "other" }], [existing]);
    expect(item.diff.find((d) => d.field === "company")).toBeTruthy();
  });

  it("matches by email when the LinkedIn id is missing", () => {
    const noUid = { ...robert, linkedin_uid: null };
    expect(planImport([{ contact: noUid, accountId: "acct" }], [existing])[0].matchReason).toBe("Email");
  });

  it("sends same-name, different-id rows to review", () => {
    const other = {
      ...robert,
      linkedin_uid: "ACwOTHER",
      email: null,
      linkedin_public_url: "https://www.linkedin.com/in/robert-m-mason-ii",
    };
    const [item] = planImport([{ contact: other, accountId: "acct" }], [existing]);
    expect(item.action).toBe("review");
    expect(item.candidateContactIds).toEqual(["c1"]);
  });
  it("matches by public profile URL when the LinkedIn id differs", () => {
    const moved = { ...robert, linkedin_uid: "ACwNEW", email: null, title: "VP, Data Architecture" };
    const [item] = planImport([{ contact: moved, accountId: "acct" }], [existing]);
    expect(item.matchReason).toBe("Public profile URL");
    expect(item.action).toBe("update");
    expect(item.diff.map((d) => d.field)).toEqual(["title"]);
  });

  it("skips duplicate rows within one file", () => {
    const items = planImport(
      [
        { contact: robert, accountId: "acct" },
        { contact: robert, accountId: "acct" },
      ],
      [],
    );
    expect(items.map((i) => i.action)).toEqual(["create", "unchanged"]);
  });
});

describe("geocode helpers", () => {
  it("normalizes LinkedIn metro names", () => {
    expect(normalizeLocationQuery("Greater Phoenix Area")).toBe("Phoenix");
    expect(normalizeLocationQuery("San Francisco Bay Area")).toBe("San Francisco");
    expect(normalizeLocationQuery("Dallas-Fort Worth Metroplex")).toBe("Dallas-Fort Worth");
    expect(normalizeLocationQuery("Phoenix, Arizona, United States")).toBe("Phoenix, Arizona, United States");
  });
  it("builds labels from Photon features", () => {
    expect(
      placeFromPhoton({
        geometry: { coordinates: [-112.07, 33.44] },
        properties: { name: "Phoenix", state: "Arizona", country: "United States", type: "city" },
      }),
    ).toEqual({ label: "Phoenix, Arizona, United States", lat: 33.44, lng: -112.07, city: "Phoenix", region: "Arizona", country: "United States" });
  });
});
