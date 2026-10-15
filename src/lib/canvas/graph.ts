/**
 * Pure canvas logic: which contacts earn a node, how edges are styled, how the
 * account family is gathered, and the ELK auto-layout bridge. Framework-free so
 * every rule is unit-testable; the React Flow wiring lives in the canvas page.
 */
import type { ElkNode } from "elkjs/lib/elk-api";
import type { ContactListItem } from "@/lib/data";
import type { Account, StyleRule } from "@/lib/types";

export type CanvasView = "people" | "hierarchy";

export type CanvasLayout = {
  /** Node positions by id, as placed by the seller or the auto-layout. */
  positions: Record<string, { x: number; y: number }>;
  /** Node ids dragged onto the canvas from the side panel. */
  added: string[];
  /** Node ids removed from the canvas by the seller. */
  hidden: string[];
};

export const EMPTY_LAYOUT: CanvasLayout = { positions: {}, added: [], hidden: [] };

/** A raw canvas_layouts row to a safe layout; malformed entries are dropped, never trusted. */
export function normalizeLayout(
  row: { positions?: unknown; added?: unknown; hidden?: unknown } | null | undefined,
): CanvasLayout {
  const positions: CanvasLayout["positions"] = {};
  const raw = (row?.positions ?? {}) as Record<string, { x?: unknown; y?: unknown }>;
  for (const [id, v] of Object.entries(raw)) {
    if (typeof v?.x === "number" && Number.isFinite(v.x) && typeof v?.y === "number" && Number.isFinite(v.y)) {
      positions[id] = { x: v.x, y: v.y };
    }
  }
  const ids = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  return { positions, added: ids(row?.added), hidden: ids(row?.hidden) };
}

export type InfluenceLink = { from_contact_id: string; to_contact_id: string };

/**
 * Everyone who earns a canvas spot without being dragged in: the reporting
 * forest (managers and their reports), key contacts, high influence scores,
 * research-validated people, and influence participants.
 */
export function defaultPeopleIds(
  contacts: Pick<ContactListItem, "id" | "is_key" | "influence_score" | "persona_status" | "reports_to_id">[],
  influences: InfluenceLink[],
): Set<string> {
  const ids = new Set<string>();
  for (const c of contacts) {
    if (c.is_key) ids.add(c.id);
    if ((c.influence_score ?? 0) >= 60) ids.add(c.id);
    if (c.persona_status && c.persona_status !== "assumed") ids.add(c.id);
    if (c.reports_to_id) {
      ids.add(c.id);
      ids.add(c.reports_to_id);
    }
  }
  for (const e of influences) {
    ids.add(e.from_contact_id);
    ids.add(e.to_contact_id);
  }
  return ids;
}

/** People-view membership: the default set plus manual additions, minus manual removals. */
export function peopleIds(
  contacts: Parameters<typeof defaultPeopleIds>[0],
  influences: InfluenceLink[],
  layout: Pick<CanvasLayout, "added" | "hidden">,
): Set<string> {
  const ids = defaultPeopleIds(contacts, influences);
  for (const id of layout.added) ids.add(id);
  for (const id of layout.hidden) ids.delete(id);
  return ids;
}

// ───────────────────────── Filters ─────────────────────────

export type LineKind = "confirmed" | "medium" | "low" | "unrated" | "influence";
export const LINE_KINDS: LineKind[] = ["confirmed", "medium", "low", "unrated", "influence"];

export type CanvasFilters = {
  /** Contacts' own account (an entity inside the selected sphere). Empty = all. */
  accountIds: string[];
  orgIds: string[];
  /** One person's neighborhood: managers up, every report below, influence links. */
  focusId: string | null;
  lines: Record<LineKind, boolean>;
  /** Look past the saved canvas set to everyone matching the account and org filters. */
  everyone: boolean;
  /** Drop people who have no visible line to anyone else shown. */
  connectedOnly: boolean;
};

export const DEFAULT_FILTERS: CanvasFilters = {
  accountIds: [],
  orgIds: [],
  focusId: null,
  lines: { confirmed: true, medium: true, low: true, unrated: true, influence: true },
  everyone: false,
  connectedOnly: false,
};

export const filtersActive = (f: CanvasFilters) =>
  f.accountIds.length > 0 ||
  f.orgIds.length > 0 ||
  f.focusId !== null ||
  f.everyone ||
  f.connectedOnly ||
  LINE_KINDS.some((k) => !f.lines[k]);

export const reportingLineKind = (confidence: string | null | undefined): LineKind =>
  confidence === "confirmed" || confidence === "medium" || confidence === "low" ? confidence : "unrated";

type FilterContact = Pick<ContactListItem, "id" | "account_id" | "org_id" | "reports_to_id" | "reports_to_confidence">;

