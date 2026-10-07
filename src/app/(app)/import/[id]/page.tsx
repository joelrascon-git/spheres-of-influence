import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import type { FieldDiff } from "@/lib/import/plan";
import { ImportReview, type ReviewItem } from "./import-review";

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

export default async function ImportReviewPage({ params }: PageProps<"/import/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();

  const { data: batch } = await supabase
    .from("import_batches")
    .select("id, file_name, export_date, status")
    .eq("id", id)
    .maybeSingle();
  if (!batch) notFound();

  const [{ data: rawItems }, { data: accountRows }] = await Promise.all([
    supabase.from("import_items").select(ITEM_COLUMNS).eq("batch_id", id).order("row_index"),
    supabase.from("accounts").select("id, name"),
  ]);
  const accountName = new Map((accountRows ?? []).map((a) => [a.id as string, a.name as string]));

  // Names for matched contacts, merge targets and ambiguous candidates.
  const interestingIds = new Set<string>();
  for (const it of (rawItems ?? []) as ItemRow[]) {
    if (it.matched_contact_id) interestingIds.add(it.matched_contact_id);
    if (it.merge_into_contact_id) interestingIds.add(it.merge_into_contact_id);
    for (const cid of it.candidate_contact_ids ?? []) interestingIds.add(cid);
  }
  const refById = new Map<string, { full_name: string; title: string | null }>();
  const ids = [...interestingIds];
  for (let i = 0; i < ids.length; i += 400) {
    const { data: refs } = await supabase
      .from("contacts")
      .select(CONTACT_REF)
      .in("id", ids.slice(i, i + 400));
    for (const r of refs ?? []) refById.set(r.id as string, { full_name: r.full_name as string, title: r.title as string | null });
  }

  const items: ReviewItem[] = ((rawItems ?? []) as ItemRow[]).map((it) => ({
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

  return (
    <ImportReview
      batchId={batch.id}
      fileName={batch.file_name ?? "Untitled"}
      exportDate={batch.export_date}
      status={batch.status}
      items={items}
    />
  );
}
