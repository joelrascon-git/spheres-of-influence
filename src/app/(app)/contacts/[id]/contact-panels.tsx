"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ArrowLeft, ArrowRight, Plus, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ContactAvatar, ConfidenceBadge, FitBadge, KeyStar, StatusBadge, TagChip, isDnc, isGone } from "@/components/contact-bits";
import { RichTextView } from "@/components/rich-text";
import {
  DateField,
  InlineText,
  LocationInput,
  MultiSelect,
  QualityDot,
  RichTextField,
  SingleSelect,
} from "@/components/fields";
import { CONFIDENCE, SENIORITY, SENIORITY_LEVELS, PERSONA_STATUS, CHAMPION_FLAG, ENGAGE_STAGES } from "@/lib/constants";
import { describeInferenceValue } from "@/lib/inference/apply";
import { InferenceCard } from "@/app/(app)/inferences/inference-card";
import type { ContactRef } from "@/lib/data";
import type { Place } from "@/lib/geocode";
import type { Contact, FieldDefinition, Inference, Note, Tag } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  addNote,
  deleteContact,
  deleteInfluence,
  deleteNote,
  generateContactBrief,
  setContactTags,
  updateContact,
  updateNote,
  upsertInfluence,
  type ContactPatch,
} from "../actions";

/** Shared inline-save wrapper around updateContact with toast errors. */
function useSave(contactId: string) {
  const [pending, start] = useTransition();
  const save = (patch: ContactPatch, place?: Place | null) =>
    start(async () => {
      const r = await updateContact(contactId, patch, place);
      if (!r.ok) toast.error(r.error);
    });
  return { pending, save };
}

const rowClass = "flex items-center gap-2";
const labelClass = "w-28 shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground";

/** One-click research-grade brief: an appended note plus review-queue proposals. */
export function AiBriefPanel({ contactId, enabled }: { contactId: string; enabled: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <section className="space-y-2 rounded-lg border bg-card p-4">
      <h2 className="text-sm font-semibold">AI</h2>
      <p className="text-xs text-muted-foreground">
        {enabled
          ? "Brief this person against the account's research. The brief lands in Notes; field-level proposals wait in the review queue."
          : "Set ANTHROPIC_API_KEY in .env.local to enable AI briefs."}
      </p>
      <Button
        size="sm"
        variant="outline"
        disabled={!enabled || pending}
        onClick={() =>
          start(async () => {
            const r = await generateContactBrief(contactId);
            if (!r.ok) {
              toast.error(r.error);
              return;
            }
            toast.success(
              r.data?.queued
                ? `Brief added to Notes — ${r.data.queued} proposals queued for review.`
                : "Brief added to Notes.",
            );
            router.refresh();
          })
        }
      >
        <Sparkles className="size-3.5" /> {pending ? "Thinking…" : "AI brief"}
      </Button>
    </section>
  );
}

