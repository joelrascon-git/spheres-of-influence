"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { BookmarkPlus, ChevronLeft, ChevronRight, Download, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/page-header";
import { ContactAvatar, isGone, KeyStar, PersonaBadge, StatusBadge, TagChip } from "@/components/contact-bits";
import { QualityIndicator, SingleSelect } from "@/components/fields";
import { SearchBar } from "@/components/search-bar";
import { FacetBar } from "@/components/facet-bar";
import { DEFAULT_STATUSES, PERSONA_CODES, seniorityLabel } from "@/lib/constants";
import type { ContactListItem } from "@/lib/data";
import type { ContactSearchResult } from "@/lib/contacts-query";
import { highlightTerms, parseQuery, type Facets } from "@/lib/search/parse";
import { facetsToParams } from "@/lib/search/url";
import { tenure } from "@/lib/tenure";
import type { FieldDefinition, Tag } from "@/lib/types";
import { cn } from "@/lib/utils";
import { bulkTag, bulkUpdateContacts, deleteContact, deleteView, saveView, type ActionResult } from "./actions";

type ViewRow = { id: string; name: string; query: string; filters: Record<string, unknown> };

const SORTS: [string, string][] = [
  ["default", "Key & seniority"],
  ["name", "Last name"],
  ["updated", "Last updated"],
  ["contacted", "Last contacted"],
  ["role_start", "Role start"],
  ["created", "Newest"],
];

