"use client";

import { useTransition } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { BrainCircuit, Check, Loader2, ListPlus, Radar, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { addSignalToHypothesis, createTaskFromSignal, dismissSignal, linkSignal, runSignalScan } from "@/app/(app)/signals/actions";
import type { Signal } from "@/lib/types";

export type SignalCardData = Pick<
  Signal,
  "id" | "title" | "summary" | "so_what" | "source_name" | "source_url" | "source_date" | "relevance" | "status"
>;

const STATUS_STYLES: Record<Signal["status"], string> = {
  new: "border border-primary/40 bg-primary/10 text-primary",
  linked: "bg-muted text-muted-foreground",
  dismissed: "border border-dashed text-muted-foreground/60",
};

/** One signal: what happened, the so-what for Factory, its source, and the four actions. */
export function SignalCard({
  signal,
  account,
  showActions,
}: {
  signal: SignalCardData;
  account?: { id: string; name: string } | null;
  showActions?: boolean;
}) {
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, okToast?: string) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) toast.error(r.error);
      else if (okToast) toast.success(okToast);
    });

  return (
    <li className={cn("space-y-1.5 px-4 py-3", signal.status === "dismissed" && "opacity-60")}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="min-w-0 flex-1 text-sm font-medium leading-snug">{signal.title}</span>
        {account && (
          <Link href={`/accounts/${account.id}`} className="shrink-0 rounded bg-accent px-1.5 py-0.5 text-[11px] text-accent-foreground hover:underline">
            {account.name}
          </Link>
        )}
        <span
          title={`Relevance ${signal.relevance} of 5`}
          className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[11px] font-semibold"
        >
          {"●".repeat(signal.relevance)}
          <span className="text-muted-foreground/40">{"●".repeat(5 - signal.relevance)}</span>
        </span>
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] ${STATUS_STYLES[signal.status]}`}>{signal.status}</span>
      </div>
      <p className="text-xs text-muted-foreground">{signal.summary}</p>
      <p className="text-xs">
        <span className="mr-1 font-semibold text-primary">So what:</span>
        {signal.so_what}
      </p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <a
          href={signal.source_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground hover:underline"
          title={signal.source_url}
        >
          {signal.source_name}
          {signal.source_date && <span>· {format(parseISO(signal.source_date), "MMM d, yyyy")}</span>}
        </a>
        {(showActions ?? signal.status === "new") && (
          <span className="flex items-center gap-1">
            <Button
              size="xs"
              variant="outline"
              disabled={pending}
              onClick={() => run(() => linkSignal(signal.id), "Linked to the account.")}
              title="Keep this attached to the account record"
            >
              {pending ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />} Link
            </Button>
            <Button
              size="xs"
              variant="outline"
              disabled={pending}
              onClick={() => run(() => addSignalToHypothesis(signal.id), "Added to the working hypothesis.")}
              title="Append this signal to the account's working hypothesis"
            >
              <BrainCircuit className="size-3" /> Hypothesis
            </Button>
            <Button
              size="xs"
              variant="outline"
              disabled={pending}
              onClick={() => run(() => createTaskFromSignal(signal.id), "Task created.")}
              title="Create a follow-up task from this signal"
            >
              <ListPlus className="size-3" /> Task
            </Button>
            <Button
              size="xs"
              variant="ghost"
              disabled={pending}
              onClick={() => run(() => dismissSignal(signal.id))}
              title="Dismiss this signal"
              className="text-muted-foreground"
            >
              <X className="size-3" />
            </Button>
          </span>
        )}
      </div>
    </li>
  );
}

/** Runs the daily scan now, for one account. */
export function RunScanButton({ accountId }: { accountId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      size="xs"
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await runSignalScan(accountId);
          if (!r.ok || !r.data) {
            toast.error(r.ok ? "Scan finished with no result." : r.error);
            return;
          }
          const { found, added, dropped } = r.data;
          if (added > 0) toast.success(`Scan: ${added} new signal${added === 1 ? "" : "s"} kept${dropped ? `, ${dropped} dropped as uncited or duplicates` : ""}.`);
          else toast.message("Scan finished", { description: `${found} found, none new — every source was uncited, a duplicate, or already stored.` });
        })
      }
      title="Search the web for this account's latest news and score it for Factory"
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Radar className="size-3.5" />} {pending ? "Scanning…" : "Run scan"}
    </Button>
  );
}
