import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildFilter, type Facets } from "@/lib/search/parse";
import type { MapPerson } from "@/lib/map/pins";

const MAP_COLUMNS =
  "id, full_name, title, avatar_path, email, location, location_city, location_region, location_country, location_lat, location_lng, account_id, org_id, influence_score, is_key, statuses, personas, seniority_level";
const ID_BATCH = 150;

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
  // Hundreds of UUIDs in one `in()` filter overflow the REST URL limit and the
  // request fails outright, so fetch the details in batches.
  const batches: string[][] = [];
  for (let i = 0; i < ids.length; i += ID_BATCH) batches.push(ids.slice(i, i + ID_BATCH));
  const results = await Promise.all(
    batches.map((batch) => supabase.from("contacts").select(MAP_COLUMNS).in("id", batch)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return { people: [], total, error: failed.error.message };
  const byId = new Map(results.flatMap((r) => r.data ?? []).map((r) => [r.id as string, r as unknown as MapPerson]));
  return { people: ids.map((id) => byId.get(id)).filter(Boolean) as MapPerson[], total };
}