/** A person, their management chain up, everyone below them, and their direct influence links. */
export function focusIds(contacts: FilterContact[], influences: InfluenceLink[], focusId: string): Set<string> {
  const byId = new Map(contacts.map((c) => [c.id, c]));
  const ids = new Set<string>([focusId]);
  let cur = byId.get(focusId);
  while (cur?.reports_to_id && !ids.has(cur.reports_to_id)) {
    ids.add(cur.reports_to_id);
    cur = byId.get(cur.reports_to_id);
  }
  const reportsOf = new Map<string, string[]>();
  for (const c of contacts) {
    if (!c.reports_to_id) continue;
    reportsOf.set(c.reports_to_id, [...(reportsOf.get(c.reports_to_id) ?? []), c.id]);
  }
  const stack = [focusId];
  while (stack.length) {
    for (const r of reportsOf.get(stack.pop()!) ?? []) {
      if (ids.has(r)) continue;
      ids.add(r);
      stack.push(r);
    }
  }
  for (const e of influences) {
    if (e.from_contact_id === focusId) ids.add(e.to_contact_id);
    if (e.to_contact_id === focusId) ids.add(e.from_contact_id);
  }
  return new Set([...ids].filter((id) => byId.has(id)));
}

/**
 * Who stays on the People view under the filters. `canvasIds` is the saved
 * canvas set; a focus person replaces it with their neighborhood, and
 * `everyone` widens it to every loaded contact.
 */
export function applyCanvasFilters(
  contacts: FilterContact[],
  influences: InfluenceLink[],
  canvasIds: Set<string>,
  f: CanvasFilters,
): Set<string> {
  let ids: Set<string>;
  if (f.focusId) {
    ids = focusIds(contacts, influences, f.focusId);
  } else {
    const base = f.everyone ? contacts : contacts.filter((c) => canvasIds.has(c.id));
    const accounts = new Set(f.accountIds);
    const orgs = new Set(f.orgIds);
    ids = new Set(
      base
        .filter((c) => !accounts.size || (c.account_id !== null && accounts.has(c.account_id)))
        .filter((c) => !orgs.size || (c.org_id !== null && orgs.has(c.org_id)))
        .map((c) => c.id),
    );
  }
  if (!f.connectedOnly) return ids;

  const linked = new Set<string>();
  for (const c of contacts) {
    if (!ids.has(c.id) || !c.reports_to_id || !ids.has(c.reports_to_id)) continue;
    if (!f.lines[reportingLineKind(c.reports_to_confidence)]) continue;
    linked.add(c.id);
    linked.add(c.reports_to_id);
  }
  if (f.lines.influence)
    for (const e of influences)
      if (ids.has(e.from_contact_id) && ids.has(e.to_contact_id)) {
        linked.add(e.from_contact_id);
        linked.add(e.to_contact_id);
      }
  if (f.focusId) linked.add(f.focusId);
  return new Set([...ids].filter((id) => linked.has(id)));
}

/** Org box size that encloses its member cards (positions are relative to the box). */
export function enclosingGroupSize(
  children: { x: number; y: number; w?: number; h?: number }[],
  card: { w: number; h: number },
  pad = 16,
): { w: number; h: number } {
  let w = 252;
  let h = 130;
  for (const c of children) {
    w = Math.max(w, c.x + (c.w ?? card.w) + pad);
    h = Math.max(h, c.y + (c.h ?? card.h) + pad);
  }
  return { w, h };
}

/**
 * Card scale by influence score — the influence-map spec says node size
 * reflects the score. 0–100 maps to 0.8×–1.3×; unscored people stay neutral.
 */
export function influenceScale(score: number | null | undefined): number {
  if (score == null) return 1;
  const s = Math.max(0, Math.min(100, score));
  return 0.8 + (s / 100) * 0.5;
}

/** Edge stroke by confidence: solid = confirmed, dashed = medium, dotted = low. Shared by reporting and influence lines. */
export function confidenceEdgeStyle(confidence: string | null | undefined): { strokeDasharray?: string } {
  if (confidence === "confirmed") return {};
  if (confidence === "low") return { strokeDasharray: "2 4" };
  return { strokeDasharray: "8 4" };
}

/** The account and every account beneath it: the sphere whose people a canvas shows. */
export function subtreeAccountIds(accounts: Pick<Account, "id" | "parent_account_id">[], rootId: string): string[] {
  const ids = new Set([rootId]);
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop()!;
    for (const a of accounts)
      if (a.parent_account_id === id && !ids.has(a.id)) {
        ids.add(a.id);
        stack.push(a.id);
      }
  }
  return [...ids];
}

