"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import type { ActionResult } from "@/app/(app)/contacts/actions";
import type { Tag } from "@/lib/types";

const tagInput = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80),
  description: z.string().trim().min(1, "A description is required so you remember why this tag exists.").max(2000),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#ef6f2e"),
});

export async function createTag(input: z.input<typeof tagInput>): Promise<ActionResult<Tag>> {
  const { supabase } = await requireUser();
  const parsed = tagInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { data, error } = await supabase.from("tags").insert(parsed.data).select("*").single();
  if (error) return { ok: false, error: error.code === "23505" ? "A tag with that name already exists." : error.message };
  revalidatePath("/tags");
  return { ok: true, data: data as Tag };
}

export async function updateTag(id: string, input: z.input<typeof tagInput>): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const parsed = tagInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { error } = await supabase.from("tags").update(parsed.data).eq("id", id);
  if (error) return { ok: false, error: error.code === "23505" ? "A tag with that name already exists." : error.message };
  revalidatePath("/tags");
  revalidatePath("/contacts");
  return { ok: true };
}

export async function deleteTag(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data: links } = await supabase.from("contact_tags").select("contact_id").eq("tag_id", id);
  const { error } = await supabase.from("tags").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  // The cascade's touch can run while the tag row is still visible; re-touch so its name leaves search.
  const ids = (links ?? []).map((l) => l.contact_id);
  if (ids.length) await supabase.from("contacts").update({ updated_at: new Date().toISOString() }).in("id", ids);
  revalidatePath("/tags");
  revalidatePath("/contacts");
  return { ok: true };
}

/** Moves every contact from `sourceId` onto `targetId`, then deletes the source tag. */
export async function mergeTags(sourceId: string, targetId: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  if (sourceId === targetId) return { ok: false, error: "Pick a different tag to merge into." };
  const { data: links } = await supabase.from("contact_tags").select("contact_id").eq("tag_id", sourceId);
  const rows = (links ?? []).map((l) => ({ contact_id: l.contact_id, tag_id: targetId }));
  if (rows.length) {
    const { error } = await supabase.from("contact_tags").upsert(rows, { onConflict: "contact_id,tag_id", ignoreDuplicates: true });
    if (error) return { ok: false, error: error.message };
  }
  return deleteTag(sourceId);
}
