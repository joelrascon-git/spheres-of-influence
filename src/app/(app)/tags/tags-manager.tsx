"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRightCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SingleSelect } from "@/components/fields";
import type { Tag } from "@/lib/types";
import { createTag, deleteTag, mergeTags, updateTag } from "./actions";

const COLORS = ["#ef6f2e", "#22c55e", "#3b82f6", "#eab308", "#a855f7", "#ef4444", "#14b8a6", "#64748b"];

type Draft = { id: string | null; name: string; description: string; color: string };

const emptyDraft: Draft = { id: null, name: "", description: "", color: "#ef6f2e" };

function TagDialog({
  draft,
  onChange,
  onClose,
  onSubmit,
  pending,
}: {
  draft: Draft | null;
  onChange: (d: Draft) => void;
  onClose: () => void;
  onSubmit: () => void;
  pending: boolean;
}) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{draft?.id ? "Edit tag" : "New tag"}</DialogTitle>
          <DialogDescription>
            Tags must have a description, so months later you still know why this slice of people exists.
          </DialogDescription>
        </DialogHeader>
        {draft && (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="tag-name">Name *</Label>
              <Input id="tag-name" autoFocus value={draft.name} onChange={(e) => onChange({ ...draft, name: e.target.value })} placeholder="e.g. AI skeptics" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tag-desc">Description *</Label>
              <Input
                id="tag-desc"
                value={draft.description}
                onChange={(e) => onChange({ ...draft, description: e.target.value })}
                placeholder="Who gets this tag, and why?"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tag-color">Color</Label>
              <div className="flex items-center gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Color ${c}`}
                    onClick={() => onChange({ ...draft, color: c })}
                    className="size-6 rounded-full ring-offset-2 ring-offset-popover hover:scale-110"
                    style={{ background: c, boxShadow: draft.color === c ? `0 0 0 2px ${c}` : undefined }}
                  />
                ))}
                <input
                  type="color"
                  value={draft.color}
                  onChange={(e) => onChange({ ...draft, color: e.target.value })}
                  className="ml-2 h-6 w-8 cursor-pointer rounded border bg-transparent"
                  aria-label="Custom color"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={pending || !draft.name.trim() || !draft.description.trim()}>
                {pending ? "Saving…" : draft.id ? "Save tag" : "Create tag"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function TagsManager({ tags, counts }: { tags: Tag[]; counts: Record<string, number> }) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [mergeFrom, setMergeFrom] = useState<Tag | null>(null);
  const [mergeInto, setMergeInto] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = () => {
    if (!draft) return;
    const input = { name: draft.name.trim(), description: draft.description.trim(), color: draft.color };
    start(async () => {
      const r = draft.id ? await updateTag(draft.id, input) : await createTag(input);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setDraft(null);
    });
  };

  return (
    <div className="px-6 py-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{tags.length} tag{tags.length === 1 ? "" : "s"}</p>
        <Button size="sm" onClick={() => setDraft({ ...emptyDraft })}>
          <Plus className="size-3.5" /> New tag
        </Button>
      </div>

      {tags.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm font-medium">No tags yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tags are slices of your people: “AI skeptics”, “went to the offsite”, “owns budget”.
          </p>
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {tags.map((t) => (
            <li key={t.id} className="group flex items-center gap-3 px-3 py-2.5 hover:bg-accent/40">
              <span className="size-3 shrink-0 rounded-full" style={{ background: t.color }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/contacts?tag=${t.id}`} className="truncate text-sm font-medium hover:underline">
                    {t.name}
                  </Link>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {counts[t.id] ?? 0} contact{(counts[t.id] ?? 0) === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground" title={t.description}>
                  {t.description}
                </p>
              </div>
              {mergeFrom?.id === t.id ? (
                <div className="flex items-center gap-1.5">
                  <SingleSelect
                    className="w-40"
                    options={tags.filter((o) => o.id !== t.id).map((o) => ({ value: o.id, label: o.name, color: o.color }))}
                    value={mergeInto}
                    placeholder="Merge into…"
                    onChange={setMergeInto}
                    searchable
                  />
                  <Button
                    size="sm"
                    disabled={!mergeInto || pending}
                    onClick={() =>
                      mergeInto &&
                      start(async () => {
                        const r = await mergeTags(t.id, mergeInto);
                        if (!r.ok) {
                          toast.error(r.error);
                          return;
                        }
                        toast.success(`Merged “${t.name}”.`);
                        setMergeFrom(null);
                        setMergeInto(null);
                      })
                    }
                  >
                    Merge
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setMergeFrom(null)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <span className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <button
                    type="button"
                    aria-label={`Merge ${t.name} into another tag`}
                    title="Merge into another tag"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setMergeFrom(t);
                      setMergeInto(null);
                    }}
                  >
                    <ArrowRightCircle className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Edit ${t.name}`}
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      setDraft({ id: t.id, name: t.name, description: t.description, color: t.color })
                    }
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${t.name}`}
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      if (!confirm(`Delete tag “${t.name}”? Contacts keep their data; they just lose this tag.`)) return;
                      start(async () => {
                        const r = await deleteTag(t.id);
                        if (!r.ok) toast.error(r.error);
                      });
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {draft && <TagDialog draft={draft} onChange={setDraft} onClose={() => setDraft(null)} onSubmit={submit} pending={pending} />}
    </div>
  );
}
