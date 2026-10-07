"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, ChevronRight, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineText, RichTextField, SingleSelect } from "@/components/fields";
import { PARENT_RELATIONSHIP } from "@/lib/constants";
import type { Account, FieldDefinition, Org } from "@/lib/types";
import { cn } from "@/lib/utils";
import { createAccount, createOrg, deleteAccount, deleteOrg, updateAccount, updateOrg } from "./actions";

const rowClass = "flex items-center gap-2";
const labelClass = "w-28 shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground";

function useAccountSaver(id: string) {
  const [pending, start] = useTransition();
  const save = (patch: Parameters<typeof updateAccount>[1]) =>
    start(async () => {
      const r = await updateAccount(id, patch);
      if (!r.ok) toast.error(r.error);
    });
  return { pending, save };
}

/** Numeric InlineText that keeps null when blank. */
function NumberText({ value, onSave }: { value: number | null; onSave: (v: number | null) => void }) {
  return <InlineText value={value == null ? null : String(value)} type="number" placeholder="—" onSave={(v) => onSave(v ? Number(v) : null)} />;
}

export function AccountFactsPanel({ account, fields }: { account: Account; fields: FieldDefinition[] }) {
  const { save } = useAccountSaver(account.id);
  const custom = fields.filter((f) => !f.is_system && f.show_in_profile);
  const setCustom = (key: string, v: unknown) => save({ custom_fields: { ...(account.custom_fields ?? {}), [key]: v } });

  return (
    <section className="space-y-2.5 rounded-lg border bg-card p-4">
      <h2 className="text-sm font-semibold">Company facts</h2>
      <div className={rowClass}>
        <span className={labelClass}>Domain</span>
        <InlineText value={account.domain} placeholder="Add domain…" onSave={(v) => save({ domain: v || null })} />
      </div>
      <div className={rowClass}>
        <span className={labelClass}>Website</span>
        <InlineText
          value={account.website}
          placeholder="Add website…"
          type="url"
          onSave={(v) => save({ website: v || null })}
        />
      </div>
      <div className={rowClass}>
        <span className={labelClass}>Industry</span>
        <InlineText value={account.industry} placeholder="Add industry…" onSave={(v) => save({ industry: v || null })} />
      </div>
      <div className={rowClass}>
        <span className={labelClass}>Employees</span>
        <NumberText value={account.employee_count} onSave={(v) => save({ employee_count: v })} />
      </div>
      <div className={rowClass}>
        <span className={labelClass}>Engineers</span>
        <NumberText value={account.engineer_count} onSave={(v) => save({ engineer_count: v })} />
      </div>
      <div className={rowClass}>
        <span className={labelClass}>Founded</span>
        <NumberText value={account.year_founded} onSave={(v) => save({ year_founded: v })} />
      </div>
      {(account.revenue_min_musd != null || account.revenue_max_musd != null) && (
        <div className={rowClass}>
          <span className={labelClass}>Revenue</span>
          <span className="text-sm text-muted-foreground">
            ${(account.revenue_min_musd ?? "?").toLocaleString()}M – ${(account.revenue_max_musd ?? "?").toLocaleString()}M
          </span>
        </div>
      )}
      <div className={rowClass}>
        <span className={labelClass}>HQ</span>
        <InlineText value={account.hq} placeholder="Add HQ…" onSave={(v) => save({ hq: v || null })} />
      </div>
      <div className={cn(rowClass, "items-start")}>
        <span className={labelClass}>Description</span>
        <InlineText
          className="flex-1"
          multiline
          value={account.description}
          placeholder="Add description…"
          onSave={(v) => save({ description: v || null })}
        />
      </div>
      <div className={cn(rowClass, "items-start")}>
        <span className={labelClass}>Specialities</span>
        <InlineText
          className="flex-1"
          multiline
          value={account.specialities}
          placeholder="Add specialities…"
          onSave={(v) => save({ specialities: v || null })}
        />
      </div>
      {custom.map((f) => {
        const v = account.custom_fields?.[f.key];
        return (
          <div key={f.id} className={rowClass}>
            <span className={labelClass} title={f.help_text ?? undefined}>
              {f.label}
            </span>
            <InlineText
              value={typeof v === "string" || typeof v === "number" ? String(v) : null}
              placeholder={`Add ${f.label.toLowerCase()}…`}
              multiline={f.field_type === "long_text"}
              onSave={(next) => setCustom(f.key, f.field_type === "number" ? (next ? Number(next) : null) : next || null)}
            />
          </div>
        );
      })}
      {account.department_headcounts && Object.keys(account.department_headcounts).length > 0 && (
        <details className="pt-1">
          <summary className="cursor-pointer text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Department headcounts (from import)
          </summary>
          <ul className="mt-2 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
            {Object.entries(account.department_headcounts).map(([k, v]) => (
              <li key={k}>
                {k}: {v.toLocaleString()}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

export function WhysPanel({ account }: { account: Account }) {
  const { save } = useAccountSaver(account.id);
  const items: [string, string, keyof Account, string][] = [
    ["Why anything?", "Why would this company change anything at all? What's the burning problem?", "why_anything", "No reason to change yet."],
    ["Why Factory?", "Of all options, why would they buy from Factory?", "why_factory", "No case for Factory yet."],
    ["Why now?", "What makes this quarter different from last year?", "why_now", "No timing trigger yet."],
  ];
  return (
    <section className="space-y-3 rounded-lg border bg-card p-4">
      <h2 className="text-sm font-semibold">The three whys</h2>
      {items.map(([title, hint, key, empty]) => (
        <div key={key} className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground" title={hint}>
            {title}
          </p>
          {(account[key] as string | null) ? (
            <RichTextField value={account[key] as string} placeholder={hint} onSave={(html) => save({ [key]: html || null })} />
          ) : (
            <RichTextField value={null} placeholder={hint} onSave={(html) => save({ [key]: html || null })} />
          )}
          {!account[key] && <p className="text-xs text-muted-foreground/60">{empty}</p>}
        </div>
      ))}
    </section>
  );
}

export function StructurePanel({ account, accounts }: { account: Account; accounts: Account[] }) {
  const { save } = useAccountSaver(account.id);
  const parent = accounts.find((a) => a.id === account.parent_account_id);
  const children = accounts.filter((a) => a.parent_account_id === account.id);
  const rel = PARENT_RELATIONSHIP.find((r) => r.value === account.parent_relationship);

  return (
    <section className="space-y-2.5 rounded-lg border bg-card p-4">
      <h2 className="text-sm font-semibold">Corporate structure</h2>
      <div className={rowClass}>
        <span className={labelClass}>Parent</span>
        <SingleSelect
          className="flex-1"
          options={accounts
            .filter((a) => a.id !== account.id)
            .map((a) => ({ value: a.id, label: a.name }))}
          value={account.parent_account_id}
          placeholder="No parent (top of tree)"
          onChange={(v) => save({ parent_account_id: v })}
          searchable
        />
      </div>
      {parent && (
        <p className="pl-30 text-xs text-muted-foreground">
          Parent:{" "}
          <Link href={`/accounts/${parent.id}`} className="text-primary hover:underline">
            {parent.name}
          </Link>
        </p>
      )}
      <div className={rowClass}>
        <span className={labelClass}>Relationship</span>
        <SingleSelect
          className="flex-1"
          options={PARENT_RELATIONSHIP.map((r) => ({ value: r.value, label: r.label, hint: r.hint }))}
          value={account.parent_relationship}
          onChange={(v) => save({ parent_relationship: (v ?? "unknown") as Account["parent_relationship"] })}
        />
      </div>
      {rel && <p className="pl-30 text-xs text-muted-foreground">{rel.hint}</p>}
      <div className={cn(rowClass, "items-start")}>
        <span className={labelClass}>Notes</span>
        <InlineText
          className="flex-1"
          multiline
          value={account.parent_relationship_notes}
          placeholder="How does buying actually work here?"
          onSave={(v) => save({ parent_relationship_notes: v || null })}
        />
      </div>
      {children.length > 0 && (
        <div className="pt-1">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Subsidiaries ({children.length})
          </p>
          <ul className="space-y-0.5 text-sm">
            {children.map((c) => (
              <li key={c.id} className="flex items-center gap-1">
                <ChevronRight className="size-3 text-muted-foreground" />
                <Link href={`/accounts/${c.id}`} className="text-primary hover:underline">
                  {c.name}
                </Link>
                {c.domain && <span className="text-xs text-muted-foreground">{c.domain}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

const emptyOrgDraft = {
  id: null as string | null,
  name: "",
  parent_org_id: null as string | null,
  status: "inferred" as Org["status"],
  description: "" as string | null,
  aliases: "",
  color: null as string | null,
  notes: "" as string | null,
};

export function OrgsPanel({ account, orgs, contactCounts }: { account: Account; orgs: Org[]; contactCounts: Record<string, number> }) {
  const [draft, setDraft] = useState<typeof emptyOrgDraft | null>(null);
  const [pending, start] = useTransition();
  const nameById = useMemo(() => new Map(orgs.map((o) => [o.id, o])), [orgs]);
  const unassigned = contactCounts[""] ?? 0;

  const submit = () => {
    if (!draft || !draft.name.trim()) return;
    const values = {
      account_id: account.id,
      name: draft.name.trim(),
      parent_org_id: draft.parent_org_id,
      status: draft.status,
      description: draft.description || null,
      aliases: draft.aliases.split(",").map((a) => a.trim()).filter(Boolean),
      color: draft.color,
      notes: draft.notes || null,
    };
    start(async () => {
      const r = draft.id ? await updateOrg(draft.id, values) : await createOrg(values);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setDraft(null);
    });
  };

  return (
    <section className="space-y-2 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Orgs ({orgs.length})</h2>
        <Button variant="outline" size="sm" onClick={() => setDraft({ ...emptyOrgDraft })}>
          <Plus className="size-3.5" /> Add org
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        The company&apos;s own internal groups, not its reporting lines.{" "}
        {unassigned > 0 && (
          <>
            {unassigned} contact{unassigned === 1 ? "" : "s"} not in any org yet.
          </>
        )}
      </p>
      {orgs.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No orgs yet. Add them manually, or import a CSV and let AI infer them.
        </p>
      ) : (
        <ul className="space-y-1">
          {orgs.map((o) => (
            <li key={o.id} className="group flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-accent/50">
              {o.color ? (
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: o.color }} />
              ) : (
                <span className="size-2.5 shrink-0 rounded-full border border-border" />
              )}
              <Link href={`/contacts?org=${o.id}`} className="min-w-0 flex-1 truncate text-sm font-medium hover:underline">
                {o.name}
              </Link>
              {o.parent_org_id && nameById.get(o.parent_org_id) && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  ⊂ {nameById.get(o.parent_org_id)!.name}
                </span>
              )}
              {o.status === "confirmed" && (
                <span className="shrink-0 rounded border border-green-500/40 px-1 text-[11px] text-green-400">Confirmed</span>
              )}
              {o.aliases.length > 0 && (
                <span className="shrink-0 text-xs text-muted-foreground" title={o.aliases.join(", ")}>
                  aka
                </span>
              )}
              <span className="w-14 shrink-0 text-right text-xs text-muted-foreground">
                {contactCounts[o.id] ?? 0} ppl
              </span>
              <span className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  aria-label={`Edit ${o.name}`}
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    setDraft({
                      id: o.id,
                      name: o.name,
                      parent_org_id: o.parent_org_id,
                      status: o.status,
                      description: o.description,
                      aliases: o.aliases.join(", "),
                      color: o.color,
                      notes: o.notes,
                    })
                  }
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${o.name}`}
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    if (!confirm(`Delete org “${o.name}”? Its contacts stay, just unassigned.`)) return;
                    start(async () => {
                      const r = await deleteOrg(o.id);
                      if (!r.ok) toast.error(r.error);
                    });
                  }}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      {draft && (
        <Dialog open onOpenChange={(o) => !o && setDraft(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{draft.id ? "Edit org" : "New org"}</DialogTitle>
              <DialogDescription>
                An org is a functional group inside the account, like “Database Engineering”.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label htmlFor="org-name">Name *</Label>
                <Input
                  id="org-name"
                  autoFocus
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="e.g. Data Platform"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Parent org</Label>
                <SingleSelect
                  options={orgs
                    .filter((o) => o.id !== draft.id)
                    .map((o) => ({ value: o.id, label: o.name }))}
                  value={draft.parent_org_id}
                  placeholder="No parent (top level)"
                  onChange={(v) => setDraft({ ...draft, parent_org_id: v })}
                />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <SingleSelect
                  options={[
                    { value: "inferred", label: "Inferred" },
                    { value: "confirmed", label: "Confirmed" },
                  ]}
                  value={draft.status}
                  onChange={(v) => setDraft({ ...draft, status: (v ?? "inferred") as Org["status"] })}
                  allowClear={false}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="org-color">Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="org-color"
                    type="color"
                    value={draft.color ?? "#ef6f2e"}
                    onChange={(e) => setDraft({ ...draft, color: e.target.value })}
                    className="h-8 w-10 cursor-pointer rounded border bg-transparent"
                  />
                  {draft.color && (
                    <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setDraft({ ...draft, color: null })}>
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="col-span-2 space-y-1">
                <Label htmlFor="org-aliases">Aliases</Label>
                <Input
                  id="org-aliases"
                  value={draft.aliases}
                  onChange={(e) => setDraft({ ...draft, aliases: e.target.value })}
                  placeholder="Comma-separated other names, e.g. Data Eng, DE"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label htmlFor="org-desc">Description</Label>
                <Input
                  id="org-desc"
                  value={draft.description ?? ""}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="What does this group own?"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Notes</Label>
                <RichTextField value={draft.notes} onChange={(html) => setDraft({ ...draft, notes: html })} placeholder="Org notes…" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setDraft(null)}>
                Cancel
              </Button>
              <Button size="sm" disabled={pending || !draft.name.trim()} onClick={submit}>
                {pending ? "Saving…" : draft.id ? "Save org" : "Create org"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}

export function AccountNameEdit({ account }: { account: Account }) {
  const { save } = useAccountSaver(account.id);
  return (
    <InlineText
      value={account.name}
      placeholder="Account name"
      onSave={(v) => v.trim() && save({ name: v.trim() })}
      className="text-lg"
    />
  );
}

export function DeleteAccountButton({ account }: { account: Account }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Delete ${account.name}? Orgs and notes are deleted; contacts keep their data without an account.`)) return;
        start(async () => {
          const r = await deleteAccount(account.id);
          if (!r.ok) {
            toast.error(r.error);
            return;
          }
          router.push("/accounts");
        });
      }}
    >
      <Trash2 className="size-3.5" /> {pending ? "Deleting…" : "Delete account"}
    </Button>
  );
}

export function NewAccountButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [form, setForm] = useState({ name: "", domain: "", industry: "", employee_count: "", hq: "" });

  return (
    <Dialog open={open} onOpenChange={(o) => setOpen(o)}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="size-3.5" /> New account
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New account</DialogTitle>
          <DialogDescription>
            Accounts are usually created when you import a CSV. Add one manually for prospects.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid grid-cols-2 gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await createAccount({
                name: form.name.trim(),
                domain: form.domain.trim() || null,
                industry: form.industry.trim() || null,
                employee_count: form.employee_count ? Number(form.employee_count) : null,
                hq: form.hq.trim() || null,
              });
              if (!r.ok || !r.data) {
                toast.error(r.ok ? "Created, but couldn't open it." : r.error);
                return;
              }
              setOpen(false);
              setForm({ name: "", domain: "", industry: "", employee_count: "", hq: "" });
              router.push(`/accounts/${r.data.id}`);
            });
          }}
        >
          <div className="col-span-2 space-y-1">
            <Label htmlFor="acct-name">Name *</Label>
            <Input id="acct-name" required autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="acct-domain">Domain</Label>
            <Input id="acct-domain" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} placeholder="carvana.com" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="acct-industry">Industry</Label>
            <Input id="acct-industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="acct-employees">Employees</Label>
            <Input id="acct-employees" type="number" value={form.employee_count} onChange={(e) => setForm({ ...form, employee_count: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="acct-hq">HQ</Label>
            <Input id="acct-hq" value={form.hq} onChange={(e) => setForm({ ...form, hq: e.target.value })} />
          </div>
          <DialogFooter className="col-span-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending || !form.name.trim()}>
              {pending ? "Creating…" : "Create account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AccountsTable({ accounts }: { accounts: Account[] }) {
  const [filter, setFilter] = useState("");
  const rows = accounts.filter(
    (a) =>
      !filter ||
      a.name.toLowerCase().includes(filter.toLowerCase()) ||
      (a.domain ?? "").toLowerCase().includes(filter.toLowerCase()),
  );
  return (
    <div className="space-y-3 px-6 py-4">
      <div className="flex items-center gap-2 rounded-md border bg-input/20 px-2.5 focus-within:border-ring">
        <Search className="size-4 text-muted-foreground" />
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter accounts…"
          className="h-9 flex-1 bg-transparent text-sm outline-none"
        />
      </div>
      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {accounts.length === 0 ? "No accounts yet. They're created when you import a CSV." : "No matches."}
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {rows.map((a) => (
            <li key={a.id}>
              <Link href={`/accounts/${a.id}`} className="flex items-center gap-3 px-3 py-2 hover:bg-accent/50">
                <Building2 className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{a.name}</span>
                {a.domain && <span className="hidden truncate text-xs text-muted-foreground sm:block">{a.domain}</span>}
                {a.industry && <span className="hidden truncate text-xs text-muted-foreground md:block">{a.industry}</span>}
                {a.employee_count != null && (
                  <span className="shrink-0 text-xs text-muted-foreground">{a.employee_count.toLocaleString()} emp</span>
                )}
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
