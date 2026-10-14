/**
 * The import apply core: planning, account resolution, batch creation, row apply
 * and AI enrichment as plain functions over a Supabase client. The server
 * actions in app/(app)/import/actions.ts wrap these for the UI; the one-off
 * loader uses the same functions headless so both paths write identically.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import Papa from "papaparse";
import { z } from "zod";
import { logActivity } from "@/lib/data";
import { geocodeCached, placeColumns } from "@/lib/geocode-server";
import { dateFromFileName, toIsoDate } from "@/lib/tenure";
import {
  emailQualityFromProvider,
  mapEvabootRow,
  missingHeaders,
  type ImportedCompany,
  type ImportedContact,
} from "@/lib/import/evaboot";
import { planImport, SILENT_FIELDS, type ExistingContact, type FieldDiff } from "@/lib/import/plan";
import { companyKey, planAccounts, type ExistingAccount } from "@/lib/import/accounts";
import { classifyContact, type Classification } from "@/lib/inference/classify";
import type { OrgRef } from "@/lib/inference/orgs";
import { queueInferences, type InferenceProposal } from "@/lib/inference/queue";
import { AiBadJsonError, aiCompleteJson, getStoredPrompt } from "@/lib/ai/client";
import type { Evidence } from "@/lib/types";
import { STATUS } from "@/lib/constants";

/** Stored in import_items.payload: the mapped CSV row plus the account it belongs to. */
export type ItemPayload = { contact: ImportedContact; account_id: string | null };

export const ITEM_COLUMNS =
  "id, row_index, linkedin_uid, full_name, action, match_reason, matched_contact_id, candidate_contact_ids, payload, diff, decision, merge_into_contact_id, applied_contact_id, error";
export type ImportItemRow = {
  id: string;
  row_index: number;
  linkedin_uid: string | null;
  full_name: string | null;
  action: "create" | "update" | "unchanged" | "review" | "error";
  match_reason: string | null;
  matched_contact_id: string | null;
  candidate_contact_ids: string[];
  payload: ItemPayload;
  diff: FieldDiff[];
  decision: "pending" | "accept" | "skip" | "merge";
  merge_into_contact_id: string | null;
  applied_contact_id: string | null;
  error: string | null;
};

export const EXISTING_COLUMNS =
  "id, account_id, linkedin_uid, email, first_name, last_name, statuses, title, headline, summary, job_description, location, linkedin_public_url, role_start, company_start";

const ACCOUNT_COLUMNS =
  "id, name, domain, linkedin_company_id, website, industry, employee_count, description, specialities, company_type, hq, year_founded, revenue_min_musd, revenue_max_musd, employee_growth, department_headcounts, out_of_scope";

// ───────── Planning ─────────

export async function fetchExisting(
  supabase: SupabaseClient,
  accountIds: string[],
  uids: string[],
  emails: string[],
  publicUrls: string[],
): Promise<ExistingContact[]> {
  const byId = new Map<string, ExistingContact>();
  const ingest = (rows: Record<string, unknown>[]) => {
    for (const r of rows) byId.set(r.id as string, r as unknown as ExistingContact);
  };
  const chunked = async (col: string, values: string[]) => {
    for (let i = 0; i < values.length; i += 400) {
      const { data } = await supabase.from("contacts").select(EXISTING_COLUMNS).in(col, values.slice(i, i + 400));
      ingest((data ?? []) as Record<string, unknown>[]);
    }
  };
  if (accountIds.length) await chunked("account_id", accountIds);
  if (uids.length) await chunked("linkedin_uid", uids);
  if (emails.length) await chunked("email", emails.map((e) => e.toLowerCase()));
  if (publicUrls.length) await chunked("linkedin_public_url", urlVariants(publicUrls));
  return [...byId.values()];
}

/** Case- and slash-variants of a profile URL so stored URLs match across sources. */
export function urlVariants(urls: string[]): string[] {
  const out = new Set<string>();
  for (const u of urls) {
    const lower = u.toLowerCase().trim();
    const bare = lower.replace(/\/+$/, "");
    out.add(lower);
    out.add(bare);
    out.add(`${bare}/`);
  }
  return [...out];
}

