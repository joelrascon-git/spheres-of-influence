"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mic } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ingestDocument } from "./actions";

export type AccountOption = { id: string; name: string };

/**
 * The paste box for the live moment: a transcript or voice note goes in, notes
 * and a review-ready extraction come out on the document page.
 */
export function IngestForm({ accounts, preselect, aiReady }: { accounts: AccountOption[]; preselect: string; aiReady: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [text, setText] = useState("");

  const tooShort = text.trim().length > 0 && text.trim().length < 50;

  if (!aiReady)
    return (
      <div className="rounded-lg border border-dashed bg-card p-6 text-sm text-muted-foreground">
        AI is not configured. Add <span className="font-mono">ANTHROPIC_API_KEY</span> to{" "}
        <span className="font-mono">.env.local</span> and restart the dev server to ingest transcripts.
      </div>
    );

  return (
    <form
      className="space-y-3 rounded-lg border bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const accountId = String(fd.get("account_id") ?? "");
        if (!accountId) {
          toast.error("Pick an account first.");
          return;
        }
        start(async () => {
          const r = await ingestDocument({
            account_id: accountId,
            title: String(fd.get("title") ?? "").trim() || undefined,
            text,
          });
          if (!r.ok || !r.data) {
            toast.error(r.ok ? "Ingest ran, but the review page didn't open." : r.error);
            return;
          }
          router.push(`/ingest/${r.data.documentId}`);
        });
      }}
    >
      <div className="flex items-center gap-2">
        <Mic className="size-4 text-muted-foreground" />
        <p className="text-sm font-medium">Paste a transcript or voice note</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Account</span>
          <select
            name="account_id"
            defaultValue={preselect}
            className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm"
            required
          >
            <option value="" disabled>
              Pick an account…
            </option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Title (optional)</span>
          <input
            name="title"
            placeholder="e.g. AMEX discovery — Priya Sharma"
            className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm"
            maxLength={300}
          />
        </label>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={12}
        maxLength={200000}
        placeholder={
          "Paste the raw transcript, a Wisr-style voice note, or free-form notes here…\n\nThe call type is detected, notes are generated under your rules, and every change is proposed for review."
        }
        className="min-h-48 w-full rounded-lg border border-border bg-background p-3 font-mono text-xs leading-relaxed"
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={pending || text.trim().length < 50}>
          {pending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" /> Generating notes & extraction…
            </>
          ) : (
            "Ingest"
          )}
        </Button>
        <span className="text-xs text-muted-foreground">
          {pending
            ? "Two model calls run back to back — this can take a minute."
            : tooShort
              ? "At least 50 characters."
              : `${text.length.toLocaleString()} / 200,000 characters`}
        </span>
      </div>
    </form>
  );
}
