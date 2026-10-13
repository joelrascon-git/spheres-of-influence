/**
 * One-off loader for the real AmEx dataset: runs the same import apply core,
 * research migration and AI enrichment the app uses, against the real Supabase
 * project — headless. Guarded so a normal `npm test` run skips it entirely.
 *
 *   RUN_REAL_LOAD=1 npx vitest run src/lib/__tests__/load-real-data.test.ts --testTimeout=3600000
 *
 * Phases (LOAD_PHASES, comma-separated, default "import,apply,research,enrich"):
 *   import  — parse the CSV, plan accounts/contacts, create the import batch
 *   apply   — apply every planned row of the latest batch (resumable)
 *   research — run the AmEx research corpus migration (idempotent)
 *   enrich  — AI enrichment pass over the applied batch (needs ANTHROPIC_API_KEY)
 *
 * Credentials come from .env.local: NEXT_PUBLIC_SUPABASE_URL,
 * SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY. The service key bypasses RLS, so
 * this script only ever runs deliberately, with RUN_REAL_LOAD set.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  applyItem,
  createImportBatch,
  enrichNextSlice,
  ITEM_COLUMNS,
  planImportFile,
  progressCounts,
  type ImportItemRow,
} from "@/lib/import/apply-core";
import { runResearchMigration } from "@/lib/research/migrate";
import type { OrgRef } from "@/lib/inference/orgs";

const DEFAULT_CSV = "/Users/joelrascon_macbook_pro_2025/Downloads/Factory/Spheres of Influence/AmEx - Evaboot Export.csv";
const FALLBACK_CSV = "sample-data/amex_leads_10_7_2026.csv";

/** Tiny .env.local parser: the runner does not depend on dotenv. */
function readEnvLocal(): Record<string, string> {
  const out: Record<string, string> = {};
  if (!existsSync(".env.local")) return out;
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i > 0) out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

const log = (msg: string) => console.log(`[load] ${msg}`);

async function ownerId(supabase: SupabaseClient): Promise<string> {
  const { data } = await supabase.from("field_definitions").select("owner_id").limit(1);
  const id = (data ?? [])[0]?.owner_id as string | undefined;
  if (!id) throw new Error("No user found (field_definitions is empty). Sign in to the app once first.");
  return id;
}

async function latestBatch(supabase: SupabaseClient): Promise<{ id: string; file_name: string; status: string }> {
  const { data } = await supabase
    .from("import_batches")
    .select("id, file_name, status")
    .neq("status", "discarded")
    .order("created_at", { ascending: false })
    .limit(1);
  const b = (data ?? [])[0];
  if (!b) throw new Error("No import batch found. Run the import phase first.");
  return b;
}