/** Importable firmographics: written on create, blank-filled on match. */
function accountValues(company: ImportedCompany) {
  return {
    name: company.name,
    domain: company.domain,
    website: company.website,
    linkedin_company_id: company.linkedin_company_id,
    industry: company.industry,
    employee_count: company.employee_count,
    description: company.description,
    specialities: company.specialities,
    company_type: company.company_type,
    hq: company.hq,
    year_founded: company.year_founded,
    revenue_min_musd: company.revenue_min_musd,
    revenue_max_musd: company.revenue_max_musd,
    employee_growth: company.employee_growth,
    department_headcounts: company.department_headcounts,
  };
}

/**
 * Find-or-create the account for each distinct company in the file. One fetch of
 * the owner's accounts feeds the pure matcher; variant names ("American Express
 * Banking corporation") fold onto the parent brand, GBT gets its own account
 * tagged out of scope, and nothing else is guessed.
 */
export async function resolveAccounts(supabase: SupabaseClient, userId: string, contacts: ImportedContact[]) {
  const companies = new Map<string, ImportedCompany>();
  for (const c of contacts) {
    const key = companyKey(c.company);
    if (key && !companies.has(key)) companies.set(key, c.company);
  }

  const { data: accountRows } = await supabase.from("accounts").select(ACCOUNT_COLUMNS);
  const existing = (accountRows ?? []) as unknown as ExistingAccount[];
  const plans = planAccounts(companies, existing);

  // Create the unmatched companies in one insert; returned rows follow values order.
  const idByKey = new Map<string, string>();
  const creators = plans.filter((p) => !p.match && !p.reuseKey);
  if (creators.length) {
    // Bulk insert rows must have a uniform shape: PostgREST unions the keys across
    // all rows, so a key present on one row (out_of_scope on the GBT account) is
    // NULL on the others and violates not-null. Set it on every row explicitly.
    const values = creators.map((p) => ({
      owner_id: userId,
      ...accountValues(p.company),
      name: p.company.name ?? p.key,
      out_of_scope: p.outOfScope === true,
    }));
    const { data: created, error } = await supabase.from("accounts").insert(values).select("id");
    for (let i = 0; i < (created ?? []).length; i++) {
      const plan = creators[i];
      const id = (created ?? [])[i]?.id as string | undefined;
      if (id) {
        idByKey.set(plan.key, id);
        await logActivity(supabase, "account", id, "create", { source: "import", name: plan.company.name ?? plan.key }, "manual", userId);
      }
    }
    if (error) console.warn("import: some accounts failed to create", error.message);
  }
  for (const p of plans) {
    if (p.match) idByKey.set(p.key, p.match.accountId);
    else if (p.reuseKey && idByKey.has(p.reuseKey)) idByKey.set(p.key, idByKey.get(p.reuseKey)!);
  }

  // Blank-fill matched accounts so seller edits survive; tag GBT out of scope.
  const byId = new Map((accountRows ?? []).map((a) => [(a as { id: string }).id, a as Record<string, unknown>]));
  for (const p of plans) {
    if (!p.match) continue;
    const current = byId.get(p.match.accountId);
    if (!current) continue;
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(accountValues(p.company))) {
      if (v != null && current[k] == null) patch[k] = v;
    }
    if (p.outOfScope && !current.out_of_scope) patch.out_of_scope = true;
    if (Object.keys(patch).length) {
      await supabase.from("accounts").update(patch).eq("id", p.match.accountId);
      await logActivity(supabase, "account", p.match.accountId, "update", { source: "import", ...patch }, "manual", userId);
    }
  }

  // Map every row to its account, even when its company wasn't first-seen.
  const accountIdFor = (c: ImportedContact): string | null => idByKey.get(companyKey(c.company)) ?? null;
  return { accountIdFor };
}

