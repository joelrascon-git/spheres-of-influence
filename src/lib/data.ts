import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Account, Contact, FieldDefinition, Influence, Note, Org, Tag } from "@/lib/types";

/** Columns needed to render lists and pickers; avoids pulling long profile text for 10k rows. */
export const CONTACT_LIST_COLUMNS =
  "id, account_id, org_id, first_name, last_name, full_name, title, headline, location, location_city, avatar_path, email, email_quality, phone, phone_quality, seniority, is_key, personas, statuses, last_contacted, reports_to_id, reports_to_confidence, role_start, company_start, updated_at, linkedin_uid";

export type ContactListItem = Pick<
  Contact,
  | "id"
  | "account_id"
  | "org_id"
  | "first_name"
  | "last_name"
  | "full_name"
  | "title"
  | "headline"
  | "location"
  | "location_city"
  | "avatar_path"
  | "email"
  | "email_quality"
  | "phone"
  | "phone_quality"
  | "seniority"
  | "is_key"
  | "personas"
  | "statuses"
  | "last_contacted"
  | "reports_to_id"
  | "reports_to_confidence"
  | "role_start"
  | "company_start"
  | "updated_at"
  | "linkedin_uid"
>;

export type ContactRef = Pick<Contact, "id" | "full_name" | "title" | "avatar_path" | "account_id" | "statuses">;

export async function listAccounts(supabase: SupabaseClient) {
  const { data } = await supabase.from("accounts").select("*").order("name");
  return (data ?? []) as Account[];
}

export async function listOrgs(supabase: SupabaseClient, accountIds?: string[]) {
  let q = supabase.from("orgs").select("*").order("sort_order").order("name");
  if (accountIds?.length) q = q.in("account_id", accountIds);
  const { data } = await q;
  return (data ?? []) as Org[];
}

export async function listTags(supabase: SupabaseClient) {
  const { data } = await supabase.from("tags").select("*").order("name");
  return (data ?? []) as Tag[];
}

export async function listTagCounts(supabase: SupabaseClient) {
  const { data } = await supabase.from("contact_tags").select("tag_id");
  const counts = new Map<string, number>();
  for (const r of data ?? []) counts.set(r.tag_id, (counts.get(r.tag_id) ?? 0) + 1);
  return counts;
}

export async function getFieldDefs(supabase: SupabaseClient, entity?: FieldDefinition["entity"]) {
  let q = supabase.from("field_definitions").select("*").order("sort_order");
  if (entity) q = q.eq("entity", entity);
  const { data } = await q;
  return (data ?? []) as FieldDefinition[];
}

export async function getContact(supabase: SupabaseClient, id: string) {
  const { data } = await supabase.from("contacts").select("*").eq("id", id).maybeSingle();
  return data as Contact | null;
}

/** Light refs for every contact in the given accounts, for pickers (reports-to, influence). */
export async function listContactRefs(supabase: SupabaseClient, accountIds?: (string | null)[]) {
  const ids = (accountIds ?? []).filter(Boolean) as string[];
  let q = supabase.from("contacts").select("id, full_name, title, avatar_path, account_id, statuses").order("last_name").limit(10000);
  if (ids.length) q = q.in("account_id", ids);
  const { data } = await q;
  return (data ?? []) as ContactRef[];
}

export async function getContactRelations(supabase: SupabaseClient, id: string) {
  const [notes, tagLinks, influencesOut, influencesIn, reports] = await Promise.all([
    supabase.from("notes").select("*").eq("contact_id", id).order("created_at", { ascending: false }),
    supabase.from("contact_tags").select("tag_id").eq("contact_id", id),
    supabase.from("influences").select("*").eq("from_contact_id", id),
    supabase.from("influences").select("*").eq("to_contact_id", id),
    supabase.from("contacts").select("id, full_name, title, avatar_path, account_id, statuses").eq("reports_to_id", id).order("last_name"),
  ]);
  return {
    notes: (notes.data ?? []) as Note[],
    tagIds: (tagLinks.data ?? []).map((t) => t.tag_id as string),
    influences: (influencesOut.data ?? []) as Influence[],
    influencedBy: (influencesIn.data ?? []) as Influence[],
    directReports: (reports.data ?? []) as ContactRef[],
  };
}

export async function logActivity(
  supabase: SupabaseClient,
  entity: string,
  entityId: string,
  action: string,
  changes: Record<string, unknown> = {},
  source = "manual",
) {
  await supabase.from("activity_log").insert({ entity, entity_id: entityId, action, changes, source });
}