export function BasicsPanel({
  contact,
  accounts,
  orgs,
  personasOptions,
  statusOptions,
}: {
  contact: Contact;
  accounts: { id: string; name: string }[];
  orgs: { id: string; name: string; account_id: string }[];
  personasOptions: string[];
  statusOptions: string[];
}) {
  const { save } = useSave(contact.id);
  const orgOptions = orgs
    .filter((o) => !contact.account_id || o.account_id === contact.account_id)
    .map((o) => ({ value: o.id, label: o.name }));

  return (
    <section className="space-y-2.5 rounded-lg border bg-card p-4">
      <h2 className="text-sm font-semibold">Details</h2>

      <div className={rowClass}>
        <span className={labelClass}>Title</span>
        <InlineText value={contact.title} placeholder="Add title…" onSave={(v) => save({ title: v || null })} />
      </div>
      <div className={rowClass}>
        <span className={labelClass}>Seniority</span>
        <SingleSelect
          className="flex-1"
          options={SENIORITY.map((s) => ({ value: s.value, label: s.label }))}
          value={contact.seniority}
          onChange={(v) => save({ seniority: v as Contact["seniority"] })}
        />
      </div>
      <div className={rowClass}>
        <span className={labelClass}>Account</span>
        <SingleSelect
          className="flex-1"
          options={accounts.map((a) => ({ value: a.id, label: a.name }))}
          value={contact.account_id}
          placeholder="No account"
          onChange={(v) => save({ account_id: v })}
          searchable
        />
      </div>
      {contact.account_id && orgOptions.length > 0 && (
        <div className={rowClass}>
          <span className={labelClass}>Org</span>
          <SingleSelect
            className="flex-1"
            options={orgOptions}
            value={contact.org_id}
            placeholder="No org"
            onChange={(v) => save({ org_id: v })}
            searchable
          />
        </div>
      )}
      <div className={rowClass}>
        <span className={labelClass}>Personas</span>
        <MultiSelect
          className="flex-1"
          options={personasOptions.map((p) => ({ value: p, label: p }))}
          value={contact.personas}
          onChange={(v) => save({ personas: v })}
        />
      </div>
      <div className={rowClass}>
        <span className={labelClass}>Statuses</span>
        <MultiSelect
          className="flex-1"
          options={statusOptions.map((s) => ({ value: s, label: s }))}
          value={contact.statuses}
          onChange={(v) => save({ statuses: v })}
          renderChip={(o) => <StatusBadge status={o.label} />}
        />
      </div>
      <div className={rowClass}>
        <span className={labelClass}>Email</span>
        <QualityDot value={contact.email_quality} onChange={(q) => save({ email_quality: q })} label="Email" />
        <InlineText
          value={contact.email}
          placeholder="Add email…"
          type="email"
          inputClassName="font-mono text-[13px]"
          onSave={(v) => save({ email: v || null })}
        />
      </div>
      <div className={rowClass}>
        <span className={labelClass}>Phone</span>
        <QualityDot value={contact.phone_quality} onChange={(q) => save({ phone_quality: q })} label="Phone" />
        <InlineText value={contact.phone} placeholder="Add phone…" onSave={(v) => save({ phone: v || null })} />
      </div>
      <div className={rowClass}>
        <span className={labelClass}>Location</span>
        <LocationInput
          className="flex-1"
          value={contact.location}
          onSelect={(text, place) => save({ location: text || null }, place)}
        />
      </div>
      <div className={rowClass}>
        <span className={labelClass}>Last contact</span>
        <DateField value={contact.last_contacted} onChange={(v) => save({ last_contacted: v })} />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => save({ last_contacted: format(new Date(), "yyyy-MM-dd") })}
          disabled={contact.last_contacted === format(new Date(), "yyyy-MM-dd")}
        >
          Today
        </Button>
      </div>
      <div className={rowClass}>
        <span className={labelClass}>Role start</span>
        <DateField value={contact.role_start} onChange={(v) => save({ role_start: v })} />
      </div>
      <div className={rowClass}>
        <span className={labelClass}>Company start</span>
        <DateField value={contact.company_start} onChange={(v) => save({ company_start: v })} />
      </div>
      <div className={cn(rowClass, "items-start")}>
        <span className={labelClass}>Key contact</span>
        <button
          type="button"
          onClick={() => save({ is_key: !contact.is_key })}
          className="flex items-center gap-1.5 text-sm"
          title="Toggle key contact"
        >
          <KeyStar active={contact.is_key} />
          {contact.is_key ? "Key" : "Not key"}
        </button>
      </div>
      {contact.is_key && (
        <div className={cn(rowClass, "items-start")}>
          <span className={labelClass}>Why key</span>
          <RichTextField
            className="flex-1"
            value={contact.key_reasoning}
            placeholder="What makes them key to the deal?"
            onSave={(html) => save({ key_reasoning: html || null })}
          />
        </div>
      )}
    </section>
  );
}

