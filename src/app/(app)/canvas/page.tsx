import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { CONTACT_LIST_COLUMNS, type ContactListItem, listAccounts, listOrgs } from "@/lib/data";
import {
  hierarchyAccounts,
  normalizeLayout,
  subtreeAccountIds,
  topAncestorId,
  type CanvasLayout,
} from "@/lib/canvas/graph";
import type { StyleRule } from "@/lib/types";
import { AccountCanvas } from "./canvas";

export type CanvasOrg = { id: string; name: string; color: string | null; account_id: string };
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
export type AccountChoice = { id: string; name: string; out_of_scope: boolean };

/**
 * The canvas for one account's sphere: that account and every entity beneath
 * it. Without ?account=, opens the account with the most contacts at its top
 * parent. One query set, no per-node round trips.
 */
export default async function CanvasPage({ searchParams }: PageProps<"/canvas">) {
  const sp = await searchParams;
  const requested = typeof sp.account === "string" ? sp.account : null;
  const { supabase } = await requireUser();
  const allAccounts = await listAccounts(supabase);

  let accountId = requested && allAccounts.some((a) => a.id === requested) ? requested : null;
  if (!accountId) {
    const { data: owners } = await supabase.from("contacts").select("account_id").not("account_id", "is", null);
    const counts = new Map<string, number>();
    for (const r of (owners ?? []) as { account_id: string }[]) counts.set(r.account_id, (counts.get(r.account_id) ?? 0) + 1);
    const busiest = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    accountId = busiest ? topAncestorId(allAccounts, busiest) : (allAccounts[0]?.id ?? null);
  }
  if (!accountId) {
    return (
      <div className="p-8 text-sm text-muted-foreground">
        No accounts yet. <Link href="/import" className="text-primary hover:underline">Import contacts</Link> to build a canvas.
      </div>
    );
  }
  const account = allAccounts.find((a) => a.id === accountId)!;
  const sphereIds = subtreeAccountIds(allAccounts, accountId);

  const [contactRows, orgs, influenceRows, ruleRows, layoutRows] = await Promise.all([
    supabase.from("contacts").select(CONTACT_LIST_COLUMNS).in("account_id", sphereIds).order("last_name"),
    listOrgs(supabase, sphereIds),
    supabase.from("influences").select("from_contact_id, to_contact_id, confidence, strength"),
    supabase.from("style_rules").select("*").order("priority", { ascending: false }),
    supabase.from("canvas_layouts").select("view, positions, added, hidden").eq("account_id", accountId),
  ]);

  const contacts = (contactRows.data ?? []) as ContactListItem[];
  const contactIds = new Set(contacts.map((c) => c.id));
  // Influence edges only matter inside the sphere; cross-account ends stay on profiles.
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

  const toCanvasAccount = (a: (typeof allAccounts)[number]): CanvasAccount => ({
    id: a.id,
    name: a.name,
    domain: a.domain,
    parent_account_id: a.parent_account_id,
    parent_relationship: a.parent_relationship,
    entity_type: a.entity_type,
    out_of_scope: a.out_of_scope,
    employee_count: a.employee_count,
  });

  return (
    <AccountCanvas
      // Remount per account so per-account state (layout, filters) never leaks across.
      key={accountId}
      accountId={accountId}
      accountName={account.name}
      accountChoices={allAccounts.map((a) => ({ id: a.id, name: a.name, out_of_scope: a.out_of_scope }))}
      sphereAccounts={allAccounts.filter((a) => sphereIds.includes(a.id)).map(toCanvasAccount)}
      contacts={contacts}
      orgs={orgs.map((o) => ({ id: o.id, name: o.name, color: o.color, account_id: o.account_id }))}
      accounts={hierarchyAccounts(allAccounts, accountId).map(toCanvasAccount)}
      influences={influences}
      styleRules={(ruleRows.data ?? []) as StyleRule[]}
      layouts={layouts}
    />
  );
}
