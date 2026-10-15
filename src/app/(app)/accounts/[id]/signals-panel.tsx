import { EmptyState } from "@/components/page-header";
import { RunScanButton, SignalCard } from "@/components/signal-bits";
import type { Signal } from "@/lib/types";

/** The account's signal history: new ones actionable, the rest for the record. */
export function SignalsPanel({ accountId, signals }: { accountId: string; signals: Signal[] }) {
  const ordered = [...signals].sort((a, b) => {
    if (a.status !== b.status) return a.status === "new" ? -1 : b.status === "new" ? 1 : 0;
    return (b.source_date ?? b.created_at).localeCompare(a.source_date ?? a.created_at);
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          News, filings and org moves scanned for this account, each with the so-what for Factory already written.
        </p>
        <RunScanButton accountId={accountId} />
      </div>
      {ordered.length === 0 ? (
        <EmptyState
          title="No signals yet"
          description="Run the scan to search the web for this account's latest news, or paste a transcript — its next steps and initiatives become signals for the Today feed."
        />
      ) : (
        <ul className="divide-y rounded-lg border">
          {ordered.map((s) => (
            <SignalCard key={s.id} signal={s} />
          ))}
        </ul>
      )}
    </div>
  );
}
