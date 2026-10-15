import Link from "next/link";
import { format, parseISO } from "date-fns";
import { EmptyState, PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { FunnelChips, TYPE_LABEL, type CampaignRow } from "./funnel-bits";
import { NewCampaignForm } from "./new-campaign-form";

const STATUS_STYLES: Record<string, string> = {
  planning: "bg-muted text-muted-foreground",
  active: "border border-green-500/40 bg-green-500/10 text-green-600",
  done: "bg-accent text-accent-foreground",
};

/** Every motion in one list: dinners, break-ins, co-sells, webinars and outbound. */
export default async function CampaignsPage() {
  const { supabase } = await requireUser();

  const [campaignRows, accountRows] = await Promise.all([
    supabase
      .from("campaigns")
      .select("*, accounts(id, name), campaign_members(contact_account_id, funnel_stage)")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("accounts").select("id, name").order("name").limit(500),
  ]);

  const campaigns = (campaignRows.data ?? []) as unknown as CampaignRow[];
  const accounts = (accountRows.data ?? []).map((a) => ({ id: a.id as string, name: a.name as string }));

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Campaigns"
        description="One object per motion — outbound, exec dinners, account break-ins, partner co-sells and webinars. Track the funnel, and see who brought a new account with them."
      />

      <div className="mx-auto max-w-5xl space-y-4 p-4">
        <NewCampaignForm accounts={accounts} />

        {campaigns.length === 0 ? (
          <EmptyState
            title="No campaigns yet"
            description="Name your first motion — an exec dinner, an outbound sequence, a break-in plan — and it gets a member funnel."
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
                    {c.accounts ? <span>{c.accounts.name}</span> : <span className="italic">multi-account</span>}
                    {c.event_date && <span>{format(parseISO(c.event_date), "MMM d, yyyy")}</span>}
                    <FunnelChips campaign={c} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
