import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { getFieldDefs } from "@/lib/data";
import type { PersonaCatalogEntry, Prompt, StyleRule } from "@/lib/types";
import { AdminPanels } from "./admin-panels";

export default async function AdminPage() {
  const { supabase } = await requireUser();
  const [fields, rules, prompts, personas] = await Promise.all([
    getFieldDefs(supabase),
    supabase.from("style_rules").select("*").order("priority", { ascending: false }),
    supabase.from("prompts").select("id, key, name, description, model, system_prompt, version, updated_at").order("name"),
    supabase.from("persona_catalog").select("*").order("sort_order"),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <PageHeader
        title="Admin"
        description="Your workspace, your words: fields, picklists, personas, how contacts look on the canvas, and the AI prompts behind every feature."
      />
      <AdminPanels
        fields={fields}
        rules={(rules.data ?? []) as unknown as StyleRule[]}
        prompts={(prompts.data ?? []) as unknown as Prompt[]}
        personas={(personas.data ?? []) as unknown as PersonaCatalogEntry[]}
      />
    </div>
  );
}
