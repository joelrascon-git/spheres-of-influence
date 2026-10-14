import { DEFAULT_STATUSES, ENGAGE_STAGES, PERSONA_CODES, SENIORITY, SENIORITY_LEVELS } from "@/lib/constants";
import type { FieldDefinition, Prompt, StyleRule } from "@/lib/types";

type FieldSeed = Omit<FieldDefinition, "id" | "is_system" | "help_text"> & { help_text?: string };

let order = 0;
const f = (
  entity: FieldSeed["entity"],
  key: string,
  label: string,
  field_type: FieldSeed["field_type"],
  opts: Partial<Pick<FieldSeed, "options" | "show_in_profile" | "show_in_list" | "show_on_canvas" | "help_text">> = {},
): FieldSeed => ({
  entity,
  key,
  label,
  field_type,
  options: opts.options ?? [],
  show_in_profile: opts.show_in_profile ?? true,
  show_in_list: opts.show_in_list ?? false,
  show_on_canvas: opts.show_on_canvas ?? false,
  sort_order: order++,
  help_text: opts.help_text,
});

// System fields map to real columns. Admin can relabel, reorder, hide, and edit picklist options.
export const SYSTEM_FIELDS: FieldSeed[] = [
  f("contact", "title", "Title", "text", { show_in_list: true, show_on_canvas: true }),
  f("contact", "account_id", "Account", "select", { show_in_list: true }),
  f("contact", "org_id", "Org", "select", { show_in_list: true, show_on_canvas: false }),
  f("contact", "seniority", "Seniority", "select", {
    options: SENIORITY.map((s) => s.label),
    show_in_list: true,
    show_on_canvas: true,
  }),
  f("contact", "personas", "Persona", "multi_select", {
    options: PERSONA_CODES.map((p) => p.code),
    show_in_list: true,
    show_on_canvas: true,
    help_text: "Codes from the persona taxonomy (EB, CH, DM…). Full names come from the persona catalog in Admin.",
  }),
  f("contact", "statuses", "Status", "multi_select", {
    options: DEFAULT_STATUSES,
    show_in_list: true,
    show_on_canvas: true,
  }),
  f("contact", "seniority_level", "Seniority Level", "select", {
    options: SENIORITY_LEVELS.map((l) => l.value),
    show_in_list: false,
    help_text: "L1–L6 ladder from the persona knowledge base; finer than Seniority.",
  }),
  f("contact", "buying_role", "Buying Role", "text", { show_in_list: false }),
  f("contact", "engage_stage", "Engage Stage", "select", { options: [...ENGAGE_STAGES] }),
  f("contact", "is_key", "Key Contact", "boolean", { show_in_list: true, show_on_canvas: true }),
  f("contact", "key_reasoning", "Key Contact Reasoning", "rich_text"),
  f("contact", "email", "Email", "email", { show_in_list: true }),
  f("contact", "phone", "Phone", "phone"),
  f("contact", "location", "Location", "text", { show_in_list: true }),
  f("contact", "tenure", "Tenure", "text", {
    show_in_list: true,
    show_on_canvas: true,
    help_text: "Calculated live from role and company start dates.",
  }),
  f("contact", "last_contacted", "Last Contacted", "date", { show_in_list: true }),
  f("contact", "reports_to_id", "Reports To", "select"),
  f("contact", "tags", "Tags", "multi_select", { show_in_list: true, show_on_canvas: true }),
  f("contact", "headline", "Profile Headline", "long_text"),
  f("contact", "summary", "Profile Summary", "long_text"),
  f("contact", "job_description", "Job Description", "long_text"),
  f("contact", "linkedin_uid", "LinkedIn Unique ID", "text"),
  f("contact", "updated_at", "Last Updated", "date", { show_in_list: true }),

  f("account", "industry", "Industry", "text"),
  f("account", "employee_count", "# of Employees", "number"),
  f("account", "engineer_count", "# of Engineers", "number"),
  f("account", "hq", "HQ", "text"),
  f("account", "why_anything", "Why Anything?", "rich_text"),
  f("account", "why_factory", "Why Factory?", "rich_text"),
  f("account", "why_now", "Why Now?", "rich_text"),

  f("org", "description", "Org Description", "long_text"),
  f("org", "status", "Status", "select", { options: ["Confirmed", "Inferred"] }),
  f("org", "notes", "Notes", "rich_text"),
];