/** The account's top-most ancestor (loop-safe). */
export function topAncestorId(accounts: Pick<Account, "id" | "parent_account_id">[], id: string): string {
  const byId = new Map(accounts.map((a) => [a.id, a]));
  const seen = new Set<string>();
  let cur = id;
  while (!seen.has(cur)) {
    seen.add(cur);
    const parent = byId.get(cur)?.parent_account_id;
    if (!parent || !byId.has(parent)) break;
    cur = parent;
  }
  return cur;
}

/** The account's family for the hierarchy view: itself, its ancestors, and every descendant. */
export function hierarchyAccounts(accounts: Account[], rootId: string): Account[] {
  const byId = new Map(accounts.map((a) => [a.id, a]));
  const out = new Map<string, Account>();
  let cur = byId.get(rootId);
  while (cur && !out.has(cur.id)) {
    out.set(cur.id, cur);
    cur = cur.parent_account_id ? byId.get(cur.parent_account_id) : undefined;
  }
  const childrenOf = new Map<string, Account[]>();
  for (const a of accounts) {
    if (!a.parent_account_id) continue;
    const list = childrenOf.get(a.parent_account_id) ?? [];
    list.push(a);
    childrenOf.set(a.parent_account_id, list);
  }
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop()!;
    for (const child of childrenOf.get(id) ?? []) {
      if (!out.has(child.id)) {
        out.set(child.id, child);
        stack.push(child.id);
      }
    }
  }
  return [...out.values()];
}

/** The first enabled rule (highest priority wins) a contact's statuses satisfy. */
export function matchStyleRule(rules: StyleRule[], statuses: string[]): StyleRule | null {
  for (const r of rules) {
    if (!r.enabled || r.field !== "statuses") continue;
    if (r.operator === "contains" && r.value != null && statuses.includes(r.value)) return r;
    if (r.operator === "equals" && r.value != null && statuses.length === 1 && statuses[0] === r.value) return r;
  }
  return null;
}

// ───────────────────────── ELK auto-layout ─────────────────────────

export type ElkPosition = { x: number; y: number; width: number; height: number };

export type LayoutNodeSpec = {
  id: string;
  width: number;
  height: number;
  /** Group node this node lives in (org boxes on the people view). */
  parentNode?: string;
  /** Group nodes get padding for their header label. */
  group?: boolean;
};

export type LayoutEdgeSpec = { id: string; sources: string[]; targets: string[] };

/**
 * ELK layered auto-layout, compound org groups included. Returns group nodes in
 * absolute coordinates and their children RELATIVE to the group, which is what
 * React Flow expects.
 */
export async function layoutWithElk(
  nodes: LayoutNodeSpec[],
  edges: LayoutEdgeSpec[],
  direction: "DOWN" | "RIGHT" = "DOWN",
): Promise<Record<string, ElkPosition>> {
  const ELKConstructor = (await import("elkjs/lib/elk.bundled.js")).default;
  const elk = new ELKConstructor();

  const childrenOf = new Map<string, LayoutNodeSpec[]>();
  for (const n of nodes) {
    if (!n.parentNode) continue;
    const list = childrenOf.get(n.parentNode) ?? [];
    list.push(n);
    childrenOf.set(n.parentNode, list);
  }
  const toElk = (n: LayoutNodeSpec): ElkNode => ({
    id: n.id,
    width: n.width,
    height: n.height,
    ...(n.group ? { layoutOptions: { "elk.padding": "[top=36,left=16,bottom=16,right=16]" } } : {}),
    children: (childrenOf.get(n.id) ?? []).map(toElk),
  });

  const result = (await elk.layout({
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": direction,
      "elk.hierarchyHandling": "INCLUDE_CHILDREN",
      "elk.layered.spacing.nodeNodeBetweenLayers": "70",
      "elk.spacing.edgeEdge": "15",
      "elk.spacing.edgeNode": "25",
      "elk.spacing.nodeNode": "30",
    },
    children: nodes.filter((n) => !n.parentNode).map(toElk),
    edges: edges.map((e) => ({ id: e.id, sources: e.sources, targets: e.targets })),
  })) as { id: string; x?: number; y?: number; width?: number; height?: number; children?: unknown[] };

  // ELK already reports every node's x/y relative to its containing node, which
  // is the same convention React Flow uses for parentId children.
  const out: Record<string, ElkPosition> = {};
  const wanted = new Set(nodes.map((n) => n.id));
  const walk = (n: { id: string; x?: number; y?: number; width?: number; height?: number; children?: unknown[] }) => {
    if (wanted.has(n.id)) out[n.id] = { x: n.x ?? 0, y: n.y ?? 0, width: n.width ?? 0, height: n.height ?? 0 };
    for (const c of (n.children ?? []) as Parameters<typeof walk>[0][]) walk(c);
  };
  walk(result);
  return out;
}
