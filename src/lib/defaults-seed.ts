import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_PROMPTS, DEFAULT_STYLE_RULES, SYSTEM_FIELDS } from "@/lib/defaults";

const seeded = new Set<string>();

/**
 * Inserts any missing default fields, style rules and prompts for this owner.
 * Existing rows are never overwritten, so Admin edits survive. Runs once per server process per user.
 */
export async function ensureDefaults(supabase: SupabaseClient, userId: string) {
  if (seeded.has(userId)) return;

  const { count } = await supabase
    .from("field_definitions")
    .select("id", { count: "exact", head: true })
    .eq("is_system", true);

  if ((count ?? 0) < SYSTEM_FIELDS.length) {
    await supabase.from("field_definitions").upsert(
      SYSTEM_FIELDS.map((s) => ({ ...s, is_system: true, owner_id: userId })),
      { onConflict: "owner_id,entity,key", ignoreDuplicates: true },
    );
  }

  const { count: promptCount } = await supabase.from("prompts").select("id", { count: "exact", head: true });
  if ((promptCount ?? 0) < DEFAULT_PROMPTS.length) {
    await supabase
      .from("prompts")
      .upsert(DEFAULT_PROMPTS.map((p) => ({ ...p, owner_id: userId })), {
        onConflict: "owner_id,key",
        ignoreDuplicates: true,
      });
  }

  const { count: ruleCount } = await supabase.from("style_rules").select("id", { count: "exact", head: true });
  if ((ruleCount ?? 0) === 0) {
    await supabase.from("style_rules").insert(DEFAULT_STYLE_RULES.map((r) => ({ ...r, owner_id: userId })));
  }

  seeded.add(userId);
}
