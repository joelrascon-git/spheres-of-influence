/**
 * Research migration: encodes the AmEx corpus (src/lib/research/amex.ts) into the
 * knowledge schema. Run from Admin → Research data, any time, in any order with
 * the CSV import:
 *
 *   - Accounts, orgs, docs and contacts are matched against existing rows before
 *     they are written, so the migration enriches imported records instead of
 *     duplicating them (domains and exact names join; the four people absent from
 *     the Evaboot export are created deliberately).
 *   - Initiatives and challenges upsert by (owner, account, code); link tables
 *     insert with ON CONFLICT DO NOTHING, so a re-run only refreshes content.
 *
 * Research values are ground truth, not inference proposals: the corpus carries
 * its own sources and confidence, so persona, seniority, evidence and influence
 * are written directly (persona_status "indicated"/"validated") rather than
 * queued for review. Import-time "assumed" values on the same rows are upgraded.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ResearchConfidence } from "@/lib/constants";
import type { Evidence } from "@/lib/types";
import { influenceScore, type InitiativeFit, type ProximityToEb } from "@/lib/inference/score";
import { legacySeniority } from "@/lib/inference/title";
import { nameTokens, normalizeDomain } from "@/lib/import/accounts";
import { publicUrlSlug } from "@/lib/import/plan";
import { markdownToHtml } from "@/lib/markdown";
import {
  EB_CONTACT_KEY,
  PRIMARY_ACCOUNT_CODE,
  RESEARCH_ACCOUNTS,
  RESEARCH_CHALLENGES,
  RESEARCH_CONTACTS,
  RESEARCH_DOCS,
  RESEARCH_EDGES,
  RESEARCH_INITIATIVES,
  RESEARCH_ORGS,
  researchContactByKey,
  type ResearchContact,
} from "@/lib/research/amex";

// ───────────────────────── Pure helpers (unit-tested) ─────────────────────────

export type ExistingAccountRow = { id: string; name: string; domain: string | null };
export type ExistingContactRow = {
  id: string;
  first_name: string;
  last_name: string;
  linkedin_public_url: string | null;
  account_id: string | null;
  statuses: string[];
  evidence: Evidence[];
  gaps: string[];
};

/** Token-folded name: punctuation and parentheticals stop being words. */
export const researchNameKey = (name: string) => nameTokens(name).join(" ");

/** Exact domain, then exact name. Never variant-folds: research entities are distinct. */
export function matchResearchAccount(
  account: { match_domains: string[]; match_names: string[] },
  existing: ExistingAccountRow[],
): ExistingAccountRow | null {
  const domains = new Set(account.match_domains.map((d) => normalizeDomain(d)).filter((d): d is string => !!d));
  if (domains.size) {
    const byDomain = existing.find((a) => a.domain && domains.has(normalizeDomain(a.domain)!));
    if (byDomain) return byDomain;
  }
  const names = new Set(account.match_names.map(researchNameKey).filter(Boolean));
  if (names.size) {
    const byName = existing.find((a) => names.has(researchNameKey(a.name)));
    if (byName) return byName;
  }
  return null;
}

export type ContactMatch =
  | { row: ExistingContactRow; reason: "url" | "name" }
  | { ambiguous: true }
  | null;

/**
 * Public profile URL first, then a unique name. A LinkedIn URL is identity, so it
 * matches across accounts; names only match inside the researched account family
 * (plus unassigned rows), so an unrelated company's coincidental name never merges.
 */
export function matchResearchContact(
  contact: { first_name: string; last_name: string; linkedin_url: string | null },
  existing: ExistingContactRow[],
  accountIds?: Set<string>,
): ContactMatch {
  const slug = publicUrlSlug(contact.linkedin_url);
  if (slug) {
    const byUrl = existing.find((c) => publicUrlSlug(c.linkedin_public_url) === slug);
    if (byUrl) return { row: byUrl, reason: "url" };
  }
  const key = researchNameKey(`${contact.first_name} ${contact.last_name}`);
  if (key) {
    const pool = accountIds
      ? existing.filter((c) => !c.account_id || accountIds.has(c.account_id))
      : existing;
    const byName = pool.filter((c) => researchNameKey(`${c.first_name} ${c.last_name}`) === key);
    if (byName.length === 1) return { row: byName[0], reason: "name" };
    if (byName.length > 1) return { ambiguous: true };
  }
  return null;
}

