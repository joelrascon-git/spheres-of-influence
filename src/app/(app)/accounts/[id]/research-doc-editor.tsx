"use client";

import { useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { Loader2, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RichTextEditor, RichTextView } from "@/components/rich-text";
import { updateResearchDoc } from "@/app/(app)/accounts/actions";
import { DOC_TYPES } from "@/lib/constants";
import type { ResearchDoc } from "@/lib/types";

export const docTypeLabel = (t: string) => DOC_TYPES.find((d) => d.value === t)?.label ?? t;

/** One knowledge-base or research document: cited content the seller can correct in place. */
export function ResearchDocItem({ doc }: { doc: ResearchDoc }) {
  const [editing, setEditing] = useState(false);
  const [html, setHtml] = useState(doc.body_html);
  const [pending, start] = useTransition();

  return (
    <li>
      <details className="rounded-lg border bg-card" open={editing}>
        <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-4 py-2.5 text-sm">
          <span className="rounded bg-accent px-1.5 py-0.5 text-[11px] text-accent-foreground">{docTypeLabel(doc.doc_type)}</span>
          <span className="font-medium">{doc.title}</span>
          <span className="ml-auto text-xs text-muted-foreground">updated {format(parseISO(doc.updated_at), "MMM d, yyyy")}</span>
        </summary>
        <div className="space-y-2 border-t px-4 py-3">
          {editing ? (
            <>
              <RichTextEditor value={html} onChange={setHtml} minHeight="min-h-64" />
              <div className="flex items-center gap-2">
                <Button
                  size="xs"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const r = await updateResearchDoc(doc.id, html);
                      if (!r.ok) {
                        toast.error(r.error);
                        return;
                      }
                      setEditing(false);
                      toast.success("Document updated.");
                    })
                  }
                >
                  {pending ? <Loader2 className="size-3 animate-spin" /> : "Save"}
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => {
                    setHtml(doc.body_html);
                    setEditing(false);
                  }}
                  className="text-muted-foreground"
                >
                  <X className="size-3" /> Cancel
                </Button>
                <span className="text-[11px] text-muted-foreground">
                  Your edit stays until the research corpus is re-loaded from Admin.
                </span>
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              <RichTextView html={doc.body_html} className="text-sm" />
              <button
                onClick={() => {
                  setHtml(doc.body_html);
                  setEditing(true);
                }}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <Pencil className="size-3" /> Edit this document
              </button>
            </div>
          )}
        </div>
      </details>
    </li>
  );
}
