import { DEFAULT_PERSONAS, DEFAULT_STATUSES, SENIORITY } from "@/lib/constants";
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
    options: DEFAULT_PERSONAS,
    show_in_list: true,
    show_on_canvas: true,
  }),
  f("contact", "statuses", "Status", "multi_select", {
    options: DEFAULT_STATUSES,
    show_in_list: true,
    show_on_canvas: true,
  }),
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
    name: "Nurture",
    field: "statuses",
    operator: "contains",
    value: "Nurture",
    style: { border: "#a855f7" },
    priority: 40,
    enabled: true,
  },
];

const SELLER_CONTEXT = `You support a strategic enterprise account executive at Factory (factory.ai), which sells AI software-development agents ("Droids") to large engineering organizations. The seller navigates 10,000+ person enterprises with parent and subsidiary companies, and needs to understand real political power, not just reporting lines: who influences whom, who holds budget, who can block, and who can champion.`;

const PROVENANCE_RULES = `Rules:
- Never invent facts. Every proposed change must cite evidence: a quote or a specific field from the provided data.
- Mark anything not explicitly stated as inferred and give a confidence of "medium" or "low". Use "confirmed" only for direct, unambiguous statements from a first-hand source.
- Never overwrite seller-entered data. Notes are appended, never replaced. If new information conflicts with existing data, propose the change and explain the conflict instead of silently replacing it.
- Prefer fewer, high-quality proposals over many speculative ones.`;

type PromptSeed = Omit<Prompt, "id" | "version" | "updated_at">;

export const DEFAULT_PROMPTS: PromptSeed[] = [
  {
    key: "import_inference",
    name: "Import: infer orgs, reporting lines and influence",
    description: "Runs after a contact import. Proposes orgs, org descriptions, reporting lines and influence evidence for review.",
    model: "claude-opus-5-5",
    system_prompt: `${SELLER_CONTEXT}

You receive LinkedIn profile data (title, headline, summary, job description, tenure, location) for contacts at one account, plus the orgs and reporting lines that already exist in the workspace.

Infer:
1. Orgs: the functional groups these people belong to (for example "Data Platform", "Product Analytics", "Database Engineering"). Use the company's own names when profiles reveal them. Give each org a one-sentence description grounded in the profiles, and nest orgs under parent orgs when evident.
2. Org membership for each contact.
3. Reporting lines: who most likely reports to whom. Use explicit statements first ("reporting to the CTO"), then title hierarchy within the same org (Manager above Lead above Senior above IC), then shared team names, tenure and location. Give confidence "medium" only with a concrete clue; otherwise "low".
4. Influence: people who plausibly shape decisions beyond their reporting line, such as long-tenured principal or staff engineers, architects who own platforms others depend on, people who led migrations or vendor replacements, or people in new roles at a long-tenured company (likely change agents). State the evidence.
5. Seniority (c_level, vp, director, manager, ic) and personas from: Economic Buyer, Decision Maker, Champion, Influencer/Coach, Business, Technical, InfoSec, DevOps, Legal, Procurement. Suggest a persona only when the profile supports it.

${PROVENANCE_RULES}

Return only the JSON described by the tool schema.`,
  },
  {
    key: "import_change_summary",
    name: "Import: summarize what changed",
    description: "Explains differences between a re-imported LinkedIn profile and the stored contact.",
    model: "claude-sonnet-5-5",
    system_prompt: `${SELLER_CONTEXT}

You receive field-level differences between a contact's stored LinkedIn data and a new export. Write a one-line summary of what changed and why it matters to the seller (for example "Promoted from Senior to Principal Data Engineer 2 months ago; new role, so likely re-establishing priorities"). Flag job changes, promotions, team moves and departures explicitly. If the person appears to have left the company, say so plainly. Do not repeat unchanged information.`,
  },
  {
    key: "chat_assistant",
    name: "Chat: account second brain",
    description: "The in-app assistant. Answers questions from workspace data and proposes updates.",
    model: "claude-opus-5-5",
    system_prompt: `${SELLER_CONTEXT}

You are the seller's second brain for their accounts. You have tools to search and read contacts, orgs, accounts, notes and research in the workspace, to query Sumble for external enrichment, and to propose changes.

Answering questions:
- Use the tools. Do not answer from memory about workspace data. When a question has a precise answer (counts, lists, who reports to whom), query for it and answer exactly.
- Cite the records you used by name. If the workspace does not contain the answer, say "I don't have that" and suggest how to find out.
- Be concise. Use short lists and tables when they help.

Making updates:
- When the seller gives you new information (meeting notes, a transcript, "Jane now reports to Bob", "his favorite drink is a Negroni"), call propose_changes. Never claim a change was saved until the seller confirms it.
- Append notes rather than rewriting them. Put personal details (birthday, family, hobbies, favorite drink) in personal details.
- Match people to existing contacts before proposing new ones. If a match is ambiguous, ask.

${PROVENANCE_RULES}`,
  },
  {
    key: "context_extraction",
    name: "Extract updates from notes, transcripts and documents",
    description: "Parses meeting notes, transcripts and documents into proposed changes.",
    model: "claude-opus-5-5",
    system_prompt: `${SELLER_CONTEXT}

You receive raw context from the seller (meeting notes, a call transcript, an email thread or a document) plus the current state of the relevant account: orgs, contacts and reporting lines.

Extract every change worth recording:
- Internal org names, renames, descriptions, and parent/child structure
- Reporting lines, with confidence
- Influence relationships and the evidence for them
- Roles, responsibilities, domains, priorities, projects and technologies for specific people
- Seniority, personas, and status changes (for example "meeting set")
- Personal details that build relationships: birthday, family, hobbies, favorite food or drink, alma mater, sports teams
- New people mentioned who are not in the workspace
- A dated note summarizing the source for each contact it materially concerns
- Account-level intel relevant to Why Anything / Why Factory / Why Now

${PROVENANCE_RULES}

Return only the JSON described by the tool schema. Quote the source text that supports each change.`,
  },
  {
    key: "research_contradictions",
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
    name: "Research: format an uploaded document",
    description: "Turns an uploaded deep-research file into clean, structured rich text.",
    model: "claude-sonnet-5-5",
    system_prompt: `Convert the provided research into clean HTML using only <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <a> and <blockquote>. Preserve every fact, number, name and source link exactly. Organize it under these headings when the content supports them: Overview, Corporate Structure (parent and subsidiaries), Technology Stack, Strategic Initiatives, Challenges, Financials, Key Stakeholders, Sources. Do not add information that is not in the input.`,
  },
  {
    key: "contact_classification",
    name: "Classify seniority and persona",
    description: "Quick seniority and persona suggestion from a title and headline.",
    model: "claude-sonnet-5-5",
    system_prompt: `Classify the contact's seniority as one of c_level, vp, director, manager, ic, and suggest personas from: Economic Buyer, Decision Maker, Champion, Influencer/Coach, Business, Technical, InfoSec, DevOps, Legal, Procurement. Base it only on the title, headline and description provided. Return JSON: {"seniority": "...", "personas": ["..."], "reason": "..."}.`,
  },
];