export const DEFAULT_STYLE_RULES: Omit<StyleRule, "id">[] = [
  {
    name: "No longer at company",
    field: "statuses",
    operator: "contains",
    value: "No Longer at Company",
    style: { opacity: 0.45, grayscale: true, badge: "Gone" },
    priority: 100,
    enabled: true,
  },
  {
    name: "Do not contact",
    field: "statuses",
    operator: "contains",
    value: "Do Not Contact",
    style: { border: "#ef4444", background: "rgba(239,68,68,0.12)", badge: "DNC" },
    priority: 90,
    enabled: true,
  },
  {
    name: "Relationship made",
    field: "statuses",
    operator: "contains",
    value: "Connected - Relationship Made",
    style: { border: "#22c55e", background: "rgba(34,197,94,0.10)" },
    priority: 80,
    enabled: true,
  },
  {
    name: "Meeting set",
    field: "statuses",
    operator: "contains",
    value: "Connected - Meeting Set",
    style: { border: "#3b82f6", background: "rgba(59,130,246,0.10)" },
    priority: 70,
    enabled: true,
  },
  {
    name: "Follow up",
    field: "statuses",
    operator: "contains",
    value: "Connected - F/U",
    style: { border: "#eab308" },
    priority: 60,
    enabled: true,
  },
  {
    name: "Working",
    field: "statuses",
    operator: "contains",
    value: "Working",
    style: { border: "#ef6f2e" },
    priority: 50,
    enabled: true,
  },
  {
    name: "Out of scope",
    field: "statuses",
    operator: "contains",
    value: "Out of Scope",
    style: { opacity: 0.4, badge: "OOS" },
    priority: 95,
    enabled: true,
  },
  {
    name: "Nurture",
    field: "statuses",
    operator: "contains",
    value: "Nurture",
    style: { border: "#a855f7" },
    priority: 40,
    enabled: true,
  },
];

const SELLER_CONTEXT = `You support a strategic enterprise account executive at Factory (factory.ai), which sells AI software-development agents ("Droids") to large engineering organizations. The seller navigates 10,000+ person enterprises with parent and subsidiary companies, and needs to understand real political power, not just reporting lines: who influences whom, who holds budget, who can block, and who can champion.

The workspace is the seller's second brain: contacts carry personas, L1–L6 seniority levels and influence scores; accounts carry legal-entity trees and why-fields; orgs carry buying roles; strategic initiatives and challenges are ranked for Factory fit; and research documents are attached per account. Two seller-scoped research documents exist for every account — the Factory product knowledge base and the sales-cycle persona rules — so reason with them, and treat any product or pricing claim you cannot trace to them as suspect.`;

const PROVENANCE_RULES = `Rules:
- Never invent facts. Every proposed change must cite evidence: a quote or a specific field from the provided data.
- Mark anything not explicitly stated as inferred and give a confidence of "medium" or "low". Use "confirmed" only for direct, unambiguous statements from a first-hand source.
- Never overwrite seller-entered data. Notes are appended, never replaced. If new information conflicts with existing data, propose the change and explain the conflict instead of silently replacing it.
- Prefer fewer, high-quality proposals over many speculative ones.`;

type PromptSeed = Omit<Prompt, "id" | "updated_at">;

