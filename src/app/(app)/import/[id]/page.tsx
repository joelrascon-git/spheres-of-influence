import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { integrations } from "@/lib/env";
import type { FieldDiff } from "@/lib/import/plan";
import { REVIEW_GROUPS } from "../review-groups";
import { ImportReview, type ReviewItem } from "./import-review";

const PAGE_SIZE = 50;

const ITEM_COLUMNS =
  "id, row_index, linkedin_uid, full_name, action, match_reason, matched_contact_id, candidate_contact_ids, payload, diff, decision, merge_into_contact_id, applied_contact_id, error";

type ItemRow = {
  id: string;
  row_index: number;
  linkedin_uid: string | null;
  full_name: string | null;
  action: ReviewItem["action"];
  match_reason: string | null;
  matched_contact_id: string | null;
  candidate_contact_ids: string[];
  payload: { contact: { title: string | null; location: string | null; email: string | null; first_name: string; last_name: string }; account_id: string | null };
  diff: FieldDiff[];
  decision: ReviewItem["decision"];
  merge_into_contact_id: string | null;
  applied_contact_id: string | null;
  error: string | null;
};

const CONTACT_REF = "id, full_name, title";

/** Names for the accounts, matches and candidates this page of rows refers to. */
async function enrichItems(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  rawItems: ItemRow[],
): Promise<ReviewItem[]> {
  if (!rawItems.length) return [];
  const accountIds = new Set<string>();
  const contactIds = new Set<string>();
  for (const it of rawItems) {
    if (it.payload.account_id) accountIds.add(it.payload.account_id);
    if (it.matched_contact_id) contactIds.add(it.matched_contact_id);
    if (it.merge_into_contact_id) contactIds.add(it.merge_into_contact_id);
    for (const cid of it.candidate_contact_ids ?? []) contactIds.add(cid);
    for (const d of it.diff ?? []) {
      if (d.field === "company") {
        if (d.before) accountIds.add(d.before);
        if (d.after) accountIds.add(d.after);
      }
    }
  }
  const accountName = new Map<string, string>();
  if (accountIds.size) {
    const { data } = await supabase.from("accounts").select("id, name").in("id", [...accountIds]);
    for (const a of data ?? []) accountName.set(a.id as string, a.name as string);
  }
  const refById = new Map<string, { full_name: string; title: string | null }>();
  const ids = [...contactIds];
  for (let i = 0; i < ids.length; i += 400) {
    const { data: refs } = await supabase.from("contacts").select(CONTACT_REF).in("id", ids.slice(i, i + 400));
    for (const r of refs ?? []) refById.set(r.id as string, { full_name: r.full_name as string, title: r.title as string | null });
  }

  return rawItems.map((it) => ({
    id: it.id,
    rowIndex: it.row_index,
    fullName: it.full_name ?? `${it.payload.contact.first_name} ${it.payload.contact.last_name}`.trim(),
    title: it.payload.contact?.title ?? null,
    companyName: it.payload.account_id ? (accountName.get(it.payload.account_id) ?? null) : null,
    location: it.payload.contact?.location ?? null,
    email: it.payload.contact?.email ?? null,
    linkedinUid: it.linkedin_uid,
    action: it.action,
    matchReason: it.match_reason,
    matchedContactId: it.matched_contact_id,
    matchedName: it.matched_contact_id ? (refById.get(it.matched_contact_id)?.full_name ?? null) : null,
    mergeIntoName: it.merge_into_contact_id ? (refById.get(it.merge_into_contact_id)?.full_name ?? null) : null,
    decision: it.decision,
    candidateIds: it.candidate_contact_ids ?? [],
    candidates: (it.candidate_contact_ids ?? []).map((cid) => {
      const ref = refById.get(cid);
      return { id: cid, label: ref ? (ref.title ? `${ref.full_name} — ${ref.title}` : ref.full_name) : "Unknown contact" };
    }),
    diff: (it.diff ?? []).map((d) => ({
      field: d.field,
      label: d.label,
      before: d.before,
      after: d.after,
      beforeDisplay:
        d.field === "company" ? (accountName.get(d.before ?? "") ?? d.before ?? "") : (d.before ?? ""),
      afterDisplay:
        d.field === "company" ? (accountName.get(d.after ?? "") ?? d.after ?? "") : (d.after ?? ""),
      defaultAccept: d.defaultAccept,
      accept: (d as { accept?: boolean }).accept,
      note: d.note,
    })),
    error: it.error,
    appliedContactId: it.applied_contact_id,
  }));
}

