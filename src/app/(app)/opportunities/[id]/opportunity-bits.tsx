"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EyeOff, Eye, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ITEM_STATUS_META, ITEM_STATUSES, OPPORTUNITY_STATUSES, type ItemStatus } from "@/lib/workflow/qualify";
import { cn } from "@/lib/utils";
import {
  addQualificationElement,
  addQualificationEvidence,
  deleteOpportunity,
  deleteQualificationEvidence,
  setQualificationItem,
  updateOpportunity,
} from "../actions";

export type EvidenceRow = {
  id: string;
  note: string;
  contact_id: string | null;
  contact_name: string | null;
  created_at: string;
};

/** The deal header: name, status, amount, close date, next step — saved inline. */
export function OppHeaderForm({
  opportunity,
}: {
  opportunity: { id: string; name: string; status: string; amount: number | null; close_date: string | null; next_step: string | null };
}) {
  const [pending, start] = useTransition();
  return (
    <form
      className="grid grid-cols-2 gap-3 sm:grid-cols-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const amount = String(fd.get("amount") ?? "").trim();
        start(async () => {
          const r = await updateOpportunity(opportunity.id, {
            name: String(fd.get("name") ?? "").trim(),
            status: String(fd.get("status") ?? "open") as (typeof OPPORTUNITY_STATUSES)[number],
            amount: amount ? Number(amount) : null,
            close_date: String(fd.get("close_date") ?? "") || null,
            next_step: String(fd.get("next_step") ?? "").trim() || null,
          });
          if (!r.ok) toast.error(r.error);
        });
      }}
    >
      <label className="col-span-2 space-y-1">
        <span className="text-xs font-medium text-muted-foreground">Name</span>
        <input name="name" defaultValue={opportunity.name} maxLength={200} className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm" />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-medium text-muted-foreground">Status</span>
        <select name="status" defaultValue={opportunity.status} className="h-8 w-full rounded-lg border border-border bg-background px-2 text-sm">
          {OPPORTUNITY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1">
        <span className="text-xs font-medium text-muted-foreground">Amount</span>
        <input name="amount" type="number" min="0" step="1000" defaultValue={opportunity.amount ?? ""} className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm" />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-medium text-muted-foreground">Close date</span>
        <input name="close_date" type="date" defaultValue={opportunity.close_date ?? ""} className="h-8 w-full rounded-lg border border-border bg-background px-2 text-sm" />
      </label>
      <label className="col-span-2 space-y-1 sm:col-span-4">
        <span className="text-xs font-medium text-muted-foreground">Next step</span>
        <input name="next_step" defaultValue={opportunity.next_step ?? ""} maxLength={2000} className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm" placeholder="The single next action" />
      </label>
      <div className="flex items-end">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : "Save"}
        </Button>
      </div>
    </form>
  );
}

