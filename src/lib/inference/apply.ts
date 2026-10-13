/**
 * Write-through for reviewed inferences: accepting a proposal applies it to its
 * subject. The plan builders are pure so their validation is unit-testable; the
 * apply step resolves names against the database (org by name, manager by name,
 * program by code) and never invents a row it cannot find.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CHAMPION_FLAG,
  ENTITY_TYPES,
  ORG_FIT,
  PERSONA_CODES,
  SENIORITY_LEVELS,
} from "@/lib/constants";
import type { Evidence, Inference } from "@/lib/types";

export type InferenceLike = Pick<Inference, "subject_type" | "subject_id" | "kind" | "value" | "confidence" | "evidence" | "rationale" | "source">;

// ───────────────────────── Pure plan builders ─────────────────────────

export type WritePlan =
  | { type: "patch"; patch: Record<string, unknown> }
  /** Merge into a contact array column; upgrading persona status marks the merge evidence-backed. */
  | { type: "array"; field: "statuses" | "personas"; op: "add" | "remove" | "set"; values: string[]; upgradePersonaStatus?: boolean }
  /** Set org_id by resolving an org name (or id) inside the contact's account. */
  | { type: "org"; org: string }
  /** Set reports_to by resolving a full name inside the contact's account. */
  | { type: "manager"; name: string; confidence?: string }
  /** Link the contact to an initiative/challenge by code (or name). */
  | { type: "program_link"; program: "initiative" | "challenge"; code: string }
  /** Informational only: accepting records the review without writing. */
  | { type: "none" };

/** Fields the "field" kind may write, per subject type. Never profile text: that is seller territory. */
const FIELD_WRITES: Record<"contact" | "account" | "org", Record<string, "array" | "text" | "bool" | "int" | "enum">> = {
  contact: {
    statuses: "array",
    personas: "array",
    engage_stage: "text",
    buying_role: "text",
    champion_flag: "enum",
    can_veto: "bool",
    function_bucket: "int",
  },
  account: {
    why_anything: "text",
    why_factory: "text",
    why_now: "text",
    entity_type: "enum",
    out_of_scope: "bool",
  },
  org: {
    buying_role: "text",
    factory_fit: "enum",
    rank: "int",
  },
};

const enumValues = (field: string): readonly string[] => {
  switch (field) {
    case "champion_flag":
      return CHAMPION_FLAG.map((c) => c.value);
    case "entity_type":
      return ENTITY_TYPES.map((e) => e.value);
    case "factory_fit":
      return ORG_FIT.map((f) => f.value);
    default:
      return [];
  }
};

const asString = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const asArray = (v: unknown): string[] | null =>
  Array.isArray(v) && v.every((x) => typeof x === "string") && v.length > 0 ? (v as string[]) : null;

/** Contact-only kinds: they express writes that only make sense for a person. */
const CONTACT_ONLY_KINDS: readonly Inference["kind"][] = [
  "persona",
  "seniority_level",
  "key_person",
  "org_assignment",
  "reporting_line",
  "initiative_link",
  "challenge_link",
];

/**
 * Turns a proposal into a write plan. Returns an error string for values the
 * plan cannot express — the review action shows it instead of writing.
 */
