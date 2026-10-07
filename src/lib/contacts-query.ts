import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildFilter, type Facets } from "@/lib/search/parse";
import { CONTACT_LIST_COLUMNS, type ContactListItem } from "@/lib/data";

export type ContactSearchResult = {
  contacts: ContactListItem[];
  total: number;
  tagsByContact: Record<string, string[]>;
  error?: string;
};

export async function searchContacts(
  supabase: SupabaseClient,
  { query, facets, sort = "default", limit = 100, offset = 0 }: { query: string; facets: Facets; sort?: string; limit?: number; offset?: number },
): Promise<ContactSearchResult> {
  const filter = buildFilter(query, facets);
  const { data: hits, error } = await supabase.rpc("search_contacts", {
    p_filter: filter,
    p_sort: sort,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) return { contacts: [], total: 0, tagsByContact: {}, error: error.message };
  const ids = ((hits ?? []) as { id: string; total: number }[]).map((h) => h.id);
  const total = Number((hits as { total: number }[] | null)?.[0]?.total ?? 0);
  if (ids.length === 0) return { contacts: [], total, tagsByContact: {} };

  const [{ data: rows }, { data: links }] = await Promise.all([
    supabase.from("contacts").select(CONTACT_LIST_COLUMNS).in("id", ids),
    supabase.from("contact_tags").select("contact_id, tag_id").in("contact_id", ids),
  ]);
  const byId = new Map((rows ?? []).map((r) => [r.id, r as ContactListItem]));
  const tagsByContact: Record<string, string[]> = {};
  for (const l of links ?? []) (tagsByContact[l.contact_id] ??= []).push(l.tag_id);
  return { contacts: ids.map((id) => byId.get(id)).filter(Boolean) as ContactListItem[], total, tagsByContact };
}
