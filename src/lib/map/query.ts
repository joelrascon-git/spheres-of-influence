import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildFilter, type Facets } from "@/lib/search/parse";
import type { MapPerson } from "@/lib/map/pins";

const MAP_COLUMNS =
  "id, full_name, title, avatar_path, email, location, location_city, location_region, location_country, location_lat, location_lng, account_id, org_id, influence_score, is_key, statuses, personas, seniority_level";

/**
 * The same boolean query and facet filtering as the contacts page, but every
 * match — not one page — and only the columns the map needs, so pins, the
 * cohort list and copy-emails all describe the same set of people.
 */
export async function searchMapPeople(
  supabase: SupabaseClient,
  { query, facets, limit = 2000 }: { query: string; facets: Facets; limit?: number },
): Promise<{ people: MapPerson[]; total: number; error?: string }> {
  const filter = buildFilter(query, facets);
  const { data: hits, error } = await supabase.rpc("search_contacts", {
    p_filter: filter,
    p_sort: "default",
    p_limit: limit,
    p_offset: 0,
  });
  if (error) return { people: [], total: 0, error: error.message };
  const rows = (hits ?? []) as { id: string; total: number }[];
  const total = Number(rows[0]?.total ?? 0);
  const ids = rows.map((r) => r.id);
  if (ids.length === 0) return { people: [], total };
  const { data } = await supabase.from("contacts").select(MAP_COLUMNS).in("id", ids);
  const byId = new Map((data ?? []).map((r) => [r.id, r as MapPerson]));
  return { people: ids.map((id) => byId.get(id)).filter(Boolean) as MapPerson[], total };
}