/** Wraps search-term matches in a highlight. Terms come from the positive part of the query. */
function Highlight({ text, terms }: { text: string | null | undefined; terms: string[] }) {
  const t = text ?? "";
  const escaped = terms.filter((x) => x.length >= 2).map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!t || escaped.length === 0) return <>{t || null}</>;
  const parts = t.split(new RegExp(`(${escaped.join("|")})`, "i"));
  if (parts.length === 1) return <>{t}</>;
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded-sm bg-primary/25 px-0.5 text-foreground">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export function ContactsView({
  query,
  facets,
  sort,
  page,
  pageSize,
  result,
  accounts,
  orgs,
  tags,
  fields,
  views,
  cities,
}: {
  query: string;
  facets: Facets;
  sort: string;
  page: number;
  pageSize: number;
  result: ContactSearchResult;
  accounts: { id: string; name: string }[];
  orgs: { id: string; name: string; account_id: string }[];
  tags: Tag[];
  fields: FieldDefinition[];
  views: ViewRow[];
  cities: string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  const terms = useMemo(() => highlightTerms(parseQuery(query)), [query]);
  const accountName = useMemo(() => new Map(accounts.map((a) => [a.id, a.name])), [accounts]);
  const orgName = useMemo(() => new Map(orgs.map((o) => [o.id, o.name])), [orgs]);
  const tagById = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags]);
  const personaOptions = fields.find((f) => f.key === "personas")?.options ?? PERSONA_CODES.map((p) => p.code);
  const statusOptions = fields.find((f) => f.key === "statuses")?.options ?? DEFAULT_STATUSES;
  const show = useMemo(() => {
    const m = new Map(fields.map((f) => [f.key, f.show_in_list]));
    return (key: string) => m.get(key) ?? true;
  }, [fields]);

  /** Push a new q/facets/sort/page to the URL. Any change except an explicit page resets to page 1. */
  const go = (patch: { q?: string; facets?: Facets; sort?: string; page?: number }) => {
    const p = facetsToParams(patch.facets ?? facets);
    const q = patch.q !== undefined ? patch.q : query;
    if (q) p.set("q", q);
    const s = patch.sort !== undefined ? patch.sort : sort;
    if (s && s !== "default") p.set("sort", s);
    const pg = patch.page ?? 1;
    if (pg > 1) p.set("page", String(pg));
    router.push(`/contacts${p.size ? `?${p}` : ""}`, { scroll: false });
  };

  const run = (fn: () => Promise<ActionResult>) => {
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) toast.error(r.error);
      else setSelected(new Set());
    });
  };

  const ids = result.contacts.map((c) => c.id);
  const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));
  const someSelected = ids.some((id) => selected.has(id));
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });

  const pages = Math.max(1, Math.ceil(result.total / pageSize));
  const exportHref = useMemo(() => {
    const p = facetsToParams(facets);
    if (query) p.set("q", query);
    if (sort !== "default") p.set("sort", sort);
    return `/contacts/export?${p.toString()}`;
  }, [facets, query, sort]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-2 border-b px-6 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchBar className="min-w-64 flex-1" value={query} onSubmit={(q) => go({ q })} />
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
              <BookmarkPlus className="size-3.5" /> Views
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {views.length === 0 ? (
                <p className="px-2 py-1.5 text-xs text-muted-foreground">No saved views yet.</p>
              ) : (
                views.map((v) => (
                  <div key={v.id} className="group flex items-center gap-1 rounded-md px-1.5 py-1 hover:bg-accent">
                    <button
                      type="button"
                      className="flex-1 truncate text-left text-sm"
                      title={`Apply view “${v.name}”`}
                      onClick={() => go({ q: v.query, facets: v.filters as Facets })}
                    >
                      {v.name}
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete view ${v.name}`}
                      className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                      onClick={() => startTransition(async () => void (await deleteView(v.id)))}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))
              )}
              <DropdownMenuSeparator />
              <SaveViewItem query={query} facets={facets} />
            </DropdownMenuContent>
          </DropdownMenu>
          <Select value={sort} onValueChange={(s) => go({ sort: String(s) })}>
            <SelectTrigger size="sm" className="w-40">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" nativeButton={false} render={<a href={exportHref} />}>
            <Download className="size-3.5" /> Export
          </Button>
        </div>
        <FacetBar
          facets={facets}
          onChange={(f) => go({ facets: f })}
          sources={{ accounts, orgs, tags, personas: personaOptions, statuses: statusOptions, cities }}
        />
      </div>

      <div className="flex items-center justify-between gap-4 px-6 py-2 text-xs text-muted-foreground">
        {result.error ? (
          <span className="text-destructive">Search error: {result.error}</span>
        ) : (
          <span>
            {result.contacts.length === 0 ? "No contacts" : `${(page - 1) * pageSize + 1}–${(page - 1) * pageSize + result.contacts.length} of ${result.total.toLocaleString()} contacts`}
          </span>
        )}
        {pages > 1 && (
          <span className="flex items-center gap-2">
            <span>
              Page {page} of {pages}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Previous page"
              disabled={page <= 1}
              onClick={() => go({ page: page - 1 })}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Next page"
              disabled={page >= pages}
              onClick={() => go({ page: page + 1 })}
            >
              <ChevronRight />
            </Button>
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-6 pb-28">
        {result.contacts.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title={query || Object.keys(facets).length ? "No contacts match this search" : "No contacts yet"}
              description={
                query || Object.keys(facets).length
                  ? "Try removing filters, or check the syntax help in the search bar."
                  : "Import an Evaboot CSV of LinkedIn leads to get started. Your contacts, orgs and influence map grow from there."
              }
              action={
                query || Object.keys(facets).length ? (
                  <Button variant="outline" size="sm" onClick={() => go({ q: "", facets: {} })}>
                    Clear search
                  </Button>
                ) : (
                  <Button size="sm" nativeButton={false} render={<Link href="/import" />}>
                    <Plus className="size-3.5" /> Import contacts
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-9">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={!allSelected && someSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Select all on this page"
                  />
                </TableHead>
                {show("is_key") && <TableHead className="w-8" aria-label="Key contact" />}
                <TableHead>Name</TableHead>
                {show("title") && <TableHead className="min-w-56">Title</TableHead>}
                {show("account_id") && <TableHead className="min-w-40">Account / Org</TableHead>}
                {show("seniority") && <TableHead>Seniority</TableHead>}
                {show("personas") && <TableHead className="min-w-32">Personas</TableHead>}
                {show("statuses") && <TableHead className="min-w-36">Status</TableHead>}
                {show("tags") && <TableHead className="min-w-36">Tags</TableHead>}
                {show("tenure") && <TableHead>Tenure</TableHead>}
                {show("email") && <TableHead className="min-w-44">Email</TableHead>}
                {show("location") && <TableHead className="min-w-36">Location</TableHead>}
                {show("last_contacted") && <TableHead>Last contacted</TableHead>}
                {show("updated_at") && <TableHead>Updated</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.contacts.map((c) => (
                <ContactRow
                  key={c.id}
                  contact={c}
                  terms={terms}
                  selected={selected.has(c.id)}
                  onToggle={() => toggle(c.id)}
                  show={show}
                  accountName={accountName.get(c.account_id ?? "") ?? null}
                  orgName={c.org_id ? (orgName.get(c.org_id) ?? null) : null}
                  tagChips={(result.tagsByContact[c.id] ?? []).map((id) => tagById.get(id)).filter(Boolean) as Tag[]}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {selected.size > 0 && (
        <div className="sticky bottom-0 z-20 flex flex-wrap items-center gap-2 border-t bg-popover/95 px-6 py-2 backdrop-blur">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
            <X className="size-3.5" /> Clear
          </Button>
          <span className="mx-1 h-4 w-px bg-border" />
          <SingleSelect
            className="w-44"
            options={statusOptions.map((s) => ({ value: s, label: s }))}
            value={null}
            placeholder="Add status…"
            onChange={(v) => v && run(() => bulkUpdateContacts([...selected], { statuses: [v] }, "add"))}
          />
          <SingleSelect
            className="w-44"
            options={statusOptions.map((s) => ({ value: s, label: s }))}
            value={null}
            placeholder="Remove status…"
            onChange={(v) => v && run(() => bulkUpdateContacts([...selected], { statuses: [v] }, "remove"))}
          />
          <SingleSelect
            className="w-36"
            options={[
              { value: "c_level", label: "C-Level" },
              { value: "vp", label: "VP" },
              { value: "director", label: "Director" },
              { value: "manager", label: "Manager" },
              { value: "ic", label: "IC" },
            ]}
            value={null}
            placeholder="Set seniority…"
            onChange={(v) => v && run(() => bulkUpdateContacts([...selected], { seniority: v as ContactListItem["seniority"] }))}
          />
          <SingleSelect
            className="w-40"
            options={orgs.map((o) => ({ value: o.id, label: o.name, hint: accountName.get(o.account_id) }))}
            value={null}
            placeholder="Move to org…"
            onChange={(v) => v && run(() => bulkUpdateContacts([...selected], { org_id: v }))}
          />
          {tags.length > 0 && (
            <>
              <SingleSelect
                className="w-36"
                options={tags.map((t) => ({ value: t.id, label: t.name, color: t.color }))}
                value={null}
                placeholder="Add tag…"
                onChange={(v) => v && run(() => bulkTag([...selected], v, false))}
              />
              <SingleSelect
                className="w-40"
                options={tags.map((t) => ({ value: t.id, label: t.name, color: t.color }))}
                value={null}
                placeholder="Remove tag…"
                onChange={(v) => v && run(() => bulkTag([...selected], v, true))}
              />
            </>
          )}
          <Button size="sm" onClick={() => run(() => bulkUpdateContacts([...selected], { is_key: true }))}>
            <KeyStar active className="size-3.5" /> Mark key
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (!confirm(`Delete ${selected.size} contact${selected.size === 1 ? "" : "s"}? This cannot be undone.`)) return;
              run(async () => {
                for (const id of selected) {
                  const r = await deleteContact(id);
                  if (!r.ok) return r;
                }
                return { ok: true as const };
              });
            }}
          >
            <Trash2 className="size-3.5" /> Delete
          </Button>
        </div>
      )}
    </div>
  );
}

function ContactRow({
  contact: c,
  terms,
  selected,
  onToggle,
  show,
  accountName,
  orgName,
  tagChips,
}: {
  contact: ContactListItem;
  terms: string[];
  selected: boolean;
  onToggle: () => void;
  show: (key: string) => boolean;
  accountName: string | null;
  orgName: string | null;
  tagChips: Tag[];
}) {
  const gone = isGone(c.statuses);
  const t = tenure(c.role_start, c.company_start);
  return (
    <TableRow className={cn(gone && "opacity-55", selected && "bg-muted/60")}>
      <TableCell className="w-9">
        <Checkbox checked={selected} onCheckedChange={onToggle} aria-label={`Select ${c.full_name}`} />
      </TableCell>
      {show("is_key") && (
        <TableCell className="w-8">
          {c.is_key && <KeyStar active />}
        </TableCell>
      )}
      <TableCell>
        <Link href={`/contacts/${c.id}`} className="flex items-center gap-2">
          <ContactAvatar name={c.full_name} path={c.avatar_path} size={26} dimmed={gone} />
          <span className="font-medium">
            <Highlight text={c.full_name} terms={terms} />
          </span>
        </Link>
      </TableCell>
      {show("title") && (
        <TableCell className="max-w-64">
          <span className="block truncate text-[13px] text-muted-foreground" title={c.title ?? undefined}>
            <Highlight text={c.title} terms={terms} />
          </span>
        </TableCell>
      )}
      {show("account_id") && (
        <TableCell>
          <span className="block max-w-40 truncate text-[13px]">{accountName ?? "—"}</span>
          {orgName && (
            <span className="block max-w-40 truncate text-xs text-muted-foreground" title={orgName}>
              {orgName}
            </span>
          )}
        </TableCell>
      )}
      {show("seniority") && <TableCell className="text-[13px]">{seniorityLabel(c.seniority) || "—"}</TableCell>}
      {show("personas") && (
        <TableCell>
          <div className="flex max-w-44 flex-wrap gap-1">
            {c.personas.slice(0, 2).map((p) => (
              <PersonaBadge key={p} persona={p} />
            ))}
            {c.personas.length > 2 && (
              <span className="text-xs text-muted-foreground" title={c.personas.slice(2).join(", ")}>
                +{c.personas.length - 2}
              </span>
            )}
          </div>
        </TableCell>
      )}
      {show("statuses") && (
        <TableCell>
          <div className="flex max-w-44 flex-wrap gap-1">
            {c.statuses.slice(0, 2).map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
            {c.statuses.length > 2 && (
              <span className="text-xs text-muted-foreground" title={c.statuses.slice(2).join(", ")}>
                +{c.statuses.length - 2}
              </span>
            )}
          </div>
        </TableCell>
      )}
      {show("tags") && (
        <TableCell>
          <div className="flex max-w-44 flex-wrap gap-1">
            {tagChips.slice(0, 2).map((t) => (
              <TagChip key={t.id} name={t.name} color={t.color} />
            ))}
            {tagChips.length > 2 && (
              <span className="text-xs text-muted-foreground" title={tagChips.slice(2).map((t) => t.name).join(", ")}>
                +{tagChips.length - 2}
              </span>
            )}
          </div>
        </TableCell>
      )}
      {show("tenure") && (
        <TableCell className="text-[13px]">
          <span title={t.label || undefined}>{t.short || "—"}</span>
        </TableCell>
      )}
      {show("email") && (
        <TableCell className="max-w-44">
          {c.email ? (
            <span className="flex items-center gap-1.5">
              <QualityIndicator value={c.email_quality} />
              <a href={`mailto:${c.email}`} className="truncate text-[13px] hover:underline">
                {c.email}
              </a>
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
      )}
      {show("location") && (
        <TableCell className="max-w-36">
          <span className="block truncate text-[13px] text-muted-foreground" title={c.location ?? undefined}>
            {c.location_city ?? c.location ?? "—"}
          </span>
        </TableCell>
      )}
      {show("last_contacted") && (
        <TableCell className="text-[13px]">
          {c.last_contacted ? format(parseISO(c.last_contacted), "MMM d, yyyy") : <span className="text-muted-foreground">never</span>}
        </TableCell>
      )}
      {show("updated_at") && (
        <TableCell className="text-[13px] text-muted-foreground">{format(parseISO(c.updated_at), "MMM d, yyyy")}</TableCell>
      )}
    </TableRow>
  );
}

function SaveViewItem({ query, facets }: { query: string; facets: Facets }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, start] = useTransition();

  return (
    <>
      <DropdownMenuItem render={<button type="button" />} onClick={() => setOpen(true)}>
        <BookmarkPlus className="size-3.5" /> Save current view…
      </DropdownMenuItem>
      <Dialog open={open} onOpenChange={(o) => setOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save view</DialogTitle>
            <DialogDescription>
              Saves the current search and filters so you can return to them from the Views menu.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Key AI leaders"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (name.trim()) submit();
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" disabled={pending || !name.trim()} onClick={submit}>
              {pending ? "Saving…" : "Save view"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  function submit() {
    start(async () => {
      const r = await saveView(name.trim(), "contacts", query, facets);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("View saved");
      setName("");
      setOpen(false);
    });
  }
}
