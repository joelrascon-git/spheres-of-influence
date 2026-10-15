"use client";

import { useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveHypothesis } from "@/app/(app)/signals/actions";
import type { Hypothesis } from "@/lib/types";

/** The account's working hypothesis: latest version, editable, never rewritten. */
export function HypothesisPanel({ accountId, hypothesis }: { accountId: string; hypothesis: Hypothesis | null }) {
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(hypothesis?.content ?? "");

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Working hypothesis</h2>
        {hypothesis && (
          <span className="text-xs text-muted-foreground">
            v{hypothesis.version}
            {hypothesis.source === "signal" ? " · updated by a signal" : ""}
            {` · ${format(parseISO(hypothesis.created_at), "MMM d")}`}
          </span>
        )}
      </div>

      {editing ? (
        <form
          className="mt-2 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await saveHypothesis(accountId, draft);
              if (!r.ok) {
                toast.error(r.error);
                return;
              }
              setEditing(false);
            });
          }}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={12}
            maxLength={50000}
            className="w-full rounded-lg border border-border bg-background p-2 text-xs leading-relaxed"
          />
          <div className="flex items-center gap-2">
            <Button type="submit" size="xs" disabled={pending}>
              {pending ? <Loader2 className="size-3 animate-spin" /> : "Save as new version"}
            </Button>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              disabled={pending}
              onClick={() => {
                setDraft(hypothesis?.content ?? "");
                setEditing(false);
              }}
              className="text-muted-foreground"
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-2">
          {hypothesis ? (
            <>
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">{hypothesis.content}</p>
              <button
                onClick={() => {
                  setDraft(hypothesis.content);
                  setEditing(true);
                }}
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <Pencil className="size-3" /> Edit (saves a new version)
              </button>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                No hypothesis yet — write the bet you&rsquo;re making on this account, and why now.
              </p>
              <button onClick={() => setEditing(true)} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                <Pencil className="size-3" /> Write one
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
