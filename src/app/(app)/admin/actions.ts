"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/data";
import { MODELS } from "@/lib/constants";
import type { ActionResult } from "@/app/(app)/contacts/actions";

// ───────── Field definitions & picklists ─────────

const fieldPatch = z
  .object({
    label: z.string().min(1).max(200),
    options: z.array(z.string().max(200)).max(200),
    show_in_profile: z.boolean(),
    show_in_list: z.boolean(),
    show_on_canvas: z.boolean(),
    sort_order: z.number().int().min(0).max(9999),
    help_text: z.string().max(1000).nullable(),
  })
  .partial();

export async function updateFieldDef(id: string, patch: z.input<typeof fieldPatch>): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const parsed = fieldPatch.safeParse(patch);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid update" };
  const { error } = await supabase.from("field_definitions").update(parsed.data).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath("/contacts");
  return { ok: true };
}

const fieldType = z.enum([
  "text",
  "long_text",
  "rich_text",
  "number",
  "date",
  "select",
  "multi_select",
  "boolean",
  "url",
  "email",
  "phone",
]);

const newField = z.object({
  entity: z.enum(["contact", "account", "org"]),
  label: z.string().min(1).max(200),
  key: z
    .string()
    .regex(/^[a-z][a-z0-9_]{0,60}$/)
    .max(61),
  field_type: fieldType,
  options: z.array(z.string().max(200)).max(200).default([]),
});

export async function createFieldDef(input: z.input<typeof newField>): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const parsed = newField.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.path[0] === "key"
          ? "Key must be lowercase letters, numbers and underscores, starting with a letter."
          : (parsed.error.issues[0]?.message ?? "Invalid field"),
    };
  const { error } = await supabase.from("field_definitions").insert({ ...parsed.data, is_system: false });
  if (error)
    return { ok: false, error: error.code === "23505" ? "A field with that key already exists." : error.message };
  revalidatePath("/admin");
  revalidatePath("/contacts");
  return { ok: true };
}

export async function deleteFieldDef(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data: field } = await supabase.from("field_definitions").select("is_system, key, entity").eq("id", id).maybeSingle();
  if (!field) return { ok: false, error: "Field not found." };
  if (field.is_system) return { ok: false, error: "System fields can be relabeled or hidden, but not deleted." };
  const { error } = await supabase.from("field_definitions").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  // Values stay in custom_fields so re-adding the field restores them.
  revalidatePath("/admin");
  revalidatePath("/contacts");
  return { ok: true };
}

// ───────── Style rules ─────────

const styleRulePatch = z
  .object({
    name: z.string().min(1).max(200),
    field: z.string().max(100),
    operator: z.enum(["contains", "equals", "is_true", "is_empty"]),
    value: z.string().max(200).nullable(),
    style: z
      .object({
        border: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable(),
        background: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable(),
        opacity: z.number().min(0).max(1).nullable(),
        grayscale: z.boolean().nullable(),
        badge: z.string().max(40).nullable(),
      })
      .partial(),
    priority: z.number().int().min(0).max(999),
    enabled: z.boolean(),
  })
  .partial();

export async function updateStyleRule(id: string, patch: z.input<typeof styleRulePatch>): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const parsed = styleRulePatch.safeParse(patch);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid rule" };
  const values: Record<string, unknown> = { ...parsed.data };
  if (values.style) {
    // Style patches merge onto the current rule so callers can send one property.
    const { data: current } = await supabase.from("style_rules").select("style").eq("id", id).maybeSingle();
    values.style = { ...(current?.style ?? {}), ...values.style };
  }
  const { error } = await supabase.from("style_rules").update(values).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}

export async function createStyleRule(): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("style_rules")
    .insert({ name: "New rule", field: "statuses", operator: "contains", value: "", style: {}, priority: 0 });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteStyleRule(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("style_rules").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}

// ───────── Prompts ─────────

const promptPatch = z
  .object({
    name: z.string().min(1).max(200),
    description: z.string().max(1000).nullable(),
    model: z.enum(MODELS.map((m) => m.value) as [string, ...string[]]),
    system_prompt: z.string().min(1).max(100000),
  })
  .partial();

export async function updatePrompt(id: string, patch: z.input<typeof promptPatch>): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const parsed = promptPatch.safeParse(patch);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid prompt" };
  const { data: current } = await supabase
    .from("prompts")
    .select("version, model, system_prompt")
    .eq("id", id)
    .maybeSingle();
  if (!current) return { ok: false, error: "Prompt not found." };

  const contentChanged =
    (parsed.data.system_prompt !== undefined && parsed.data.system_prompt !== current.system_prompt) ||
    (parsed.data.model !== undefined && parsed.data.model !== current.model);
  const version = contentChanged ? current.version + 1 : current.version;

  const { error } = await supabase.from("prompts").update({ ...parsed.data, version }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  if (contentChanged) {
    await supabase.from("prompt_versions").insert({
      prompt_id: id,
      version,
      model: parsed.data.model ?? current.model,
      system_prompt: parsed.data.system_prompt ?? current.system_prompt,
    });
    await logActivity(supabase, "prompt", id, "update", { version, model: parsed.data.model ?? current.model });
  }
  revalidatePath("/admin");
  return { ok: true };
}
