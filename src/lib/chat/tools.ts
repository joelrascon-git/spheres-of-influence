/**
 * The chat assistant's read-only tools: definitions the model sees, and the
 * executor that answers each call from the workspace. Every tool returns the
 * data the model needs plus the records it used, which become the answer's
 * citation chips. No write tools by design — new information goes through
 * Ingest and the review queue.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { ChatToolSpec } from "@/lib/ai/client";
import { searchContacts } from "@/lib/contacts-query";

/** A record a tool used; rendered as a citation chip under the answer. */
export type ChatRecord = {
  type: "contact" | "account" | "org" | "doc" | "note" | "initiative" | "challenge";
  id: string;
  name: string;
};

export type ChatToolResult = { data: unknown; records: ChatRecord[] };

export const CHAT_TOOLS: ChatToolSpec[] = [
  {
    name: "search_entities",
    description:
      "Find people, accounts and orgs by name. Boolean operators (AND, OR, NOT, quotes) work for people. Returns matches with their ids, for the other tools.",
    input_schema: {
      type: "object",
      properties: { query: { type: "string", description: "Names or keywords, e.g. 'VP of Platform' or 'platform engineering'" } },
      required: ["query"],
    },
  },
  {
    name: "get_person",
    description:
      "One person: profile, org and account, personas and seniority, key-person reasoning, evidence quotes, personal details, reporting line, recent notes, and linked initiatives and challenges.",
    input_schema: { type: "object", properties: { contact_id: { type: "string" } }, required: ["contact_id"] },
  },
  {
    name: "get_account",
    description:
      "One account: the three whys, working hypothesis, initiatives, challenges, open opportunities and recent signals.",
    input_schema: { type: "object", properties: { account_id: { type: "string" } }, required: ["account_id"] },
  },
  {
    name: "graph_neighbors",
    description:
      "The influence map around one person: who they influence and who influences them, each with strength, confidence and the evidence quote.",
    input_schema: { type: "object", properties: { contact_id: { type: "string" } }, required: ["contact_id"] },
  },
  {
    name: "search_knowledge",
    description:
      "Search the Factory product knowledge base, the account research documents and every stored note (call notes, transcripts, meeting notes).",
    input_schema: {
      type: "object",
      properties: { query: { type: "string", description: "One or two keywords works best, e.g. 'Copilot' or 'tech stack'" } },
      required: ["query"],
    },
  },
  {
    name: "pending_inferences",
    description: "Proposals waiting in the review queue, with kind, value and confidence.",
    input_schema: { type: "object", properties: {} },
  },
];

/** Keywords safe to embed in PostgREST ilike filters: letters/digits only, 3+ chars, capped. */
export function filterWords(query: string): string[] {
  return String(query ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && w.length <= 24)
    .slice(0, 5);
}

const ilikeOr = (fields: string[], words: string[]) =>
  words.flatMap((w) => fields.map((f) => `${f}.ilike.%${w}%`)).join(",");

