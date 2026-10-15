"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createOpportunity } from "./actions";

/** Creates a deal with the default MEDDPICC board and opens it. */
export function NewOpportunityForm({ accountId }: { accountId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const input = e.currentTarget.elements.namedItem("name") as HTMLInputElement | null;
        const name = input?.value.trim() ?? "";
        if (!name) return;
        start(async () => {
          const r = await createOpportunity({ account_id: accountId, name });
          if (!r.ok || !r.data) {
            toast.error(r.ok ? "Created, but it didn't open." : r.error);
            return;
          }
          router.push(`/opportunities/${r.data.id}`);
        });
      }}
    >
      <input
        name="name"
        maxLength={200}
        placeholder="e.g. Factory platform pilot — ETS"
        className="h-8 min-w-48 flex-1 rounded-lg border border-border bg-background px-2.5 text-sm"
      />
      <Button type="submit" size="xs" disabled={pending}>
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} New opportunity
      </Button>
    </form>
  );
}
