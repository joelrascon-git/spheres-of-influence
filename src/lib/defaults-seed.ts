import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_PROMPTS,
  DEFAULT_STYLE_RULES,
  PERSONA_CATALOG_SEED,
  SYSTEM_FIELDS,
} from "@/lib/defaults";
import { DEFAULT_STATUSES, LEGACY_PERSONAS, LEGACY_STATUSES, PERSONA_CODES } from "@/lib/constants";
import { MEDDPICC_ELEMENTS } from "@/lib/workflow/qualify";

const seeded = new Set<string>();

const sameSet = (a: string[], b: string[]) => a.length === b.length && b.every((v) => a.includes(v));

/**
 * Inserts any missing default fields, style rules, prompts and persona-catalog entries
 * for this owner, and upgrades seeds that changed in code — without touching user edits.
 * Prompt content is versioned: a higher code version updates the stored prompt and
 * records the new version. Option lists are upgraded only when still equal to the
 * legacy defaults. Runs once per server process per user.
 */
export async function ensureDefaults(supabase: SupabaseClient, userId: string) {
  if (seeded.has(userId)) return;

  // ── Field definitions ─────────────────────────────────────────────────────────
  const { data: existingFields } = await supabase
    .from("field_definitions")
    .select("key, entity, options")
    .eq("is_system", true);

  const have = new Set((existingFields ?? []).map((r: { key: string; entity: string }) => `${r.entity}:${r.key}`));
  const missingFields = SYSTEM_FIELDS.filter((s) => !have.has(`${s.entity}:${s.key}`));
  if (missingFields.length) {
    await supabase.from("field_definitions").upsert(
      missingFields.map((s) => ({ ...s, is_system: true, owner_id: userId })),
      { onConflict: "owner_id,entity,key", ignoreDuplicates: true },
    );
  }

  // Upgrade picklist options that are still the untouched legacy defaults.
  for (const row of (existingFields ?? []) as { key: string; entity: string; options: string[] }[]) {
    if (row.entity !== "contact") continue;
    let next: string[] | null = null;
    if (row.key === "personas" && sameSet(row.options ?? [], LEGACY_PERSONAS)) {
      next = PERSONA_CODES.map((p) => p.code);
    } else if (row.key === "statuses" && sameSet(row.options ?? [], LEGACY_STATUSES)) {
      next = DEFAULT_STATUSES;
    }
    if (next) await supabase.from("field_definitions").update({ options: next }).eq("owner_id", userId).eq("entity", "contact").eq("key", row.key);
  }

  // ── Prompts (versioned) ──────────────────────────────────────────────────────
  const { data: existingPrompts } = await supabase
    .from("prompts")
    .select("id, key, version")
    .order("created_at");

  const stored = new Map((existingPrompts ?? []).map((p: { key: string; version: number; id: string }) => [p.key, p]));
  const toInsert = DEFAULT_PROMPTS.filter((p) => !stored.has(p.key));
  if (toInsert.length) {
    await supabase
      .from("prompts")
      .upsert(toInsert.map((p) => ({ ...p, owner_id: userId })), {
        onConflict: "owner_id,key",
        ignoreDuplicates: true,
      });
  }
  for (const p of DEFAULT_PROMPTS) {
    const s = stored.get(p.key);
    if (s && p.version > s.version) {
      await supabase
        .from("prompts")
        .update({
          name: p.name,
          description: p.description,
          model: p.model,
          system_prompt: p.system_prompt,
          version: p.version,
        })
        .eq("id", s.id);
      await supabase.from("prompt_versions").insert({
        prompt_id: s.id,
        version: p.version,
        model: p.model,
        system_prompt: p.system_prompt,
      });
    }
  }

  // ── Style rules (insert any that are missing by name) ────────────────────────
  const { data: existingRules } = await supabase.from("style_rules").select("name");
  const ruleNames = new Set((existingRules ?? []).map((r: { name: string }) => r.name));
  const missingRules = DEFAULT_STYLE_RULES.filter((r) => !ruleNames.has(r.name));
  if (missingRules.length) {
    await supabase.from("style_rules").insert(missingRules.map((r) => ({ ...r, owner_id: userId })));
  }

  // ── Persona catalog ──────────────────────────────────────────────────────────
  const { count: personaCount } = await supabase
    .from("persona_catalog")
    .select("id", { count: "exact", head: true });
  if ((personaCount ?? 0) < PERSONA_CATALOG_SEED.length) {
    await supabase
      .from("persona_catalog")
      .upsert(PERSONA_CATALOG_SEED.map((p) => ({ ...p, owner_id: userId })), {
        onConflict: "owner_id,code",
        ignoreDuplicates: true,
      });
  }

  // ── Qualification templates (MEDDPICC is the seeded default) ────────────────
  const { count: templateCount } = await supabase
    .from("qualification_templates")
    .select("id", { count: "exact", head: true });
  if ((templateCount ?? 0) === 0) {
    await supabase.from("qualification_templates").insert({
      owner_id: userId,
      name: "MEDDPICC",
      elements: MEDDPICC_ELEMENTS,
      is_default: true,
    });
  }

  seeded.add(userId);
}
