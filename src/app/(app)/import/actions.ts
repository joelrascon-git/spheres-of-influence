"use server";

import { revalidatePath } from "next/cache";
import Papa from "papaparse";
import { requireUser } from "@/lib/auth";
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
import { diffContact, planImport, SILENT_FIELDS, type ExistingContact, type FieldDiff } from "@/lib/import/plan";
import { companyKey, planAccounts, type ExistingAccount } from "@/lib/import/accounts";
import { classifyContact, type Classification } from "@/lib/inference/classify";
import type { OrgRef } from "@/lib/inference/orgs";
import type { Evidence } from "@/lib/types";
import { REVIEW_GROUPS, withGroup } from "./review-groups";
import type { ActionResult } from "@/app/(app)/contacts/actions";
import { STATUS } from "@/lib/constants";

/** Stored in import_items.payload: the mapped CSV row plus the account it belongs to. */
type ItemPayload = { contact: ImportedContact; account_id: string | null };

const ITEM_COLUMNS = "id, row_index, linkedin_uid, full_name, action, match_reason, matched_contact_id, candidate_contact_ids, payload, diff, decision, merge_into_contact_id, applied_contact_id, error";
type ImportItemRow = {
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

const EXISTING_COLUMNS =
  "id, account_id, linkedin_uid, email, first_name, last_name, statuses, title, headline, summary, job_description, location, linkedin_public_url, role_start, company_start";

async function fetchExisting(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
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
function urlVariants(urls: string[]): string[] {
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

const ACCOUNT_COLUMNS =
  "id, name, domain, linkedin_company_id, website, industry, employee_count, description, specialities, company_type, hq, year_founded, revenue_min_musd, revenue_max_musd, employee_growth, department_headcounts, out_of_scope";

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
async function resolveAccounts(supabase: Awaited<ReturnType<typeof requireUser>>["supabase"], contacts: ImportedContact[]) {
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
    const values = creators.map((p) => ({
      ...accountValues(p.company),
      name: p.company.name ?? p.key,
      ...(p.outOfScope ? { out_of_scope: true } : {}),
    }));
    const { data: created, error } = await supabase.from("accounts").insert(values).select("id");
    for (let i = 0; i < (created ?? []).length; i++) {
      const plan = creators[i];
      const id = (created ?? [])[i]?.id as string | undefined;
      if (id) {
        idByKey.set(plan.key, id);
        await logActivity(supabase, "account", id, "create", { source: "import", name: plan.company.name ?? plan.key });
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
      await logActivity(supabase, "account", p.match.accountId, "update", { source: "import", ...patch });
    }
  }

  // Map every row to its account, even when its company wasn't first-seen.
  const accountIdFor = (c: ImportedContact): string | null => idByKey.get(companyKey(c.company)) ?? null;
  return { accountIdFor };
}

export async function startImport(formData: FormData): Promise<ActionResult<{ batchId: string }>> {
  const { supabase } = await requireUser();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Pick a CSV file." };
  if (file.size > 20 * 1024 * 1024) return { ok: false, error: "File is larger than 20 MB. Split the export." };

  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: "greedy" });
  const rows = (parsed.data ?? []).filter((r) => Object.keys(r).length > 0);
  const headers = parsed.meta?.fields ?? (rows[0] ? Object.keys(rows[0]) : []);
  const missing = missingHeaders(headers);
  if (missing.length) return { ok: false, error: `Missing required column(s): ${missing.join(", ")}.` };
  if (rows.length === 0) return { ok: false, error: "The file has no data rows." };

  const explicit = String(formData.get("export_date") ?? "").trim();
  const exportDate = /^\d{4}-\d{2}-\d{2}$/.test(explicit) ? explicit : dateFromFileName(file.name) ?? toIsoDate(new Date());

  const contacts = rows.map((r) => mapEvabootRow(r, exportDate));
  const { accountIdFor } = await resolveAccounts(supabase, contacts);
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
      file_name: file.name,
      export_date: exportDate,
      account_id: mainAccount,
      source: "csv",
      status: "review",
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  const items = planned.map((p) => {
    const contact = contacts[p.rowIndex];
    const payload: ItemPayload = { contact, account_id: accountIdFor(contact) };
    return {
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
      return { ok: false, error: insertError.message };
    }
  }

  const stats: Record<string, number> = {};
  for (const p of planned) stats[p.action] = (stats[p.action] ?? 0) + 1;
  await supabase.from("import_batches").update({ stats }).eq("id", batch.id);
  revalidatePath("/import");
  return { ok: true, data: { batchId: batch.id } };
}

// ───────── Review actions ─────────

export async function setItemDecision(
  itemId: string,
  decision: "accept" | "skip" | "pending",
): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("import_items")
    .update({ decision })
    .eq("id", itemId)
    .select("batch_id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/import/${data.batch_id}`);
  return { ok: true };
}

/** Bulk include/exclude for one review group (see review-groups.ts). Merge decisions are never overwritten. */
export async function setBulkDecision(
  batchId: string,
  group: string,
  decision: "accept" | "skip",
): Promise<ActionResult<{ updated: number }>> {
  const { supabase } = await requireUser();
  const spec = REVIEW_GROUPS.find((g) => g.key === group);
  if (!spec) return { ok: false, error: "Unknown review group." };
  const { count, error } = await withGroup(
    supabase
      .from("import_items")
      .update({ decision }, { count: "exact" })
      .eq("batch_id", batchId)
      .neq("decision", "merge"),
    spec,
  );
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/import/${batchId}`);
  return { ok: true, data: { updated: count ?? 0 } };
}

/** Toggle whether one field diff will be applied. Persists into the item's stored diff. */
export async function setDiffAccept(itemId: string, field: string, accept: boolean): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data: item } = await supabase.from("import_items").select("diff").eq("id", itemId).maybeSingle();
  if (!item) return { ok: false, error: "Import item not found." };
  const diff = (item.diff as FieldDiff[]).map((d) => (d.field === field ? { ...d, accept } : d));
  const { data, error } = await supabase
    .from("import_items")
    .update({ diff })
    .eq("id", itemId)
    .select("batch_id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/import/${data.batch_id}`);
  return { ok: true };
}

/** Resolves an ambiguous same-name row: recompute its diff against the chosen contact. */
export async function chooseMergeTarget(
  itemId: string,
  contactId: string | null,
): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data: item } = await supabase.from("import_items").select("payload, batch_id").eq("id", itemId).maybeSingle();
  if (!item) return { ok: false, error: "Import item not found." };
  const batchId = item.batch_id;
  if (!contactId) {
    const { error } = await supabase
      .from("import_items")
      .update({ decision: "pending", merge_into_contact_id: null, matched_contact_id: null, diff: [] })
      .eq("id", itemId);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/import/${batchId}`);
    return { ok: true };
  }
  const { data: existing } = await supabase
    .from("contacts")
    .select(EXISTING_COLUMNS)
    .eq("id", contactId)
    .maybeSingle();
  if (!existing) return { ok: false, error: "That contact no longer exists." };
  const payload = item.payload as ItemPayload;
  const diff = diffContact(existing as unknown as ExistingContact, payload.contact, payload.account_id);
  const { error } = await supabase
    .from("import_items")
    .update({ decision: "merge", merge_into_contact_id: contactId, diff })
    .eq("id", itemId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/import/${batchId}`);
  return { ok: true };
}

