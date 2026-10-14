"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createContactFromExtraction, deleteDocument } from "../actions";

export type NewPersonData = {
  name: string;
  title: string | null;
  org: string | null;
  email: string | null;
};

/** One unresolved person from the extraction: a single click creates them and queues their proposals. */
export function NewPersonCard({ documentId, person }: { documentId: string; person: NewPersonData }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [added, setAdded] = useState<string | null>(null);

  if (added)
    return (
      <p className="rounded-lg border border-dashed px-4 py-3 text-xs text-muted-foreground">
        Created {person.name}.{" "}
        {added && (
          <a href={`/contacts/${added}`} className="text-primary hover:underline">
            Open their page
          </a>
        )}
      </p>
    );

  return (
    <li className="space-y-2 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-sm font-medium">{person.name}</span>
        {person.title && <span className="text-sm text-muted-foreground">{person.title}</span>}
      </div>
      <p className="text-xs text-muted-foreground">
        {[person.org, person.email].filter(Boolean).join(" · ") || "New person mentioned in this source"}
      </p>
      <Button
        size="xs"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await createContactFromExtraction(documentId, person.name);
            if (!r.ok) {
              toast.error(r.error);
              return;
            }
            if (!r.data) {
              toast.error("Created, but the page didn't refresh — reload to see them.");
              return;
            }
            setAdded(r.data.contactId);
            router.refresh();
          })
        }
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Add to this account
      </Button>
    </li>
  );
}

export function DeleteDocumentButton({ documentId, title }: { documentId: string; title: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Delete “${title}”? Accepted proposals keep their audit trail; the raw source is removed.`)) return;
        start(async () => {
          const r = await deleteDocument(documentId);
          if (!r.ok) {
            toast.error(r.error);
            return;
          }
          router.push("/ingest");
        });
      }}
    >
      {pending ? "Deleting…" : "Delete source"}
    </Button>
  );
}
