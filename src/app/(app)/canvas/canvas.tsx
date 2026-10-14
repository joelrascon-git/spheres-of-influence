"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ChevronDown, Crosshair, LayoutGrid, Network, Plus, SlidersHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MultiSelect, SingleSelect } from "@/components/fields";
import { ContactAvatar, KeyStar, PersonaBadge, StatusBadge } from "@/components/contact-bits";
import { ContactHoverCard } from "@/components/contact-hover-card";
import { CONFIDENCE } from "@/lib/constants";
import {
  DEFAULT_FILTERS,
  LINE_KINDS,
  applyCanvasFilters,
  enclosingGroupSize,
  filtersActive,
  layoutWithElk,
  matchStyleRule,
  peopleIds,
  reportingEdgeStyle,
  reportingLineKind,
  type CanvasFilters,
  type CanvasView,
  type LayoutEdgeSpec,
  type LayoutNodeSpec,
  type LineKind,
} from "@/lib/canvas/graph";
import type { ContactListItem } from "@/lib/data";
import type { StyleRule } from "@/lib/types";
import type { AccountChoice, CanvasAccount, CanvasOrg } from "./page";
import { saveCanvasLayout } from "./actions";

// ───────────────────────── Data shapes ─────────────────────────

export type CanvasInfluence = {
  from_contact_id: string;
  to_contact_id: string;
  confidence: string | null;
  strength: string | null;
};

type StatusDot = { label: string; color: string | null };

type ContactNodeData = {
  kind: "contact";
  contact: ContactListItem;
  orgName: string | null;
  rule: StyleRule["style"] | null;
  statusDots: StatusDot[];
};
type OrgNodeData = { kind: "org"; name: string; count: number; collapsed: boolean };
type AccountNodeData = { kind: "account"; account: CanvasAccount; isRoot: boolean };
export type CanvasNodeData = ContactNodeData | OrgNodeData | AccountNodeData;
export type CanvasNode = Node<CanvasNodeData>;

type CanvasProps = {
  accountId: string;
  accountName: string;
  /** Every account, for the account picker. */
  accountChoices: AccountChoice[];
  /** The selected account and the entities beneath it, for the account filter. */
  sphereAccounts: CanvasAccount[];
  contacts: ContactListItem[];
  orgs: CanvasOrg[];
  accounts: CanvasAccount[];
  influences: CanvasInfluence[];
  styleRules: StyleRule[];
  layouts: Record<CanvasView, ReturnType<typeof import("@/lib/canvas/graph").normalizeLayout>>;
};

const CARD_W = 220;
const CARD_H = 78;
const ACC_W = 230;
const ACC_H = 84;
const EDGE_COLOR = "#78716c";
const INFLUENCE_COLOR = "#f59e0b";
const RELATIONSHIP_LABELS: Record<CanvasAccount["parent_relationship"], string> = {
  centralized: "Centralized procurement",
  semi_autonomous: "Semi-autonomous",
  independent: "Independent",
  unknown: "Unknown",
};
const LINE_LABELS: Record<LineKind, string> = {
  confirmed: "Confirmed",
  medium: "Medium",
  low: "Low",
  unrated: "Unrated",
  influence: "Influence",
};

// ───────────────────────── Custom nodes ─────────────────────────

function ContactNode({ data, selected }: NodeProps) {
  const d = data as CanvasNodeData;
  if (d.kind !== "contact") return null;
  const c = d.contact;
  return (
    <div
      className={`group w-[220px] rounded-lg border bg-card p-2 shadow-sm transition-shadow ${selected ? "ring-2 ring-primary" : ""}`}
      style={{
        borderColor: d.rule?.border,
        background: d.rule?.background,
        opacity: d.rule?.opacity,
        filter: d.rule?.grayscale ? "grayscale(1)" : undefined,
      }}
    >
      <Handle type="target" position={Position.Top} className="!size-1.5 !border-0 !bg-muted-foreground" />
      <div className="flex items-start gap-2">
        <ContactAvatar name={c.full_name} path={c.avatar_path} size={28} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 truncate text-xs font-semibold">
            <span className="truncate">{c.full_name}</span>
            {c.is_key && <KeyStar active className="size-3 shrink-0" />}
          </p>
          <p className="line-clamp-2 text-[11px] leading-tight text-muted-foreground">{c.title ?? "No title"}</p>
        </div>
      </div>
      <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        {d.statusDots.map((s) => (
          <span key={s.label} className="flex items-center gap-0.5" title={s.label}>
            {s.color && <span className="size-1.5 rounded-full" style={{ background: s.color }} />}
            <span className="max-w-[80px] truncate">{s.label}</span>
          </span>
        ))}
        {c.seniority_level && <span className="ml-auto shrink-0 rounded bg-accent px-1">{c.seniority_level}</span>}
        {c.influence_score != null && <span className="shrink-0 tabular-nums">I{c.influence_score}</span>}
      </div>
      <Handle type="source" position={Position.Bottom} className="!size-1.5 !border-0 !bg-muted-foreground" />
    </div>
  );
}

