"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InlineText, SingleSelect } from "@/components/fields";
import { MODELS } from "@/lib/constants";
import type { FieldDefinition, FieldType, Prompt, StyleRule } from "@/lib/types";
import type { ResearchMigrationResult } from "@/lib/research/migrate";
import { cn } from "@/lib/utils";
import {
  createFieldDef,
  createStyleRule,
  deleteFieldDef,
  deleteStyleRule,
  migrateResearchData,
  updateFieldDef,
  updatePrompt,
  updateStyleRule,
} from "./actions";

const ENTITIES: { value: FieldDefinition["entity"]; label: string }[] = [
  { value: "contact", label: "Contacts" },
  { value: "account", label: "Accounts" },
  { value: "org", label: "Orgs" },
];

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "long_text", label: "Long text" },
  { value: "rich_text", label: "Rich text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "select", label: "Select" },
  { value: "multi_select", label: "Multi-select" },
  { value: "boolean", label: "Boolean" },
  { value: "url", label: "URL" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
];

const RULE_FIELDS = [
  { value: "statuses", label: "Status" },
  { value: "personas", label: "Persona" },
  { value: "seniority", label: "Seniority" },
  { value: "is_key", label: "Key contact" },
  { value: "email_quality", label: "Email quality" },
  { value: "phone_quality", label: "Phone quality" },
];

const OPERATORS = [
  { value: "contains", label: "contains" },
  { value: "equals", label: "equals" },
  { value: "is_true", label: "is true" },
  { value: "is_empty", label: "is empty" },
];

function useRun() {
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok?: () => void) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) toast.error(r.error ?? "Something went wrong");
      else ok?.();
    });
  return { pending, run };
}

// ───────── Fields ─────────

