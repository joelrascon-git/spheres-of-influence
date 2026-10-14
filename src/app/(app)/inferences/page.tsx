import Link from "next/link";
import { PageHeader, EmptyState } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { describeInferenceValue } from "@/lib/inference/apply";
import { INFERENCE_KINDS } from "@/lib/inference/queue";
import { RESEARCH_CONFIDENCE } from "@/lib/constants";
import type { Inference } from "@/lib/types";
import { cn } from "@/lib/utils";
import { InferenceCard, type InferenceCardData } from "./inference-card";
import { BulkAcceptButton } from "./inference-bulk";

const PAGE_SIZE = 100;

type Params = Record<string, string | string[] | undefined>;

const one = (p: Params, k: string) => {
  const v = p[k];
  return (Array.isArray(v) ? v[0] : v) ?? "";
};

/** Filter pill that toggles one search param, server-rendered. */
function FilterPill({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-7 items-center rounded-full border px-2.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground",
        active && "border-primary/50 bg-primary/10 text-foreground",
      )}
    >
      {label}
    </Link>
  );
}

function buildHref(current: Params, patch: Record<string, string>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(current)) {
    const val = Array.isArray(v) ? v[0] : v;
    if (val) p.set(k, val);
  }
  for (const [k, v] of Object.entries(patch)) {
    if (v) p.set(k, v);
    else p.delete(k);
  }
  const qs = p.toString();
  return `/inferences${qs ? `?${qs}` : ""}`;
}

export default async function InferencesPage({ searchParams }: PageProps<"/inferences">) {
  const { supabase } = await requireUser();
  const params = await searchParams;
  const kind = one(params, "kind");
  const conf = one(params, "conf");
  const src = one(params, "src");
  const status = one(params, "status") || "pending";

  let q = supabase
    .from("inferences")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);
  if (kind) q = q.eq("kind", kind);
  if (conf) q = q.eq("confidence", conf);
  if (src) q = q.eq("source", src);
  q = q.eq("status", status);
  const { data, count } = await q;
  const rows = (data ?? []) as Inference[];

  // Counts for the status switcher and the confirmed-bulk button.
  const [{ count: pendingCount }, { count: acceptedCount }, { count: rejectedCount }, { count: confirmedCount }] =
    await Promise.all([
      supabase.from("inferences").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("inferences").select("id", { count: "exact", head: true }).eq("status", "accepted"),
      supabase.from("inferences").select("id", { count: "exact", head: true }).eq("status", "rejected"),
      supabase.from("inferences").select("id", { count: "exact", head: true }).eq("status", "pending").eq("confidence", "confirmed"),
    ]);

  // Resolve subject names and links, batched per subject type.
  const byType = new Map<string, string[]>();
  for (const r of rows) {
    const list = byType.get(r.subject_type) ?? [];
    list.push(r.subject_id);
    byType.set(r.subject_type, list);
  }
  const labelById = new Map<string, { label: string; href: string | null }>();
  const idsOf = (t: string) => [...new Set(byType.get(t) ?? [])];

  if (idsOf("contact").length) {
    const { data: cs } = await supabase.from("contacts").select("id, full_name, title").in("id", idsOf("contact"));
    for (const c of cs ?? []) labelById.set(c.id, { label: c.title ? `${c.full_name} · ${c.title}` : c.full_name, href: `/contacts/${c.id}` });
  }
  if (idsOf("account").length) {
    const { data: as } = await supabase.from("accounts").select("id, name").in("id", idsOf("account"));
    for (const a of as ?? []) labelById.set(a.id, { label: a.name, href: `/accounts/${a.id}` });
  }
  if (idsOf("org").length) {
    const { data: os } = await supabase.from("orgs").select("id, name, account_id").in("id", idsOf("org"));
    for (const o of os ?? []) labelById.set(o.id, { label: o.name, href: o.account_id ? `/accounts/${o.account_id}` : null });
  }
  if (idsOf("initiative").length) {
    const { data: is } = await supabase.from("initiatives").select("id, code, name, account_id").in("id", idsOf("initiative"));
    for (const i of is ?? []) labelById.set(i.id, { label: `${i.code} · ${i.name}`, href: i.account_id ? `/accounts/${i.account_id}` : null });
  }
  if (idsOf("challenge").length) {
    const { data: chs } = await supabase.from("challenges").select("id, code, name, account_id").in("id", idsOf("challenge"));
    for (const c of chs ?? []) labelById.set(c.id, { label: `${c.code} · ${c.name}`, href: c.account_id ? `/accounts/${c.account_id}` : null });
  }

  const cards: InferenceCardData[] = rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    description: describeInferenceValue(r.kind, r.value),
    confidence: r.confidence,
    source: r.source,
    subjectLabel: labelById.get(r.subject_id)?.label ?? `${r.subject_type} (deleted?)`,
    subjectHref: labelById.get(r.subject_id)?.href ?? null,
    rationale: r.rationale,
    evidence: (r.evidence ?? []) as InferenceCardData["evidence"],
    status: r.status,
    undoable: r.status === "accepted" && !!r.undo,
  }));

  const statusCounts: Record<string, number | null> = {
    pending: pendingCount,
    accepted: acceptedCount,
    rejected: rejectedCount,
  };

  return (
    <div className="flex min-h-screen flex-col">
      <PageHeader
        title="Review queue"
        description="Every AI and import proposal waits here — accepting writes it through to the record, rejecting keeps the audit trail."
        actions={
          status === "pending" ? (
            <BulkAcceptButton filter={{ kind: kind || undefined, source: src || undefined, confidence: "confirmed" }} confirmedCount={confirmedCount ?? 0} />
          ) : undefined
        }
      />

      <div className="space-y-2 border-b px-6 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(["pending", "accepted", "rejected"] as const).map((s) => (
            <FilterPill
              key={s}
              href={buildHref(params, { status: s === "pending" ? "" : s })}
              label={`${s[0].toUpperCase()}${s.slice(1)} (${statusCounts[s] ?? 0})`}
              active={status === s}
            />
          ))}
          <span className="mx-1 h-4 w-px bg-border" />
          <FilterPill href={buildHref(params, { kind: "" })} label="All kinds" active={!kind} />
          {INFERENCE_KINDS.map((k) => (
            <FilterPill key={k} href={buildHref(params, { kind: k })} label={k.replaceAll("_", " ")} active={kind === k} />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <FilterPill href={buildHref(params, { conf: "" })} label="Any confidence" active={!conf} />
          {RESEARCH_CONFIDENCE.map((c) => (
            <FilterPill key={c.value} href={buildHref(params, { conf: c.value })} label={c.label} active={conf === c.value} />
          ))}
          <span className="mx-1 h-4 w-px bg-border" />
          <FilterPill href={buildHref(params, { src: "" })} label="Any source" active={!src} />
          {["research", "import", "ai", "manual"].map((s) => (
            <FilterPill key={s} href={buildHref(params, { src: s })} label={s[0].toUpperCase() + s.slice(1)} active={src === s} />
          ))}
        </div>
      </div>

      <div className="flex-1 px-6 pb-10">
        {cards.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title={count === 0 ? "Nothing to review" : "No proposals match these filters"}
              description={
                count === 0
                  ? "When the AI brief, import enrichment or research extraction propose changes, they land here for a human decision."
                  : "Try clearing a filter, or switch back to Pending."
              }
            />
          </div>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
            {cards.map((c) => (
              <InferenceCard key={c.id} data={c} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
