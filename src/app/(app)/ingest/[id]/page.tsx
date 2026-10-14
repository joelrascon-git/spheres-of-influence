import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, ListChecks } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { describeInferenceValue } from "@/lib/inference/apply";
import { aiConfigured } from "@/lib/ai/client";
import { CALL_TYPE_LABELS, storedExtractionSchema, type CallType } from "@/lib/ingest/extract";
import type { Inference, IngestDocument } from "@/lib/types";
import { InferenceCard, type InferenceCardData } from "@/app/(app)/inferences/inference-card";
import { DeleteDocumentButton, NewPersonCard, type NewPersonData } from "./document-bits";

export default async function IngestDocumentPage({ params }: PageProps<"/ingest/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();

  const { data: docRow } = (await supabase.from("documents").select("*").eq("id", id).maybeSingle()) as {
    data: IngestDocument | null;
  };
  if (!docRow) notFound();
  const doc = docRow;

  const { data: account } = (await supabase
    .from("accounts")
    .select("id, name")
    .eq("id", doc.account_id)
    .maybeSingle()) as { data: { id: string; name: string } | null };

  const { data: infRows } = await supabase
    .from("inferences")
    .select("*")
    .eq("document_id", id)
    .order("created_at", { ascending: true });
  const inferences = (infRows ?? []) as Inference[];
  const pending = inferences.filter((i) => i.status === "pending");
  const acceptedCount = inferences.filter((i) => i.status === "accepted").length;

  // Subject labels for the proposal cards: only contacts and accounts come out of ingestion.
  const contactIds = [...new Set(inferences.filter((i) => i.subject_type === "contact").map((i) => i.subject_id))];
  const labelById = new Map<string, { label: string; href: string | null }>();
  if (contactIds.length) {
    const { data: cs } = await supabase.from("contacts").select("id, full_name, title").in("id", contactIds);
    for (const c of cs ?? []) labelById.set(c.id, { label: c.title ? `${c.full_name} · ${c.title}` : c.full_name, href: `/contacts/${c.id}` });
  }
  labelById.set(doc.account_id, { label: account?.name ?? "Account", href: `/accounts/${doc.account_id}` });

  const cards: InferenceCardData[] = pending.map((r) => ({
    id: r.id,
    kind: r.kind,
    description: describeInferenceValue(r.kind, r.value),
    confidence: r.confidence,
    source: r.source,
    subjectLabel: labelById.get(r.subject_id)?.label ?? `${r.subject_type}`,
    subjectHref: labelById.get(r.subject_id)?.href ?? null,
    rationale: r.rationale,
    evidence: r.evidence ?? [],
  }));

  const stored = storedExtractionSchema.safeParse(doc.extraction);
  const newPeople: NewPersonData[] = stored.success
    ? stored.data.people
        .filter((p) => !p.contact_id && !(stored.data.created ?? {})[p.name])
        .map((p) => ({ name: p.name, title: p.title ?? null, org: p.org ?? null, email: p.email ?? null }))
    : [];
  const nextSteps = stored.success ? stored.data.next_steps : [];
  const createdPeople = stored.success ? stored.data.created ?? {} : {};
  const callLabel = CALL_TYPE_LABELS[doc.call_type as CallType] ?? "Source";

  return (
    <div className="flex min-h-screen flex-col">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Link href="/ingest" className="mr-1 text-muted-foreground hover:text-foreground" aria-label="Back to ingest">
              <ArrowLeft className="size-4" />
            </Link>
            {doc.title}
          </span>
        }
        description={
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            {account && (
              <Link href={`/accounts/${account.id}`} className="text-primary hover:underline">
                {account.name}
              </Link>
            )}
            <span className="rounded bg-accent px-1.5 py-0.5 text-xs text-accent-foreground">{callLabel}</span>
            <span className="text-muted-foreground">{format(new Date(doc.created_at), "MMM d, yyyy HH:mm")}</span>
            {doc.status === "failed" && (
              <span className="rounded border border-red-500/40 bg-red-500/10 px-1.5 py-0.5 text-xs text-red-400">Failed</span>
            )}
          </span>
        }
        actions={<DeleteDocumentButton documentId={doc.id} title={doc.title} />}
      />

      <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-5">
        {/* Notes view */}
        <section className="min-w-0 space-y-3 rounded-lg border bg-card p-5 xl:col-span-3">
          <h2 className="text-sm font-semibold">Notes</h2>
          {doc.status === "failed" ? (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">
              <p className="font-medium">The ingest failed and nothing was applied.</p>
              {doc.error && <p className="mt-1 text-red-300">{doc.error}</p>}
              {!aiConfigured() && <p className="mt-1">AI is not configured on this server.</p>}
            </div>
          ) : doc.notes_html ? (
            <div className="rich-text text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: doc.notes_html }} />
          ) : (
            <p className="text-sm text-muted-foreground">Notes were not generated for this source.</p>
          )}
          <details className="rounded-lg border bg-muted/30 p-3">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground">Raw source</summary>
            <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap break-words text-xs leading-relaxed text-muted-foreground">
              {doc.raw_text}
            </pre>
          </details>
        </section>

        {/* Extraction review */}
        <section className="min-w-0 space-y-4 xl:col-span-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Extraction review</h2>
              <Link href="/inferences" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                <ListChecks className="size-3.5" /> Open the queue ({acceptedCount} accepted here)
              </Link>
            </div>
            {doc.status === "done" && (
              <p className="text-xs text-muted-foreground">
                {pending.length > 0
                  ? `${pending.length} proposal${pending.length === 1 ? "" : "s"} from this source wait below and in the review queue.`
                  : "Every proposal from this source has been resolved."}
              </p>
            )}
          </div>

          {cards.length > 0 && (
            <ul className="space-y-3">
              {cards.map((c) => (
                <InferenceCard key={c.id} data={c} />
              ))}
            </ul>
          )}
          {doc.status === "done" && cards.length === 0 && newPeople.length === 0 && nextSteps.length === 0 && (
            <p className="rounded-lg border border-dashed px-4 py-3 text-xs text-muted-foreground">
              Nothing worth changing was found in this source.
            </p>
          )}

          {newPeople.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                New people ({newPeople.length})
              </h3>
              <ul className="space-y-3">
                {newPeople.map((p) => (
                  <NewPersonCard key={p.name} documentId={doc.id} person={p} />
                ))}
              </ul>
            </div>
          )}

          {Object.keys(createdPeople).length > 0 && (
            <div className="space-y-1">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Added from this source</h3>
              <ul className="space-y-1">
                {Object.entries(createdPeople).map(([name, contactId]) => (
                  <li key={contactId} className="text-sm">
                    <Link href={`/contacts/${contactId}`} className="text-primary hover:underline">
                      {name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {nextSteps.length > 0 && (
            <div className="space-y-2 rounded-lg border bg-card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next steps</h3>
              <ul className="space-y-1.5">
                {nextSteps.map((s, i) => (
                  <li key={i} className="text-sm">
                    <span className={s.committed ? "font-medium" : ""}>{s.text}</span>
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      {[s.person, s.due ? `due ${s.due}` : null, s.committed ? "committed" : "offered"]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
