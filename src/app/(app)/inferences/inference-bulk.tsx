"use client";

import { useState, useTransition } from "react";
import { CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { bulkAcceptInferences, type BulkFilter } from "./actions";

/** Accept-everything-confirmed shortcut for the queue header. */
export function BulkAcceptButton({ filter, confirmedCount }: { filter: BulkFilter; confirmedCount: number }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const [note, setNote] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      {note && <span className="text-xs text-muted-foreground">{note}</span>}
      <Button
        size="sm"
        variant="outline"
        disabled={pending || confirmedCount === 0}
        onClick={() =>
          start(async () => {
            const r = await bulkAcceptInferences(filter);
            if (!r.ok) {
              toast.error(r.error);
              return;
            }
            const { applied, failed, errors } = r.data!;
            if (failed > 0) {
              toast.message(`${applied} applied · ${failed} left for review`, {
                description: errors.join("\n"),
              });
            } else {
              toast.success(`${applied} proposal${applied === 1 ? "" : "s"} applied`);
            }
            setNote(`${applied} applied${failed ? ` · ${failed} need a look` : ""}`);
            router.refresh();
          })
        }
      >
        <CheckCheck className="size-3.5" /> {pending ? "Applying…" : `Accept confirmed (${confirmedCount})`}
      </Button>
    </div>
  );
}
