import Link from "next/link";
import { format, parseISO } from "date-fns";
import { EmptyState } from "@/components/page-header";
import type { Opportunity } from "@/lib/types";
import { NewOpportunityForm } from "@/app/(app)/opportunities/new-opportunity-form";

const STATUS_STYLES: Record<string, string> = {
  open: "bg-accent text-accent-foreground",
  won: "border-green-500/40 bg-green-500/10 text-green-600",
  lost: "border-red-500/40 bg-red-500/10 text-red-500",
  paused: "bg-muted text-muted-foreground",
};

/** The account's deals: one line each, boarding straight into the MEDDPICC board. */
export function OpportunitiesPanel({ accountId, opportunities }: { accountId: string; opportunities: Opportunity[] }) {
  return (
    <div className="space-y-3">
      <NewOpportunityForm accountId={accountId} />
      {opportunities.length === 0 ? (
        <EmptyState
          title="No opportunities yet"
          description="Name a deal and it starts with the full MEDDPICC board: rename, hide or add elements per deal."
        />
      ) : (
        <ul className="divide-y rounded-lg border">
          {opportunities.map((o) => (
            <li key={o.id}>
              <Link href={`/opportunities/${o.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-muted/50">
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{o.name}</span>
                <span className={`rounded px-1.5 py-0.5 text-[11px] ${STATUS_STYLES[o.status] ?? STATUS_STYLES.open}`}>{o.status}</span>
                {o.amount != null && <span className="text-xs text-muted-foreground">{o.amount.toLocaleString()}</span>}
                {o.close_date && (
                  <span className="text-xs text-muted-foreground">closes {format(parseISO(o.close_date), "MMM d")}</span>
                )}
                {o.next_step && <span className="max-w-56 truncate text-xs text-muted-foreground">→ {o.next_step}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
