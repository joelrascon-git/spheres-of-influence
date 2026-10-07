"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { AlertTriangle, ArrowRight, Check, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SingleSelect } from "@/components/fields";
import { cn } from "@/lib/utils";
import { applyImport, chooseMergeTarget, discardImport, setDiffAccept, setItemDecision } from "../actions";

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

function ItemCard({ item }: { item: ReviewItem }) {
  const [, start] = useTransition();
  const included = item.decision === "accept" || item.decision === "merge";

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
      )}

      {item.action === "unchanged" && item.decision !== "skip" && (
        <p className="mt-1 text-xs text-muted-foreground">No profile changes. Import still refreshes photos, links and connection counts.</p>
      )}
    </li>
  );
}

function Section({ title, items, hint }: { title: string; items: ReviewItem[]; hint?: string }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold">
        {title} <span className="font-normal text-muted-foreground">({items.length})</span>
      </h2>
      {hint && <p className="mb-2 text-xs text-muted-foreground">{hint}</p>}
      <ul className="space-y-2">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}

export function ImportReview({
  batchId,
  fileName,
  exportDate,
  status,
  items,
}: {
  batchId: string;
  fileName: string;
  exportDate: string;
  status: string;
  items: ReviewItem[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [showSkipped, setShowSkipped] = useState(false);

  const needsReview = items.filter((i) => i.action === "review" && i.decision === "pending");
  const updates = items.filter((i) => i.decision === "merge" || (i.action === "update" && i.decision !== "skip"));
  const creates = items.filter((i) => i.action === "create" && i.decision !== "skip");
  const unchanged = items.filter((i) => i.action === "unchanged" && i.decision !== "skip");
  const errors = items.filter((i) => i.action === "error");
  const skipped = items.filter((i) => i.decision === "skip");
  const toApply = updates.length + creates.length + unchanged.length;

  if (status === "applied") {
    const appliedCount = items.filter((i) => i.appliedContactId).length;
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-6 py-10">
        <div className="rounded-lg border border-green-500/40 bg-green-500/10 p-6 text-center">
          <p className="text-sm font-semibold">Import applied</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {appliedCount} of {items.length} rows touched contacts. {errors.length > 0 && `${errors.length} rows failed.`}
          </p>
          <div className="mt-3 flex justify-center gap-2">
            <Button size="sm" nativeButton={false} render={<Link href="/contacts" />}>View contacts</Button>
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/import" />}>Back to imports</Button>
          </div>
        </div>
        {errors.length > 0 && (
          <Section title="Rows that failed" items={errors} />
        )}
        <Section title="Applied rows" items={items.filter((i) => i.appliedContactId)} />
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

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{fileName}</h1>
          <p className="text-xs text-muted-foreground">
            LinkedIn export dated {format(parseISO(exportDate), "MMMM d, yyyy")} · {items.length} rows ·{" "}
            {needsReview.length > 0 ? (
              <span className="text-yellow-400">{needsReview.length} need your call</span>
            ) : (
              "nothing ambiguous left"
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
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
          <Button
            size="sm"
            disabled={pending || toApply === 0}
            onClick={() =>
              start(async () => {
                const r = await applyImport(batchId);
                if (!r.ok) {
                  toast.error(r.error);
                  return;
                }
                toast.success(`Applied: ${r.data?.applied ?? 0} rows, ${r.data?.errors ?? 0} errors.`);
                router.refresh();
              })
            }
          >
            {pending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" /> Applying…
              </>
            ) : (
              <>
                <Check className="size-3.5" /> Apply {toApply} rows
              </>
            )}
          </Button>
        </div>
      </div>

      {pending && (
        <p className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
          Applying: contacts, locations and profile photos are being written. Large imports take a few minutes —
          keep this tab open.
        </p>
      )}

      <Section
        title="Needs your call"
        items={needsReview}
        hint="These rows share a name with an existing contact but not a LinkedIn ID or email."
      />
      <Section title="Updates" items={updates} hint="Matched contacts with changes. Uncheck any change you don't want." />
      <Section title="New contacts" items={creates} />
      <Section title="No changes" items={unchanged} />
      <Section title="Rows with problems" items={errors} />

      {skipped.length > 0 && (
        <div>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setShowSkipped(!showSkipped)}
          >
            {showSkipped ? "Hide" : "Show"} {skipped.length} skipped row{skipped.length === 1 ? "" : "s"}
          </button>
          {showSkipped && (
            <div className="mt-2">
              <Section title="Skipped" items={skipped} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
