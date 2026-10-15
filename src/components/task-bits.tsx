"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createTask, setTaskStatus } from "@/app/(app)/opportunities/actions";

/** One open/done task row with its actions; used on Today and on deals. */
export function TaskRow({
  id,
  title,
  due,
  done,
}: {
  id: string;
  title: string;
  due?: string | null;
  done?: boolean;
}) {
  const [pending, start] = useTransition();
  const [gone, setGone] = useState<"done" | "dismissed" | null>(null);
  if (gone)
    return (
      <li className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground line-through decoration-muted-foreground/40">
        <span className="min-w-0 flex-1 truncate">{title}</span>
        <span className="text-xs">{gone === "done" ? "done" : "dismissed"}</span>
      </li>
    );
  return (
    <li className="flex items-center gap-2 py-1.5">
      <button
        title={done ? "Reopen" : "Mark done"}
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await setTaskStatus(id, done ? "open" : "done");
            if (!r.ok) {
              toast.error(r.error);
              return;
            }
            if (!done) setGone("done");
            else window.location.reload();
          })
        }
        className="inline-flex size-5 shrink-0 items-center justify-center rounded border hover:bg-accent"
      >
        {pending ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
      </button>
      <span className={`min-w-0 flex-1 truncate text-sm ${done ? "text-muted-foreground line-through" : ""}`}>{title}</span>
      {due && <span className="shrink-0 text-xs text-muted-foreground">{due}</span>}
      <button
        title="Dismiss"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await setTaskStatus(id, "dismissed");
            if (!r.ok) {
              toast.error(r.error);
              return;
            }
            setGone("dismissed");
          })
        }
        className="shrink-0 text-muted-foreground hover:text-foreground"
      >
        <X className="size-3.5" />
      </button>
    </li>
  );
}

/** Inline "add a task" with an optional due date, used on Today and on deals. */
export function QuickAddTask({
  accountId,
  contactId,
  opportunityId,
}: {
  accountId?: string;
  contactId?: string;
  opportunityId?: string;
}) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="text-xs font-medium text-primary hover:underline">
        + Add a task
      </button>
    );

  return (
    <form
      className="flex flex-wrap items-center gap-2 pt-1"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const r = await createTask({
            title: String(fd.get("title") ?? "").trim(),
            due_date: String(fd.get("due_date") ?? "") || null,
            account_id: accountId ?? null,
            contact_id: contactId ?? null,
            opportunity_id: opportunityId ?? null,
          });
          if (!r.ok) {
            toast.error(r.error);
            return;
          }
          setOpen(false);
          window.location.reload();
        });
      }}
    >
      <input
        name="title"
        required
        maxLength={500}
        placeholder="Task"
        className="h-8 min-w-40 flex-1 rounded-lg border border-border bg-background px-2.5 text-sm"
      />
      <input
        type="date"
        name="due_date"
        className="h-8 rounded-lg border border-border bg-background px-2 text-sm text-muted-foreground"
      />
      <Button type="submit" size="xs" disabled={pending}>
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : "Add"}
      </Button>
    </form>
  );
}
