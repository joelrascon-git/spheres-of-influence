import Papa from "papaparse";
import { format, parseISO } from "date-fns";
import { requireUser } from "@/lib/auth";
import { searchContacts } from "@/lib/contacts-query";
import { listAccounts, listOrgs, listTags } from "@/lib/data";
import { seniorityLabel } from "@/lib/constants";
import { facetsFromParams } from "@/lib/search/url";
import { tenure } from "@/lib/tenure";

/** Exports whatever the current search + filters match, not just the visible page. */
export async function GET(request: Request) {
  const { supabase } = await requireUser();
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const sort = url.searchParams.get("sort") ?? "default";
  const facets = facetsFromParams(Object.fromEntries(url.searchParams.entries()));

  const [accounts, orgs, tags] = await Promise.all([listAccounts(supabase), listOrgs(supabase), listTags(supabase)]);
  const accountName = new Map(accounts.map((a) => [a.id, a.name]));
  const orgName = new Map(orgs.map((o) => [o.id, o.name]));
  const tagName = new Map(tags.map((t) => [t.id, t.name]));

  const PAGE = 1000; // search_contacts caps the page size at 1000.
  const rows: Record<string, string>[] = [];
  for (let offset = 0; offset < 50_000; offset += PAGE) {
    const result = await searchContacts(supabase, { query, facets, sort, limit: PAGE, offset });
    for (const c of result.contacts) {
      const t = tenure(c.role_start, c.company_start);
      rows.push({
        Name: c.full_name,
        "Key Contact": c.is_key ? "Yes" : "",
        Title: c.title ?? "",
        Account: c.account_id ? (accountName.get(c.account_id) ?? "") : "",
        Org: c.org_id ? (orgName.get(c.org_id) ?? "") : "",
        Seniority: seniorityLabel(c.seniority),
        Personas: c.personas.join("; "),
        Statuses: c.statuses.join("; "),
        Tags: (result.tagsByContact[c.id] ?? []).map((id) => tagName.get(id) ?? "").join("; "),
        Email: c.email ?? "",
        "Email Quality": c.email_quality ?? "",
        Phone: c.phone ?? "",
        Location: c.location_city ?? c.location ?? "",
        "Role Tenure": t.label,
        "Role Start": c.role_start ?? "",
        "Company Start": c.company_start ?? "",
        "Last Contacted": c.last_contacted ? format(parseISO(c.last_contacted), "yyyy-MM-dd") : "",
        "Last Updated": format(parseISO(c.updated_at), "yyyy-MM-dd"),
        LinkedIn: c.linkedin_uid ? `https://www.linkedin.com/in/${c.linkedin_uid}` : "",
      });
    }
    if (result.contacts.length < PAGE) break;
  }

  const csv = Papa.unparse(rows, { newline: "\n" });
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="contacts-${format(new Date(), "yyyy-MM-dd")}.csv"`,
    },
  });
}
