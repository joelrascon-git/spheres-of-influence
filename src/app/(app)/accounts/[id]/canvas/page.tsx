import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { CONTACT_LIST_COLUMNS, type ContactListItem, listAccounts, listOrgs } from "@/lib/data";
import { hierarchyAccounts, normalizeLayout, type CanvasLayout } from "@/lib/canvas/graph";
import type { StyleRule } from "@/lib/types";
import { AccountCanvas } from "./canvas";

export type CanvasOrg = { id: string; name: string; color: string | null };
export type CanvasAccount = {
  id: string;
  name: string;
  domain: string | null;
  parent_account_id: string | null;
  parent_relationship: "independent" | "semi_autonomous" | "centralized" | "unknown";
  entity_type: string | null;
  out_of_scope: boolean;
  employee_count: number | null;
};

/** One query set: everything the canvas needs, no per-node round trips. */
export default async function CanvasPage({ params }: PageProps<"/accounts/[id]/canvas">) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const { data: account } = await supabase.from("accounts").select("*").eq("id", id).maybeSingle();
  if (!account) notFound();

  const [contactRows, orgs, allAccounts, influenceRows, ruleRows, layoutRows] = await Promise.all([
    supabase.from("contacts").select(CONTACT_LIST_COLUMNS).eq("account_id", id).order("last_name"),
    listOrgs(supabase, [id]),
    listAccounts(supabase),
    supabase.from("influences").select("from_contact_id, to_contact_id, confidence, strength"),
    supabase.from("style_rules").select("*").order("priority", { ascending: false }),
    supabase.from("canvas_layouts").select("view, positions, added, hidden").eq("account_id", id),
  ]);

  const contacts = (contactRows.data ?? []) as ContactListItem[];
  const contactIds = new Set(contacts.map((c) => c.id));
  // Influence edges only matter inside the account; cross-account ends stay on profiles.
  const influences = ((influenceRows.data ?? []) as {
    from_contact_id: string;
    to_contact_id: string;
    confidence: string | null;
    strength: string | null;
  }[]).filter((e) => contactIds.has(e.from_contact_id) && contactIds.has(e.to_contact_id));

  const layouts: Record<"people" | "hierarchy", CanvasLayout> = {
    people: normalizeLayout(null),
    hierarchy: normalizeLayout(null),
  };
  for (const row of (layoutRows.data ?? []) as {
    view: "people" | "hierarchy";
    positions: unknown;
    added: unknown;
    hidden: unknown;
  }[]) {
    layouts[row.view] = normalizeLayout(row);
  }

  return (
    <AccountCanvas
      accountId={id}
      accountName={account.name as string}
      contacts={contacts}
      orgs={orgs.map((o) => ({ id: o.id, name: o.name, color: o.color }))}
      accounts={hierarchyAccounts(allAccounts, id).map((a) => ({
        id: a.id,
        name: a.name,
        domain: a.domain,
        parent_account_id: a.parent_account_id,
        parent_relationship: a.parent_relationship,
        entity_type: a.entity_type,
        out_of_scope: a.out_of_scope,
        employee_count: a.employee_count,
      }))}
      influences={influences}
      styleRules={(ruleRows.data ?? []) as StyleRule[]}
      layouts={layouts}
    />
  );
}