/** One MEDDPICC element: status, summary, evidence with linked people, hide. */
export function ItemCard({
  item,
  evidence,
  contacts,
}: {
  item: { id: string; label: string; status: string; summary: string | null };
  evidence: EvidenceRow[];
  contacts: { id: string; name: string }[];
}) {
  const [pending, start] = useTransition();
  const [summary, setSummary] = useState(item.summary ?? "");
  const [label, setLabel] = useState(item.label);
  const [adding, setAdding] = useState(false);

  const patch = (p: Parameters<typeof setQualificationItem>[1]) =>
    start(async () => {
      const r = await setQualificationItem(item.id, p);
      if (!r.ok) toast.error(r.error);
    });

  return (
    <li className="space-y-2 rounded-lg border bg-card p-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={() => label.trim() && label.trim() !== item.label && patch({ label: label.trim() })}
          maxLength={100}
          className="min-w-24 flex-1 rounded border border-transparent bg-transparent px-1 text-sm font-medium hover:border-border focus:border-border focus:outline-none"
          title="Rename this element (affects this deal only)"
        />
        <div className="flex items-center gap-1">
          {ITEM_STATUSES.map((s) => (
            <button
              key={s}
              disabled={pending}
              onClick={() => patch({ status: s })}
              title={s === "unknown" ? "Nothing known yet" : s === "identified" ? "Identified" : "Validated"}
              className={cn(
                "rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors",
                item.status === s ? ITEM_STATUS_META[s as ItemStatus].className : "border-border/50 text-muted-foreground/60 hover:border-border hover:text-muted-foreground",
              )}
            >
              {ITEM_STATUS_META[s as ItemStatus].label}
            </button>
          ))}
        </div>
        <button
          title={item.status === "unknown" ? "Nothing known yet" : "Hide this element from the board"}
          disabled={pending}
          onClick={() => patch({ hidden: true })}
          className="text-muted-foreground/50 hover:text-muted-foreground"
        >
          <EyeOff className="size-3.5" />
        </button>
      </div>

      <textarea
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        onBlur={() => summary !== (item.summary ?? "") && patch({ summary: summary || null })}
        rows={2}
        maxLength={5000}
        placeholder="What you know about this element…"
        className="w-full rounded-lg border border-border bg-background p-2 text-xs leading-relaxed"
      />

      <ul className="space-y-1">
        {evidence.map((e) => (
          <li key={e.id} className="flex items-start gap-1.5 text-xs">
            <span className="min-w-0 flex-1 text-muted-foreground">
              {e.contact_name && <span className="font-medium text-foreground">{e.contact_name}: </span>}
              {e.note}
              <span className="ml-1 text-muted-foreground/60">{format(new Date(e.created_at), "MMM d")}</span>
            </span>
            <button
              title="Delete evidence"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await deleteQualificationEvidence(e.id);
                  if (!r.ok) toast.error(r.error);
                })
              }
              className="mt-0.5 text-muted-foreground/50 hover:text-foreground"
            >
              <Trash2 className="size-3" />
            </button>
          </li>
        ))}
      </ul>

      {adding ? (
        <form
          className="flex flex-wrap items-center gap-1.5"
          onSubmit={(ev) => {
            ev.preventDefault();
            const fd = new FormData(ev.currentTarget);
            start(async () => {
              const r = await addQualificationEvidence(item.id, {
                note: String(fd.get("note") ?? "").trim(),
                contact_id: String(fd.get("contact_id") ?? "") || null,
              });
              if (!r.ok) {
                toast.error(r.error);
                return;
              }
              setAdding(false);
            });
          }}
        >
          <input name="note" required maxLength={2000} placeholder="Evidence — a quote or fact" className="h-8 min-w-32 flex-1 rounded-lg border border-border bg-background px-2.5 text-xs" />
          <select name="contact_id" className="h-8 rounded-lg border border-border bg-background px-2 text-xs text-muted-foreground">
            <option value="">No person</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Button type="submit" size="xs" disabled={pending}>
            {pending ? <Loader2 className="size-3 animate-spin" /> : "Add"}
          </Button>
        </form>
      ) : (
        <button onClick={() => setAdding(true)} className="text-xs font-medium text-primary hover:underline">
          + Evidence
        </button>
      )}
    </li>
  );
}

/** Hidden elements collapse to one row so the board stays focused. */
export function HiddenItemRow({ item }: { item: { id: string; label: string } }) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await setQualificationItem(item.id, { hidden: false });
          if (!r.ok) toast.error(r.error);
        })
      }
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      title="Unhide this element"
    >
      <Eye className="size-3" /> {item.label}
    </button>
  );
}

/** Adds a custom element to this deal's board. */
export function AddElementForm({ opportunityId }: { opportunityId: string }) {
  const [pending, start] = useTransition();
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const input = e.currentTarget.elements.namedItem("label") as HTMLInputElement | null;
        if (!input?.value.trim()) return;
        const label = input.value;
        start(async () => {
          const r = await addQualificationElement(opportunityId, label);
          if (!r.ok) {
            toast.error(r.error);
            return;
          }
          input.value = "";
        });
      }}
    >
      <input
        name="label"
        maxLength={100}
        placeholder="Custom element (e.g. Security review)"
        className="h-8 min-w-40 flex-1 rounded-lg border border-border bg-background px-2.5 text-sm"
      />
      <Button type="submit" size="xs" variant="outline" disabled={pending}>
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Add element
      </Button>
    </form>
  );
}

export function DeleteOpportunityButton({ opportunityId, name }: { opportunityId: string; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Delete “${name}”? The board and its evidence go with it.`)) return;
        start(async () => {
          const r = await deleteOpportunity(opportunityId);
          if (!r.ok) {
            toast.error(r.error);
            return;
          }
          router.back();
        });
      }}
    >
      <Trash2 className="size-3.5" /> {pending ? "Deleting…" : "Delete"}
    </Button>
  );
}
