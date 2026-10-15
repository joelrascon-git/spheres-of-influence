import Link from "next/link";
import { format, parseISO } from "date-fns";
import { EmptyState } from "@/components/page-header";
import { FunnelChips, TYPE_LABEL, type CampaignRow } from "@/app/(app)/campaigns/funnel-bits";
import { NewCampaignForm } from "@/app/(app)/campaigns/new-campaign-form";

const STATUS_STYLES: Record<string, string> = {
  planning: "bg-muted text-muted-foreground",
  active: "border border-green-500/40 bg-green-500/10 text-green-600",
  done: "bg-accent text-accent-foreground",
};

/** The account's motions, each with its funnel and net-new flags one click away. */
export function CampaignsPanel({ accountId, campaigns }: { accountId: string; campaigns: CampaignRow[] }) {
  return (
    <div className="space-y-3">
      <NewCampaignForm accountId={accountId} />
      {campaigns.length === 0 ? (
        <EmptyState
          title="No campaigns yet"
          description="Run an exec dinner, an account break-in or a co-sell against this account and track who moves through the funnel."
        />
      ) : (
        <ul className="divide-y rounded-lg border">
          {campaigns.map((c) => (
            <li key={c.id}>
              <Link href={`/campaigns/${c.id}`} className="flex flex-col gap-1 px-4 py-3 hover:bg-muted/50">
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{c.name}</span>
                  <span className="text-xs text-muted-foreground">{TYPE_LABEL(c.type)}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[11px] ${STATUS_STYLES[c.status] ?? STATUS_STYLES.planning}`}>{c.status}</span>
                </span>
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {c.event_date && <span>{format(parseISO(c.event_date), "MMM d, yyyy")}</span>}
                  <FunnelChips campaign={c} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
