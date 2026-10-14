"use server";

import { requireUser } from "@/lib/auth";
import { normalizeLayout, type CanvasLayout, type CanvasView } from "@/lib/canvas/graph";

export type CanvasActionResult = { ok: true } | { ok: false; error: string };

/** Saves the seller's arrangement for one account canvas view; the client's JSON shape is never trusted. */
export async function saveCanvasLayout(
  accountId: string,
  view: CanvasView,
  layout: CanvasLayout,
): Promise<CanvasActionResult> {
  const { supabase, user } = await requireUser();
  if (view !== "people" && view !== "hierarchy") return { ok: false, error: "Unknown canvas view." };
  const clean = normalizeLayout(layout);
  const { error } = await supabase.from("canvas_layouts").upsert(
    {
      owner_id: user.id,
      account_id: accountId,
      view,
      positions: clean.positions,
      added: clean.added,
      hidden: clean.hidden,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "owner_id,account_id,view" },
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