/** Distance to the Economic Buyer along the corpus's reporting lines (§8.2). */
export function proximityToEb(
  contact: ResearchContact,
  byKey: (key: string) => ResearchContact | undefined,
): ProximityToEb {
  if (contact.key === EB_CONTACT_KEY) return "eb";
  const seen = new Set([contact.key]);
  let managerKey: string | null = contact.reports_to_key;
  for (let hops = 1; managerKey && hops <= 2 && !seen.has(managerKey); hops++) {
    const manager = byKey(managerKey);
    if (!manager) break;
    if (manager.key === EB_CONTACT_KEY) return hops === 1 ? "direct_report" : "two_levels";
    seen.add(managerKey);
    managerKey = manager.reports_to_key;
  }
  return "other";
}

/** Documented initiative ownership outranks adjacency; challenges alone are adjacent. */
export function initiativeFitOf(contact: ResearchContact): InitiativeFit {
  if (contact.initiative_links.some((l) => l.strength === "documented")) return "owns";
  return contact.initiative_links.length > 0 || contact.challenge_links.length > 0 ? "adjacent" : "none";
}

const EVIDENCE_RANK: Record<ResearchConfidence, number> = { confirmed: 3, secondhand: 2, unverified: 1, inference: 0 };

/** The strongest confidence among a contact's cited evidence ("inference" when none). */
export function strongestEvidence(contact: ResearchContact): ResearchConfidence {
  return contact.evidence.reduce<ResearchConfidence>(
    (best, e) => (EVIDENCE_RANK[e.confidence] > EVIDENCE_RANK[best] ? e.confidence : best),
    "inference",
  );
}

/** The influence score for a researched contact: level + corpus proximity, links and evidence. */
export function researchInfluenceScore(contact: ResearchContact): number | null {
  return influenceScore({
    level: contact.seniority_level,
    icTrack: contact.ic_track,
    initiativeFit: initiativeFitOf(contact),
    proximityToEb: proximityToEb(contact, researchContactByKey),
    evidence: strongestEvidence(contact),
    access: "cold",
  });
}

/** Appended to gaps when research adds a person the Evaboot export does not contain. */
export const NOT_IN_EXPORT_GAP = "Not in the Evaboot export; added from research.";

// ───────────────────────── Migration ─────────────────────────

export type ResearchMigrationCounts = {
  accounts_created: number;
  accounts_updated: number;
  docs_created: number;
  docs_updated: number;
  orgs_created: number;
  orgs_updated: number;
  initiatives: number;
  challenges: number;
  contacts_created: number;
  contacts_updated: number;
  contact_initiative_links: number;
  contact_challenge_links: number;
  org_initiative_links: number;
  influence_edges: number;
};

export type ResearchMigrationResult = {
  ok: boolean;
  error?: string;
  /** The account the corpus is about (AXP), for the activity log. */
  account_id: string | null;
  counts: ResearchMigrationCounts;
  warnings: string[];
};

const zeroCounts = (): ResearchMigrationCounts => ({
  accounts_created: 0,
  accounts_updated: 0,
  docs_created: 0,
  docs_updated: 0,
  orgs_created: 0,
  orgs_updated: 0,
  initiatives: 0,
  challenges: 0,
  contacts_created: 0,
  contacts_updated: 0,
  contact_initiative_links: 0,
  contact_challenge_links: 0,
  org_initiative_links: 0,
  influence_edges: 0,
});

type AnyRow = Record<string, unknown>;

/** Rows the migration can read back from Supabase without generics gymnastics. */
const rows = (data: unknown): AnyRow[] => (data ?? []) as AnyRow[];

async function upsertIgnoringDuplicates(
  supabase: SupabaseClient,
  table: string,
  values: AnyRow[],
  onConflict: string,
): Promise<number> {
  let inserted = 0;
  for (let i = 0; i < values.length; i += 200) {
    const { data, error } = await supabase
      .from(table)
      .upsert(values.slice(i, i + 200), { onConflict, ignoreDuplicates: true })
      .select();
    if (error) throw new Error(`${table}: ${error.message}`);
    inserted += rows(data).length; // ON CONFLICT DO NOTHING skips duplicates from the returned set.
  }
  return inserted;
}