/** The persona taxonomy, seeded into persona_catalog so labels and definitions are editable. */
export const PERSONA_CATALOG_SEED: {
  code: string;
  name: string;
  definition: string;
  one_liner: string;
  weight: number;
  can_veto: boolean;
  meddpicc: string;
  sort_order: number;
}[] = [
  { code: "EB", name: "Economic Buyer", weight: 10, can_veto: true, meddpicc: "E – Economic Buyer", sort_order: 1,
    one_liner: "Final budget authority; can say yes when others say no.",
    definition: "The one person with overall authority over the financial decision for the scope being sold. For Factory, the executive who owns the budget for engineering productivity / AI-assisted software delivery / modernization at the deal's scope, and who can overrule a no from below." },
  { code: "CH", name: "Champion", weight: 9, can_veto: false, meddpicc: "C – Champion", sort_order: 2,
    one_liner: "Actively sells Factory internally; validated only by actions.",
    definition: "An internal stakeholder with power and influence who actively advocates for Factory when the seller is not in the room, with a personal win tied to Factory's success. Never assigned from a title alone: the most a title earns is Potential Champion." },
  { code: "DM", name: "Decision Maker", weight: 9, can_veto: false, meddpicc: "D – Decision Criteria / Process", sort_order: 3,
    one_liner: "Holds a formal vote or writes the decision criteria.",
    definition: "Anyone with a formal vote or approval in choosing the vendor, or who writes the decision criteria. May not own the budget but can choose between options. Councils (architecture review boards, AI governance) are DMs in aggregate." },
  { code: "BS", name: "Business Sponsor", weight: 8, can_veto: false, meddpicc: "M – Metrics; I – Pain", sort_order: 4,
    one_liner: "Owns the business outcome and gives political air cover.",
    definition: "An executive who owns the business outcome the deal serves and provides political air cover. Segment presidents and program owners (e.g. an AI transformation office) typically land here." },
  { code: "TECH", name: "Technical", weight: 7, can_veto: true, meddpicc: "D – Decision Criteria", sort_order: 5,
    one_liner: "Sets and approves technical requirements and architecture fit.",
    definition: "Sets and approves technical requirements and architecture fit. Separated from EVAL (hands-on activity): TECH is about authority to approve the technical decision." },
  { code: "INFOSEC", name: "InfoSec", weight: 7, can_veto: true, meddpicc: "P – Paper Process", sort_order: 6,
    one_liner: "Security, technology-risk and AI-governance reviewers who must approve.",
    definition: "Security, technology-risk and AI-governance reviewers who must approve autonomous agents touching code. Seldom advance a deal, but each can stop one: flag can_veto." },
  { code: "EVAL", name: "Evaluator", weight: 6, can_veto: false, meddpicc: "M – Metrics", sort_order: 7,
    one_liner: "Runs the hands-on pilot/POC and scores results.",
    definition: "Runs the hands-on pilot or POC and scores results. A bad pilot is a soft veto. Distinguished from TECH by activity, not authority." },
  { code: "FIN", name: "Finance", weight: 5, can_veto: true, meddpicc: "E – Economic Buyer", sort_order: 8,
    one_liner: "Validates the business case, ROI, budget source and forecasts.",
    definition: "Validates the business case, ROI, budget source and consumption forecasts. Consumption pricing pulls Finance in earlier than seat-based tools." },
  { code: "PROC", name: "Procurement", weight: 5, can_veto: true, meddpicc: "P – Paper Process", sort_order: 9,
    one_liner: "Runs sourcing, vendor onboarding and third-party risk intake.",
    definition: "Runs sourcing, vendor onboarding, third-party risk intake and the commercial process. Marketplace procurement changes the purchasing path and who signs." },
  { code: "LEGAL", name: "Legal", weight: 5, can_veto: true, meddpicc: "P – Paper Process", sort_order: 10,
    one_liner: "Negotiates contract, data, IP, privacy and AI terms.",
    definition: "Negotiates contract, data, IP, privacy and AI terms. Cares which LLM providers see code, data residency, and indemnities." },
  { code: "COACH", name: "Coach / Influencer", weight: 5, can_veto: false, meddpicc: "C (pre-Champion)", sort_order: 11,
    one_liner: "Gives inside information or shapes opinion without formal power.",
    definition: "Gives inside information or shapes opinion without necessarily holding power. Chiefs of staff and long-tenured principal engineers often land here. Never forecast on a coach." },
  { code: "PARTNER", name: "Partner", weight: 4, can_veto: false, meddpicc: "Competition; Decision Process", sort_order: 12,
    one_liner: "External partner people who shape or source the deal.",
    definition: "External partner people (GSI, cloud, AI lab, ISV) and customer-side alliance owners who shape or source the deal. They cannot formally veto but can derail." },
];