/** Strips tags and centers a snippet on the first keyword hit. */
export function htmlSnippet(html: string, words: string[], span = 320): string {
  const text = String(html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const lower = text.toLowerCase();
  let at = -1;
  for (const w of words) {
    const i = lower.indexOf(w);
    if (i >= 0 && (at < 0 || i < at)) at = i;
  }
  const start = at > span ? at - span : 0;
  return (start > 0 ? "…" : "") + text.slice(start, start + span * 2) + (start + span * 2 < text.length ? "…" : "");
}

type AnyRow = Record<string, unknown>;

export async function executeChatTool(
  supabase: SupabaseClient,
  name: string,
  input: Record<string, unknown>,
): Promise<ChatToolResult> {
  switch (name) {
    case "search_entities":
      return searchEntities(supabase, String(input.query ?? ""));
    case "get_person":
      return getPerson(supabase, z.uuid().parse(input.contact_id));
    case "get_account":
      return getAccount(supabase, z.uuid().parse(input.account_id));
    case "graph_neighbors":
      return graphNeighbors(supabase, z.uuid().parse(input.contact_id));
    case "search_knowledge":
      return searchKnowledge(supabase, String(input.query ?? ""));
    case "pending_inferences":
      return pendingInferences(supabase);
    default:
      throw new Error(`Unknown tool "${name}".`);
  }
}

async function searchEntities(supabase: SupabaseClient, query: string): Promise<ChatToolResult> {
  const trimmed = query.trim();
  if (!trimmed) return { data: { people: [], accounts: [], orgs: [] }, records: [] };
  const words = filterWords(trimmed);

  const [peopleRes, accountRes, orgRes] = await Promise.all([
    searchContacts(supabase, { query: trimmed, facets: {}, sort: "name", limit: 12 }),
    words.length
      ? supabase.from("accounts").select("id, name, domain").or(ilikeOr(["name", "domain"], words)).limit(6)
      : Promise.resolve({ data: [] as AnyRow[] }),
    words.length
      ? supabase.from("orgs").select("id, name").or(ilikeOr(["name"], words)).limit(6)
      : Promise.resolve({ data: [] as AnyRow[] }),
  ]);

  const people = peopleRes.contacts.map((c) => ({
    id: c.id,
    name: c.full_name,
    title: c.title,
    account_id: c.account_id,
    org_id: c.org_id,
    is_key: c.is_key,
    personas: c.personas,
    seniority_level: c.seniority_level,
  }));
  const accounts = (accountRes.data ?? []) as AnyRow[];
  const orgs = (orgRes.data ?? []) as AnyRow[];

  return {
    data: {
      people,
      accounts: accounts.map((a) => ({ id: a.id, name: a.name, domain: a.domain })),
      orgs: orgs.map((o) => ({ id: o.id, name: o.name })),
    },
    records: [
      ...people.map((p) => ({ type: "contact" as const, id: p.id, name: p.name })),
      ...accounts.map((a) => ({ type: "account" as const, id: a.id as string, name: a.name as string })),
      ...orgs.map((o) => ({ type: "org" as const, id: o.id as string, name: o.name as string })),
    ],
  };
}

async function getPerson(supabase: SupabaseClient, contactId: string): Promise<ChatToolResult> {
  const { data: raw } = await supabase
    .from("contacts")
    .select("*, orgs(name), accounts(name)")
    .eq("id", contactId)
    .maybeSingle();
  const c = raw as unknown as
    | (AnyRow & {
        id: string;
        full_name: string;
        title: string | null;
        headline: string | null;
        summary: string | null;
        seniority_level: string | null;
        personas: string[] | null;
        persona_status: string | null;
        champion_flag: string | null;
        can_veto: boolean | null;
        is_key: boolean | null;
        key_reasoning: string | null;
        influence_score: number | null;
        statuses: string[] | null;
        buying_role: string | null;
        location: string | null;
        evidence: { claim: string; confidence?: string }[] | null;
        personal_details: Record<string, unknown> | null;
        reports_to_id: string | null;
        reports_to_confidence: string | null;
        orgs: { name: string } | null;
        accounts: { name: string } | null;
      })
    | null;
  if (!c) throw new Error("No person with that id.");

  const [notesRes, managerRes, initiativeRes, challengeRes] = await Promise.all([
    supabase.from("notes").select("body_text, created_at, source").eq("contact_id", contactId).order("created_at", { ascending: false }).limit(8),
    c.reports_to_id
      ? supabase.from("contacts").select("id, full_name").eq("id", c.reports_to_id).maybeSingle()
      : Promise.resolve({ data: null as AnyRow | null }),
    supabase.from("contact_initiatives").select("initiatives(code, name)").eq("contact_id", contactId),
    supabase.from("contact_challenges").select("challenges(code, name)").eq("contact_id", contactId),
  ]);

  const manager = (managerRes.data ?? null) as { id: string; full_name: string } | null;
  const initiatives = ((initiativeRes.data ?? []) as unknown as { initiatives: { code: string; name: string } | null }[])
    .map((l) => l.initiatives)
    .filter(Boolean) as { code: string; name: string }[];
  const challenges = ((challengeRes.data ?? []) as unknown as { challenges: { code: string; name: string } | null }[])
    .map((l) => l.challenges)
    .filter(Boolean) as { code: string; name: string }[];

  return {
    data: {
      name: c.full_name,
      title: c.title,
      org: c.orgs?.name ?? null,
      account: c.accounts?.name ?? null,
      seniority_level: c.seniority_level,
      personas: c.personas ?? [],
      persona_status: c.persona_status,
      champion_flag: c.champion_flag,
      can_veto: c.can_veto,
      is_key: c.is_key,
      key_reasoning: c.key_reasoning,
      influence_score: c.influence_score,
      statuses: c.statuses ?? [],
      buying_role: c.buying_role,
      location: c.location,
      headline: c.headline,
      summary: c.summary,
      evidence: (c.evidence ?? []).slice(0, 12),
      personal_details: c.personal_details ?? {},
      reports_to: manager ? { name: manager.full_name, confidence: c.reports_to_confidence } : null,
      initiatives,
      challenges,
      notes: ((notesRes.data ?? []) as AnyRow[]).map((n) => ({
        date: n.created_at,
        text: String(n.body_text ?? "").slice(0, 1200),
      })),
    },
    records: [
      { type: "contact", id: c.id, name: c.full_name },
      ...(c.orgs ? [{ type: "org" as const, id: String(c.org_id ?? ""), name: c.orgs.name }] : []),
      ...(c.accounts ? [{ type: "account" as const, id: String(c.account_id ?? ""), name: c.accounts.name }] : []),
      ...(manager ? [{ type: "contact" as const, id: manager.id, name: manager.full_name }] : []),
      ...initiatives.map((i) => ({ type: "initiative" as const, id: i.code, name: i.name })),
      ...challenges.map((ch) => ({ type: "challenge" as const, id: ch.code, name: ch.name })),
    ],
  };
}

async function getAccount(supabase: SupabaseClient, accountId: string): Promise<ChatToolResult> {
  const { data: raw } = await supabase.from("accounts").select("*").eq("id", accountId).maybeSingle();
  const a = raw as AnyRow | null;
  if (!a) throw new Error("No account with that id.");

  const [hypothesisRes, initiativeRes, challengeRes, opportunityRes, signalRes] = await Promise.all([
    supabase.from("hypotheses").select("content, version").eq("account_id", accountId).order("version", { ascending: false }).limit(1),
    supabase.from("initiatives").select("code, name, summary, factory_fit").eq("account_id", accountId).order("rank"),
    supabase.from("challenges").select("code, name, summary, factory_fit").eq("account_id", accountId).order("rank"),
    supabase.from("opportunities").select("name, status, amount, close_date, next_step").eq("account_id", accountId).order("created_at", { ascending: false }).limit(10),
    supabase.from("signals").select("title, so_what, source_name, status, created_at").eq("account_id", accountId).order("created_at", { ascending: false }).limit(8),
  ]);

  const initiatives = (initiativeRes.data ?? []) as AnyRow[];
  const challenges = (challengeRes.data ?? []) as AnyRow[];
  const hypothesis = ((hypothesisRes.data ?? [])[0] ?? null) as { content: string; version: number } | null;

  return {
    data: {
      name: a.name,
      domain: a.domain,
      industry: a.industry,
      why_anything: a.why_anything,
      why_factory: a.why_factory,
      why_now: a.why_now,
      hypothesis: hypothesis ? { version: hypothesis.version, content: hypothesis.content } : null,
      initiatives: initiatives.map((i) => ({ code: i.code, name: i.name, summary: i.summary, factory_fit: i.factory_fit })),
      challenges: challenges.map((c) => ({ code: c.code, name: c.name, summary: c.summary, factory_fit: c.factory_fit })),
      opportunities: (opportunityRes.data ?? []) as AnyRow[],
      signals: (signalRes.data ?? []) as AnyRow[],
    },
    records: [
      { type: "account", id: accountId, name: a.name as string },
      ...initiatives.map((i) => ({ type: "initiative" as const, id: i.code as string, name: i.name as string })),
      ...challenges.map((c) => ({ type: "challenge" as const, id: c.code as string, name: c.name as string })),
    ],
  };
}

async function graphNeighbors(supabase: SupabaseClient, contactId: string): Promise<ChatToolResult> {
  const [outRes, inRes, selfRes] = await Promise.all([
    supabase.from("influences").select("id, to_contact_id, strength, confidence, evidence, source").eq("from_contact_id", contactId),
    supabase.from("influences").select("id, from_contact_id, strength, confidence, evidence, source").eq("to_contact_id", contactId),
    supabase.from("contacts").select("id, full_name").eq("id", contactId).maybeSingle(),
  ]);
  const self = (selfRes.data ?? null) as { id: string; full_name: string } | null;
  if (!self) throw new Error("No person with that id.");

  const otherIds = [
    ...((outRes.data ?? []) as AnyRow[]).map((r) => r.to_contact_id as string),
    ...((inRes.data ?? []) as AnyRow[]).map((r) => r.from_contact_id as string),
  ];
  const names = new Map<string, string>();
  if (otherIds.length) {
    const { data } = await supabase.from("contacts").select("id, full_name").in("id", otherIds);
    for (const r of (data ?? []) as { id: string; full_name: string }[]) names.set(r.id, r.full_name);
  }

  const influences = ((outRes.data ?? []) as AnyRow[]).map((r) => ({
    direction: "influences",
    who: names.get(r.to_contact_id as string) ?? null,
    contact_id: r.to_contact_id,
    strength: r.strength,
    confidence: r.confidence,
    evidence: r.evidence,
    source: r.source,
  }));
  const influencedBy = ((inRes.data ?? []) as AnyRow[]).map((r) => ({
    direction: "influenced by",
    who: names.get(r.from_contact_id as string) ?? null,
    contact_id: r.from_contact_id,
    strength: r.strength,
    confidence: r.confidence,
    evidence: r.evidence,
    source: r.source,
  }));

  return {
    data: { person: self.full_name, influences, influenced_by: influencedBy },
    records: [...influences, ...influencedBy]
      .map((e) => ({ type: "contact" as const, id: e.contact_id as string, name: e.who as string }))
      .filter((r) => !!r.name),
  };
}

async function searchKnowledge(supabase: SupabaseClient, query: string): Promise<ChatToolResult> {
  const words = filterWords(query);
  if (!words.length) return { data: { documents: [], notes: [] }, records: [] };

  const [docRes, noteRes] = await Promise.all([
    supabase.from("research_docs").select("id, title, scope, doc_type, body_html").or(ilikeOr(["title", "body_html"], words)).limit(5),
    supabase.from("notes").select("id, body_text, created_at, contact_id, account_id").or(ilikeOr(["body_text"], words)).order("created_at", { ascending: false }).limit(6),
  ]);

  const notes = (noteRes.data ?? []) as AnyRow[];
  // Name the notes' subjects for citation chips: people and accounts they're attached to.
  const contactIds = notes.map((n) => n.contact_id).filter(Boolean) as string[];
  const accountIds = notes.map((n) => n.account_id).filter(Boolean) as string[];
  const [contactRes, accountRes] = await Promise.all([
    contactIds.length ? supabase.from("contacts").select("id, full_name").in("id", contactIds) : Promise.resolve({ data: [] as AnyRow[] }),
    accountIds.length ? supabase.from("accounts").select("id, name").in("id", accountIds) : Promise.resolve({ data: [] as AnyRow[] }),
  ]);
  const contactNames = new Map(((contactRes.data ?? []) as AnyRow[]).map((c) => [c.id as string, c.full_name as string]));
  const accountNames = new Map(((accountRes.data ?? []) as AnyRow[]).map((c) => [c.id as string, c.name as string]));

  const documents = ((docRes.data ?? []) as AnyRow[]).map((d) => ({
    title: d.title,
    type: d.doc_type,
    scope: d.scope,
    snippet: htmlSnippet(String(d.body_html ?? ""), words),
  }));

  return {
    data: {
      documents,
      notes: notes.map((n) => ({
        date: n.created_at,
        subject: contactNames.get(n.contact_id as string) ?? accountNames.get(n.account_id as string) ?? null,
        snippet: htmlSnippet(String(n.body_text ?? ""), words, 200),
      })),
    },
    records: [
      ...((docRes.data ?? []) as AnyRow[]).map((d) => ({ type: "doc" as const, id: d.id as string, name: d.title as string })),
      ...notes.map((n) => {
        const subject = contactNames.get(n.contact_id as string) ?? accountNames.get(n.account_id as string);
        return { type: "note" as const, id: n.id as string, name: subject ? `Note about ${subject}` : "Workspace note" };
      }),
    ],
  };
}

async function pendingInferences(supabase: SupabaseClient): Promise<ChatToolResult> {
  const { data } = await supabase
    .from("inferences")
    .select("id, subject_type, subject_id, kind, value, confidence, rationale")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(20);
  return {
    data: { proposals: data ?? [], total: data?.length ?? 0 },
    records: [],
  };
}