/** Parses and plans an Evaboot CSV: the shared body of the upload action and the loader. */
export async function planImportFile(
  supabase: SupabaseClient,
  userId: string,
  text: string,
  fileName: string,
  explicitDate?: string,
): Promise<{ error: string } | { contacts: ImportedContact[]; planned: ReturnType<typeof planImport>; accountIdFor: (c: ImportedContact) => string | null; exportDate: string }> {
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: "greedy" });
  const rows = (parsed.data ?? []).filter((r) => Object.keys(r).length > 0);
  const headers = parsed.meta?.fields ?? (rows[0] ? Object.keys(rows[0]) : []);
  const missing = missingHeaders(headers);
  if (missing.length) return { error: `Missing required column(s): ${missing.join(", ")}.` };
  if (rows.length === 0) return { error: "The file has no data rows." };

  const explicit = (explicitDate ?? "").trim();
  const exportDate = /^\d{4}-\d{2}-\d{2}$/.test(explicit) ? explicit : dateFromFileName(fileName) ?? toIsoDate(new Date());

  const contacts = rows.map((r) => mapEvabootRow(r, exportDate));
  const { accountIdFor } = await resolveAccounts(supabase, userId, contacts);
  const planned = planImport(
    contacts.map((contact) => ({ contact, accountId: accountIdFor(contact) })),
    await fetchExisting(
      supabase,
      [...new Set(contacts.map((c) => accountIdFor(c)).filter(Boolean) as string[])],
      [...new Set(contacts.map((c) => c.linkedin_uid).filter(Boolean) as string[])],
      [...new Set(contacts.map((c) => c.email).filter(Boolean) as string[])],
      [...new Set(contacts.map((c) => c.linkedin_public_url).filter(Boolean) as string[])],
    ),
  );
  return { contacts, planned, accountIdFor, exportDate };
}