describe.skipIf(!process.env.RUN_REAL_LOAD)("real data load", () => {
  it(
    "imports the AmEx export, migrates research and enriches with AI",
    { timeout: 3_600_000 },
    async () => {
      const env = readEnvLocal();
      const url = env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !serviceKey)
        throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local.");
      if (env.ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY; // for aiConfigured()

      const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
      const userId = await ownerId(supabase);
      const phases = (process.env.LOAD_PHASES ?? "import,apply,research,enrich").split(",").map((s) => s.trim());
      log(`phases: ${phases.join(" → ")} · user ${userId.slice(0, 8)}…`);

      let batchId = process.env.LOAD_BATCH ?? "";

      if (phases.includes("import")) {
        const csv = existsSync(process.env.LOAD_CSV ?? DEFAULT_CSV) ? (process.env.LOAD_CSV ?? DEFAULT_CSV) : FALLBACK_CSV;
        log(`import: planning ${csv}`);
        const planned = await planImportFile(supabase, readFileSync(csv, "utf8"), csv.split("/").pop() ?? "export.csv");
        if ("error" in planned) throw new Error(planned.error);
        const { batchId: id, stats } = await createImportBatch(
          supabase,
          csv.split("/").pop() ?? "export.csv",
          planned.contacts,
          planned.planned,
          planned.accountIdFor,
          planned.exportDate,
        );
        batchId = id;
        log(`import: batch ${id} · plan ${JSON.stringify(stats)}`);
      }

      if (phases.includes("apply")) {
        if (!batchId) batchId = (await latestBatch(supabase)).id;
        await supabase.from("import_batches").update({ status: "applying" }).eq("id", batchId);
        const orgsCache = new Map<string, OrgRef[]>();
        let processed = 0;
        for (;;) {
          const { data: rawItems } = await supabase
            .from("import_items")
            .select(ITEM_COLUMNS)
            .eq("batch_id", batchId)
            .filter("processed_at", "is", null)
            .order("row_index")
            .limit(100);
          const items = (rawItems ?? []) as unknown as ImportItemRow[];
          if (!items.length) break;
          const now = new Date().toISOString();
          for (const item of items) {
            let contactId: string | null = null;
            let error: string | null = item.error;
            let decision = item.decision;
            if (item.action !== "error" && item.decision !== "skip" && item.decision !== "pending") {
              try {
                contactId = await applyItem(supabase, userId, batchId, item, orgsCache);
              } catch (e) {
                error = e instanceof Error ? e.message : "Failed to apply row";
                decision = "skip";
              }
            }
            await supabase
              .from("import_items")
              .update({ processed_at: now, applied_contact_id: contactId, error, decision })
              .eq("id", item.id);
            processed++;
          }
          log(`apply: ${processed} rows applied (last row_index ${items[items.length - 1].row_index})`);
        }
        const progress = await progressCounts(supabase, batchId);
        await supabase
          .from("import_batches")
          .update({
            status: "applied",
            applied_at: new Date().toISOString(),
            stats: { applied: progress.applied, skipped: progress.skipped, errors: progress.errors },
          })
          .eq("id", batchId);
        log(`apply: done · ${JSON.stringify(progress)}`);
      }

      if (phases.includes("research")) {
        log("research: running corpus migration");
        const r = await runResearchMigration(supabase, userId);
        if (!r.ok) throw new Error(r.error ?? "Research migration failed.");
        log(`research: ${JSON.stringify(r.counts)}`);
        for (const w of r.warnings) log(`research warning: ${w}`);
      }

      if (phases.includes("enrich")) {
        if (!batchId) batchId = (await latestBatch(supabase)).id;
        if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY missing from .env.local; skipping enrich.");
        for (;;) {
          const r = await enrichNextSlice(supabase, userId, batchId);
          if ("error" in r) throw new Error(r.error);
          if (r.progress.processed % 40 < 8 || r.progress.done)
            log(`enrich: ${r.progress.processed}/${r.progress.total} · queued ${r.progress.queued} · failed ${r.progress.failed}`);
          if (r.progress.done) break;
        }
      }

      // Final scoreboard, straight from the database.
      const count = (t: string, filter?: string) =>
        supabase
          .from(t)
          .select("id", { count: "exact", head: true })
          .then(({ count }) => `${t}: ${count ?? 0}${filter ? ` (${filter})` : ""}`);
      const [
        contacts,
        accounts,
        orgs,
        initiatives,
        challenges,
        docs,
        pending,
        validated,
      ] = await Promise.all([
        count("contacts"),
        count("accounts"),
        count("orgs"),
        count("initiatives"),
        count("challenges"),
        count("research_docs"),
        supabase.from("inferences").select("id", { count: "exact", head: true }).eq("status", "pending")
          .then(({ count }) => `inferences pending: ${count ?? 0}`),
        supabase.from("contacts").select("id", { count: "exact", head: true }).neq("persona_status", "assumed")
          .then(({ count }) => `contacts research-validated: ${count ?? 0}`),
      ]);
      log("final: " + [contacts, accounts, orgs, initiatives, challenges, docs, pending, validated].join(" · "));
      expect(true).toBe(true);
    },
  );
});
