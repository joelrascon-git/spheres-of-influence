"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { AlertTriangle, ArrowRight, Check, ChevronLeft, ChevronRight, Loader2, Plus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SingleSelect } from "@/components/fields";
import { cn } from "@/lib/utils";
import {
  applyImportChunk,
  chooseMergeTarget,
  discardImport,
  enrichImportChunk,
  explainImportChange,
  setBulkDecision,
  setDiffAccept,
  setItemDecision,
  type ApplyProgress,
  type EnrichProgress,
} from "../actions";

export type ReviewDiff = {
  field: string;
  label: string;
  before: string | null;
  after: string | null;
  beforeDisplay: string;
  afterDisplay: string;
  defaultAccept: boolean;
  accept?: boolean;
  note?: string;
};

export type ReviewItem = {
  id: string;
  rowIndex: number;
  fullName: string;
  title: string | null;
  companyName: string | null;
  location: string | null;
  email: string | null;
  linkedinUid: string | null;
  action: "create" | "update" | "unchanged" | "review" | "error";
  matchReason: string | null;
  matchedContactId: string | null;
  matchedName: string | null;
  mergeIntoName: string | null;
  decision: "pending" | "accept" | "skip" | "merge";
  candidateIds: string[];
  candidates: { id: string; label: string }[];
  diff: ReviewDiff[];
  error: string | null;
  appliedContactId: string | null;
};

const ACTION_CHIP: Record<ReviewItem["action"], string> = {
  create: "border-primary/40 bg-primary/10 text-primary",
  update: "border-blue-500/40 bg-blue-500/10 text-blue-400",
  unchanged: "border-foreground/20 text-muted-foreground",
  review: "border-yellow-500/40 bg-yellow-500/10 text-yellow-400",
  error: "border-red-500/40 bg-red-500/10 text-red-400",
};

