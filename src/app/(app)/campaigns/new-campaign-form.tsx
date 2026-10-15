"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CAMPAIGN_TYPES, type CampaignType } from "@/lib/workflow/campaigns";
import { createCampaign } from "./actions";

/** Creates a campaign and opens it. No account selected means a multi-account motion. */
export function NewCampaignForm({
  accountId = null,
  accounts = [],
  label = "New campaign",
}: {
  accountId?: string | null;
  accounts?: { id: string; name: string }[];
  label?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const name = String(fd.get("name") ?? "").trim();
        if (!name) return;
        start(async () => {
          const r = await createCampaign({
            account_id: String(fd.get("account_id") ?? "") || null,
            name,
            type: String(fd.get("type") ?? "event_dinner") as CampaignType,
            event_date: String(fd.get("event_date") ?? "") || null,
          });
          if (!r.ok || !r.data) {
            toast.error(r.ok ? "Created, but it didn't open." : r.error);
            return;
          }
          router.push(`/campaigns/${r.data.id}`);
        });
      }}
    >
      <input
        name="name"
        maxLength={200}
        placeholder="e.g. AMEX exec dinner — Q4 platform summit"
        className="h-8 min-w-48 flex-1 rounded-lg border border-border bg-background px-2.5 text-sm"
      />
      <select
        name="type"
        defaultValue="event_dinner"
        className="h-8 rounded-lg border border-border bg-background px-2 text-sm text-muted-foreground"
      >
        {CAMPAIGN_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      {accountId ? (
        <input type="hidden" name="account_id" value={accountId} />
      ) : (
        <select
          name="account_id"
          defaultValue=""
          className="h-8 max-w-44 rounded-lg border border-border bg-background px-2 text-sm text-muted-foreground"
        >
          <option value="">Multi-account</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      )}
      <input name="event_date" type="date" className="h-8 rounded-lg border border-border bg-background px-2 text-sm text-muted-foreground" />
      <Button type="submit" size="xs" disabled={pending}>
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} {label}
      </Button>
    </form>
  );
}