export default async function ImportReviewPage({ params, searchParams }: PageProps<"/import/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const { supabase } = await requireUser();

  const { data: batch } = await supabase
    .from("import_batches")
    .select("id, file_name, export_date, status")
    .eq("id", id)
    .maybeSingle();
  if (!batch) notFound();

  const props = {
    batchId: batch.id,
    fileName: batch.file_name ?? "Untitled",
    exportDate: batch.export_date,
    status: batch.status,
    aiEnabled: integrations.anthropic(),
  };
  const countQuery = () =>
    supabase.from("import_items").select("id", { count: "exact", head: true }).eq("batch_id", id);

  if (batch.status === "discarded") {
    return (
      <ImportReview {...props} items={[]} tabs={[]} activeGroup="update" page={1} pageCount={1}
        totals={{ rows: 0, pendingReview: 0, toApply: 0 }} />
    );
  }

  if (batch.status === "applied") {
    const [total, touched, failed, errorRows] = await Promise.all([
      countQuery(),
      countQuery().filter("applied_contact_id", "not.is", null),
      countQuery().filter("error", "not.is", null).neq("action", "error"),
      supabase.from("import_items").select(ITEM_COLUMNS).eq("batch_id", id).eq("action", "error").order("row_index").limit(50),
    ]);
    return (
      <ImportReview
        {...props}
        items={await enrichItems(supabase, (errorRows.data ?? []) as unknown as ItemRow[])}
        tabs={[]}
        activeGroup="update"
        page={1}
        pageCount={1}
        totals={{ rows: total.count ?? 0, pendingReview: 0, toApply: 0 }}
        applied={{ touched: touched.count ?? 0, errors: failed.count ?? 0 }}
      />
    );
  }

  // Review or applying: counts per group drive the tabs, the bulk actions and pagination.
  // Group filters are applied with concrete-typed loops (not a generic helper) so
  // supabase's deep column types stay out of type inference.
  const groupCounts = await Promise.all(
    REVIEW_GROUPS.map(async (g) => {
      let q = countQuery();
      for (const [column, value] of g.eq ?? []) q = q.eq(column, value);
      for (const [column, value] of g.neq ?? []) q = q.neq(column, value);
      if (g.or) q = q.or(g.or);
      return (await q).count ?? 0;
    }),
  );
  const [rows, pendingReview] = await Promise.all([
    countQuery().then((r) => r.count ?? 0),
    countQuery().eq("action", "review").eq("decision", "pending").then((r) => r.count ?? 0),
  ]);
  const countByGroup = new Map(REVIEW_GROUPS.map((g, i) => [g.key as string, groupCounts[i]]));
  const requested = typeof sp.group === "string" ? sp.group : null;
  const spec =
    REVIEW_GROUPS.find((g) => g.key === requested) ??
    REVIEW_GROUPS.find((g) => (countByGroup.get(g.key) ?? 0) > 0) ??
    REVIEW_GROUPS[0];
  const groupCount = countByGroup.get(spec.key) ?? 0;
  const pageCount = Math.max(1, Math.ceil(groupCount / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(sp.page) || 1), pageCount);
  const from = (page - 1) * PAGE_SIZE;

  const itemsQuery = supabase.from("import_items").select(ITEM_COLUMNS).eq("batch_id", id);
  const filteredItems = (() => {
    let q = itemsQuery;
    for (const [column, value] of spec.eq ?? []) q = q.eq(column, value);
    for (const [column, value] of spec.neq ?? []) q = q.neq(column, value);
    if (spec.or) q = q.or(spec.or);
    return q;
  })();
  const { data: rawItems } = await filteredItems.order("row_index").range(from, from + PAGE_SIZE - 1);
  const items = await enrichItems(supabase, (rawItems ?? []) as unknown as ItemRow[]);

  const toApply = (["update", "create", "unchanged"] as const).reduce(
    (sum, k) => sum + (countByGroup.get(k) ?? 0),
    0,
  );

  return (
    <ImportReview
      {...props}
      items={items}
      tabs={REVIEW_GROUPS.map((g) => ({ key: g.key, label: g.label, count: countByGroup.get(g.key) ?? 0 }))}
      activeGroup={spec.key}
      hint={spec.hint}
      page={page}
      pageCount={pageCount}
      totals={{ rows, pendingReview, toApply }}
    />
  );
}
