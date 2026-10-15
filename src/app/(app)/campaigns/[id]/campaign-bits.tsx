"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  CAMPAIGN_STATUSES,
  CAMPAIGN_TYPES,
  FUNNEL_LABELS,
  FUNNEL_STAGES,
  type CampaignType,
  type FunnelStage,
} from "@/lib/workflow/campaigns";
import { addCampaignMember, deleteCampaign, removeCampaignMember, setMemberOutcome, setMemberStage, updateCampaign } from "../actions";

export type MemberRow = {
  id: string;
  contact_id: string;
  contact_name: string;
  contact_title: string | null;
  account_name: string | null;
  net_new: boolean;
  funnel_stage: FunnelStage;
  outcome: string | null;
};

/** The campaign header: name, type, status, date and the messaging, saved inline. */
export function CampaignHeaderForm({
  campaign,
}: {
  campaign: {
    id: string;
    name: string;
    type: string;
    status: string;
    event_date: string | null;
    messaging: string | null;
  };
}) {
  const [pending, start] = useTransition();
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const r = await updateCampaign(campaign.id, {
            name: String(fd.get("name") ?? "").trim(),
            type: String(fd.get("type") ?? campaign.type) as CampaignType,
            status: String(fd.get("status") ?? campaign.status) as (typeof CAMPAIGN_STATUSES)[number],
            event_date: String(fd.get("event_date") ?? "") || null,
            messaging: String(fd.get("messaging") ?? "").trim() || null,
          });
          if (!r.ok) toast.error(r.error);
        });
      }}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="col-span-2 space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Name</span>
          <input
            name="name"
            defaultValue={campaign.name}
            maxLength={200}
            className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Type</span>
          <select name="type" defaultValue={campaign.type} className="h-8 w-full rounded-lg border border-border bg-background px-2 text-sm">
            {CAMPAIGN_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Status</span>
          <select name="status" defaultValue={campaign.status} className="h-8 w-full rounded-lg border border-border bg-background px-2 text-sm">
            {CAMPAIGN_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Event date</span>
          <input
            name="event_date"
            type="date"
            defaultValue={campaign.event_date ?? ""}
            className="h-8 w-full rounded-lg border border-border bg-background px-2 text-sm"
          />
        </label>
      </div>
      <label className="block space-y-1">
        <span className="text-xs font-medium text-muted-foreground">Messaging</span>
        <textarea
          name="messaging"
          defaultValue={campaign.messaging ?? ""}
          rows={2}
          maxLength={10000}
          placeholder="The pitch this motion runs on…"
          className="w-full rounded-lg border border-border bg-background p-2 text-sm leading-relaxed"
        />
      </label>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : "Save"}
      </Button>
    </form>
  );
}

/** Adds a person to the funnel; their account is snapshotted for net-new flags. */
export function AddMemberForm({
  campaignId,
  campaignAccountId,
  contacts,
}: {
  campaignId: string;
  campaignAccountId: string | null;
  contacts: { id: string; name: string; account_id: string | null }[];
}) {
  const [pending, start] = useTransition();
  const scoped = campaignAccountId ? contacts.filter((c) => c.account_id === campaignAccountId) : [];
  const others = campaignAccountId ? contacts.filter((c) => c.account_id !== campaignAccountId) : contacts;
  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const select = e.currentTarget.elements.namedItem("contact_id") as HTMLSelectElement | null;
        const contactId = select?.value ?? "";
        if (!contactId) return;
        start(async () => {
          const r = await addCampaignMember({ campaign_id: campaignId, contact_id: contactId });
          if (!r.ok) {
            toast.error(r.error);
            return;
          }
          if (select) select.value = "";
        });
      }}
    >
      <select
        name="contact_id"
        defaultValue=""
        className="h-8 min-w-48 max-w-72 flex-1 rounded-lg border border-border bg-background px-2 text-sm"
      >
        <option value="" disabled>
          Add a person to the funnel…
        </option>
        {scoped.length > 0 && (
          <optgroup label="This account">
            {scoped.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </optgroup>
        )}
        {others.length > 0 && (
          <optgroup label={campaignAccountId ? "Outside this account" : "All contacts"}>
            {others.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>
      <Button type="submit" size="xs" disabled={pending}>
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <UserPlus className="size-3.5" />} Add
      </Button>
    </form>
  );
}

/** One person in the funnel: stage, outcome, and their account with the net-new flag. */
export function MemberRow({ member }: { member: MemberRow }) {
  const [pending, start] = useTransition();
  const [outcome, setOutcome] = useState(member.outcome ?? "");

  const saveOutcome = () => {
    if (outcome.trim() === (member.outcome ?? "")) return;
    start(async () => {
      const r = await setMemberOutcome(member.id, outcome.trim() || null);
      if (!r.ok) toast.error(r.error);
    });
  };

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5">
      <Link href={`/contacts/${member.contact_id}`} className="min-w-28 flex-1 truncate text-sm font-medium hover:underline">
        {member.contact_name}
      </Link>
      {member.contact_title && <span className="max-w-44 truncate text-xs text-muted-foreground">{member.contact_title}</span>}
      {member.net_new ? (
        <span
          title={`From ${member.account_name ?? "another account"} — outside the campaign's account`}
          className="rounded border border-green-500/40 bg-green-500/10 px-1.5 py-0.5 text-[11px] font-medium text-green-600"
        >
          Net-new{member.account_name ? ` · ${member.account_name}` : ""}
        </span>
      ) : (
        member.account_name && <span className="max-w-40 truncate text-xs text-muted-foreground">{member.account_name}</span>
      )}
      <select
        value={member.funnel_stage}
        disabled={pending}
        onChange={(e) =>
          start(async () => {
            const r = await setMemberStage(member.id, e.target.value as FunnelStage);
            if (!r.ok) toast.error(r.error);
          })
        }
        className="h-7 rounded-lg border border-border bg-background px-1.5 text-xs text-muted-foreground"
        title="Funnel stage"
      >
        {FUNNEL_STAGES.map((s) => (
          <option key={s} value={s}>
            {FUNNEL_LABELS[s]}
          </option>
        ))}
      </select>
      <input
        value={outcome}
        onChange={(e) => setOutcome(e.target.value)}
        onBlur={saveOutcome}
        maxLength={500}
        placeholder="Outcome…"
        className="h-7 w-36 rounded-lg border border-border bg-background px-2 text-xs"
        title="What happened with this person"
      />
      <button
        title="Remove from the campaign"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await removeCampaignMember(member.id);
            if (!r.ok) toast.error(r.error);
          })
        }
        className="text-muted-foreground/50 hover:text-foreground"
      >
        <Trash2 className="size-3.5" />
      </button>
    </li>
  );
}

export function DeleteCampaignButton({ campaignId, name }: { campaignId: string; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Delete “${name}”? The member funnel goes with it.`)) return;
        start(async () => {
          const r = await deleteCampaign(campaignId);
          if (!r.ok) {
            toast.error(r.error);
            return;
          }
          router.push("/campaigns");
        });
      }}
    >
      <Trash2 className="size-3.5" /> {pending ? "Deleting…" : "Delete"}
    </Button>
  );
}