function OrgNode({ data }: NodeProps) {
  const d = data as CanvasNodeData;
  if (d.kind !== "org") return null;
  return (
    <div className="pointer-events-none relative h-full w-full rounded-xl border border-dashed border-muted-foreground/40 bg-muted/5">
      <div className="pointer-events-auto absolute left-2 top-2 flex max-w-full items-center gap-1 rounded bg-card/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span className="truncate">{d.name}</span>
        <span>· {d.count}</span>
        {d.collapsed && <ChevronDown className="size-3" />}
      </div>
    </div>
  );
}

function AccountNode({ data, selected }: NodeProps) {
  const d = data as CanvasNodeData;
  if (d.kind !== "account") return null;
  const a = d.account;
  return (
    <div
      className={`w-[230px] rounded-lg border bg-card p-2.5 shadow-sm ${selected ? "ring-2 ring-primary" : ""} ${a.out_of_scope ? "opacity-55 grayscale" : ""}`}
    >
      <Handle type="target" position={Position.Left} className="!size-1.5 !border-0 !bg-muted-foreground" />
      <p className="flex items-center gap-1.5 truncate text-xs font-semibold">
        <span className="truncate">{a.name}</span>
        {d.isRoot && <span className="shrink-0 rounded bg-primary/15 px-1 text-[10px] text-primary">This account</span>}
      </p>
      {a.domain && <p className="truncate text-[11px] text-muted-foreground">{a.domain}</p>}
      <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
        {a.employee_count != null && <span>{a.employee_count.toLocaleString()} employees</span>}
        {a.entity_type && <span className="rounded bg-accent px-1">{a.entity_type}</span>}
        {a.out_of_scope && <span className="rounded bg-red-500/15 px-1 text-red-400">Out of scope</span>}
      </div>
      <Handle type="source" position={Position.Right} className="!size-1.5 !border-0 !bg-muted-foreground" />
    </div>
  );
}

const nodeTypes: NodeTypes = { contact: ContactNode, org: OrgNode, account: AccountNode };

// ───────────────────────── Canvas ─────────────────────────

export function AccountCanvas(props: CanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}

