import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { DEFAULT_STATUSES, PERSONA_CODES } from "@/lib/constants";
import { getFieldDefs, listAccounts, listOrgs, listTags } from "@/lib/data";
import { searchMapPeople } from "@/lib/map/query";
import { facetsFromParams } from "@/lib/search/url";
import { MapView } from "./map-view";

/**
 * The literal world map: every contact pinned by their geocoded location, with
 * the same boolean search and facet cohort-building as the contacts page. State
 * lives in the URL, so "who's in Phoenix" is a shareable link.
 */
export default async function MapPage({ searchParams }: PageProps<"/map">) {
  const { supabase } = await requireUser();
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const facets = facetsFromParams(params);

  const [result, accounts, orgs, tags, fields, cityRows] = await Promise.all([
    searchMapPeople(supabase, { query, facets }),
    listAccounts(supabase),
    listOrgs(supabase),
    listTags(supabase),
    getFieldDefs(supabase, "contact"),
    supabase.from("contacts").select("location_city").not("location_city", "is", null).limit(10000),
  ]);
  const cities = [...new Set((cityRows.data ?? []).map((r) => r.location_city as string))].sort();
  const personaOptions = fields.find((f) => f.key === "personas")?.options ?? PERSONA_CODES.map((p) => p.code);
  const statusOptions = fields.find((f) => f.key === "statuses")?.options ?? DEFAULT_STATUSES;

  return (
    <div className="flex h-screen flex-col">
      <PageHeader
        title="Map"
        description="Where every contact is, on one world map. Filter a location cohort for a regional dinner, an event, or a trip."
      />
      <MapView
        query={query}
        facets={facets}
        people={result.people}
        total={result.total}
        error={result.error}
        accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
        orgs={orgs.map((o) => ({ id: o.id, name: o.name, account_id: o.account_id }))}
        tags={tags}
        personas={personaOptions}
        statuses={statusOptions}
        cities={cities}
      />
    </div>
  );
}
