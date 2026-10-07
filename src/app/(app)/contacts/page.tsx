import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { getFieldDefs, listAccounts, listOrgs, listTags } from "@/lib/data";
import { searchContacts } from "@/lib/contacts-query";
import { facetsFromParams } from "@/lib/search/url";
import { ContactsView } from "./contacts-view";
import { NewContactButton } from "./new-contact";

const PAGE_SIZE = 100;

export default async function ContactsPage({ searchParams }: PageProps<"/contacts">) {
  const { supabase } = await requireUser();
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const sort = typeof params.sort === "string" ? params.sort : "default";
  const page = Math.max(1, Number(params.page) || 1);
  const facets = facetsFromParams(params);

  const [result, accounts, orgs, tags, fields, views, cityRows] = await Promise.all([
    searchContacts(supabase, { query, facets, sort, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
    listAccounts(supabase),
    listOrgs(supabase),
    listTags(supabase),
    getFieldDefs(supabase, "contact"),
    supabase.from("saved_views").select("id, name, query, filters").eq("surface", "contacts").order("name"),
    supabase.from("contacts").select("location_city").not("location_city", "is", null).limit(10000),
  ]);
  const cities = [...new Set((cityRows.data ?? []).map((r) => r.location_city as string))].sort();

  return (
    <div className="flex h-screen flex-col">
      <PageHeader
        title="Contacts"
        description="Search everything in every profile. Try: title:manager AND (AI OR “machine learning”) -status:“Do Not Contact”"
        actions={<NewContactButton accounts={accounts} orgs={orgs} />}
      />
      <ContactsView
        query={query}
        facets={facets}
        sort={sort}
        page={page}
        pageSize={PAGE_SIZE}
        result={result}
        accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
        orgs={orgs.map((o) => ({ id: o.id, name: o.name, account_id: o.account_id }))}
        tags={tags}
        fields={fields}
        views={(views.data ?? []) as { id: string; name: string; query: string; filters: Record<string, unknown> }[]}
        cities={cities}
      />
    </div>
  );
}