export function writePlanFor(
  subjectType: Inference["subject_type"],
  kind: Inference["kind"],
  value: Record<string, unknown>,
): { plan: WritePlan } | { error: string } {
  if (subjectType !== "contact" && CONTACT_ONLY_KINDS.includes(kind))
    return { error: `“${kind}” proposals only apply to contacts.` };
  switch (kind) {
    case "persona": {
      const codes = (asArray(value.personas) ?? []).filter((p) => PERSONA_CODES.some((c) => c.code === p));
      if (!codes.length) return { error: "No valid persona codes in the proposal." };
      return { plan: { type: "array", field: "personas", op: "add", values: codes, upgradePersonaStatus: true } };
    }
    case "seniority_level": {
      const level = asString(value.seniority_level);
      if (!level || !SENIORITY_LEVELS.some((l) => l.value === level)) return { error: "Seniority level must be one of L1–L6." };
      return { plan: { type: "patch", patch: { seniority_level: level } } };
    }
    case "key_person": {
      if (typeof value.is_key !== "boolean") return { error: "Key-person proposals need is_key: true or false." };
      const patch: Record<string, unknown> = { is_key: value.is_key };
      const reason = asString(value.key_reasoning);
      if (reason) patch.key_reasoning = reason;
      return { plan: { type: "patch", patch } };
    }
    case "org_assignment": {
      const org = asString(value.org) ?? asString(value.org_name) ?? asString(value.org_id);
      if (!org) return { error: "No org name in the proposal." };
      return { plan: { type: "org", org } };
    }
    case "reporting_line": {
      const name = asString(value.reports_to) ?? asString(value.reports_to_name) ?? asString(value.reports_to_id);
      if (!name) return { error: "No manager name in the proposal." };
      return { plan: { type: "manager", name, confidence: asString(value.reports_to_confidence) ?? undefined } };
    }
    case "initiative_link":
    case "challenge_link": {
      const program = kind === "initiative_link" ? "initiative" : "challenge";
      const code = asString(value.code) ?? asString(value.initiative_code) ?? asString(value.challenge_code) ?? asString(value.name);
      if (!code) return { error: `No ${program} code in the proposal.` };
      return { plan: { type: "program_link", program, code } };
    }
    case "field": {
      const field = asString(value.field);
      if (!field) return { error: "No field name in the proposal." };
      if (subjectType !== "contact" && subjectType !== "account" && subjectType !== "org")
        return { error: `“${field}” is not a field proposals can write.` };
      const shape = FIELD_WRITES[subjectType][field];
      if (!shape) return { error: `“${field}” is not a field proposals can write.` };
      const mode = asString(value.mode) === "add" || asString(value.mode) === "remove" ? asString(value.mode) : "set";
      if (shape === "array") {
        const values = asArray(value.value) ?? (typeof value.value === "string" ? [value.value] : null);
        if (!values) return { error: `“${field}” needs a list of values.` };
        const op = mode === "set" ? "set" : (mode as "add" | "remove");
        return {
          plan: {
            type: "array",
            field: field as "statuses" | "personas",
            op,
            values: values.filter((v) => v.length > 0),
            upgradePersonaStatus: field === "personas" && op === "add",
          },
        };
      }
      const raw = value.value;
      if (shape === "bool" && typeof raw !== "boolean") return { error: `“${field}” needs true or false.` };
      if (shape === "int" && (typeof raw !== "number" || !Number.isInteger(raw))) return { error: `“${field}” needs a number.` };
      if (shape === "text" && !asString(raw)) return { error: `“${field}” needs text.` };
      if (shape === "enum" && (!asString(raw) || !enumValues(field).includes(String(raw)))) return { error: `“${raw}” is not a valid ${field}.` };
      return { plan: { type: "patch", patch: { [field]: raw } } };
    }
    case "summary":
      return { plan: { type: "none" } };
  }
}

/** Corpus confidence on a reporting line becomes the UI's three-point scale. */
export function reportingConfidenceFrom(v: unknown): "confirmed" | "medium" | "low" {
  if (v === "confirmed") return "confirmed";
  if (v === "secondhand" || v === "medium") return "medium";
  return "low";
}

/** Evidence claims joined into one text block, used for reports-to evidence and link notes. */
export function evidenceTextOf(evidence: Evidence[], rationale?: string | null): string | null {
  const parts = evidence.map((e) => e.claim).filter(Boolean);
  if (rationale) parts.push(rationale);
  return parts.length ? parts.join(" • ") : null;
}

