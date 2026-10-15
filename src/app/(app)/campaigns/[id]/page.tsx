import Link from "next/link";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { Campaign, CampaignMember } from "@/lib/types";
import { FUNNEL_LABELS, FUNNEL_STAGES, isNetNew } from "@/lib/workflow/campaigns";
import { TYPE_LABEL } from "../funnel-bits";
import { AddMemberForm, CampaignHeaderForm, DeleteCampaignButton, MemberRow, type MemberRow as MemberRowType } from "./campaign-bits";

const STATUS_STYLES: Record<string, string> = {
  planning: "bg-muted text-muted-foreground",
  active: "border border-green-500/40 bg-green-500/10 text-green-600",
  done: "bg-accent text-accent-foreground",
};

export default async function CampaignPage({ params }: PageProps<"/campaigns/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();

  const { data: campaignRow } = (await supabase
    .from("campaigns")
    .select("*, accounts(id, name)")
    .eq("id", id)
    .maybeSingle()) as unknown as { data: (Campaign & { accounts: { id: string; name: string } | null }) | null };
  if (!campaignRow) notFound();
  const campaign = campaignRow;

  const [memberRows, contactRows] = await Promise.all([
    supabase
      .from("campaign_members")
      .select("*, contacts(id, full_name, title)")
      .eq("campaign_id", id)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase.from("contacts").select("id, full_name, title, account_id").order("full_name").limit(500),
  ]);

  const members = (memberRows.data ?? []) as unknown as (CampaignMember & {
    contacts: { id: string; full_name: string; title: string | null } | null;
  })[];

  // Account names for the net-new badges, fetched once the member rows are known.
  const memberAccountIds = [...new Set(members.flatMap((m) => (m.contact_account_id ? [m.contact_account_id] : [])))];
  const accountRes = memberAccountIds.length
    ? await supabase.from("accounts").select("id, name").in("id", memberAccountIds)
    : { data: [] as { id: string; name: string }[] };
  const accountNames = new Map(((accountRes.data ?? []) as { id: string; name: string }[]).map((a) => [a.id, a.name]));

  const pickerContacts = ((contactRows.data ?? []) as { id: string; full_name: string; title: string | null; account_id: string | null }[]).map(
    (c) => ({
      id: c.id,
      name: c.title ? `${c.full_name} · ${c.title}` : c.full_name,
      account_id: c.account_id,
    }),
  );

  const rows: MemberRowType[] = members.map((m) => ({
    id: m.id,
    contact_id: m.contact_id,
    contact_name: m.contacts?.full_name ?? "Unknown person",
    contact_title: m.contacts?.title ?? null,
    account_name: m.contact_account_id ? (accountNames.get(m.contact_account_id) ?? null) : null,
    net_new: isNetNew(campaign.account_id, m.contact_account_id),
    funnel_stage: m.funnel_stage,
    outcome: m.outcome,
  }));

  const netNewCount = rows.filter((r) => r.net_new).length;

  return (
    <div className="min-h-screen">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Link href="/campaigns" className="mr-1 text-muted-foreground hover:text-foreground" aria-label="Back to campaigns">
              <ArrowLeft className="size-4" />
            </Link>
            {campaign.name}
          </span>
        }
        description={
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            {campaign.accounts ? (
              <Link href={`/accounts/${campaign.accounts.id}`} className="text-primary hover:underline">
                {campaign.accounts.name}
              </Link>
            ) : (
              <span className="italic">multi-account</span>
            )}
            <span className="text-muted-foreground">{TYPE_LABEL(campaign.type)}</span>
            <span className={`rounded px-1.5 py-0.5 text-xs ${STATUS_STYLES[campaign.status] ?? STATUS_STYLES.planning}`}>{campaign.status}</span>
            {campaign.event_date && (
              <span className="text-muted-foreground">{format(parseISO(campaign.event_date), "MMM d, yyyy")}</span>
            )}
            <span className="text-muted-foreground">
              {rows.length} member{rows.length === 1 ? "" : "s"}
            </span>
          </span>
        }
        actions={<DeleteCampaignButton campaignId={campaign.id} name={campaign.name} />}
      />

      <div className="mx-auto max-w-5xl space-y-4 p-4">
        <section className="rounded-lg border bg-card p-4">
          <CampaignHeaderForm
            campaign={{
              id: campaign.id,
              name: campaign.name,
              type: campaign.type,
              status: campaign.status,
              event_date: campaign.event_date,
              messaging: campaign.messaging,
            }}
          />
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {FUNNEL_STAGES.map((stage) => {
              const n = rows.filter((r) => r.funnel_stage === stage).length;
              return (
                <span
                  key={stage}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-xs",
                    n > 0 ? "border-border bg-muted font-medium text-foreground" : "border-dashed text-muted-foreground/60",
                  )}
                >
                  {FUNNEL_LABELS[stage]} <span className="font-semibold">{n}</span>
                </span>
              );
            })}
            {netNewCount > 0 && (
              <span className="rounded-lg border border-green-500/40 bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-600">
                {netNewCount} net-new
              </span>
            )}
          </div>

          <ul className="divide-y rounded-lg border">
            {rows.map((m) => (
              <MemberRow key={m.id} member={m} />
            ))}
            {rows.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                No one in the funnel yet — add the people you&rsquo;re moving.
              </li>
            )}
          </ul>

          <AddMemberForm campaignId={campaign.id} campaignAccountId={campaign.account_id} contacts={pickerContacts} />
        </section>
      </div>
    </div>
  );
}