function CanvasInner({
  accountId,
  accountName,
  accountChoices,
  sphereAccounts,
  contacts,
  orgs,
  accounts,
  influences,
  styleRules,
  layouts,
}: CanvasProps) {
  const router = useRouter();
  const { screenToFlowPosition, fitView } = useReactFlow();

  const [view, setView] = useState<CanvasView>("people");
  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [collapsedOrgs, setCollapsedOrgs] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingDrop, setPendingDrop] = useState<{ childId: string; managerId: string } | null>(null);
  const [dropConfidence, setDropConfidence] = useState("medium");
  const [search, setSearch] = useState("");
  const [autoLaying, setAutoLaying] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [panelOpen, setPanelOpen] = useState(true);
  const [legendOpen, setLegendOpen] = useState(false);
  const [added, setAdded] = useState<string[]>(layouts.people.added);
  const [hidden, setHidden] = useState<string[]>(layouts.people.hidden);
  const [overrides, setOverrides] = useState<
    Record<string, { reports_to_id?: string | null; reports_to_confidence?: "confirmed" | "medium" | "low" | null }>
  >({});

  const [filters, setFilters] = useState<CanvasFilters>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtering = view === "people" && filtersActive(filters);

  // Saved arrangement vs. a throwaway one: a filtered view gets its own compact
  // auto-layout and never overwrites the seller's saved positions.
  const positionsRef = useRef<Record<string, { x: number; y: number }>>({ ...layouts.people.positions });
  const filteredPositionsRef = useRef<Record<string, { x: number; y: number }>>({});
  const posStore = useCallback(() => (filtering ? filteredPositionsRef.current : positionsRef.current), [filtering]);
  const nodesRef = useRef<CanvasNode[]>([]);
  const membershipRef = useRef({ added, hidden });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fittedRef = useRef<string | null>(null);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);
  useEffect(() => {
    membershipRef.current = { added, hidden };
  }, [added, hidden]);

  const updateFilters = useCallback((patch: Partial<CanvasFilters>) => {
    filteredPositionsRef.current = {};
    setFilters((f) => ({ ...f, ...patch }));
  }, []);

  const contactById = useMemo(() => new Map(contacts.map((c) => [c.id, c])), [contacts]);
  const orgById = useMemo(() => new Map(orgs.map((o) => [o.id, o])), [orgs]);

  /** The contact as the canvas currently knows it: props merged with unsaved reporting overrides. */
  const effective = useCallback(
    (c: ContactListItem) => {
      const o = overrides[c.id];
      return {
        ...c,
        reports_to_id: o?.reports_to_id !== undefined ? o.reports_to_id : c.reports_to_id,
        reports_to_confidence: o?.reports_to_confidence !== undefined ? o.reports_to_confidence : c.reports_to_confidence,
      };
    },
    [overrides],
  );

  /** The saved People-view set, before filters. */
  const canvasIds = useMemo(() => peopleIds(contacts, influences, { added, hidden }), [contacts, influences, added, hidden]);

  const shownIds = useMemo(
    () =>
      view === "people"
        ? applyCanvasFilters(contacts.map(effective), influences, canvasIds, filters)
        : new Set(accounts.map((a) => a.id)),
    [view, contacts, effective, influences, canvasIds, filters, accounts],
  );

  const lineVisible = useCallback((kind: LineKind) => filters.lines[kind], [filters.lines]);

  // ── Build nodes and edges for the current view ──
  useEffect(() => {
    if (view === "people") {
      const shown = contacts.filter((c) => shownIds.has(c.id));
      const membersByOrg = new Map<string, number>();
      for (const c of shown) {
        if (!c.org_id) continue;
        membersByOrg.set(c.org_id, (membersByOrg.get(c.org_id) ?? 0) + 1);
      }

      const store = posStore();
      const nextNodes: CanvasNode[] = [];
      for (const [orgId, count] of membersByOrg) {
        const o = orgById.get(orgId);
        if (!o) continue;
        const size = enclosingGroupSize(
          shown.filter((c) => c.org_id === orgId && store[c.id]).map((c) => store[c.id]),
          { w: CARD_W, h: CARD_H },
        );
        nextNodes.push({
          id: `org:${orgId}`,
          type: "org",
          position: store[`org:${orgId}`] ?? { x: 0, y: 0 },
          data: { kind: "org", name: o.name, count, collapsed: collapsedOrgs.includes(orgId) },
          style: { width: size.w, height: size.h },
        });
      }
      for (const raw of shown) {
        const c = effective(raw);
        const rule = matchStyleRule(styleRules, c.statuses);
        const statusDots: StatusDot[] = c.statuses.slice(0, 4).map((s) => ({
          label: s,
          color: matchStyleRule(styleRules, [s])?.style.border ?? null,
        }));
        nextNodes.push({
          id: c.id,
          type: "contact",
          position: store[c.id] ?? { x: 0, y: 0 },
          data: { kind: "contact", contact: c, orgName: c.org_id ? (orgById.get(c.org_id)?.name ?? null) : null, rule: rule?.style ?? null, statusDots },
          parentId: c.org_id ? `org:${c.org_id}` : undefined,
          hidden: !!c.org_id && collapsedOrgs.includes(c.org_id),
        });
      }

      const nextEdges: Edge[] = [];
      for (const raw of shown) {
        const c = effective(raw);
        if (!c.reports_to_id || !shownIds.has(c.reports_to_id)) continue;
        if (!lineVisible(reportingLineKind(c.reports_to_confidence))) continue;
        nextEdges.push({
          id: `report:${c.id}`,
          source: c.reports_to_id,
          target: c.id,
          style: { stroke: EDGE_COLOR, strokeWidth: 1.5, ...reportingEdgeStyle(c.reports_to_confidence) },
        });
      }
      for (const e of influences) {
        if (!lineVisible("influence") || !shownIds.has(e.from_contact_id) || !shownIds.has(e.to_contact_id)) continue;
        nextEdges.push({
          id: `infl:${e.from_contact_id}:${e.to_contact_id}`,
          source: e.from_contact_id,
          target: e.to_contact_id,
          style: { stroke: INFLUENCE_COLOR, strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: INFLUENCE_COLOR, width: 14, height: 14 },
        });
      }
      setNodes(nextNodes);
      setEdges(nextEdges);
    } else {
      setNodes(
        accounts.map((a) => ({
          id: a.id,
          type: "account",
          position: positionsRef.current[a.id] ?? { x: 0, y: 0 },
          data: { kind: "account", account: a, isRoot: a.id === accountId },
        })),
      );
      setEdges(
        accounts
          .filter((a) => a.parent_account_id && accounts.some((p) => p.id === a.parent_account_id))
          .map((a) => ({
            id: `acct:${a.id}`,
            source: a.parent_account_id!,
            target: a.id,
            // Centralized is the common case; labelling every edge buries the exceptions.
            label: a.parent_relationship === "centralized" ? undefined : RELATIONSHIP_LABELS[a.parent_relationship],
            labelStyle: { fill: "#d6d3d1", fontSize: 10 },
            labelBgStyle: { fill: "#0c0a09", fillOpacity: 0.9 },
            labelBgPadding: [4, 2] as [number, number],
            labelBgBorderRadius: 4,
            style: { stroke: EDGE_COLOR, strokeWidth: 1.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLOR, width: 12, height: 12 },
          })),
      );
    }
  }, [view, contacts, influences, accounts, accountId, orgs, orgById, styleRules, shownIds, collapsedOrgs, effective, posStore, lineVisible, setNodes, setEdges]);

  // ── Persistence ──
  const doSave = useCallback(
    async (v: CanvasView) => {
      setSaveState("saving");
      // Membership only belongs to the People view; the map keeps its own lists empty.
      const { added: a, hidden: h } = v === "people" ? membershipRef.current : { added: [], hidden: [] };
      const r = await saveCanvasLayout(accountId, v, { positions: positionsRef.current, added: a, hidden: h });
      setSaveState(r.ok ? "saved" : "error");
      if (!r.ok) toast.error(r.error);
    },
    [accountId],
  );

  // Reads membership from a ref when the timer fires, so a save scheduled right
  // after an add/remove includes it.
  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void doSave(view), 700);
  }, [doSave, view]);

  // ── Auto-layout ──
  const runAutoLayout = useCallback(
    async (fit: boolean) => {
      setAutoLaying(true);
      try {
        const specs: LayoutNodeSpec[] = [];
        const edgeSpecs: LayoutEdgeSpec[] = [];
        if (view === "people") {
          const shown = contacts.filter((c) => shownIds.has(c.id));
          const orgIds = [...new Set(shown.map((c) => c.org_id).filter(Boolean) as string[])];
          for (const oid of orgIds) specs.push({ id: `org:${oid}`, width: 320, height: 200, group: true });
          for (const c of shown)
            specs.push({ id: c.id, width: CARD_W, height: CARD_H, parentNode: c.org_id ? `org:${c.org_id}` : undefined });
          for (const raw of shown) {
            const c = effective(raw);
            const m = c.reports_to_id;
            if (m && shownIds.has(m) && lineVisible(reportingLineKind(c.reports_to_confidence)))
              edgeSpecs.push({ id: `r:${raw.id}`, sources: [m], targets: [raw.id] });
          }
          for (const e of influences)
            if (lineVisible("influence") && shownIds.has(e.from_contact_id) && shownIds.has(e.to_contact_id))
              edgeSpecs.push({ id: `i:${e.from_contact_id}:${e.to_contact_id}`, sources: [e.from_contact_id], targets: [e.to_contact_id] });
        } else {
          for (const a of accounts) specs.push({ id: a.id, width: ACC_W, height: ACC_H });
          for (const a of accounts)
            if (a.parent_account_id && accounts.some((p) => p.id === a.parent_account_id))
              edgeSpecs.push({ id: `a:${a.id}`, sources: [a.parent_account_id], targets: [a.id] });
        }
        // Entity families are wide and shallow, so they read better left to right.
        const laid = await layoutWithElk(specs, edgeSpecs, view === "hierarchy" ? "RIGHT" : "DOWN");
        const store = posStore();
        for (const [id, p] of Object.entries(laid)) store[id] = { x: p.x, y: p.y };
        // Rebuild with the new positions.
        setCollapsedOrgs((s) => [...s]);
        if (fit) setTimeout(() => void fitView({ padding: 0.15, duration: 400 }), 50);
        if (!filtering) scheduleSave();
      } catch {
        toast.error("Auto-layout failed. Try again or place people manually.");
      } finally {
        setAutoLaying(false);
      }
    },
    [view, contacts, shownIds, influences, accounts, effective, fitView, scheduleSave, posStore, filtering, lineVisible],
  );

  // A view (or a new filter combination) with unplaced nodes: lay it out and fit once.
  useEffect(() => {
    if (autoLaying) return;
    const fitKey = filtering ? `${view}:${JSON.stringify(filters)}` : view;
    const store = posStore();
    const missing = nodesRef.current.filter((n) => !store[n.id]);
    if (nodes.length && missing.length) void runAutoLayout(fittedRef.current !== fitKey);
    if (nodes.length) fittedRef.current = fitKey;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rebuild-driven; runAutoLayout identity would loop
  }, [nodes, view]);

  // ── Interactions ──
  const absolutePos = useCallback((n: CanvasNode) => {
    let x = n.position.x;
    let y = n.position.y;
    let parentId = n.parentId;
    while (parentId) {
      const p = nodesRef.current.find((q) => q.id === parentId);
      if (!p) break;
      x += p.position.x;
      y += p.position.y;
      parentId = p.parentId;
    }
    return { x, y };
  }, []);

  const onNodeDragStop = useCallback(
    (_e: unknown, node: CanvasNode) => {
      posStore()[node.id] = { x: node.position.x, y: node.position.y };
      if (!filtering) scheduleSave();
      if (view !== "people" || node.type !== "contact") return;
      // Dropping one contact onto another sets a reporting line — after confirmation.
      const w = node.measured?.width ?? CARD_W;
      const h = node.measured?.height ?? CARD_H;
      const center = { x: absolutePos(node).x + w / 2, y: absolutePos(node).y + h / 2 };
      for (const n of nodesRef.current) {
        if (n.id === node.id || n.type !== "contact" || n.hidden) continue;
        const nw = n.measured?.width ?? CARD_W;
        const nh = n.measured?.height ?? CARD_H;
        const np = absolutePos(n);
        if (center.x >= np.x && center.x <= np.x + nw && center.y >= np.y && center.y <= np.y + nh) {
          if (n.id !== (node.data as ContactNodeData).contact.reports_to_id) {
            setPendingDrop({ childId: node.id, managerId: n.id });
          }
          break;
        }
      }
    },
    [scheduleSave, view, absolutePos, posStore, filtering],
  );

  const confirmDrop = useCallback(async () => {
    if (!pendingDrop) return;
    const { childId, managerId } = pendingDrop;
    const child = contactById.get(childId);
    const manager = contactById.get(managerId);
    const r = await updateReportingLine(childId, managerId, dropConfidence);
    if (!r.ok) {
      toast.error(r.error);
    } else {
      setOverrides((o) => ({
        ...o,
        [childId]: {
          reports_to_id: managerId,
          reports_to_confidence: dropConfidence as "confirmed" | "medium" | "low",
        },
      }));
      toast.success(`${child?.full_name ?? "Contact"} now reports to ${manager?.full_name ?? "manager"}`);
    }
    setPendingDrop(null);
  }, [pendingDrop, dropConfidence, contactById]);

  const addToCanvas = useCallback(
    (id: string, position?: { x: number; y: number }) => {
      positionsRef.current[id] = position ?? { x: 120 + Math.random() * 60, y: 120 + Math.random() * 60 };
      setHidden((h) => h.filter((x) => x !== id));
      setAdded((a) => (a.includes(id) ? a : [...a, id]));
      scheduleSave();
    },
    [scheduleSave],
  );

  const removeFromCanvas = useCallback(
    (id: string) => {
      setHidden((h) => (h.includes(id) ? h : [...h, id]));
      setAdded((a) => a.filter((x) => x !== id));
      setSelectedId(null);
      scheduleSave();
    },
    [scheduleSave],
  );

  const switchView = useCallback(
    (v: CanvasView) => {
      if (v === view) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      void doSave(view); // keep the arrangement we just left
      positionsRef.current = { ...layouts[v].positions };
      setView(v);
      setSelectedId(null);
      setPendingDrop(null);
    },
    [view, doSave, layouts],
  );

  const toggleCollapse = useCallback((orgNodeId: string) => {
    const orgId = orgNodeId.slice(4);
    setCollapsedOrgs((s) => (s.includes(orgId) ? s.filter((x) => x !== orgId) : [...s, orgId]));
  }, []);

  const onNodeClick = useCallback(
    (_e: unknown, node: CanvasNode) => {
      if (node.type === "org") toggleCollapse(node.id);
      else if (node.type === "contact") setSelectedId((cur) => (cur === node.id ? null : node.id));
      else setSelectedId(null);
    },
    [toggleCollapse],
  );

  const onNodeDoubleClick = useCallback(
    (_e: unknown, node: CanvasNode) => {
      if (node.type === "contact") router.push(`/contacts/${node.id}`);
      if (node.type === "account") router.push(`/accounts/${node.id}`);
    },
    [router],
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const id = event.dataTransfer.getData("application/spheres-contact");
      if (!id) return;
      addToCanvas(id, screenToFlowPosition({ x: event.clientX, y: event.clientY }));
    },
    [addToCanvas, screenToFlowPosition],
  );

  // ── Panel and legend data ──
  const panelContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts
      .filter((c) => !canvasIds.has(c.id))
      .filter((c) => !q || c.full_name.toLowerCase().includes(q) || (c.title ?? "").toLowerCase().includes(q))
      .sort((a, b) => (b.influence_score ?? 0) - (a.influence_score ?? 0) || a.last_name.localeCompare(b.last_name));
  }, [contacts, canvasIds, search]);

  // ── Filter options (only choices that would show someone) ──
  const filterOptions = useMemo(() => {
    const byAccount = new Map<string, number>();
    const byOrg = new Map<string, number>();
    for (const c of contacts) {
      if (c.account_id) byAccount.set(c.account_id, (byAccount.get(c.account_id) ?? 0) + 1);
      if (c.org_id) byOrg.set(c.org_id, (byOrg.get(c.org_id) ?? 0) + 1);
    }
    const accountName = new Map(sphereAccounts.map((a) => [a.id, a.name]));
    const multiEntity = new Set(orgs.filter((o) => byOrg.has(o.id)).map((o) => o.account_id)).size > 1;
    return {
      accounts: sphereAccounts
        .filter((a) => byAccount.has(a.id))
        .map((a) => ({ value: a.id, label: `${a.name} (${byAccount.get(a.id)})` })),
      orgs: orgs
        .filter((o) => byOrg.has(o.id))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((o) => ({
          value: o.id,
          label: `${o.name}${multiEntity ? ` · ${accountName.get(o.account_id) ?? ""}` : ""} (${byOrg.get(o.id)})`,
        })),
      people: [...contacts]
        .sort((a, b) => a.full_name.localeCompare(b.full_name))
        .map((c) => ({ value: c.id, label: c.title ? `${c.full_name} · ${c.title}` : c.full_name })),
    };
  }, [contacts, orgs, sphereAccounts]);

  const activeFilterCount =
    (filters.accountIds.length ? 1 : 0) +
    (filters.orgIds.length ? 1 : 0) +
    (filters.focusId ? 1 : 0) +
    (LINE_KINDS.some((k) => !filters.lines[k]) ? 1 : 0) +
    (filters.everyone ? 1 : 0) +
    (filters.connectedOnly ? 1 : 0);
  const focusPerson = filters.focusId ? contactById.get(filters.focusId) : null;

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of contacts.filter((x) => shownIds.has(x.id)))
      for (const s of c.statuses) counts.set(s, (counts.get(s) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [contacts, shownIds]);

  const selected = selectedId ? contactById.get(selectedId) : null;
  const pendingChild = pendingDrop ? contactById.get(pendingDrop.childId) : null;
  const pendingManager = pendingDrop ? contactById.get(pendingDrop.managerId) : null;

  return (
    <div className="flex h-screen flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b bg-background px-4 py-2.5">
        <SingleSelect
          className="w-64"
          searchable
          allowClear={false}
          options={accountChoices.map((a) => ({ value: a.id, label: a.out_of_scope ? `${a.name} (out of scope)` : a.name }))}
          value={accountId}
          onChange={(v) => v && v !== accountId && router.push(`/canvas?account=${v}`)}
        />
        <Link href={`/accounts/${accountId}`} className="text-xs text-muted-foreground hover:text-foreground hover:underline" title={`Open ${accountName}`}>
          Open account
        </Link>
        <div className="ml-2 flex rounded-md border p-0.5">
          <button
            type="button"
            onClick={() => switchView("people")}
            className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${view === "people" ? "bg-accent" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Network className="size-3.5" /> People
          </button>
          <button
            type="button"
            onClick={() => switchView("hierarchy")}
            className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${view === "hierarchy" ? "bg-accent" : "text-muted-foreground hover:text-foreground"}`}
          >
            <LayoutGrid className="size-3.5" /> Account map
          </button>
        </div>
        <span className="text-xs text-muted-foreground">
          {view === "people"
            ? filtering
              ? `Showing ${shownIds.size} of ${contacts.length} people (filtered)`
              : `${shownIds.size} on canvas · drag one onto another to set a reporting line · click an org to collapse`
            : `${accounts.length} entities`}
        </span>
        {view === "people" && (
          <Button
            size="sm"
            variant={filtersOpen || activeFilterCount ? "secondary" : "outline"}
            onClick={() => setFiltersOpen((o) => !o)}
          >
            <SlidersHorizontal className="size-3.5" /> Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          {saveState === "saving" && <span className="text-xs text-muted-foreground">Saving…</span>}
          {saveState === "saved" && <span className="text-xs text-muted-foreground">Saved</span>}
          {saveState === "error" && <span className="text-xs text-destructive">Save failed</span>}
          <Button size="sm" variant="outline" disabled={autoLaying} onClick={() => void runAutoLayout(true)}>
            {autoLaying ? "Laying out…" : "Auto-layout"}
          </Button>
          {view === "people" && (
            <Button
              size="sm"
              variant={panelOpen ? "secondary" : "outline"}
              onClick={() => {
                setPanelOpen((o) => !o);
                setTimeout(() => void fitView({ padding: 0.15, duration: 300 }), 50);
              }}
            >
              <Plus className="size-3.5" /> {panelOpen ? "Hide people list" : "Add people"}
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      {view === "people" && filtersOpen && (
        <div className="flex flex-wrap items-end gap-x-4 gap-y-2.5 border-b bg-card/40 px-4 py-2.5 text-xs">
          <label className="flex w-56 flex-col gap-1">
            <span className="font-medium text-muted-foreground">Account</span>
            <MultiSelect
              options={filterOptions.accounts}
              value={filters.accountIds}
              onChange={(v) => updateFilters({ accountIds: v })}
              placeholder="All entities"
            />
          </label>
          <label className="flex w-64 flex-col gap-1">
            <span className="font-medium text-muted-foreground">Org</span>
            <MultiSelect
              options={filterOptions.orgs}
              value={filters.orgIds}
              onChange={(v) => updateFilters({ orgIds: v })}
              placeholder="All orgs"
            />
          </label>
          <label className="flex w-64 flex-col gap-1">
            <span className="font-medium text-muted-foreground">Focus on a person</span>
            <SingleSelect
              searchable
              options={filterOptions.people}
              value={filters.focusId}
              onChange={(v) => updateFilters({ focusId: v })}
              placeholder="Anyone"
            />
          </label>
          <div className="flex flex-col gap-1">
            <span className="font-medium text-muted-foreground">Lines</span>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {LINE_KINDS.map((k) => (
                <label key={k} className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="checkbox"
                    className="accent-primary"
                    checked={filters.lines[k]}
                    onChange={(e) => updateFilters({ lines: { ...filters.lines, [k]: e.target.checked } })}
                  />
                  <span
                    className="inline-block w-5 border-t-2 align-middle"
                    style={{
                      borderColor: k === "influence" ? INFLUENCE_COLOR : EDGE_COLOR,
                      borderTopStyle: k === "low" ? "dotted" : k === "confirmed" || k === "influence" ? "solid" : "dashed",
                    }}
                  />
                  {LINE_LABELS[k]}
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="flex cursor-pointer items-center gap-1.5" title="Look past the saved canvas to every contact matching the account and org filters">
              <input
                type="checkbox"
                className="accent-primary"
                checked={filters.everyone}
                disabled={!!filters.focusId}
                onChange={(e) => updateFilters({ everyone: e.target.checked })}
              />
              Include people not on the canvas
            </label>
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                className="accent-primary"
                checked={filters.connectedOnly}
                onChange={(e) => updateFilters({ connectedOnly: e.target.checked })}
              />
              Only people with a visible line
            </label>
          </div>
          {activeFilterCount > 0 && (
            <Button size="sm" variant="ghost" onClick={() => updateFilters(DEFAULT_FILTERS)}>
              Clear filters
            </Button>
          )}
          {focusPerson && (
            <p className="basis-full text-muted-foreground">
              Showing {focusPerson.full_name}&apos;s management chain, everyone below them, and their influence links. Account and org filters are paused while focusing.
            </p>
          )}
          {filtering && !focusPerson && (
            <p className="basis-full text-muted-foreground">
              Filtered views get their own tidy layout; moving cards here doesn&apos;t change your saved canvas.
            </p>
          )}
        </div>
      )}

      {/* Drop-confirmation bar */}
      {pendingDrop && pendingChild && pendingManager && (
        <div className="flex flex-wrap items-center gap-2 border-b bg-primary/5 px-4 py-2 text-sm">
          <span>
            Set <strong>{pendingChild.full_name}</strong> to report to <strong>{pendingManager.full_name}</strong>?
          </span>
          <SingleSelect
            className="w-36"
            options={CONFIDENCE.map((c) => ({ value: c.value, label: c.label }))}
            value={dropConfidence}
            onChange={(v) => setDropConfidence(v ?? "medium")}
            allowClear={false}
          />
          <Button size="sm" onClick={() => void confirmDrop()}>
            Save reporting line
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setPendingDrop(null)}>
            Cancel
          </Button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onNodeDragStop={onNodeDragStop}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            colorMode="dark"
            fitView
            fitViewOptions={{ padding: 0.15 }}
            minZoom={0.15}
            maxZoom={1.75}
            proOptions={{ hideAttribution: false }}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable className="!bg-muted/40" />
          </ReactFlow>

          {autoLaying && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-background/40 text-sm text-muted-foreground">
              Laying out the canvas…
            </div>
          )}

          {/* Selected contact details */}
          {selected && (
            <div className="absolute bottom-3 left-3 z-10 w-72 rounded-lg border bg-card p-3 shadow-xl">
              <div className="flex items-start gap-2">
                <ContactAvatar name={selected.full_name} path={selected.avatar_path} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 truncate text-sm font-semibold">
                    {selected.full_name}
                    {selected.is_key && <KeyStar active className="size-3.5" />}
                  </p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{selected.title ?? "No title on file"}</p>
                </div>
                <button type="button" aria-label="Close details" onClick={() => setSelectedId(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="size-4" />
                </button>
              </div>
              <div className="mt-2 space-y-1.5 text-xs">
                {selected.seniority_level && <div className="text-muted-foreground">Level {selected.seniority_level}</div>}
                <div className="flex flex-wrap gap-1">
                  {selected.personas.map((p) => (
                    <PersonaBadge key={p} persona={p} />
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {selected.statuses.map((s) => (
                    <StatusBadge key={s} status={s} />
                  ))}
                </div>
                {selected.influence_score != null && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                      <span className="block h-full rounded-full bg-primary" style={{ width: `${selected.influence_score}%` }} />
                    </span>
                    <span className="tabular-nums">{selected.influence_score}/100</span>
                  </div>
                )}
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <Link
                  href={`/contacts/${selected.id}`}
                  className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
                >
                  Open profile
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  title="Show only this person's management chain, reports, and influence links"
                  onClick={() => {
                    updateFilters({ focusId: selected.id });
                    setFiltersOpen(true);
                    setSelectedId(null);
                  }}
                >
                  <Crosshair className="size-3.5" /> Focus
                </Button>
                <Button size="sm" variant="ghost" onClick={() => removeFromCanvas(selected.id)}>
                  Remove
                </Button>
              </div>
            </div>
          )}

          {/* Legend */}
          {!legendOpen ? (
            <button
              type="button"
              onClick={() => setLegendOpen(true)}
              className="absolute right-3 top-3 z-10 rounded-lg border bg-card/95 px-2.5 py-1 text-[11px] font-semibold shadow-lg hover:bg-accent"
            >
              Legend
            </button>
          ) : (
          <div className="absolute right-3 top-3 z-10 w-56 rounded-lg border bg-card/95 p-2.5 text-[11px] shadow-lg">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="font-semibold">Edges</p>
              <button type="button" aria-label="Close legend" onClick={() => setLegendOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            </div>
            {view === "hierarchy" ? (
              <ul className="space-y-1 text-muted-foreground">
                <li><span className="mr-1 inline-block w-6 border-t border-muted-foreground align-middle" /> Parent → subsidiary</li>
                <li>Unlabeled lines mean centralized procurement; other relationships are labeled.</li>
                <li>Greyed cards are out of scope.</li>
              </ul>
            ) : (
            <ul className="space-y-1 text-muted-foreground">
              <li><span className="mr-1 inline-block w-6 border-t border-muted-foreground align-middle" /> Reporting — confirmed</li>
              <li><span className="mr-1 inline-block w-6 border-t border-dashed border-muted-foreground align-middle" style={{ borderStyle: "dashed" }} /> Reporting — medium</li>
              <li><span className="mr-1 inline-block w-6 border-t border-muted-foreground align-middle" style={{ borderTopStyle: "dotted" }} /> Reporting — low</li>
              <li><span className="mr-1 inline-block w-6 border-t align-middle" style={{ borderColor: INFLUENCE_COLOR }} /> Influence</li>
            </ul>
            )}
            {view === "people" && statusCounts.length > 0 && (
              <>
                <p className="mb-1.5 mt-2.5 font-semibold">On-canvas status</p>
                <ul className="space-y-1 text-muted-foreground">
                  {statusCounts.map(([s, n]) => {
                    const color = matchStyleRule(styleRules, [s])?.style.border;
                    return (
                      <li key={s} className="flex items-center gap-1.5">
                        {color && <span className="size-2 rounded-full" style={{ background: color }} />}
                        <span className="min-w-0 flex-1 truncate">{s}</span>
                        <span className="tabular-nums">{n}</span>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
          )}
        </div>

        {/* Side panel: everyone not on the canvas yet */}
        {view === "people" && panelOpen && (
          <aside className="flex w-72 shrink-0 flex-col border-l bg-card/40">
            <div className="border-b p-2.5">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${contacts.length - shownIds.size} people off-canvas…`}
                className="w-full rounded-md border bg-background px-2 py-1.5 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <ul className="min-h-0 flex-1 divide-y overflow-y-auto">
              {panelContacts.slice(0, 80).map((c) => (
                <li
                  key={c.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("application/spheres-contact", c.id)}
                  className="group flex cursor-grab items-center gap-2 px-2.5 py-1.5 hover:bg-accent/50"
                >
                  <ContactHoverCard contact={c}>
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      <ContactAvatar name={c.full_name} path={c.avatar_path} size={22} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-medium">
                          {c.full_name}
                          {c.is_key && <KeyStar active className="ml-1 inline size-3" />}
                        </span>
                        <span className="block truncate text-[11px] text-muted-foreground">{c.title ?? "—"}</span>
                      </span>
                    </span>
                  </ContactHoverCard>
                  <button
                    type="button"
                    aria-label={`Add ${c.full_name} to canvas`}
                    onClick={() => addToCanvas(c.id)}
                    className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </li>
              ))}
              {panelContacts.length === 0 && (
                <li className="p-3 text-xs text-muted-foreground">
                  {contacts.length === shownIds.size ? "Everyone is on the canvas." : "No matches."}
                </li>
              )}
              {panelContacts.length > 80 && (
                <li className="p-2 text-[11px] text-muted-foreground">{panelContacts.length - 80} more — keep typing to narrow.</li>
              )}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}

// ───────────────────────── Reporting-line write ─────────────────────────

async function updateReportingLine(
  contactId: string,
  managerId: string,
  confidence: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { updateContact } = await import("@/app/(app)/contacts/actions");
  return updateContact(contactId, {
    reports_to_id: managerId,
    reports_to_confidence: confidence as "confirmed" | "medium" | "low",
    reports_to_evidence: "Reporting line set by dragging on the account canvas.",
  });
}
