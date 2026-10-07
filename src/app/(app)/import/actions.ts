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
  if (emails.length) await chunked("email", emails);
  return [...byId.values()];
}

/** Find-or-create the account for each distinct company in the file, filling blank columns. */
async function resolveAccounts(supabase: Awaited<ReturnType<typeof requireUser>>["supabase"], contacts: ImportedContact[]) {
  const companies = new Map<string, ImportedCompany>();
  for (const c of contacts) {
    const key = c.company.domain ?? c.company.linkedin_company_id ?? (c.company.name ?? "").toLowerCase();
    if (key && !companies.has(key)) companies.set(key, c.company);
  }
  const idByKey = new Map<string, string>();
  for (const [key, company] of companies) {
    let existingId: string | null = null;
    if (company.domain) {
      const { data: byDomain } = await supabase
        .from("accounts")
        .select("id")
        .ilike("domain", company.domain)
        .maybeSingle();
      existingId = byDomain?.id ?? null;
    }
    if (!existingId && company.linkedin_company_id) {
      const { data: byLi } = await supabase
        .from("accounts")
        .select("id")
        .eq("linkedin_company_id", company.linkedin_company_id)
        .maybeSingle();
      existingId = byLi?.id ?? null;
    }
    if (!existingId && company.name) {
      const { data: byName } = await supabase
        .from("accounts")
        .select("id")
        .ilike("name", company.name)
        .maybeSingle();
      existingId = byName?.id ?? null;
    }

    const values = {
      name: company.name ?? key,
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

    let id: string;
    if (existingId) {
      id = existingId;
      // Fill only blank columns so seller edits and Sumble data survive.
      const { data: current } = await supabase.from("accounts").select("*").eq("id", id).maybeSingle();
      if (current) {
        const patch: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(values)) {
          if (v != null && !(current as Record<string, unknown>)[k]) patch[k] = v;
        }
        if (Object.keys(patch).length) {
          await supabase.from("accounts").update(patch).eq("id", id);
          await logActivity(supabase, "account", id, "update", { source: "import", ...patch });
        }
      }
    } else {
      const { data, error } = await supabase.from("accounts").insert(values).select("id").single();
      if (error || !data) continue; // Bad company row: contacts land without an account.
      id = data.id;
      await logActivity(supabase, "account", id, "create", { source: "import", name: values.name });
    }
    idByKey.set(key, id);
  }

  // Map every row to its account, even when its company wasn't first-seen.
  const accountIdFor = (c: ImportedContact): string | null => {
    const key = c.company.domain ?? c.company.linkedin_company_id ?? (c.company.name ?? "").toLowerCase();
    return idByKey.get(key) ?? null;
  };
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

export async function applyImport(batchId: string): Promise<ActionResult<{ applied: number; skipped: number; errors: number }>> {
  const { supabase, user } = await requireUser();
  const { data: batch } = await supabase.from("import_batches").select("id, status").eq("id", batchId).maybeSingle();
  if (!batch) return { ok: false, error: "Import not found." };
  if (batch.status === "applied") return { ok: false, error: "This import was already applied." };

  const { data: rawItems } = await supabase
    .from("import_items")
    .select(ITEM_COLUMNS)
    .eq("batch_id", batchId)
    .order("row_index");
  const items = (rawItems ?? []) as unknown as ImportItemRow[];

  let applied = 0;
  let skipped = 0;
  let errors = 0;
  const now = new Date().toISOString();

  for (const item of items) {
    const finish = async (contactId: string | null, error: string | null) => {
      await supabase
        .from("import_items")
        .update({ applied_contact_id: contactId, error, decision: error ? "skip" : item.decision })
        .eq("id", item.id);
    };
    if (item.action === "error" || item.decision === "skip" || item.decision === "pending") {
      skipped++;
      await finish(item.applied_contact_id, item.error);
      continue;
    }
    try {
      const { contact, account_id } = item.payload;
      let contactId: string | null = null;

      if (item.decision === "merge" && item.merge_into_contact_id) {
        // Update the seller-chosen match.
        const patch: Record<string, unknown> = { ...silentValues(contact) };
        for (const d of item.diff) {
          if ((d.accept ?? d.defaultAccept) !== true) continue;
          if (d.field === "company") {
            const { data: target } = await supabase
              .from("contacts")
              .select("statuses")
              .eq("id", item.merge_into_contact_id)
              .maybeSingle();
            const statuses = new Set(target?.statuses ?? []);
            statuses.add(STATUS.gone);
            patch.statuses = [...statuses];
          } else {
            patch[d.field] = d.after;
          }
        }
        const place = await geocodeCached(supabase, contact.location);
        if (place) Object.assign(patch, placeColumns(place));
        const { error } = await supabase
          .from("contacts")
          .update(patch)
          .eq("id", item.merge_into_contact_id);
        if (error) throw new Error(error.message);
        contactId = item.merge_into_contact_id;
      } else if ((item.action === "update" || item.action === "unchanged") && item.matched_contact_id) {
        // Update the matched contact: accepted diffs, then silent refresh fields.
        const patch: Record<string, unknown> = { ...silentValues(contact) };
        for (const d of item.diff) {
          if ((d.accept ?? d.defaultAccept) !== true) continue;
          if (d.field === "company") {
            const { data: target } = await supabase
              .from("contacts")
              .select("statuses")
              .eq("id", item.matched_contact_id)
              .maybeSingle();
            const statuses = new Set(target?.statuses ?? []);
            statuses.add(STATUS.gone);
            patch.statuses = [...statuses];
          } else {
            patch[d.field] = d.after;
          }
        }
        if (patch.role_start || patch.company_start || patch.title) {
          // A new role after a long stay often marks a change agent; seniority may shift too.
          const { data: target } = await supabase
            .from("contacts")
            .select("seniority")
            .eq("id", item.matched_contact_id)
            .maybeSingle();
          if (!target?.seniority && contact.suggested_seniority) patch.seniority = contact.suggested_seniority;
        }
        const place = await geocodeCached(supabase, contact.location);
        if (place) Object.assign(patch, placeColumns(place));
        const { error } = await supabase.from("contacts").update(patch).eq("id", item.matched_contact_id);
        if (error) throw new Error(error.message);
        contactId = item.matched_contact_id;
      } else {
        // Create (or review row the seller chose to create fresh).
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
          seniority: contact.suggested_seniority,
          linkedin_uid: contact.linkedin_uid,
          linkedin_public_url: contact.linkedin_public_url,
          sales_nav_url: contact.sales_nav_url,
          avatar_source_url: contact.avatar_source_url,
          account_id,
          evaboot_raw: contact.raw,
          last_imported_at: now,
        };
        const place = await geocodeCached(supabase, contact.location);
        if (place) Object.assign(values, placeColumns(place));
        const { data: created, error } = await supabase.from("contacts").insert(values).select("id").single();
        if (error) throw new Error(error.message);
        contactId = created.id;
      }

      if (contactId) {
        const avatarPath = await downloadAvatar(supabase, user.id, contact, contactId);
        if (avatarPath) await supabase.from("contacts").update({ avatar_path: avatarPath }).eq("id", contactId);
        await logActivity(supabase, "contact", contactId, item.decision === "merge" && item.merge_into_contact_id ? "import_update" : "import", {
          batch_id: batchId,
          row_index: item.row_index,
        });
      }
      applied++;
      await finish(contactId, null);
    } catch (e) {
      errors++;
      await finish(null, e instanceof Error ? e.message : "Failed to apply row");
    }
  }

  await supabase
    .from("import_batches")
    .update({ status: "applied", applied_at: now, stats: { applied, skipped, errors } })
    .eq("id", batchId);
  revalidatePath(`/import/${batchId}`);
  revalidatePath("/import");
  revalidatePath("/contacts");
  revalidatePath("/accounts");
  return { ok: true, data: { applied, skipped, errors } };
}