export async function runResearchMigration(
  supabase: SupabaseClient,
  userId: string,
): Promise<ResearchMigrationResult> {
  const counts = zeroCounts();
  const warnings: string[] = [];
  let axpId: string | null = null;
  try {
    // ── Accounts: the FY2025 Exhibit 21 entity tree ──
    const { data: rawAccounts, error: accountsError } = await supabase.from("accounts").select("id, name, domain");
    if (accountsError) throw new Error(accountsError.message);
    const existingAccounts = rows(rawAccounts).map((a) => ({
      id: a.id as string,
      name: a.name as string,
      domain: (a.domain as string | null) ?? null,
    }));

    const accountIdByCode = new Map<string, string>();
    for (const r of RESEARCH_ACCOUNTS) {
      const patch: AnyRow = { entity_type: r.entity_type, out_of_scope: r.out_of_scope };
      if (r.hq) patch.hq = r.hq;
      if (r.employee_count != null) patch.employee_count = r.employee_count;
      if (r.description) patch.description = r.description;
      if (r.notes) patch.notes = r.notes;
      const match = matchResearchAccount(r, existingAccounts);
      if (match) {
        const { error } = await supabase.from("accounts").update(patch).eq("id", match.id);
        if (error) throw new Error(`Account ${r.code}: ${error.message}`);
        accountIdByCode.set(r.code, match.id);
        counts.accounts_updated++;
      } else {
        const values = {
          owner_id: userId,
          name: r.name,
          domain: r.domain ?? r.match_domains[0] ?? null,
          parent_relationship: r.parent_code ? "centralized" : "independent",
          ...patch,
        };
        const { data, error } = await supabase.from("accounts").insert(values).select("id").single();
        if (error) throw new Error(`Account ${r.code}: ${error.message}`);
        const id = (data as AnyRow).id as string;
        accountIdByCode.set(r.code, id);
        existingAccounts.push({ id, name: r.name, domain: (values.domain as string | null) ?? null });
        counts.accounts_created++;
      }
    }

    // Parent links, second pass now that every code has an id.
    for (const r of RESEARCH_ACCOUNTS) {
      const id = accountIdByCode.get(r.code);
      if (!id) continue;
      if (r.parent_code) {
        const parentId = accountIdByCode.get(r.parent_code);
        if (!parentId || parentId === id) {
          warnings.push(`Account ${r.code}: parent ${r.parent_code} did not resolve.`);
          continue;
        }
        const { error } = await supabase
          .from("accounts")
          .update({ parent_account_id: parentId, parent_relationship: "centralized" })
          .eq("id", id);
        if (error) throw new Error(`Account ${r.code} parent: ${error.message}`);
      } else {
        const { error } = await supabase.from("accounts").update({ parent_relationship: "independent" }).eq("id", id);
        if (error) throw new Error(`Account ${r.code} parent: ${error.message}`);
      }
    }

    const axpAccountId = accountIdByCode.get(PRIMARY_ACCOUNT_CODE) ?? null;
    if (!axpAccountId) throw new Error(`Primary account ${PRIMARY_ACCOUNT_CODE} did not resolve.`);
    axpId = axpAccountId;

    // ── Research docs: the corpus MDs, rendered to safe HTML ──
    const { data: rawDocs, error: docsError } = await supabase.from("research_docs").select("id, title");
    if (docsError) throw new Error(docsError.message);
    const docIdByTitle = new Map(rows(rawDocs).map((d) => [d.title as string, d.id as string]));
    const docIdByKey = new Map<string, string>();
    for (const spec of RESEARCH_DOCS) {
      let markdown: string;
      try {
        markdown = await readFile(path.join(process.cwd(), "content", "research", spec.file_name), "utf8");
      } catch {
        throw new Error(`Research doc file not found: content/research/${spec.file_name}`);
      }
      const values = {
        owner_id: userId,
        account_id: spec.scope === "account" ? axpId : null,
        scope: spec.scope,
        doc_type: spec.doc_type,
        title: spec.title,
        body_html: markdownToHtml(markdown),
        source_file_path: `content/research/${spec.file_name}`,
        source_file_name: spec.file_name,
      };
      const existing = docIdByTitle.get(spec.title);
      if (existing) {
        const { error } = await supabase.from("research_docs").update(values).eq("id", existing);
        if (error) throw new Error(`Doc ${spec.key}: ${error.message}`);
        docIdByKey.set(spec.key, existing);
        counts.docs_updated++;
      } else {
        const { data, error } = await supabase.from("research_docs").insert(values).select("id").single();
        if (error) throw new Error(`Doc ${spec.key}: ${error.message}`);
        docIdByKey.set(spec.key, (data as AnyRow).id as string);
        counts.docs_created++;
      }
    }

    // ── Orgs: the ranked ETS tree and business segments ──
    const { data: rawOrgs, error: orgsError } = await supabase.from("orgs").select("id, account_id, name, sort_order");
    if (orgsError) throw new Error(orgsError.message);
    const existingOrgs = rows(rawOrgs).map((o) => ({
      id: o.id as string,
      account_id: o.account_id as string,
      name: o.name as string,
      sort_order: o.sort_order as number,
    }));

    const orgIdByCode = new Map<string, string>();
    let orgIndex = 0;
    for (const r of RESEARCH_ORGS) {
      const accountId = accountIdByCode.get(r.account_code);
      if (!accountId) {
        warnings.push(`Org ${r.code}: account ${r.account_code} did not resolve.`);
        continue;
      }
      const existing = existingOrgs.find((o) => o.account_id === accountId && researchNameKey(o.name) === researchNameKey(r.name));
      const values = {
        name: r.name,
        aliases: r.aliases,
        description: r.description,
        status: r.status,
        notes: r.notes,
        factory_fit: r.factory_fit,
        buying_role: r.buying_role,
        rank: r.rank,
        confidence: r.confidence,
        sort_order: r.rank ?? existing?.sort_order ?? 90 + orgIndex,
      };
      if (existing) {
        const { error } = await supabase.from("orgs").update(values).eq("id", existing.id);
        if (error) throw new Error(`Org ${r.code}: ${error.message}`);
        orgIdByCode.set(r.code, existing.id);
        counts.orgs_updated++;
      } else {
        const { data, error } = await supabase
          .from("orgs")
          .insert({ owner_id: userId, account_id: accountId, ...values })
          .select("id")
          .single();
        if (error) throw new Error(`Org ${r.code}: ${error.message}`);
        const id = (data as AnyRow).id as string;
        orgIdByCode.set(r.code, id);
        existingOrgs.push({ id, account_id: accountId, name: r.name, sort_order: values.sort_order });
        counts.orgs_created++;
      }
      orgIndex++;
    }

    for (const r of RESEARCH_ORGS) {
      if (!r.parent_code) continue;
      const id = orgIdByCode.get(r.code);
      const parentId = orgIdByCode.get(r.parent_code);
      if (!id) continue; // already warned above
      if (!parentId || parentId === id) {
        warnings.push(`Org ${r.code}: parent ${r.parent_code} did not resolve.`);
        continue;
      }
      const { error } = await supabase.from("orgs").update({ parent_org_id: parentId }).eq("id", id);
      if (error) throw new Error(`Org ${r.code} parent: ${error.message}`);
    }

    // ── Initiatives and challenges: upsert by (owner, account, code) ──
    const { data: initiativeData, error: initiativeError } = await supabase
      .from("initiatives")
      .upsert(
        RESEARCH_INITIATIVES.map((i) => ({
          owner_id: userId,
          account_id: axpId,
          code: i.code,
          name: i.name,
          summary: i.summary,
          why_it_matters: i.why_it_matters,
          solving_for: i.solving_for,
          factory_fit: i.factory_fit,
          factory_hypothesis: i.factory_hypothesis,
          technologies: i.technologies,
          key_dates: i.key_dates,
          rank: i.rank,
          confidence: i.confidence,
          sources: i.sources,
          doc_id: docIdByKey.get("initiatives") ?? null,
          notes: i.notes,
        })),
        { onConflict: "owner_id,account_id,code" },
      )
      .select("id, code");
    if (initiativeError) throw new Error(`Initiatives: ${initiativeError.message}`);
    const initiativeIdByCode = new Map(rows(initiativeData).map((r) => [r.code as string, r.id as string]));
    counts.initiatives = initiativeIdByCode.size;

    const { data: challengeData, error: challengeError } = await supabase
      .from("challenges")
      .upsert(
        RESEARCH_CHALLENGES.map((c) => ({
          owner_id: userId,
          account_id: axpId,
          code: c.code,
          name: c.name,
          summary: c.summary,
          why_it_matters: c.why_it_matters,
          impact: c.impact,
          entity: c.entity,
          factory_fit: c.factory_fit,
          factory_hypothesis: c.factory_hypothesis,
          key_dates: c.key_dates,
          rank: c.rank,
          confidence: c.confidence,
          sources: c.sources,
          doc_id: docIdByKey.get("challenges") ?? null,
          notes: c.notes,
          // The challenges table has no technologies column; keep the corpus data intact.
          custom_fields: c.technologies.length ? { technologies: c.technologies } : {},
        })),
        { onConflict: "owner_id,account_id,code" },
      )
      .select("id, code");
    if (challengeError) throw new Error(`Challenges: ${challengeError.message}`);
    const challengeIdByCode = new Map(rows(challengeData).map((r) => [r.code as string, r.id as string]));
    counts.challenges = challengeIdByCode.size;

    // ── Contacts: match to imported rows, create the rest, write ground truth ──
    const { data: rawContacts, error: contactsError } = await supabase
      .from("contacts")
      .select("id, first_name, last_name, linkedin_public_url, account_id, statuses, evidence, gaps")
      .limit(10000);
    if (contactsError) throw new Error(contactsError.message);
    const existingContacts = rows(rawContacts).map((c) => ({
      id: c.id as string,
      first_name: c.first_name as string,
      last_name: c.last_name as string,
      linkedin_public_url: (c.linkedin_public_url as string | null) ?? null,
      account_id: (c.account_id as string | null) ?? null,
      statuses: (c.statuses as string[]) ?? [],
      evidence: (c.evidence as Evidence[]) ?? [],
      gaps: (c.gaps as string[]) ?? [],
    }));
    const researchAccountIds = new Set(accountIdByCode.values());

    const contactIdByKey = new Map<string, string>();
    for (const c of RESEARCH_CONTACTS) {
      const accountId = accountIdByCode.get(c.account_code);
      if (!accountId) {
        warnings.push(`Contact ${c.key}: account ${c.account_code} did not resolve.`);
        continue;
      }
      const orgId = c.org_code ? (orgIdByCode.get(c.org_code) ?? null) : null;
      if (c.org_code && !orgId) warnings.push(`Contact ${c.key}: org ${c.org_code} did not resolve.`);
      const gaps = c.not_in_export ? [...c.gaps, NOT_IN_EXPORT_GAP] : c.gaps;

      const score = researchInfluenceScore(c);
      const patch: AnyRow = {
        account_id: accountId,
        persona_status: c.persona_status,
        champion_flag: c.champion_flag,
        can_veto: c.can_veto,
        is_key: c.is_key,
        statuses: c.statuses,
        evidence: c.evidence,
        gaps,
      };
      // Corpus nulls mean "not researched", never "known absent": import-derived
      // title values survive unless the corpus carries a determination.
      if (c.seniority_level) {
        patch.seniority_level = c.seniority_level;
        patch.seniority = legacySeniority(c.seniority_level);
      }
      if (c.function_bucket != null) patch.function_bucket = c.function_bucket;
      if (c.primary_persona) patch.personas = [c.primary_persona, ...c.secondary_personas];
      else if (c.secondary_personas.length) patch.personas = c.secondary_personas;
      if (score != null) patch.influence_score = score;
      if (c.title) patch.title = c.title;
      if (c.location) patch.location = c.location;
      if (c.buying_role) patch.buying_role = c.buying_role;
      if (c.key_reasoning) patch.key_reasoning = c.key_reasoning;
      if (orgId) patch.org_id = orgId;

      const match = matchResearchContact(c, existingContacts, researchAccountIds);
      if (match && "row" in match) {
        const existing = match.row;
        // Merge provenance the seller already has (import evidence, statuses, gaps) with the corpus.
        patch.evidence = [...c.evidence, ...existing.evidence.filter((e) => !c.evidence.some((r) => r.claim === e.claim))];
        patch.gaps = [...gaps, ...existing.gaps.filter((g) => !gaps.includes(g))];
        patch.statuses = [...new Set([...existing.statuses, ...c.statuses])];
        if (c.linkedin_url && !existing.linkedin_public_url) patch.linkedin_public_url = c.linkedin_url;
        const { error } = await supabase.from("contacts").update(patch).eq("id", existing.id);
        if (error) throw new Error(`Contact ${c.key}: ${error.message}`);
        contactIdByKey.set(c.key, existing.id);
        counts.contacts_updated++;
      } else {
        if (match?.ambiguous) {
          warnings.push(`Contact ${c.key}: several existing contacts share the name; created a separate research record.`);
        }
        const values = {
          owner_id: userId,
          first_name: c.first_name,
          last_name: c.last_name,
          linkedin_public_url: c.linkedin_url,
          ...patch,
        };
        const { data, error } = await supabase.from("contacts").insert(values).select("id").single();
        if (error) throw new Error(`Contact ${c.key}: ${error.message}`);
        const id = (data as AnyRow).id as string;
        contactIdByKey.set(c.key, id);
        existingContacts.push({
          id,
          first_name: c.first_name,
          last_name: c.last_name,
          linkedin_public_url: c.linkedin_url,
          account_id: accountId,
          statuses: c.statuses,
          evidence: c.evidence,
          gaps,
        });
        counts.contacts_created++;
      }
    }

    // Reporting lines, second pass now that every contact has an id.
    for (const c of RESEARCH_CONTACTS) {
      const id = contactIdByKey.get(c.key);
      if (!id || !c.reports_to_key) continue;
      const managerId = contactIdByKey.get(c.reports_to_key);
      if (!managerId) {
        warnings.push(`Contact ${c.key}: reports-to ${c.reports_to_key} did not resolve.`);
        continue;
      }
      const { error } = await supabase
        .from("contacts")
        .update({
          reports_to_id: managerId,
          reports_to_confidence: c.reports_to_confidence,
          reports_to_evidence: c.reports_to_evidence,
        })
        .eq("id", id);
      if (error) throw new Error(`Contact ${c.key} reports-to: ${error.message}`);
    }

    // ── Links and influence edges ──
    const contactInitiativeRows: AnyRow[] = [];
    const contactChallengeRows: AnyRow[] = [];
    for (const c of RESEARCH_CONTACTS) {
      const contactId = contactIdByKey.get(c.key);
      if (!contactId) continue;
      for (const l of c.initiative_links) {
        const initiativeId = initiativeIdByCode.get(l.code);
        if (!initiativeId) {
          warnings.push(`Contact ${c.key}: initiative ${l.code} did not resolve.`);
          continue;
        }
        contactInitiativeRows.push({
          contact_id: contactId,
          initiative_id: initiativeId,
          owner_id: userId,
          strength: l.strength,
          source: "research",
          note: l.note ?? null,
        });
      }
      for (const l of c.challenge_links) {
        const challengeId = challengeIdByCode.get(l.code);
        if (!challengeId) {
          warnings.push(`Contact ${c.key}: challenge ${l.code} did not resolve.`);
          continue;
        }
        contactChallengeRows.push({
          contact_id: contactId,
          challenge_id: challengeId,
          owner_id: userId,
          strength: l.strength,
          source: "research",
          note: l.note ?? null,
        });
      }
    }
    counts.contact_initiative_links = await upsertIgnoringDuplicates(
      supabase,
      "contact_initiatives",
      contactInitiativeRows,
      "contact_id,initiative_id",
    );
    counts.contact_challenge_links = await upsertIgnoringDuplicates(
      supabase,
      "contact_challenges",
      contactChallengeRows,
      "contact_id,challenge_id",
    );

    const orgInitiativeRows: AnyRow[] = [];
    for (const o of RESEARCH_ORGS) {
      const orgId = orgIdByCode.get(o.code);
      if (!orgId) continue;
      for (const code of o.initiative_codes) {
        const initiativeId = initiativeIdByCode.get(code);
        if (!initiativeId) {
          warnings.push(`Org ${o.code}: initiative ${code} did not resolve.`);
          continue;
        }
        orgInitiativeRows.push({ org_id: orgId, initiative_id: initiativeId, owner_id: userId, source: "research" });
      }
    }
    counts.org_initiative_links = await upsertIgnoringDuplicates(
      supabase,
      "org_initiatives",
      orgInitiativeRows,
      "org_id,initiative_id",
    );

    const influenceRows: AnyRow[] = [];
    for (const e of RESEARCH_EDGES) {
      const fromId = contactIdByKey.get(e.from_key);
      const toId = contactIdByKey.get(e.to_key);
      if (!fromId || !toId) {
        warnings.push(`Influence edge ${e.from_key} → ${e.to_key}: contacts did not resolve.`);
        continue;
      }
      influenceRows.push({
        owner_id: userId,
        from_contact_id: fromId,
        to_contact_id: toId,
        strength: e.strength,
        confidence: e.confidence,
        evidence: e.evidence,
        source: "research",
      });
    }
    for (let i = 0; i < influenceRows.length; i += 200) {
      const { error } = await supabase
        .from("influences")
        .upsert(influenceRows.slice(i, i + 200), { onConflict: "from_contact_id,to_contact_id" })
        .select("id");
      if (error) throw new Error(`Influences: ${error.message}`);
    }
    counts.influence_edges = influenceRows.length;
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Research migration failed",
      account_id: null,
      counts,
      warnings,
    };
  }
  return { ok: true, account_id: axpId, counts, warnings };
}
