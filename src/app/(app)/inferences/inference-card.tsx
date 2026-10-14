"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, ExternalLink, Undo2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfidenceBadge } from "@/components/contact-bits";
import type { Evidence } from "@/lib/types";
import { cn } from "@/lib/utils";
import { acceptInference, rejectInference, undoInference } from "./actions";

export const KIND_LABELS: Record<string, string> = {
  persona: "Persona",
  seniority_level: "Seniority level",
  org_assignment: "Org assignment",
  key_person: "Key person",
  reporting_line: "Reporting line",
  initiative_link: "Initiative link",
  challenge_link: "Challenge link",
  field: "Field change",
  summary: "Summary",
  influence_edge: "Influence edge",
};

const SOURCE_LABELS: Record<string, string> = {
  research: "Research",
  import: "Import",
  ai: "AI",
  manual: "Manual",
};

export type InferenceCardData = {
  id: string;
  kind: string;
  description: string;
  confidence: string;
  source: string;
  subjectLabel?: string | null;
  subjectHref?: string | null;
  rationale: string | null;
  evidence: Evidence[];
  /** Defaults to pending; accepted rows render Undo instead of Accept / Reject. */
  status?: "pending" | "accepted" | "rejected";
  /** True when an undo payload was captured at accept time. */
  undoable?: boolean;
};

/** One proposal: what it would write, the evidence behind it, and the review action. */
export function InferenceCard({ data, className }: { data: InferenceCardData; className?: string }) {
  const [pending, start] = useTransition();
  const [gone, setGone] = useState<"accepted" | "rejected" | "undone" | null>(null);
  const status = data.status ?? "pending";
  if (gone)
    return (
      <p className={cn("rounded-lg border border-dashed px-4 py-3 text-xs text-muted-foreground", className)}>
        {gone === "accepted" ? "Applied to the record." : gone === "undone" ? "Undone — back in the review queue." : "Rejected."}
      </p>
    );

  return (
    <li className={cn("space-y-2 rounded-lg border bg-card p-4", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded bg-accent px-1.5 py-0.5 text-[11px] font-medium text-accent-foreground">
          {KIND_LABELS[data.kind] ?? data.kind}
        </span>
        <span className="text-sm font-medium">{data.description}</span>
        {data.subjectHref ? (
          <Link href={data.subjectHref} className="text-sm text-primary hover:underline">
            {data.subjectLabel}
          </Link>
        ) : (
          data.subjectLabel && <span className="text-sm text-muted-foreground">{data.subjectLabel}</span>
        )}
        <span className="ml-auto flex items-center gap-1.5">
          <ConfidenceBadge confidence={data.confidence} />
          <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
            {SOURCE_LABELS[data.source] ?? data.source}
          </span>
        </span>
      </div>
      {data.rationale && <p className="text-xs text-muted-foreground">{data.rationale}</p>}
      {data.evidence.length > 0 && (
        <ul className="space-y-1">
          {data.evidence.slice(0, 4).map((e, i) => (
            <li key={i} className="flex flex-wrap items-baseline gap-1.5 text-xs">
              <ConfidenceBadge confidence={e.confidence} />
              <span className="text-muted-foreground">“{e.claim}”</span>
              {e.source_url && (
                <a href={e.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-primary hover:underline">
                  {e.source_label ?? "source"} <ExternalLink className="size-3" />
                </a>
              )}
            </li>
          ))}
          {data.evidence.length > 4 && (
            <li className="text-xs text-muted-foreground">+{data.evidence.length - 4} more evidence items</li>
          )}
        </ul>
      )}
      {status === "pending" ? (
        <div className="flex items-center gap-2 pt-0.5">
          <Button
            size="xs"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await acceptInference(data.id);
                if (!r.ok) {
                  toast.error(r.error);
                  return;
                }
                setGone("accepted");
              })
            }
          >
            <Check className="size-3.5" /> Accept
          </Button>
          <Button
            size="xs"
            variant="outline"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await rejectInference(data.id);
                if (!r.ok) {
                  toast.error(r.error);
                  return;
                }
                setGone("rejected");
              })
            }
          >
            <X className="size-3.5" /> Reject
          </Button>
        </div>
      ) : status === "accepted" && data.undoable ? (
        <div className="flex items-center gap-2 pt-0.5">
          <Button
            size="xs"
            variant="outline"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await undoInference(data.id);
                if (!r.ok) {
                  toast.error(r.error);
                  return;
                }
                setGone("undone");
              })
            }
          >
            <Undo2 className="size-3.5" /> Undo
          </Button>
        </div>
      ) : null}
    </li>
  );
}