/** One-line human description of what accepting would write. */
export function describeInferenceValue(kind: Inference["kind"], value: Record<string, unknown>): string {
  const str = (k: string) => asString(value[k]);
  switch (kind) {
    case "persona": {
      const codes = asArray(value.personas) ?? [];
      return codes.length ? `Personas: ${codes.join(", ")}` : "Personas";
    }
    case "seniority_level":
      return `Seniority level: ${str("seniority_level") ?? "?"}`;
    case "org_assignment":
      return `Org: ${str("org") ?? str("org_name") ?? "?"}`;
    case "key_person": {
      const reason = str("key_reasoning");
      return value.is_key === false ? "Not a key person" : `Mark key${reason ? ` — ${reason}` : ""}`;
    }
    case "reporting_line": {
      const name = str("reports_to") ?? str("reports_to_name") ?? "?";
      return `Reports to ${name}`;
    }
    case "initiative_link":
    case "challenge_link": {
      const label = kind === "initiative_link" ? "Initiative" : "Challenge";
      const code = str("code") ?? str("name") ?? "?";
      return `${label}: ${code}`;
    }
    case "field": {
      const field = str("field") ?? "?";
      const mode = str("mode");
      const raw = value.value;
      const val = Array.isArray(raw) ? raw.join(", ") : raw == null ? "?" : String(raw);
      const op = mode === "add" ? " +=" : mode === "remove" ? " -=" : " =";
      return `${field}${op} ${val}`;
    }
    case "summary": {
      const s = str("summary") ?? str("text") ?? JSON.stringify(value);
      return s.length > 90 ? `${s.slice(0, 90)}…` : s;
    }
  }
}

// ───────────────────────── Apply (resolves against the database) ─────────────────────────

export type ApplyResult = { ok: true; written: boolean } | { ok: false; error: string };

type ContactRow = { id: string; account_id: string | null; personas: string[]; statuses: string[]; persona_status: string | null };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Applies one reviewed proposal to its subject. Name-based resolutions are
 * scoped to the contact's account, and a name that matches nothing is an
 * error rather than a guess.
 */