export function ReportsToPanel({
  contact,
  directReports,
  candidates,
}: {
  contact: Contact;
  directReports: ContactRef[];
  candidates: ContactRef[];
}) {
  const { save } = useSave(contact.id);
  const managerOptions = candidates
    .filter((c) => c.id !== contact.id)
    .map((c) => ({ value: c.id, label: c.full_name, hint: c.title ?? undefined }));

  return (
    <section className="space-y-2.5 rounded-lg border bg-card p-4">
      <h2 className="text-sm font-semibold">Reporting line</h2>
      <div className={rowClass}>
        <span className={labelClass}>Reports to</span>
        <SingleSelect
          className="flex-1"
          options={managerOptions}
          value={contact.reports_to_id}
          placeholder="Pick a manager…"
          onChange={(v) => save({ reports_to_id: v })}
          searchable
        />
      </div>
      {contact.reports_to_id && (
        <>
          <div className={rowClass}>
            <span className={labelClass}>Confidence</span>
            <SingleSelect
              className="flex-1"
              options={CONFIDENCE.map((c) => ({ value: c.value, label: c.label }))}
              value={contact.reports_to_confidence}
              onChange={(v) => save({ reports_to_confidence: v as Contact["reports_to_confidence"] })}
            />
          </div>
          <div className={cn(rowClass, "items-start")}>
            <span className={labelClass}>Evidence</span>
            <InlineText
              className="flex-1"
              multiline
              value={contact.reports_to_evidence}
              placeholder="Why do you think this? (e.g. “says ‘reporting to the CTO’ in his summary”)"
              onSave={(v) => save({ reports_to_evidence: v || null })}
            />
          </div>
        </>
      )}
      {directReports.length > 0 && (
        <div className="pt-1">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Direct reports ({directReports.length})
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {directReports.map((r) => (
              <li key={r.id}>
                <a
                  href={`/contacts/${r.id}`}
                  className="flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs hover:bg-accent"
                >
                  <ContactAvatar name={r.full_name} path={r.avatar_path} size={16} />
                  {r.full_name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export type InfluenceEdge = {
  edgeId: string;
  contactId: string;
  name: string;
  title: string | null;
  strength: string;
  confidence: string;
  evidence: string | null;
};

const STRENGTH = [
  { value: "high", label: "Strong" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Weak" },
];

function InfluenceRow({ dir, e, onDelete }: { dir: "out" | "in"; e: InfluenceEdge; onDelete: () => void }) {
  return (
    <li className="flex items-start gap-1.5 text-sm">
      {dir === "out" ? (
        <ArrowRight className="mt-1 size-3.5 shrink-0 text-primary" />
      ) : (
        <ArrowLeft className="mt-1 size-3.5 shrink-0 text-muted-foreground" />
      )}
      <div className="min-w-0 flex-1">
        <a href={`/contacts/${e.contactId}`} className="font-medium hover:underline">
          {e.name}
        </a>
        {e.title && <span className="text-xs text-muted-foreground"> · {e.title}</span>}
        <span className="text-xs text-muted-foreground">
          {" "}
          · {STRENGTH.find((s) => s.value === e.strength)?.label ?? e.strength},{" "}
          {CONFIDENCE.find((c) => c.value === e.confidence)?.label ?? e.confidence}
        </span>
        {e.evidence && <p className="mt-0.5 text-xs text-muted-foreground">{e.evidence}</p>}
      </div>
      <button
        type="button"
        aria-label={`Delete influence relationship with ${e.name}`}
        className="mt-0.5 text-muted-foreground hover:text-destructive"
        onClick={onDelete}
      >
        <X className="size-3.5" />
      </button>
    </li>
  );
}

export function InfluencePanel({
  contact,
  candidates,
  influenced,
  influencedBy,
}: {
  contact: Contact;
  candidates: ContactRef[];
  influenced: InfluenceEdge[];
  influencedBy: InfluenceEdge[];
}) {
  const [targetId, setTargetId] = useState<string | null>(null);
  const [strength, setStrength] = useState("medium");
  const [confidence, setConfidence] = useState("medium");
  const [evidence, setEvidence] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const options = candidates
    .filter((c) => c.id !== contact.id && !influenced.some((i) => i.contactId === c.id))
    .map((c) => ({ value: c.id, label: c.full_name, hint: c.title ?? undefined }));

  return (
    <section className="space-y-3 rounded-lg border bg-card p-4">
      <h2 className="text-sm font-semibold">Influence</h2>
      <p className="text-xs text-muted-foreground">
        Real power rarely follows the org chart. Record who shapes decisions beyond their reporting line.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <SingleSelect
          className="w-48"
          options={options}
          value={targetId}
          placeholder="Influences…"
          onChange={setTargetId}
          searchable
        />
        <SingleSelect
          className="w-28"
          options={STRENGTH}
          value={strength}
          onChange={(v) => setStrength(v ?? "medium")}
          allowClear={false}
        />
        <SingleSelect
          className="w-32"
          options={CONFIDENCE.map((c) => ({ value: c.value, label: c.label }))}
          value={confidence}
          onChange={(v) => setConfidence(v ?? "medium")}
          allowClear={false}
        />
        <Button
          size="sm"
          disabled={!targetId || pending}
          onClick={() =>
            start(async () => {
              const r = await upsertInfluence({
                from_contact_id: contact.id,
                to_contact_id: targetId!,
                strength: strength as "high" | "medium" | "low",
                confidence: confidence as "confirmed" | "medium" | "low",
                evidence,
              });
              if (!r.ok) {
                toast.error(r.error);
                return;
              }
              setTargetId(null);
              setEvidence(null);
            })
          }
        >
          <Plus className="size-3.5" /> Add
        </Button>
      </div>
      <InlineText
        value={evidence}
        placeholder="Evidence: why do they listen to this person?"
        onSave={setEvidence}
        multiline
        className="text-sm text-muted-foreground"
      />
      {influenced.length > 0 && (
        <ul className="space-y-2">
          {influenced.map((e) => (
            <InfluenceRow key={e.edgeId} dir="out" e={e} onDelete={() => start(async () => void (await deleteInfluence(e.edgeId)))} />
          ))}
        </ul>
      )}
      {influencedBy.length > 0 && (
        <ul className="space-y-2">
          {influencedBy.map((e) => (
            <InfluenceRow key={e.edgeId} dir="in" e={e} onDelete={() => start(async () => void (await deleteInfluence(e.edgeId)))} />
          ))}
        </ul>
      )}
      {influenced.length === 0 && influencedBy.length === 0 && (
        <p className="text-xs text-muted-foreground">No influence recorded yet.</p>
      )}
    </section>
  );
}

export function NotesPanel({
  target,
  notes,
}: {
  target: { contact_id?: string; account_id?: string; org_id?: string };
  notes: Note[];
}) {
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<Note | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [pending, start] = useTransition();

  return (
    <section className="space-y-3 rounded-lg border bg-card p-4">
      <h2 className="text-sm font-semibold">Notes</h2>
      <RichTextField value={draft} onChange={setDraft} placeholder="Log a conversation, a quote, a next step…" toolbar minHeight="min-h-20" />
      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={pending || !draft.replace(/<[^>]*>/g, "").trim()}
          onClick={() =>
            start(async () => {
              const r = await addNote(target, draft);
              if (!r.ok) {
                toast.error(r.error);
                return;
              }
              setDraft("");
            })
          }
        >
          Add note
        </Button>
      </div>
      {notes.length === 0 && <p className="text-xs text-muted-foreground">No notes yet.</p>}
      <ul className="space-y-3">
        {notes.map((n) => (
          <li key={n.id} className="border-t pt-3 first:border-t-0 first:pt-0">
            {editing?.id === n.id ? (
              <div className="space-y-2">
                <RichTextField value={editDraft} onChange={setEditDraft} toolbar />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="xs" onClick={() => setEditing(null)}>
                    Cancel
                  </Button>
                  <Button
                    size="xs"
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        const r = await updateNote(n.id, editDraft);
                        if (!r.ok) {
                          toast.error(r.error);
                          return;
                        }
                        setEditing(null);
                      })
                    }
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="group flex items-center gap-2 text-xs text-muted-foreground">
                  {format(parseISO(n.created_at), "MMM d, yyyy")}
                  {n.source !== "manual" && <span className="rounded bg-accent px-1.5 py-0.5">{n.source}</span>}
                  <span className="ml-auto flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      className="hover:text-foreground"
                      onClick={() => {
                        setEditing(n);
                        setEditDraft(n.body_html);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="hover:text-destructive"
                      onClick={() => {
                        if (!confirm("Delete this note?")) return;
                        start(async () => void (await deleteNote(n.id)));
                      }}
                    >
                      Delete
                    </button>
                  </span>
                </div>
                <RichTextView html={n.body_html} className="mt-1 text-sm" />
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TagsPanel({ contactId, tagIds, tags }: { contactId: string; tagIds: string[]; tags: Tag[] }) {
  const [pending, start] = useTransition();
  const byId = new Map(tags.map((t) => [t.id, t]));

  return (
    <section className="space-y-2 rounded-lg border bg-card p-4">
      <h2 className="text-sm font-semibold">Tags</h2>
      <MultiSelect
        options={tags.map((t) => ({ value: t.id, label: t.name, color: t.color }))}
        value={tagIds}
        onChange={(next) =>
          start(async () => {
            const r = await setContactTags(contactId, next);
            if (!r.ok) toast.error(r.error);
          })
        }
        renderChip={(o) => {
          const t = byId.get(o.value);
          return t ? <TagChip name={t.name} color={t.color} /> : null;
        }}
        placeholder="Add tags…"
      />
      <p className="text-xs text-muted-foreground">
        Manage tag definitions in the{" "}
        <a href="/tags" className="text-primary hover:underline">
          Tags Manager
        </a>
        .
      </p>
      {pending && <p className="text-xs text-muted-foreground">Saving…</p>}
    </section>
  );
}

export function PersonalDetailsPanel({ contact }: { contact: Contact }) {
  const { save } = useSave(contact.id);
  const entries = Object.entries(contact.personal_details ?? {});
  const [newKey, setNewKey] = useState("");

  const commit = (rows: [string, string][]) =>
    save({ personal_details: Object.fromEntries(rows.filter(([k, v]) => k.trim() && v.trim())) });

  return (
    <section className="space-y-2.5 rounded-lg border bg-card p-4">
      <h2 className="text-sm font-semibold">Personal details</h2>
      <p className="text-xs text-muted-foreground">The small things that build real relationships.</p>
      {entries.length === 0 && <p className="text-xs text-muted-foreground">Nothing recorded yet.</p>}
      <ul className="space-y-1.5">
        {entries.map(([k, v]) => (
          <li key={k} className="group flex items-center gap-1.5 text-sm">
            <InlineText
              className="w-32 shrink-0 font-medium"
              value={k}
              placeholder="Label"
              onSave={(nk) => commit(entries.map(([ok, ov]) => (ok === k ? [nk, ov] : [ok, ov])))}
            />
            <InlineText
              className="flex-1"
              value={v}
              placeholder="…"
              onSave={(nv) => commit(entries.map(([ok, ov]) => (ok === k ? [ok, nv] : [ok, ov])))}
            />
            <button
              type="button"
              aria-label={`Delete ${k}`}
              className="text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
              onClick={() => commit(entries.filter(([ok]) => ok !== k))}
            >
              <X className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <form
        className="flex items-center gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!newKey.trim()) return;
          commit([...entries, [newKey.trim(), ""]]);
          setNewKey("");
        }}
      >
        <input
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="Add: birthday, favorite drink, family…"
          className="h-7 flex-1 rounded-md border bg-input/20 px-2 text-sm outline-none focus:border-ring"
        />
        <Button type="submit" size="icon-sm" variant="outline" aria-label="Add detail">
          <Plus />
        </Button>
      </form>
    </section>
  );
}

export function CustomFieldsPanel({ contact, fields }: { contact: Contact; fields: FieldDefinition[] }) {
  const { save } = useSave(contact.id);
  if (fields.length === 0) return null;
  const value = (key: string) => contact.custom_fields?.[key];
  const set = (key: string, v: unknown) => save({ custom_fields: { ...(contact.custom_fields ?? {}), [key]: v } });

  return (
    <section className="space-y-2.5 rounded-lg border bg-card p-4">
      <h2 className="text-sm font-semibold">More fields</h2>
      {fields.map((f) => {
        const v = value(f.key);
        return (
          <div key={f.id} className={rowClass}>
            <span className={labelClass} title={f.help_text ?? undefined}>
              {f.label}
            </span>
            <div className="flex-1">
              {f.field_type === "multi_select" ? (
                <MultiSelect
                  options={(f.options ?? []).map((o) => ({ value: o, label: o }))}
                  value={Array.isArray(v) ? (v as string[]) : []}
                  onChange={(next) => set(f.key, next)}
                />
              ) : f.field_type === "select" ? (
                <SingleSelect
                  options={(f.options ?? []).map((o) => ({ value: o, label: o }))}
                  value={typeof v === "string" ? v : null}
                  onChange={(next) => set(f.key, next)}
                />
              ) : f.field_type === "date" ? (
                <DateField value={typeof v === "string" ? v : null} onChange={(next) => set(f.key, next)} />
              ) : f.field_type === "boolean" ? (
                <Checkbox checked={v === true} onCheckedChange={(c) => set(f.key, c === true)} />
              ) : f.field_type === "rich_text" ? (
                <RichTextField
                  value={typeof v === "string" ? v : null}
                  placeholder={f.label}
                  onSave={(html) => set(f.key, html || null)}
                />
              ) : (
                <InlineText
                  value={typeof v === "string" || typeof v === "number" ? String(v) : null}
                  placeholder={`Add ${f.label.toLowerCase()}…`}
                  multiline={f.field_type === "long_text"}
                  type={f.field_type === "number" ? "number" : f.field_type === "email" ? "email" : f.field_type === "url" ? "url" : "text"}
                  onSave={(next) => set(f.key, f.field_type === "number" ? (next ? Number(next) : null) : next || null)}
                />
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}

// ───────── Second brain: research profile, evidence, programs, proposals ─────────

/** The researched persona fields: written by research, imports and reviewed proposals. */
export function ResearchPanel({ contact }: { contact: Contact }) {
  const { save } = useSave(contact.id);
  return (
    <section className="space-y-2.5 rounded-lg border bg-card p-4">
      <h2 className="text-sm font-semibold">Research profile</h2>
      <div className={rowClass}>
        <span className={labelClass} title="The L1–L6 ladder from the persona knowledge base; finer than seniority.">
          Level
        </span>
        <SingleSelect
          className="flex-1"
          options={SENIORITY_LEVELS.map((l) => ({ value: l.value, label: l.label }))}
          value={contact.seniority_level}
          placeholder="Not set"
          onChange={(v) => save({ seniority_level: (v ?? null) as Contact["seniority_level"] })}
        />
      </div>
      <div className={rowClass}>
        <span className={labelClass} title="How well-attested the personas are.">
          Persona status
        </span>
        <SingleSelect
          className="flex-1"
          options={PERSONA_STATUS.map((p) => ({ value: p.value, label: p.label }))}
          value={contact.persona_status}
          placeholder="Not set"
          onChange={(v) => save({ persona_status: (v ?? null) as Contact["persona_status"] })}
        />
      </div>
      <div className={rowClass}>
        <span className={labelClass} title="Champions never come from titles: only from advocacy evidence.">
          Champion
        </span>
        <SingleSelect
          className="flex-1"
          options={CHAMPION_FLAG.map((c) => ({ value: c.value, label: c.label }))}
          value={contact.champion_flag}
          placeholder="Not set"
          onChange={(v) => save({ champion_flag: (v ?? "none") as Contact["champion_flag"] })}
          allowClear={false}
        />
      </div>
      <div className={rowClass}>
        <span className={labelClass} title="Someone who can kill a purchase even without signing it.">
          Can veto
        </span>
        <SingleSelect
          className="flex-1"
          options={[
            { value: "unknown", label: "Unknown" },
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
          value={contact.can_veto == null ? "unknown" : contact.can_veto ? "yes" : "no"}
          onChange={(v) => save({ can_veto: v === "yes" ? true : v === "no" ? false : null })}
          allowClear={false}
        />
      </div>
      <div className={rowClass}>
        <span className={labelClass}>Buying role</span>
        <InlineText
          className="flex-1"
          value={contact.buying_role}
          placeholder="e.g. Technical evaluator"
          onSave={(v) => save({ buying_role: v || null })}
        />
      </div>
      <div className={rowClass}>
        <span className={labelClass}>Engage stage</span>
        <SingleSelect
          className="flex-1"
          options={ENGAGE_STAGES.map((s) => ({ value: s, label: s }))}
          value={contact.engage_stage}
          placeholder="Not engaged"
          onChange={(v) => save({ engage_stage: (v ?? null) as Contact["engage_stage"] })}
        />
      </div>
      <div className={cn(rowClass, "items-center")}>
        <span className={labelClass} title="Research-weighted influence: level, ownership, reporting-line proximity to an EB, evidence.">
          Influence
        </span>
        {contact.influence_score != null ? (
          <>
            <span className="h-1.5 w-24 overflow-hidden rounded-full bg-muted" title={`Influence score ${contact.influence_score}/100`}>
              <span className="block h-full rounded-full bg-primary" style={{ width: `${contact.influence_score}%` }} />
            </span>
            <span className="tabular-nums text-xs text-muted-foreground">{contact.influence_score}/100</span>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">Not scored yet</span>
        )}
        <InlineText
          className="ml-auto w-16"
          value={contact.influence_score == null ? null : String(contact.influence_score)}
          type="number"
          placeholder="—"
          onSave={(v) => save({ influence_score: v ? Number(v) : null })}
        />
      </div>
    </section>
  );
}

/** Cited claims with their sources and confidences, plus known gaps. */
export function EvidencePanel({ contact }: { contact: Contact }) {
  return (
    <section className="space-y-2.5 rounded-lg border bg-card p-4">
      <h2 className="text-sm font-semibold">Evidence ({contact.evidence.length})</h2>
      {contact.evidence.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No cited evidence yet — research and reviewed AI proposals record claims here with their sources.
        </p>
      )}
      <ul className="space-y-2">
        {contact.evidence.map((e, i) => (
          <li key={i} className="flex items-start gap-1.5 text-sm">
            <ConfidenceBadge confidence={e.confidence} className="mt-0.5 shrink-0" />
            <span className="min-w-0 flex-1">{e.claim}</span>
            {e.source_url && (
              <a
                href={e.source_url}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-xs text-primary hover:underline"
                title={e.source_url}
              >
                {e.source_label ?? "source"}
              </a>
            )}
          </li>
        ))}
      </ul>
      {contact.gaps.length > 0 && (
        <div className="space-y-1 border-t pt-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Gaps</p>
          <ul className="space-y-0.5 text-xs text-amber-600 dark:text-amber-500">
            {contact.gaps.map((g, i) => (
              <li key={i}>— {g}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export type LinkedProgram = {
  id: string;
  code: string;
  name: string;
  fit: string | null;
  strength: string;
  note: string | null;
};

/** The initiatives and challenges this person is tied to, with Factory fit. */
export function ProgramsPanel({
  contactId,
  accountId,
  initiatives,
  challenges,
}: {
  contactId: string;
  accountId: string | null;
  initiatives: LinkedProgram[];
  challenges: LinkedProgram[];
}) {
  if (initiatives.length === 0 && challenges.length === 0) return null;
  const href = accountId ? `/accounts/${accountId}` : null;
  return (
    <section className="space-y-2 rounded-lg border bg-card p-4" key={contactId}>
      <h2 className="text-sm font-semibold">Programs</h2>
      {initiatives.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Initiatives</p>
          <ul className="flex flex-wrap gap-1.5">
            {initiatives.map((p) => (
              <li key={p.id} className="flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs">
                {href ? (
                  <a href={href} className="font-medium hover:underline">
                    {p.code} · {p.name}
                  </a>
                ) : (
                  <span className="font-medium">
                    {p.code} · {p.name}
                  </span>
                )}
                <FitBadge fit={p.fit} />
                {p.strength === "inferred" && <span className="text-muted-foreground" title="Inferred link">~</span>}
                {p.note && <span className="text-muted-foreground" title={p.note}>·</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {challenges.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Challenges</p>
          <ul className="flex flex-wrap gap-1.5">
            {challenges.map((p) => (
              <li key={p.id} className="flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs">
                {href ? (
                  <a href={href} className="font-medium hover:underline">
                    {p.code} · {p.name}
                  </a>
                ) : (
                  <span className="font-medium">
                    {p.code} · {p.name}
                  </span>
                )}
                <FitBadge fit={p.fit} />
                {p.strength === "inferred" && <span className="text-muted-foreground" title="Inferred link">~</span>}
                {p.note && <span className="text-muted-foreground" title={p.note}>·</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/** Pending AI and import proposals for this person, accepted or rejected in place. */
export function ProposalsPanel({ inferences }: { inferences: Inference[] }) {
  if (inferences.length === 0) return null;
  return (
    <section className="space-y-2 rounded-lg border bg-card p-4">
      <h2 className="text-sm font-semibold">Pending proposals ({inferences.length})</h2>
      <p className="text-xs text-muted-foreground">Accepting writes the change to this profile.</p>
      <ul className="space-y-2">
        {inferences.map((inf) => (
          <InferenceCard
            key={inf.id}
            className="border-0 bg-muted/40 p-3"
            data={{
              id: inf.id,
              kind: inf.kind,
              description: describeInferenceValue(inf.kind, inf.value),
              confidence: inf.confidence,
              source: inf.source,
              subjectLabel: null,
              subjectHref: null,
              rationale: inf.rationale,
              evidence: inf.evidence,
            }}
          />
        ))}
      </ul>
    </section>
  );
}

export function DangerPanel({ contact }: { contact: Contact }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <section className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
      <button
        type="button"
        disabled={pending}
        className="flex items-center gap-1.5 text-sm text-destructive hover:underline disabled:opacity-50"
        onClick={() => {
          if (!confirm(`Delete ${contact.full_name}? This cannot be undone.`)) return;
          start(async () => {
            const r = await deleteContact(contact.id);
            if (!r.ok) {
              toast.error(r.error);
              return;
            }
            router.push("/contacts");
          });
        }}
      >
        <Trash2 className="size-3.5" /> {pending ? "Deleting…" : `Delete ${contact.full_name}`}
      </button>
      {(isGone(contact.statuses) || isDnc(contact.statuses)) && (
        <p className="mt-1 text-xs text-muted-foreground">Keep the record for its history instead of deleting.</p>
      )}
    </section>
  );
}