function ItemCard({ item, aiEnabled }: { item: ReviewItem; aiEnabled: boolean }) {
  const [, start] = useTransition();
  const included = item.decision === "accept" || item.decision === "merge";
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);

  const toggleInclude = () =>
    start(async () => {
      const r = await setItemDecision(item.id, included ? "skip" : "accept");
      if (!r.ok) toast.error(r.error);
    });

  return (
    <li className="rounded-lg border bg-card p-3">
      <div className="flex flex-wrap items-center gap-2">
        {item.action === "error" ? (
          <AlertTriangle className="size-4 shrink-0 text-destructive" />
        ) : (
          <Checkbox
            checked={included}
            onCheckedChange={toggleInclude}
            disabled={item.decision === "merge"}
            aria-label={`Include ${item.fullName} in this import`}
          />
        )}
        <span className="font-medium">
          {item.appliedContactId || item.matchedContactId ? (
            <Link href={`/contacts/${item.appliedContactId ?? item.matchedContactId}`} className="hover:underline">
              {item.fullName}
            </Link>
          ) : (
            item.fullName
          )}
        </span>
        {item.title && <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{item.title}</span>}
        {item.companyName && (
          <span className="shrink-0 text-xs text-muted-foreground">{item.companyName}</span>
        )}
        <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[11px]", ACTION_CHIP[item.action])}>
          {item.action === "update" && item.decision === "merge" ? "matched by you" : item.action}
        </span>
      </div>

      {item.matchReason && item.action !== "error" && (
        <p className="mt-1 text-xs text-muted-foreground">Matched by {item.matchReason.toLowerCase()}.</p>
      )}
      {item.error && <p className="mt-1 text-xs text-destructive">{item.error}</p>}

      {item.decision === "merge" && item.mergeIntoName && (
        <p className="mt-1 text-xs text-muted-foreground">
          Merging into <span className="font-medium text-foreground">{item.mergeIntoName}</span>{" "}
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() =>
              start(async () => {
                const r = await chooseMergeTarget(item.id, null);
                if (!r.ok) toast.error(r.error);
              })
            }
          >
            undo
          </button>
        </p>
      )}

      {item.action === "review" && item.decision === "pending" && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/5 p-2">
          <span className="text-xs text-muted-foreground">
            Same name{item.linkedinUid ? ", different or missing LinkedIn ID" : " and no LinkedIn ID"} — is this
            someone you already have?
          </span>
          <SingleSelect
            className="w-52"
            options={item.candidates.map((c) => ({ value: c.id, label: c.label }))}
            value={null}
            placeholder="Match to existing…"
            onChange={(v) =>
              v &&
              start(async () => {
                const r = await chooseMergeTarget(item.id, v);
                if (!r.ok) toast.error(r.error);
              })
            }
            searchable
          />
          <Button variant="outline" size="sm" onClick={toggleInclude}>
            <Plus className="size-3.5" /> Create new
          </Button>
        </div>
      )}

      {item.diff.length > 0 && (
        <>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {item.diff.map((d) => {
                const checked = d.accept ?? d.defaultAccept;
                return (
                  <tr key={d.field} className="border-t first:border-t-0">
                    <td className="w-8 py-1.5">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() =>
                          start(async () => {
                            const r = await setDiffAccept(item.id, d.field, !checked);
                            if (!r.ok) toast.error(r.error);
                          })
                        }
                        aria-label={`Apply ${d.label} change`}
                      />
                    </td>
                    <td className="w-40 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {d.label}
                    </td>
                    <td className="max-w-56 truncate py-1.5 text-muted-foreground line-through" title={d.beforeDisplay}>
                      {d.beforeDisplay || "empty"}
                    </td>
                    <td className="w-6 text-center text-muted-foreground">
                      <ArrowRight className="mx-auto size-3" />
                    </td>
                    <td className="max-w-56 truncate py-1.5" title={d.afterDisplay}>
                      {d.afterDisplay}
                    </td>
                    {d.note && (
                      <td className="py-1.5 pl-4 text-xs text-muted-foreground" colSpan={d.note ? 1 : 0}>
                        {d.note}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {aiEnabled && (
            <div className="mt-1.5">
              {explanation ? (
                <p className="border-l-2 border-primary/40 pl-2 text-xs italic text-muted-foreground">{explanation}</p>
              ) : (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
                  disabled={explaining}
                  onClick={async () => {
                    setExplaining(true);
                    try {
                      const r = await explainImportChange(item.id);
                      if (!r.ok) {
                        toast.error(r.error);
                        return;
                      }
                      setExplanation(r.data?.explanation ?? "No explanation returned.");
                    } finally {
                      setExplaining(false);
                    }
                  }}
                >
                  <Sparkles className="size-3" />
                  {explaining ? "Thinking…" : "Why did this change?"}
                </button>
              )}
            </div>
          )}
        </>
      )}

      {item.action === "unchanged" && item.decision !== "skip" && (
        <p className="mt-1 text-xs text-muted-foreground">No profile changes. Import still refreshes photos, links and connection counts.</p>
      )}
    </li>
  );
}

function BulkBar({ batchId, group, count }: { batchId: string; group: string; count: number }) {
  const [pending, start] = useTransition();
  const run = (decision: "accept" | "skip", verb: string) =>
    start(async () => {
      const r = await setBulkDecision(batchId, group, decision);
      if (!r.ok) toast.error(r.error);
      else if (!r.data) toast.error("No rows updated.");
      else toast.success(`${r.data.updated} rows ${verb}.`);
    });
  if (group === "error" || count === 0) return null;
  return (
    <div className="flex shrink-0 items-center gap-2">
      {group !== "skipped" && (
        <Button variant="outline" size="sm" disabled={pending} onClick={() => run("skip", "excluded")}>
          <X className="size-3.5" /> Skip all
        </Button>
      )}
      <Button variant="outline" size="sm" disabled={pending} onClick={() => run("accept", "included")}>
        <Check className="size-3.5" /> {group === "review" ? "Create all new" : "Include all"}
      </Button>
    </div>
  );
}

/** Post-apply AI pass: senior, key and ambiguous contacts → proposals for review. */
function EnrichSection({ batchId, aiEnabled }: { batchId: string; aiEnabled: boolean }) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<EnrichProgress | null>(null);

  /** Chunked like the apply loop, so an interrupted run resumes from batch stats. */
  async function runEnrich() {
    setRunning(true);
    try {
      for (let guard = 0; guard < 500; guard++) {
        const r = await enrichImportChunk(batchId);
        if (!r.ok) {
          toast.error(r.error);
          return;
        }
        if (!r.data) {
          toast.error("Enrichment failed.");
          return;
        }
        setProgress(r.data);
        if (r.data.done) {
          const t = r.data.failed > 0 ? toast.warning : toast.success;
          t(
            r.data.queued
              ? `Queued ${r.data.queued} proposals for review${r.data.failed ? `, ${r.data.failed} rows failed` : ""}.`
              : `No new proposals${r.data.failed ? `, ${r.data.failed} rows failed` : ""}.`,
          );
          return;
        }
      }
      toast.error("Enrichment stopped early. Press the button again to resume.");
    } finally {
      setRunning(false);
    }
  }

  if (!aiEnabled) return null;
  return (
    <section className="rounded-lg border p-4">
      <h2 className="text-sm font-semibold">AI enrichment</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Sends the senior, key and ambiguously-matched contacts from this import to Claude in batches. Every proposal
        waits in the review queue — nothing is written without your call.
      </p>
      {(running || progress) && (
        <p className="mt-2 text-xs text-muted-foreground">
          {progress
            ? `${progress.processed} of ${progress.total} rows examined · ${progress.queued} proposals queued`
            : "Starting…"}
        </p>
      )}
      <Button size="sm" className="mt-3" disabled={running || progress?.done} onClick={runEnrich}>
        {running ? (
          <>
            <Loader2 className="size-3.5 animate-spin" /> Enriching…
          </>
        ) : (
          <>
            <Sparkles className="size-3.5" /> {progress?.done ? "Enrichment done" : "Enrich key contacts"}
          </>
        )}
      </Button>
    </section>
  );
}

export function ImportReview({
  batchId,
  fileName,
  exportDate,
  status,
  items,
  tabs,
  activeGroup,
  hint,
  page,
  pageCount,
  totals,
  applied,
  aiEnabled = false,
}: {
  batchId: string;
  fileName: string;
  exportDate: string;
  status: string;
  items: ReviewItem[];
  tabs: { key: string; label: string; count: number }[];
  activeGroup: string;
  hint?: string;
  page: number;
  pageCount: number;
  totals: { rows: number; pendingReview: number; toApply: number };
  applied?: { touched: number; errors: number };
  aiEnabled?: boolean;
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<ApplyProgress | null>(null);

  /** Drive the chunked apply from the browser so 600+ row imports never hit a server timeout. */
  async function runApply() {
    setRunning(true);
    try {
      for (let guard = 0; guard < 2000; guard++) {
        const r = await applyImportChunk(batchId);
        if (!r.ok) {
          toast.error(r.error);
          return;
        }
        if (!r.data) {
          toast.error("Apply failed.");
          return;
        }
        setProgress(r.data);
        if (r.data.done) {
          const t = r.data.errors > 0 ? toast.warning : toast.success;
          t(`Import applied: ${r.data.applied} rows touched${r.data.errors > 0 ? `, ${r.data.errors} failed` : ""}.`);
          router.refresh();
          return;
        }
      }
      toast.error("Apply stopped early. Reopen this page and resume.");
    } finally {
      setRunning(false);
    }
  }

  if (status === "applied") {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-6 py-10">
        <div className="rounded-lg border border-green-500/40 bg-green-500/10 p-6 text-center">
          <p className="text-sm font-semibold">Import applied</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {applied?.touched ?? 0} of {totals.rows} rows touched contacts.
            {applied && applied.errors > 0 ? ` ${applied.errors} rows failed.` : ""}
          </p>
          <div className="mt-3 flex justify-center gap-2">
            <Button size="sm" nativeButton={false} render={<Link href="/contacts" />}>View contacts</Button>
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/import" />}>Back to imports</Button>
          </div>
        </div>
        <EnrichSection batchId={batchId} aiEnabled={aiEnabled} />
        {items.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-semibold">
              Rows with problems <span className="font-normal text-muted-foreground">({items.length})</span>
            </h2>
            <ul className="space-y-2">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} aiEnabled={aiEnabled} />
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  }

  if (status === "discarded") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-lg border p-6 text-center">
          <p className="text-sm font-semibold">This import was discarded</p>
          <Button variant="outline" size="sm" className="mt-3" nativeButton={false} render={<Link href="/import" />}>
            Back to imports
          </Button>
        </div>
      </div>
    );
  }

  const activeTab = tabs.find((t) => t.key === activeGroup);
  const percent = progress && progress.total ? Math.min(100, Math.round((progress.processed / progress.total) * 100)) : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{fileName}</h1>
          <p className="text-xs text-muted-foreground">
            LinkedIn export dated {format(parseISO(exportDate), "MMMM d, yyyy")} · {totals.rows} rows ·{" "}
            {totals.pendingReview > 0 ? (
              <Link href={`/import/${batchId}?group=review`} className="text-yellow-400 hover:underline">
                {totals.pendingReview} need your call
              </Link>
            ) : (
              "nothing ambiguous left"
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {status === "review" && (
            <Button
              variant="outline"
              size="sm"
              disabled={running}
              onClick={() => {
                if (!confirm("Discard this import? Nothing has been written to your contacts.")) return;
                start(async () => {
                  const r = await discardImport(batchId);
                  if (!r.ok) toast.error(r.error);
                  else router.push("/import");
                });
              }}
            >
              <X className="size-3.5" /> Discard
            </Button>
          )}
          <Button
            size="sm"
            disabled={running || (status === "review" && totals.toApply === 0)}
            onClick={runApply}
          >
            {running ? (
              <>
                <Loader2 className="size-3.5 animate-spin" /> Applying…
              </>
            ) : (
              <>
                <Check className="size-3.5" /> {status === "applying" ? "Resume apply" : `Apply ${totals.toApply} rows`}
              </>
            )}
          </Button>
        </div>
      </div>

      {(running || progress) && (
        <div className="space-y-1.5">
          <div className="h-2 overflow-hidden rounded-full bg-accent">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">
            {progress ? `${progress.processed} of ${progress.total} rows written` : "Starting…"} — contacts, locations
            and profile photos are being written. Keep this tab open; an interrupted apply resumes.
          </p>
        </div>
      )}

      {tabs.length > 0 && (
        <nav className="flex flex-wrap gap-1 rounded-lg border bg-card p-1">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`/import/${batchId}?group=${t.key}`}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                t.key === activeGroup
                  ? "bg-accent font-medium"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              {t.label} <span className="text-xs text-muted-foreground">{t.count}</span>
            </Link>
          ))}
        </nav>
      )}

      {hint && status !== "applying" && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <p className="min-w-0 flex-1">{hint}</p>
          <BulkBar batchId={batchId} group={activeGroup} count={activeTab?.count ?? 0} />
        </div>
      )}

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nothing in this group.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} aiEnabled={aiEnabled} />
          ))}
        </ul>
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            nativeButton={false}
            render={<Link href={`/import/${batchId}?group=${activeGroup}&page=${page - 1}`} />}
          >
            <ChevronLeft className="size-3.5" /> Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pageCount}
            nativeButton={false}
            render={<Link href={`/import/${batchId}?group=${activeGroup}&page=${page + 1}`} />}
          >
            Next <ChevronRight className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