export async function applyInference(supabase: SupabaseClient, inf: InferenceLike): Promise<ApplyResult> {
  const res = writePlanFor(inf.subject_type, inf.kind, inf.value);
  if ("error" in res) return { ok: false, error: res.error };
  const plan = res.plan;

  switch (plan.type) {
    case "none":
      return { ok: true, written: false };

    case "patch": {
      const table = inf.subject_type === "contact" ? "contacts" : inf.subject_type === "account" ? "accounts" : inf.subject_type === "org" ? "orgs" : null;
      if (!table) return { ok: false, error: `Cannot write to a ${inf.subject_type}.` };
      const { error: e } = await supabase.from(table).update(plan.patch).eq("id", inf.subject_id);
      return e ? { ok: false, error: e.message } : { ok: true, written: true };
    }

    case "array": {
      const { data: c } = (await supabase
        .from("contacts")
        .select("id, account_id, personas, statuses, persona_status")
        .eq("id", inf.subject_id)
        .maybeSingle()) as { data: ContactRow | null };
      if (!c) return { ok: false, error: "The subject contact no longer exists." };
      const current = plan.field === "personas" ? c.personas : c.statuses;
      const next =
        plan.op === "add"
          ? [...new Set([...current, ...plan.values])]
          : plan.op === "remove"
            ? current.filter((v) => !plan.values.includes(v))
            : plan.values;
      const patch: Record<string, unknown> = { [plan.field]: next };
      if (plan.upgradePersonaStatus && (c.persona_status === null || c.persona_status === "assumed"))
        patch.persona_status = "indicated";
      const { error: e } = await supabase.from("contacts").update(patch).eq("id", inf.subject_id);
      return e ? { ok: false, error: e.message } : { ok: true, written: true };
    }

    case "org": {
      const { data: c } = (await supabase
        .from("contacts")
        .select("id, account_id, personas, statuses, persona_status")
        .eq("id", inf.subject_id)
        .maybeSingle()) as { data: ContactRow | null };
      if (!c) return { ok: false, error: "The subject contact no longer exists." };
      let orgId: string | null = null;
      if (UUID_RE.test(plan.org)) {
        const { data: o } = await supabase
          .from("orgs")
          .select("id, account_id")
          .eq("id", plan.org)
          .maybeSingle();
        if (o && (!c.account_id || o.account_id === c.account_id)) orgId = o.id;
      } else if (c.account_id) {
        const { data: orgs } = await supabase
          .from("orgs")
          .select("id, name, aliases")
          .eq("account_id", c.account_id);
        const want = plan.org.toLowerCase();
        const o = (orgs ?? []).find(
          (o: { id: string; name: string; aliases: string[] }) =>
            o.name.toLowerCase() === want || o.aliases.some((a) => a.toLowerCase() === want),
        );
        if (o) orgId = o.id;
      }
      if (!orgId) return { ok: false, error: `Org “${plan.org}” not found in this account — create it first.` };
      const { error: e } = await supabase.from("contacts").update({ org_id: orgId }).eq("id", inf.subject_id);
      return e ? { ok: false, error: e.message } : { ok: true, written: true };
    }

    case "manager": {
      const { data: c } = (await supabase
        .from("contacts")
        .select("id, account_id, personas, statuses, persona_status")
        .eq("id", inf.subject_id)
        .maybeSingle()) as { data: ContactRow | null };
      if (!c) return { ok: false, error: "The subject contact no longer exists." };
      let managerId: string | null = null;
      if (UUID_RE.test(plan.name)) {
        const { data: m } = await supabase.from("contacts").select("id").eq("id", plan.name).maybeSingle();
        if (m) managerId = m.id;
      } else {
        const q = supabase.from("contacts").select("id, full_name").neq("id", inf.subject_id).limit(10000);
        if (c.account_id) q.eq("account_id", c.account_id);
        else q.is("account_id", null);
        const { data } = await q;
        const want = plan.name.toLowerCase();
        const exact = (data ?? []).find((m: { id: string; full_name: string }) => m.full_name.toLowerCase() === want);
        if (exact) managerId = exact.id;
      }
      if (!managerId) return { ok: false, error: `No contact named “${plan.name}” to report to.` };
      const { error: e } = await supabase
        .from("contacts")
        .update({
          reports_to_id: managerId,
          reports_to_confidence: reportingConfidenceFrom(plan.confidence ?? inf.confidence),
          reports_to_evidence: evidenceTextOf(inf.evidence, inf.rationale),
        })
        .eq("id", inf.subject_id);
      return e ? { ok: false, error: e.message } : { ok: true, written: true };
    }

    case "program_link": {
      const { data: c } = (await supabase
        .from("contacts")
        .select("id, account_id, personas, statuses, persona_status")
        .eq("id", inf.subject_id)
        .maybeSingle()) as { data: ContactRow | null };
      if (!c) return { ok: false, error: "The subject contact no longer exists." };
      const table = plan.program === "initiative" ? "initiatives" : "challenges";
      let q = supabase.from(table).select("id, code, name");
      if (c.account_id) q = q.eq("account_id", c.account_id);
      const { data } = await q;
      const want = plan.code.toLowerCase();
      const program = (data ?? []).find(
        (p: { id: string; code: string; name: string }) => p.code.toLowerCase() === want || p.name.toLowerCase() === want,
      );
      if (!program) return { ok: false, error: `No ${plan.program} “${plan.code}” in this account.` };
      const linkTable = plan.program === "initiative" ? "contact_initiatives" : "contact_challenges";
      const fk = plan.program === "initiative" ? "initiative_id" : "challenge_id";
      const { error: e } = await supabase
        .from(linkTable)
        .upsert(
          {
            contact_id: inf.subject_id,
            [fk]: program.id,
            strength: "inferred",
            source: inf.source,
            note: inf.rationale,
          },
          { onConflict: "contact_id," + fk, ignoreDuplicates: true },
        );
      return e ? { ok: false, error: e.message } : { ok: true, written: true };
    }
  }
}
