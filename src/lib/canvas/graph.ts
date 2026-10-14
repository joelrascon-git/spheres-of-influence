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

/** Edge stroke by reporting confidence: solid = confirmed, dashed = medium, dotted = low. */
export function reportingEdgeStyle(confidence: string | null | undefined): { strokeDasharray?: string } {
  if (confidence === "confirmed") return {};
  if (confidence === "low") return { strokeDasharray: "2 4" };
  return { strokeDasharray: "8 4" };
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