export async function discardImport(batchId: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("import_batches").update({ status: "discarded" }).eq("id", batchId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/import/${batchId}`);
  revalidatePath("/import");
  return { ok: true };
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
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
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

// ───────── Apply (chunked, resumable) ─────────

/** Rows and wall-clock budget per chunk: every call stays well inside server limits. */
const CHUNK_ROWS = 60;
const CHUNK_MS = 40_000;

export type ApplyProgress = {
  done: boolean;
  total: number;
  processed: number;
  applied: number;
  skipped: number;
  errors: number;
};

/** Live counts from the database so progress survives reloads and resumes. */
async function progressCounts(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  batchId: string,
): Promise<ApplyProgress> {
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
    errors: failed,
    skipped: Math.max(0, processed - (applied.count ?? 0) - failed),
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
async function orgsFor(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  accountId: string | null,
  cache: Map<string, OrgRef[]>,
): Promise<OrgRef[]> {
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
async function applyItem(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
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
  });
  return contactId;
}

/**
 * Apply the next slice of an import. The client loops this action until done;
 * each call processes up to CHUNK_ROWS unprocessed rows and returns live counts,
 * so an interrupted apply (reload, timeout, tab close) resumes where it stopped.
 */
export async function applyImportChunk(batchId: string): Promise<ActionResult<ApplyProgress>> {
  const { supabase, user } = await requireUser();
  const { data: batch } = await supabase.from("import_batches").select("id, status").eq("id", batchId).maybeSingle();
  if (!batch) return { ok: false, error: "Import not found." };
  if (batch.status === "discarded") return { ok: false, error: "This import was discarded." };
  if (batch.status === "applied") return { ok: true, data: await progressCounts(supabase, batchId) };
  if (batch.status === "review") {
    await supabase.from("import_batches").update({ status: "applying" }).eq("id", batchId);
  }

  const { data: rawItems } = await supabase
    .from("import_items")
    .select(ITEM_COLUMNS)
    .eq("batch_id", batchId)
    .filter("processed_at", "is", null)
    .order("row_index")
    .limit(CHUNK_ROWS);
  const items = (rawItems ?? []) as unknown as ImportItemRow[];

  const now = new Date().toISOString();
  const deadline = Date.now() + CHUNK_MS;
  const orgsCache = new Map<string, OrgRef[]>();

  for (const item of items) {
    // Stop in time so a call never outlives its request; the next chunk resumes.
    if (Date.now() > deadline) break;
    let contactId: string | null = null;
    let error: string | null = item.error;
    let decision = item.decision;
    if (item.action !== "error" && item.decision !== "skip" && item.decision !== "pending") {
      try {
        contactId = await applyItem(supabase, user.id, batchId, item, orgsCache);
      } catch (e) {
        error = e instanceof Error ? e.message : "Failed to apply row";
        decision = "skip";
      }
    }
    await supabase
      .from("import_items")
      .update({ processed_at: now, applied_contact_id: contactId, error, decision })
      .eq("id", item.id);
  }

  const progress = await progressCounts(supabase, batchId);
  if (progress.done) {
    await supabase
      .from("import_batches")
      .update({
        status: "applied",
        applied_at: now,
        stats: { applied: progress.applied, skipped: progress.skipped, errors: progress.errors },
      })
      .eq("id", batchId);
    revalidatePath(`/import/${batchId}`);
    revalidatePath("/import");
    revalidatePath("/contacts");
    revalidatePath("/accounts");
  }
  return { ok: true, data: progress };
}