/** Creates the batch and its planned items; review/error rows start pending. */
export async function createImportBatch(
  supabase: SupabaseClient,
  userId: string,
  fileName: string,
  contacts: ImportedContact[],
  planned: ReturnType<typeof planImport>,
  accountIdFor: (c: ImportedContact) => string | null,
  exportDate: string,
): Promise<{ batchId: string; stats: Record<string, number> }> {
  // The batch is anchored to the most common company in the file.
  const accountTally = new Map<string, number>();
  for (const p of planned) {
    const acct = contacts[p.rowIndex] ? accountIdFor(contacts[p.rowIndex]) : null;
    if (acct) accountTally.set(acct, (accountTally.get(acct) ?? 0) + 1);
  }
  const mainAccount = [...accountTally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const { data: batch, error } = await supabase
    .from("import_batches")
    .insert({
      owner_id: userId,
      file_name: fileName,
      export_date: exportDate,
      account_id: mainAccount,
      source: "csv",
      status: "review",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const items = planned.map((p) => {
    const contact = contacts[p.rowIndex];
    const payload: ItemPayload = { contact, account_id: accountIdFor(contact) };
    return {
      owner_id: userId,
      batch_id: batch.id,
      row_index: p.rowIndex,
      linkedin_uid: contact.linkedin_uid,
      full_name: `${contact.first_name} ${contact.last_name}`.trim() || null,
      action: p.action,
      match_reason: p.matchReason,
      matched_contact_id: p.matchedContactId,
      candidate_contact_ids: p.candidateContactIds,
      payload,
      diff: p.diff,
      decision: p.action === "review" || p.action === "error" ? "pending" : "accept",
      error: p.error ?? null,
    };
  });
  for (let i = 0; i < items.length; i += 500) {
    const { error: insertError } = await supabase.from("import_items").insert(items.slice(i, i + 500));
    if (insertError) {
      await supabase.from("import_batches").delete().eq("id", batch.id);
      throw new Error(insertError.message);
    }
  }

  const stats: Record<string, number> = {};
  for (const p of planned) stats[p.action] = (stats[p.action] ?? 0) + 1;
  await supabase.from("import_batches").update({ stats }).eq("id", batch.id);
  return { batchId: batch.id, stats };
}

// ───────── Apply ─────────

/** Values applied on every import: refresh-only fields plus provenance. */
function silentValues(contact: ImportedContact) {
  const values: Record<string, unknown> = {};
  for (const key of SILENT_FIELDS) {
    values[key] = (contact as unknown as Record<string, unknown>)[key] ?? null;
  }
  values.last_imported_at = new Date().toISOString();
  return values;
}

async function downloadAvatar(
  supabase: SupabaseClient,
  userId: string,
  contact: ImportedContact,
  contactId: string,
): Promise<string | null> {
  if (!contact.avatar_source_url) return null;
  const path = `${userId}/${contact.linkedin_uid ?? contactId}.jpg`;
  try {
    const res = await fetch(contact.avatar_source_url, {
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "Mozilla/5.0 spheres-of-influence/1.0" },
    });
    if (!res.ok) return null;
    const buffer = new Uint8Array(await res.arrayBuffer());
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, buffer, { contentType: res.headers.get("content-type") ?? "image/jpeg", upsert: true });
    return error ? null : path;
  } catch {
    return null;
  }
}

/** Rows and wall-clock budget per chunk: every call stays well inside server limits. */
export const CHUNK_ROWS = 60;
export const CHUNK_MS = 40_000;

export type ApplyProgress = {
  done: boolean;
  total: number;
  processed: number;
  applied: number;
  skipped: number;
  errors: number;
};

/** Live counts from the database so progress survives reloads and resumes. */
export async function progressCounts(supabase: SupabaseClient, batchId: string): Promise<ApplyProgress> {
  const count = () =>
    supabase.from("import_items").select("id", { count: "exact", head: true }).eq("batch_id", batchId);
  const [total, pending, applied, errors] = await Promise.all([
    count(),
    count().filter("processed_at", "is", null),
    count().filter("applied_contact_id", "not.is", null),
    // Planning errors (action "error") are skips, not apply failures.
    count().filter("error", "not.is", null).neq("action", "error"),
  ]);
  const rows = total.count ?? 0;
  const processed = rows - (pending.count ?? 0);
  const failed = errors.count ?? 0;
  return {
    done: (pending.count ?? 0) === 0,
    total: rows,
    processed,
    applied: applied.count ?? 0,
    skipped: Math.max(0, processed - (applied.count ?? 0) - failed),
    errors: failed,
  };
}

/** What a title earns on its own (KB rules 2–3): level, bucket, "assumed" personas and the import-baseline score. A title never earns a Champion. */
function classificationValues(cls: Classification, contact: ImportedContact): Record<string, unknown> {
  const values: Record<string, unknown> = {
    seniority_level: cls.seniority_level,
    function_bucket: cls.function_bucket,
    personas: cls.personas,
    persona_status: "assumed",
    champion_flag: "none",
    can_veto: cls.can_veto,
    influence_score: cls.influence_score,
  };
  if (contact.title) {
    values.evidence = [
      {
        claim: `Title "${contact.title}" from the Evaboot export`,
        source_label: "Evaboot export (LinkedIn profile)",
        confidence: "confirmed",
      },
    ] satisfies Evidence[];
  }
  return values;
}

/** Orgs of one account, fetched once per chunk: input to deterministic org assignment. */
async function orgsFor(supabase: SupabaseClient, accountId: string | null, cache: Map<string, OrgRef[]>): Promise<OrgRef[]> {
  if (!accountId) return [];
  const hit = cache.get(accountId);
  if (hit) return hit;
  const { data } = await supabase.from("orgs").select("id, name, aliases").eq("account_id", accountId);
  const orgs = (data ?? []).map((o) => ({
    id: o.id as string,
    name: o.name as string,
    aliases: (o.aliases ?? []) as string[],
  }));
  cache.set(accountId, orgs);
  return orgs;
}

/** Apply one row: merge/update the matched contact or create a new one, then the deterministic classification pass. Returns the contact written. */
export async function applyItem(
  supabase: SupabaseClient,
  userId: string,
  batchId: string,
  item: ImportItemRow,
  orgsCache: Map<string, OrgRef[]>,
): Promise<string | null> {
  const { contact, account_id } = item.payload;
  const now = new Date().toISOString();
  const cls = classifyContact({
    title: contact.title,
    headline: contact.headline,
    summary: contact.summary,
    companyName: contact.company.name,
    orgs: await orgsFor(supabase, account_id, orgsCache),
  });

  const targetId =
    item.decision === "merge" && item.merge_into_contact_id ? item.merge_into_contact_id : item.matched_contact_id;
  let contactId: string | null = null;
  if (targetId) {
    const { data: target } = await supabase
      .from("contacts")
      .select("statuses, seniority, seniority_level, function_bucket, personas, persona_status, can_veto, influence_score, org_id")
      .eq("id", targetId)
      .maybeSingle();
    const patch: Record<string, unknown> = { ...silentValues(contact) };
    for (const d of item.diff) {
      if ((d.accept ?? d.defaultAccept) !== true) continue;
      if (d.field === "company") {
        const statuses = new Set(target?.statuses ?? []);
        statuses.add(STATUS.gone);
        patch.statuses = [...statuses];
      } else {
        patch[d.field] = d.after;
      }
    }
    // Refresh title-derived fields while they are still import-owned ("assumed");
    // research/AI-validated contacts only get fills for what's missing.
    const owned = !target?.persona_status || target.persona_status === "assumed";
    if (owned) Object.assign(patch, classificationValues(cls, contact));
    else {
      if (!target?.seniority_level && cls.seniority_level) patch.seniority_level = cls.seniority_level;
      if (!target?.function_bucket && cls.function_bucket) patch.function_bucket = cls.function_bucket;
      if (!target?.can_veto && cls.can_veto) patch.can_veto = cls.can_veto;
      if (target?.influence_score == null && cls.influence_score != null) patch.influence_score = cls.influence_score;
      if (!target?.personas?.length && cls.personas.length) patch.personas = cls.personas;
    }
    if (!target?.org_id && cls.org) patch.org_id = cls.org.orgId;
    const coarse = cls.seniority ?? contact.suggested_seniority;
    if (!target?.seniority && coarse) patch.seniority = coarse;
    const place = await geocodeCached(supabase, contact.location);
    if (place) Object.assign(patch, placeColumns(place));
    const { error } = await supabase.from("contacts").update(patch).eq("id", targetId);
    if (error) throw new Error(error.message);
    contactId = targetId;
  } else {
    // Create (or a review row the seller chose to create fresh).
    const values: Record<string, unknown> = {
      owner_id: userId,
      first_name: contact.first_name,
      last_name: contact.last_name,
      title: contact.title,
      headline: contact.headline,
      summary: contact.summary,
      job_description: contact.job_description,
      location: contact.location,
      email: contact.email,
      email_quality: emailQualityFromProvider(contact.email_provider_status),
      email_provider_status: contact.email_provider_status,
      profile_industry: contact.profile_industry,
      connections: contact.connections,
      is_premium: contact.is_premium,
      is_open_profile: contact.is_open_profile,
      is_open_to_work: contact.is_open_to_work,
      current_jobs_count: contact.current_jobs_count,
      total_positions_count: contact.total_positions_count,
      role_start: contact.role_start,
      company_start: contact.company_start,
      linkedin_uid: contact.linkedin_uid,
      linkedin_public_url: contact.linkedin_public_url,
      sales_nav_url: contact.sales_nav_url,
      avatar_source_url: contact.avatar_source_url,
      account_id,
      evaboot_raw: contact.raw,
      last_imported_at: now,
      seniority: cls.seniority ?? contact.suggested_seniority,
      ...classificationValues(cls, contact),
    };
    if (cls.org) values.org_id = cls.org.orgId;
    const place = await geocodeCached(supabase, contact.location);
    if (place) Object.assign(values, placeColumns(place));
    const { data: created, error } = await supabase.from("contacts").insert(values).select("id").single();
    if (error) throw new Error(error.message);
    contactId = created.id;
  }

  if (!contactId) return null;
  const avatarPath = await downloadAvatar(supabase, userId, contact, contactId);
  if (avatarPath) await supabase.from("contacts").update({ avatar_path: avatarPath }).eq("id", contactId);
  await logActivity(supabase, "contact", contactId, item.decision === "merge" ? "import_update" : "import", {
    batch_id: batchId,
    row_index: item.row_index,
  }, "manual", userId);
  return contactId;
}

// ───────── Enrichment ─────────

export type EnrichProgress = {
  done: boolean;
  /** Items examined so far, over every applied item in the batch. */
  processed: number;
  total: number;
  queued: number;
  failed: number;
};

export const ENRICH_ROWS = 8;

const enrichmentProposal = z.object({
  kind: z.enum(["persona", "seniority_level", "org_assignment", "reporting_line", "key_person", "field"]),
  value: z.record(z.string(), z.unknown()),
  confidence: z.enum(["confirmed", "secondhand", "unverified", "inference"]).optional(),
  evidence: z
    .array(
      z.object({
        claim: z.string(),
        source_label: z.string().optional(),
        source_url: z.string().optional(),
        confidence: z.enum(["confirmed", "secondhand", "unverified", "inference"]).optional(),
      }),
    )
    .optional(),
  rationale: z.string().optional(),
});

const enrichmentResponse = z.object({
  contacts: z
    .array(z.object({ name: z.string(), proposals: z.array(enrichmentProposal).max(20).default([]) }))
    .max(ENRICH_ROWS)
    .default([]),
});

/**
 * Enrich the next slice of an applied import: senior, key and ambiguously-matched
 * contacts whose personas are still title-assumed go to the model in one batch,
 * and every proposal lands in the inference review queue. Progress lives in the
 * batch stats so an interrupted run resumes. Requires ANTHROPIC_API_KEY.
 */
export async function enrichNextSlice(
  supabase: SupabaseClient,
  userId: string,
  batchId: string,
): Promise<{ error: string } | { progress: EnrichProgress }> {
  const { data: rawBatch } = await supabase
    .from("import_batches")
    .select("id, status, stats")
    .eq("id", batchId)
    .maybeSingle();
  if (!rawBatch) return { error: "Import not found." };
  const batch = rawBatch as unknown as { id: string; status: string; stats: Record<string, unknown> };
  if (batch.status !== "applied") return { error: "Apply the import first; enrichment runs on the applied rows." };

  const state = (batch.stats?.enrichment ?? {}) as {
    cursor?: number;
    processed?: number;
    queued?: number;
    failed?: number;
  };
  const cursor = state.cursor ?? -1;
  const processed = state.processed ?? 0;
  const queuedTotal = state.queued ?? 0;
  const failedTotal = state.failed ?? 0;

  const { count: total } = await supabase
    .from("import_items")
    .select("id", { count: "exact", head: true })
    .eq("batch_id", batchId)
    .filter("applied_contact_id", "not.is", null);

  const { data: rawRows } = await supabase
    .from("import_items")
    .select("row_index, action, applied_contact_id, payload")
    .eq("batch_id", batchId)
    .filter("applied_contact_id", "not.is", null)
    .gt("row_index", cursor)
    .order("row_index")
    .limit(ENRICH_ROWS);
  const rows = (rawRows ?? []) as unknown as {
    row_index: number;
    action: string;
    applied_contact_id: string;
    payload: ItemPayload;
  }[];

  const done = rows.length < ENRICH_ROWS;
  if (!rows.length) {
    return { progress: { done: true, processed, total: total ?? processed, queued: queuedTotal, failed: failedTotal } };
  }

  // Which of this slice is worth the model's time: what a title alone cannot earn.
  const { data: rawContacts } = await supabase
    .from("contacts")
    .select(
      "id, full_name, title, headline, summary, job_description, location, seniority, seniority_level, personas, persona_status, is_key, account_id, org_id",
    )
    .in("id", rows.map((r) => r.applied_contact_id));
  const contactById = new Map(
    ((rawContacts ?? []) as Record<string, unknown>[]).map((c) => [c.id as string, c]),
  );
  const rowByContact = new Map(rows.map((r) => [r.applied_contact_id, r]));
  const candidates = [...contactById.values()].filter((c) => {
    const personaStatus = c.persona_status as string | null;
    if (personaStatus && personaStatus !== "assumed") return false; // Research ground truth already covers them.
    const senior = ["c_level", "vp", "director"].includes(c.seniority as string);
    const ambiguous = rowByContact.get(c.id as string)?.action === "review";
    return c.is_key === true || senior || ambiguous;
  });

  let queued = 0;
  let failed = 0;
  if (candidates.length) {
    const accountIds = [...new Set(candidates.map((c) => c.account_id).filter(Boolean))] as string[];
    const { data: orgRows } = accountIds.length
      ? await supabase.from("orgs").select("account_id, name, aliases").in("account_id", accountIds)
      : { data: [] };
    const { data: accountRows } = accountIds.length
      ? await supabase.from("accounts").select("id, name").in("id", accountIds)
      : { data: [] };
    const accountName = new Map(((accountRows ?? []) as { id: string; name: string }[]).map((a) => [a.id, a.name]));

    const context = {
      candidates: candidates.map((c) => ({
        name: c.full_name,
        title: c.title,
        headline: c.headline,
        summary: c.summary,
        job_description: c.job_description,
        location: c.location,
        seniority_level_so_far: c.seniority_level,
        personas_so_far: c.personas,
        role_start: rowByContact.get(c.id as string)?.payload.contact.role_start,
        company_start: rowByContact.get(c.id as string)?.payload.contact.company_start,
        account: c.account_id ? (accountName.get(c.account_id as string) ?? null) : null,
      })),
      existing_orgs: (orgRows ?? []).map((o) => ({
        account: accountName.get((o as { account_id: string }).account_id) ?? null,
        name: (o as { name: string }).name,
        aliases: (o as { aliases: string[] }).aliases,
      })),
    };

    try {
      const prompt = await getStoredPrompt(supabase, "import_inference");
      // Reasoning models spend output tokens on thinking before the JSON; give the
      // slice enough budget to finish both.
      const parsed = enrichmentResponse.parse(
        await aiCompleteJson<unknown>({
          model: prompt.model,
          system: prompt.system_prompt,
          user: JSON.stringify(context),
          maxTokens: 16_000,
        }),
      );
      const byName = new Map(candidates.map((c) => [String(c.full_name).toLowerCase(), c.id as string]));
      const proposals: InferenceProposal[] = [];
      for (const entry of parsed.contacts) {
        const subjectId = byName.get(entry.name.trim().toLowerCase());
        if (!subjectId) continue; // The model invented a name; keep it out of the queue.
        for (const p of entry.proposals) {
          proposals.push({
            subject_type: "contact",
            subject_id: subjectId,
            kind: p.kind,
            value: p.value,
            confidence: p.confidence,
            evidence: (p.evidence ?? []).map((e) => ({ ...e, confidence: e.confidence ?? "inference" })),
            rationale: p.rationale,
            source: "ai",
          });
        }
      }
      queued = await queueInferences(supabase, userId, proposals);
    } catch (e) {
      // A malformed model answer will not fix itself on retry: skip the slice and count it.
      if (e instanceof z.ZodError || e instanceof AiBadJsonError) failed = candidates.length;
      else {
        return { error: e instanceof Error ? e.message : "Enrichment failed. Retry to continue where it stopped." };
      }
    }
  }

  const enrichment = {
    cursor: rows[rows.length - 1].row_index,
    processed: processed + rows.length,
    queued: queuedTotal + queued,
    failed: failedTotal + failed,
  };
  const { error: statsError } = await supabase
    .from("import_batches")
    .update({ stats: { ...(batch.stats ?? {}), enrichment } })
    .eq("id", batchId);
  if (statsError) return { error: statsError.message };

  return {
    progress: {
      done,
      processed: enrichment.processed,
      total: total ?? enrichment.processed,
      queued: enrichment.queued,
      failed: enrichment.failed,
    },
  };
}