export const DEFAULT_PROMPTS: PromptSeed[] = [
  {
    key: "import_inference",
    version: 2,
    name: "Import: enrich key contacts into the review queue",
    description: "Runs after a contact import. Proposes personas, levels, orgs, reporting lines and key-person flags as reviewed inferences.",
    model: "claude-opus-5-5",
    system_prompt: `${SELLER_CONTEXT}

You receive a small batch of LinkedIn profiles (title, headline, summary, job description, tenure, location) from one import, plus the orgs that already exist in the account and, when researched, the account's initiatives and challenges. The deterministic import pass has already derived a seniority level, a function bucket and title-based personas — your job is what a title alone cannot earn, so do not restate what the profile literally says.

For each contact, propose only what its evidence supports:
1. persona — from the taxonomy EB, CH, DM, BS, TECH, INFOSEC, EVAL, FIN, PROC, LEGAL, COACH, PARTNER. Champion never comes from a title: propose champion_flag "potential" only with published work, an owned initiative, or stated advocacy.
2. seniority_level — L1–L6 only when the profile clearly outranks or contradicts the derived level.
3. org_assignment — the company's own org name when profiles reveal it (prefer existing orgs by name or alias).
4. reporting_line — who this person most likely reports to among the batch or existing contacts; use explicit statements ("reporting to the CTO"), then title hierarchy, shared teams, tenure and location.
5. key_person — true when the person plausibly owns budget, gatekeeps a purchase, or drives the technical agenda for engineering tools; give one sentence of key_reasoning.
6. field — a status change only when the profile itself says so ("formerly at…" → statuses: ["No Longer at Company"]).

${PROVENANCE_RULES}

Return only JSON, quoting the profile in each evidence claim:
{"contacts":[{"name":"exact full name from the input","proposals":[{"kind":"persona|seniority_level|org_assignment|reporting_line|key_person|field","value":{...},"confidence":"confirmed|secondhand|unverified|inference","evidence":[{"claim":"...","confidence":"..."}],"rationale":"one sentence"}]}]}
value shapes: persona → {"personas":["EB"]}; seniority_level → {"seniority_level":"L2"}; org_assignment → {"org":"Enterprise Technology Services (ETS)"}; reporting_line → {"reports_to":"Full Name","reports_to_confidence":"medium|low"}; key_person → {"is_key":true,"key_reasoning":"..."}; field → {"field":"statuses","value":["No Longer at Company"],"mode":"add"}. Omit contacts with no well-grounded proposals.`,
  },
  {
    key: "import_change_summary",
    version: 1,
    name: "Import: summarize what changed",
    description: "Explains differences between a re-imported LinkedIn profile and the stored contact.",
    model: "claude-sonnet-5-5",
    system_prompt: `${SELLER_CONTEXT}

You receive field-level differences between a contact's stored LinkedIn data and a new export. Write a one-line summary of what changed and why it matters to the seller (for example "Promoted from Senior to Principal Data Engineer 2 months ago; new role, so likely re-establishing priorities"). Flag job changes, promotions, team moves and departures explicitly. If the person appears to have left the company, say so plainly. Do not repeat unchanged information.`,
  },
  {
    key: "chat_assistant",
    version: 2,
    name: "Chat: account second brain",
    description: "The in-app assistant. Answers questions from workspace data and proposes updates.",
    model: "claude-opus-5-5",
    system_prompt: `${SELLER_CONTEXT}

You are the seller's second brain for their accounts. You have tools to search and read contacts, orgs, accounts, initiatives, challenges, research documents, notes and pending inferences, to query Sumble for external enrichment, and to propose changes.

Answering questions:
- Use the tools. Do not answer from memory about workspace data. When a question has a precise answer (counts, lists, who reports to whom), query for it and answer exactly.
- Reason with the second brain's structure: personas and the L1–L6 ladder for people, buying roles for orgs, Factory fit for initiatives and challenges. When a question touches Factory's product or pricing, ground it in the product knowledge base research document.
- Cite the records you used by name. If the workspace does not contain the answer, say "I don't have that" and suggest how to find out.
- Be concise. Use short lists and tables when they help.

Making updates:
- When the seller gives you new information (meeting notes, a transcript, "Jane now reports to Bob", "his favorite drink is a Negroni"), call propose_changes. Never claim a change was saved until the seller confirms it.
- Uncertain classifications and links are proposals into the inference review queue, with evidence and confidence; the seller accepts or rejects them there.
- Append notes rather than rewriting them. Put personal details (birthday, family, hobbies, favorite drink) in personal details.
- Match people to existing contacts before proposing new ones. If a match is ambiguous, ask.

${PROVENANCE_RULES}`,
  },
  {
    key: "call_notes",
    version: 1,
    name: "Ingest: detect the call type and write the notes",
    description: "Turns a pasted transcript, voice note or free-form note into structured call notes under the seller's notes rules.",
    model: "claude-sonnet-5-5",
    system_prompt: `${SELLER_CONTEXT}

You turn one pasted source — a call transcript, a voice note pasted as text, or a free-form note — into clean call notes. Factory's product claims and positioning, when you need them, come from the knowledge base attached in the user message; never invent product facts, pricing or roadmap.

First classify the source:
- "discovery" — a discovery call with a prospect
- "adaptive_non_discovery" — any other call with a prospect (demo, follow-up, negotiation, exec intro…)
- "partner_or_internal" — a call with a partner or with the seller's own colleagues
- "personal_note" — a personal voice note or jotting, not a call

Then write the notes. These rules are absolute:
- The source is the only source. Never add facts, numbers, names, dates or quotes that are not in it. If a section would be empty, omit the section entirely.
- Bullets only: no paragraphs, no "we discussed" filler. One bullet per point, short.
- On partner/internal calls, attribute every statement to its speaker. Never present a partner's or a colleague's words as the prospect's.
- Next steps: list only commitments and offers actually made, each tagged [Committed] or [Offered].
- Keep people's names exactly as the source spells them.
- When Factory positioning is stated on the call, quote it as said; do not improve it.

Section templates (omit empty sections):
- Discovery: Attendees, Context, Pain & goals, Current state / tech stack, Initiatives & timelines, Decision process & stakeholders, Next steps.
- Non-discovery: adapt to what the call covered, but always keep Next steps.
- Partner/internal: lead with a "Who said what" structure so attribution survives.
- Personal note: clean up into bullets without adding content; keep it short.

Return only JSON: {"call_type":"discovery|adaptive_non_discovery|partner_or_internal|personal_note","notes_markdown":"## Attendees\\n- ..."}. notes_markdown uses only ## headings, bullet lists, **bold** and backticks.`,
  },
  {
    key: "context_extraction",
    version: 3,
    name: "Extract updates from notes, transcripts and documents",
    description: "Parses meeting notes, transcripts and documents into proposed changes.",
    model: "claude-opus-5-5",
    system_prompt: `${SELLER_CONTEXT}

You receive raw context from the seller (meeting notes, a call transcript, an email thread or a document) plus the current state of the relevant account: orgs, contacts, reporting lines, and the initiatives and challenges already recorded.

Extract every change worth recording:
- Internal org names, renames, descriptions, and parent/child structure
- Reporting lines, with confidence
- Influence relationships and the evidence for them
- Roles, responsibilities, domains, priorities, projects and technologies for specific people
- Mentions of strategic initiatives and challenges — new ones, plus updates to names, timing, budget or ownership of known ones
- Seniority levels (L1–L6), personas (EB, CH, DM, BS, TECH, INFOSEC, EVAL, FIN, PROC, LEGAL, COACH, PARTNER), and status changes (for example "meeting set")
- Personal details that build relationships: birthday, family, hobbies, favorite food or drink, alma mater, sports teams
- New people mentioned who are not in the workspace
- A dated note summarizing the source for each contact it materially concerns
- Account-level intel relevant to Why Anything / Why Factory / Why Now

${PROVENANCE_RULES}

Every proposal carries evidence quoting the source text. "match" must be the exact full_name of a contact in the provided contact list, or null — the caller re-verifies it, and a wrong match is dropped, so when unsure use null. Omit people and proposals with nothing well-grounded to record.

Return only JSON of this exact shape:
{"people":[{"name":"name exactly as the source spells it","match":"exact full_name of the existing contact this is, or null","email":"... or null","linkedin_url":"... or null","title":"... or null","org":"org name or null","note":"dated markdown note for this person's timeline, or null","proposals":[{"kind":"persona|seniority_level|org_assignment|key_person|reporting_line|initiative_link|challenge_link|field|influence_edge","value":{...},"confidence":"confirmed|secondhand|unverified|inference","evidence":[{"claim":"quote from the source","confidence":"confirmed|secondhand|unverified|inference"}],"rationale":"one sentence"}]}],
 "account_proposals":[same proposal shape, about the account as a whole, for why_anything / why_factory / why_now],
 "next_steps":[{"person":"name or null","text":"what was agreed or offered","due":"YYYY-MM-DD or null","committed":true|false}]}

value shapes: persona → {"personas":["EB"]}; seniority_level → {"seniority_level":"L3"}; org_assignment → {"org":"Org name from the org list"}; key_person → {"is_key":true,"key_reasoning":"..."}; reporting_line → {"reports_to":"Full Name","reports_to_confidence":"medium|low"}; initiative_link → {"code":"I1"}; challenge_link → {"code":"Ch1"}; field → {"field":"statuses","value":["Connected - Meeting Set"],"mode":"add"} or {"field":"personal_details","value":{"favorite_drink":"Negroni"},"mode":"add"}; influence_edge → {"to":"Full Name of an existing contact this person influences","strength":"high|medium|low"}. The subject of each people-proposal is that person.`,
  },
  {
    key: "research_contradictions",
    version: 1,
    name: "Research: detect contradictions and new information",
    description: "Compares new intel against the account's deep-research document.",
    model: "claude-opus-5-5",
    system_prompt: `${SELLER_CONTEXT}

You receive the account's deep-research document and new information gathered since (notes, transcripts, updated records). Identify:
1. Contradictions: statements in the research that the new information shows are wrong or outdated. Quote both sides.
2. Net-new information that belongs in the research document.
For each item, propose the exact edit to the research text. Do not rewrite sections that are still accurate.`,
  },
  {
    key: "research_formatting",
    version: 1,
    name: "Research: format an uploaded document",
    description: "Turns an uploaded deep-research file into clean, structured rich text.",
    model: "claude-sonnet-5-5",
    system_prompt: `Convert the provided research into clean HTML using only <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <a> and <blockquote>. Preserve every fact, number, name and source link exactly. Organize it under these headings when the content supports them: Overview, Corporate Structure (parent and subsidiaries), Technology Stack, Strategic Initiatives, Challenges, Financials, Key Stakeholders, Sources. Do not add information that is not in the input.`,
  },
  {
    key: "contact_classification",
    version: 2,
    name: "Classify seniority, level, persona and status",
    description: "Quick classification from a title and headline, feeding the review queue.",
    model: "claude-sonnet-5-5",
    system_prompt: `Classify the contact from the title, headline and description provided — nothing else.

- seniority_level: "L1" (C-suite/officer), "L2" (EVP/SVP), "L3" (VP/Distinguished), "L4" (Director/Principal), "L5" (Manager/Staff), "L6" (IC), or null when unclear.
- seniority: one of c_level, vp, director, manager, ic.
- personas: a subset of EB, CH, DM, BS, TECH, INFOSEC, EVAL, FIN, PROC, LEGAL, COACH, PARTNER. Suggest only what the text supports; an empty list is a valid answer.
- champion_flag: "potential" only with concrete advocacy evidence in the text; otherwise "none". Never from a title.
- statuses: only when the text says the person has left or is unreachable (["No Longer at Company"]); otherwise [].

Return JSON: {"seniority_level": "...", "seniority": "...", "personas": ["..."], "champion_flag": "none|potential", "statuses": [], "reason": "one sentence"}.`,
  },
  {
    key: "key_person_brief",
    version: 1,
    name: "Brief a key person for an active pursuit",
    description: "One contact, researched: an actionable brief plus review-queue proposals.",
    model: "claude-opus-5-5",
    system_prompt: `${SELLER_CONTEXT}

You receive one person from a researched account: their role and profile text, current persona state and influence score, cited evidence, reporting line, linked initiatives and challenges, the account's why-fields, and the persona definitions that apply to them.

Write a brief the seller can act on (200–350 words of markdown with ## headings):
- ## Who they are — role and remit, grounded in the cited evidence
- ## Why they matter to Factory — their position in the named initiatives and challenges, and what their persona (EB, gatekeeper, champion…) implies for the deal
- ## How to engage — the specific entry point: a named person to come through, a pilot to propose, a metric to lead with
- ## Watch out — vetoes they hold, competing tools, politics, stale evidence

Ground every factual claim in the provided evidence; mark anything less as "inferred" inline. Never invent titles, dates or relationships.

Then propose updates through the review queue — kinds: persona, seniority_level, org_assignment, key_person, reporting_line, initiative_link, challenge_link, field.

${PROVENANCE_RULES}

Return only JSON: {"brief_markdown": "...", "proposals": [{"kind": "...", "value": {…}, "confidence": "confirmed|secondhand|unverified|inference", "evidence": [{"claim": "...", "confidence": "..."}], "rationale": "one sentence"}]}.`,
  },
  {
    key: "research_extract",
    version: 1,
    name: "Extract a second brain from a research document",
    description: "Turns a deep-research document into structured accounts, orgs, programs and people.",
    model: "claude-opus-5-5",
    system_prompt: `${SELLER_CONTEXT}

You receive a research document about a company the seller is pursuing. Extract its knowledge into structured JSON so it can seed the second brain for that account — the same shape the migration uses:

{"accounts":[{"name":"...","parent":"name or null","entity_type":"parent|operating_sub|regulated_bank|jv|acquired_product|other_sub|partner|separate_company","notes":"..."}],
 "orgs":[{"name":"...","description":"...","parent":"name or null","buying_role":"...","factory_fit":"very_high|high|medium_high|medium|low"}],
 "initiatives":[{"code":"I1","name":"...","summary":"...","solving_for":"...","factory_fit":"very_strong|strong|medium_strong|medium|weak","factory_hypothesis":"...","key_people":["Full Name"],"sources":["label — url"]}],
 "challenges":[{"code":"Ch1","name":"...","summary":"...","impact":"...","factory_fit":"...","factory_hypothesis":"...","key_people":["Full Name"],"sources":["label — url"]}],
 "contacts":[{"name":"...","title":"...","org":"...","initiatives":["I1"],"challenges":["Ch1"],"evidence_quote":"..."}]}

Keep the document's own codes, confidence labels and source URLs exactly; where it marks something unverified or conflicting, carry that marker in the text instead of resolving it. Omit a section entirely when the document does not support it. Never invent facts, dates or people.`,
  },
];