function FieldsTab({ fields }: { fields: FieldDefinition[] }) {
  const { run } = useRun();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="max-w-xl text-sm text-muted-foreground">
          Rename fields, edit picklist options (personas, statuses), and choose where each field
          appears. Values for custom fields live on the record itself, so deleting a field is
          reversible.
        </p>
        <AddFieldDialog />
      </div>
      {ENTITIES.map(({ value: entity, label }) => {
        const rows = fields.filter((f) => f.entity === entity);
        if (rows.length === 0) return null;
        return (
          <section key={entity}>
            <h2 className="mb-2 text-sm font-semibold">{label}</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-1.5 font-medium">Label</th>
                  <th className="py-1.5 font-medium">Key</th>
                  <th className="py-1.5 font-medium">Type</th>
                  <th className="py-1.5 font-medium">Options</th>
                  <th className="py-1.5 text-center font-medium" title="Show on the profile page">Profile</th>
                  <th className="py-1.5 text-center font-medium" title="Show in the contacts table">List</th>
                  <th className="py-1.5 text-center font-medium" title="Show on the influence canvas">Canvas</th>
                  <th className="py-1.5 font-medium">Order</th>
                  <th className="py-1.5 font-medium" />
                </tr>
              </thead>
              <tbody>
                {rows.map((f) => (
                  <tr key={f.id} className="border-b last:border-b-0">
                    <td className="py-1 pr-2">
                      <InlineText
                        value={f.label}
                        placeholder="Label"
                        onSave={(v) => v && run(() => updateFieldDef(f.id, { label: v }))}
                      />
                    </td>
                    <td className="py-1 pr-2 font-mono text-xs text-muted-foreground">{f.key}</td>
                    <td className="py-1 pr-2 text-xs text-muted-foreground">{f.field_type.replace(/_/g, " ")}</td>
                    <td className="max-w-64 py-1 pr-2">
                      {f.field_type === "select" || f.field_type === "multi_select" ? (
                        <InlineText
                          value={(f.options ?? []).join(", ")}
                          placeholder="Comma-separated options…"
                          onSave={(v) =>
                            run(() =>
                              updateFieldDef(f.id, {
                                options: v.split(",").map((o) => o.trim()).filter(Boolean),
                              }),
                            )
                          }
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-1 text-center">
                      <Checkbox
                        checked={f.show_in_profile}
                        onCheckedChange={(c) => run(() => updateFieldDef(f.id, { show_in_profile: c === true }))}
                        aria-label={`Show ${f.label} in profile`}
                      />
                    </td>
                    <td className="py-1 text-center">
                      <Checkbox
                        checked={f.show_in_list}
                        onCheckedChange={(c) => run(() => updateFieldDef(f.id, { show_in_list: c === true }))}
                        aria-label={`Show ${f.label} in list`}
                      />
                    </td>
                    <td className="py-1 text-center">
                      <Checkbox
                        checked={f.show_on_canvas}
                        onCheckedChange={(c) => run(() => updateFieldDef(f.id, { show_on_canvas: c === true }))}
                        aria-label={`Show ${f.label} on canvas`}
                      />
                    </td>
                    <td className="w-14 py-1">
                      <InlineText
                        value={String(f.sort_order)}
                        type="number"
                        onSave={(v) => run(() => updateFieldDef(f.id, { sort_order: Number(v) || 0 }))}
                      />
                    </td>
                    <td className="py-1">
                      {!f.is_system && (
                        <button
                          type="button"
                          aria-label={`Delete field ${f.label}`}
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            if (!confirm(`Delete the “${f.label}” field? Stored values are kept in case you re-add it.`)) return;
                            run(() => deleteFieldDef(f.id));
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}

function AddFieldDialog() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [form, setForm] = useState({ entity: "contact", label: "", key: "", field_type: "text", options: "" });

  const slug = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 60);

  return (
    <Dialog open={open} onOpenChange={(o) => setOpen(o)}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="size-3.5" /> Custom field
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New custom field</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const key = form.key.trim() || slug(form.label);
            start(async () => {
              const r = await createFieldDef({
                entity: form.entity as FieldDefinition["entity"],
                label: form.label.trim(),
                key,
                field_type: form.field_type as FieldType,
                options: form.options.split(",").map((o) => o.trim()).filter(Boolean),
              });
              if (!r.ok) {
                toast.error(r.error);
                return;
              }
              setForm({ entity: "contact", label: "", key: "", field_type: "text", options: "" });
              setOpen(false);
            });
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Applies to</Label>
              <SingleSelect
                options={ENTITIES}
                value={form.entity}
                onChange={(v) => setForm({ ...form, entity: v ?? "contact" })}
                allowClear={false}
              />
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <SingleSelect
                options={FIELD_TYPES}
                value={form.field_type}
                onChange={(v) => setForm({ ...form, field_type: v ?? "text" })}
                allowClear={false}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label htmlFor="field-label">Label *</Label>
              <Input
                id="field-label"
                autoFocus
                required
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value, key: slug(e.target.value) })}
                placeholder="e.g. Budget year"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label htmlFor="field-key">Key</Label>
              <Input
                id="field-key"
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value })}
                placeholder="auto-generated"
                className="font-mono text-xs"
              />
            </div>
            {(form.field_type === "select" || form.field_type === "multi_select") && (
              <div className="col-span-2 space-y-1">
                <Label htmlFor="field-options">Options (comma-separated)</Label>
                <Input
                  id="field-options"
                  value={form.options}
                  onChange={(e) => setForm({ ...form, options: e.target.value })}
                  placeholder="Q1, Q2, Q3, Q4"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending || !form.label.trim()}>
              {pending ? "Creating…" : "Create field"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ───────── Style rules ─────────

function StyleRulesTab({ rules }: { rules: StyleRule[] }) {
  const { run } = useRun();
  const [pending, start] = useTransition();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="max-w-xl text-sm text-muted-foreground">
          Rules restyle contacts on the influence canvas (Phase 2), e.g. “Status contains Do Not
          Contact → red border, 50% opacity”.
        </p>
        <Button size="sm" disabled={pending} onClick={() => start(async () => void (await createStyleRule()))}>
          <Plus className="size-3.5" /> Add rule
        </Button>
      </div>
      {rules.length === 0 && <p className="text-sm text-muted-foreground">No rules yet.</p>}
      <ul className="space-y-2">
        {rules.map((rule) => (
          <li key={rule.id} className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
            <Checkbox
              checked={rule.enabled}
              onCheckedChange={(c) => run(() => updateStyleRule(rule.id, { enabled: c === true }))}
              aria-label={`Enable ${rule.name}`}
            />
            <div className="w-40">
              <InlineText value={rule.name} placeholder="Rule name" onSave={(v) => v && run(() => updateStyleRule(rule.id, { name: v }))} />
            </div>
            <div className="w-36">
              <SingleSelect
                options={RULE_FIELDS}
                value={rule.field}
                onChange={(v) => run(() => updateStyleRule(rule.id, { field: v ?? "statuses" }))}
              />
            </div>
            <div className="w-28">
              <SingleSelect
                options={OPERATORS}
                value={rule.operator}
                onChange={(v) => run(() => updateStyleRule(rule.id, { operator: (v ?? "contains") as StyleRule["operator"] }))}
              />
            </div>
            <div className="min-w-32 flex-1">
              <InlineText value={rule.value} placeholder="Value…" onSave={(v) => run(() => updateStyleRule(rule.id, { value: v || null }))} />
            </div>
            <span className="text-xs text-muted-foreground">then</span>
            <ColorCell
              label="Border"
              value={rule.style.border ?? null}
              onChange={(border) => run(() => updateStyleRule(rule.id, { style: { ...rule.style, border } }))}
            />
            <ColorCell
              label="Fill"
              value={rule.style.background ?? null}
              onChange={(background) => run(() => updateStyleRule(rule.id, { style: { ...rule.style, background } }))}
            />
            <label className="flex items-center gap-1 text-xs text-muted-foreground" title="Opacity 0-1">
              opacity
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={rule.style.opacity ?? 1}
                onChange={(e) => {
                  const v = e.target.value === "" ? null : Math.min(1, Math.max(0, Number(e.target.value)));
                  run(() => updateStyleRule(rule.id, { style: { ...rule.style, opacity: v } }));
                }}
                className="w-14 rounded border bg-input/20 px-1 py-0.5"
              />
            </label>
            <label className="flex items-center gap-1 text-xs text-muted-foreground">
              <Checkbox
                checked={rule.style.grayscale === true}
                onCheckedChange={(c) => run(() => updateStyleRule(rule.id, { style: { ...rule.style, grayscale: c === true } }))}
              />
              grayscale
            </label>
            <div className="w-24">
              <InlineText
                value={rule.style.badge ?? null}
                placeholder="Badge…"
                onSave={(v) => run(() => updateStyleRule(rule.id, { style: { ...rule.style, badge: v || null } }))}
              />
            </div>
            <div className="w-12">
              <InlineText
                value={String(rule.priority)}
                type="number"
                placeholder="Prio"
                onSave={(v) => run(() => updateStyleRule(rule.id, { priority: Number(v) || 0 }))}
              />
            </div>
            <button
              type="button"
              aria-label={`Delete rule ${rule.name}`}
              className="ml-auto text-muted-foreground hover:text-destructive"
              onClick={() => {
                if (!confirm(`Delete rule “${rule.name}”?`)) return;
                run(() => deleteStyleRule(rule.id));
              }}
            >
              <Trash2 className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ColorCell({ label, value, onChange }: { label: string; value: string | null; onChange: (v: string | null) => void }) {
  return (
    <label className="flex items-center gap-1 text-xs text-muted-foreground">
      {label}
      <input
        type="color"
        value={value ?? "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="h-6 w-8 cursor-pointer rounded border bg-transparent"
        aria-label={`${label} color`}
      />
      <button type="button" aria-label={`Clear ${label} color`} className="hover:text-foreground" onClick={() => onChange(null)}>
        ×
      </button>
    </label>
  );
}

// ───────── Prompts ─────────

function PromptEditor({ prompt }: { prompt: Prompt }) {
  const { pending, run } = useRun();
  const [model, setModel] = useState(prompt.model);
  const [text, setText] = useState(prompt.system_prompt);
  const [name, setName] = useState(prompt.name);
  const [description, setDescription] = useState(prompt.description);
  const dirty = text !== prompt.system_prompt || model !== prompt.model || name !== prompt.name || description !== prompt.description;

  return (
    <li className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-48 flex-1">
          <InlineText value={name} placeholder="Prompt name" onSave={setName} className="font-medium" />
        </div>
        <span className="rounded bg-accent px-1.5 py-0.5 font-mono text-[11px] text-accent-foreground">
          v{prompt.version}
        </span>
        <div className="w-64">
          <SingleSelect
            options={MODELS.map((m) => ({ value: m.value, label: m.label }))}
            value={model}
            onChange={(v) => setModel(v ?? prompt.model)}
            allowClear={false}
          />
        </div>
        <Button
          size="sm"
          disabled={pending || !dirty || !text.trim()}
          onClick={() =>
            run(() => updatePrompt(prompt.id, { name, description, model, system_prompt: text }), () =>
              toast.success("Prompt saved"),
            )
          }
        >
          {pending ? "Saving…" : dirty ? "Save" : "Saved"}
        </Button>
      </div>
      {description !== null && (
        <InlineText
          className="mt-1 text-xs text-muted-foreground"
          value={description}
          placeholder="What this prompt is for…"
          onSave={setDescription}
        />
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={12}
        spellCheck={false}
        className="mt-2 w-full rounded-md border bg-input/20 p-2 font-mono text-xs leading-relaxed outline-none focus:border-ring"
      />
      <p className="mt-1 text-[11px] text-muted-foreground">
        Saving a changed prompt or model bumps the version; history is kept in prompt versions.
      </p>
    </li>
  );
}

// ───────── Research data ─────────

const MIGRATION_LABELS: Record<string, string> = {
  accounts_created: "Accounts created",
  accounts_updated: "Accounts updated",
  docs_created: "Research docs created",
  docs_updated: "Research docs updated",
  orgs_created: "Orgs created",
  orgs_updated: "Orgs updated",
  initiatives: "Initiatives",
  challenges: "Challenges",
  contacts_created: "Contacts created",
  contacts_updated: "Contacts enriched",
  contact_initiative_links: "Contact → initiative links",
  contact_challenge_links: "Contact → challenge links",
  org_initiative_links: "Org → initiative links",
  influence_edges: "Influence edges",
};

function ResearchDataTab() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ResearchMigrationResult | null>(null);

  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-sm text-muted-foreground">
        Encodes the American Express research corpus — the entity map, org and domain map,
        initiatives, challenges and key contacts, plus the Factory product knowledge base and
        persona rules — into this workspace. Safe to re-run any time: existing accounts and
        contacts are matched by domain, LinkedIn URL and exact name, so the corpus enriches
        imported records instead of duplicating them. Research writes persona, seniority,
        evidence and influence directly as ground truth, upgrading import-time assumptions.
      </p>
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await migrateResearchData();
            if (!r.ok) {
              toast.error(r.error);
              return;
            }
            if (!r.data) {
              toast.error("Migration returned no result");
              return;
            }
            setResult(r.data);
            toast.success("Research data migrated");
          })
        }
      >
        {pending ? "Migrating…" : "Run research migration"}
      </Button>
      {result && (
        <div className="max-w-2xl rounded-lg border bg-card p-4">
          <dl className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm sm:grid-cols-3">
            {Object.entries(result.counts).map(([key, value]) => (
              <div key={key} className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">{MIGRATION_LABELS[key] ?? key}</dt>
                <dd className="font-medium tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
          {result.warnings.length > 0 && (
            <ul className="mt-3 space-y-1 border-t pt-3 text-xs text-amber-600 dark:text-amber-500">
              {result.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminPanels({ fields, rules, prompts }: { fields: FieldDefinition[]; rules: StyleRule[]; prompts: Prompt[] }) {
  const sortedFields = [...fields].sort((a, b) => a.entity.localeCompare(b.entity) || a.sort_order - b.sort_order);
  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);
  return (
    <Tabs defaultValue="fields" className="px-6 py-4">
      <TabsList>
        <TabsTrigger value="fields">Fields & picklists</TabsTrigger>
        <TabsTrigger value="rules">Style rules</TabsTrigger>
        <TabsTrigger value="prompts">Prompts</TabsTrigger>
        <TabsTrigger value="research">Research data</TabsTrigger>
      </TabsList>
      <TabsContent value="fields" className={cn("mt-4")}>
        <FieldsTab fields={sortedFields} />
      </TabsContent>
      <TabsContent value="rules" className="mt-4">
        <StyleRulesTab rules={sortedRules} />
      </TabsContent>
      <TabsContent value="prompts" className="mt-4">
        <ul className="space-y-3">
          {prompts.map((p) => (
            <PromptEditor key={p.id} prompt={p} />
          ))}
        </ul>
      </TabsContent>
      <TabsContent value="research" className="mt-4">
        <ResearchDataTab />
      </TabsContent>
    </Tabs>
  );
}
