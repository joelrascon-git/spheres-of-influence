"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/data";
import { aiCompleteWebSearch, aiConfigured, extractJson, getStoredPrompt } from "@/lib/ai/client";
import { hashUrl, keepCitedSignals, normalizeUrl, scanResult } from "@/lib/workflow/signals";
import type { ActionResult } from "@/app/(app)/contacts/actions";

function revalidateSignal(accountId: string | null) {
  revalidatePath("/");
  if (accountId) revalidatePath(`/accounts/${accountId}`);
}

/**
 * The daily signal scan, run now: searches the web for account news, scores it,
 * writes the so-what, and keeps only signals whose source was actually fetched.
 */
export async function runSignalScan(accountId: string): Promise<ActionResult<{ found: number; added: number; dropped: number }>> {
  const { supabase } = await requireUser();
  const parsed = z.uuid().safeParse(accountId);
  if (!parsed.success) return { ok: false, error: "Pick an account to scan." };
  if (!aiConfigured()) return { ok: false, error: "AI is not configured. Add ANTHROPIC_API_KEY to .env.local and retry." };

  const { data: account } = await supabase.from("accounts").select("name, domain").eq("id", accountId).maybeSingle();
  if (!account) return { ok: false, error: "That account no longer exists." };
  const { data: existing } = await supabase.from("signals").select("source_url").limit(1000);
  const existingUrls = new Set(((existing ?? []) as { source_url: string }[]).map((s) => normalizeUrl(s.source_url)));

  const prompt = await getStoredPrompt(supabase, "signal_scan");
  let result: z.infer<typeof scanResult>;
  let sources: { url: string; title: string }[];
  try {
    const scan = await aiCompleteWebSearch({
      model: prompt.model,
      system: prompt.system_prompt,
      maxTokens: 4096,
      maxSearches: 6,
      user: [
        `Account: ${account.name}${account.domain ? ` (${account.domain})` : ""}`,
        "",
        "Signals already stored (do not repeat these URLs):",
        existingUrls.size ? [...existingUrls].slice(0, 200).map((u) => `- ${u}`).join("\n") : "- none yet",
        "",
        "Return only the JSON array of signals.",
      ].join("\n"),
    });
    sources = scan.sources;
    const candidateResult = scanResult.safeParse(extractJson(scan.text));
    if (!candidateResult.success) return { ok: false, error: "The scan came back but nothing in it was usable." };
    result = candidateResult.data;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "The signal scan failed." };
  }

  // The citation hard check: only signals whose source URL the search fetched survive.
  const { kept, dropped } = keepCitedSignals(result, new Set(sources.map((s) => normalizeUrl(s.url))), existingUrls);
  if (kept.length) {
    const { error } = await supabase.from("signals").insert(
      kept.map((s) => ({
        account_id: accountId,
        title: s.title,
        summary: s.summary,
        so_what: s.so_what,
        source_name: s.source_name,
        source_url: s.source_url,
        source_date: s.source_date ?? null,
        relevance: s.relevance,
        url_hash: hashUrl(s.source_url),
      })),
    );
    if (error) return { ok: false, error: error.message };
  }
  await logActivity(supabase, "account", accountId, "signal_scan", { found: result.length, added: kept.length, dropped }, "research");
  revalidateSignal(accountId);
  return { ok: true, data: { found: result.length, added: kept.length, dropped } };
}

/** Keeps the signal attached to the account record: it's been read and used. */
export async function linkSignal(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("signals").update({ status: "linked" }).eq("id", id).select("id, account_id, title").maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "That signal no longer exists." };
  const row = data as { id: string; account_id: string | null; title: string };
  await logActivity(supabase, "signal", row.id, "link", { title: row.title }, "research");
  revalidateSignal(row.account_id);
  return { ok: true };
}

/** Not worth acting on; kept in the account's signal history. */
export async function dismissSignal(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("signals").update({ status: "dismissed" }).eq("id", id).select("account_id").maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "That signal no longer exists." };
  revalidateSignal((data as { account_id: string | null }).account_id);
  return { ok: true };
}

/** Turns the signal into a task on the account, and marks the signal linked. */
export async function createTaskFromSignal(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data: signal } = await supabase
    .from("signals")
    .select("id, account_id, title, summary, so_what, status")
    .eq("id", id)
    .maybeSingle();
  const s = signal as { id: string; account_id: string | null; title: string; summary: string; so_what: string; status: string } | null;
  if (!s) return { ok: false, error: "That signal no longer exists." };
  if (s.status !== "new") return { ok: true };

  const { error: taskError } = await supabase.from("tasks").insert({
    account_id: s.account_id,
    title: s.title.slice(0, 200),
    details: `${s.summary}\n\nSo what for Factory: ${s.so_what}\n\nSource: stored signal.`,
  });
  if (taskError) return { ok: false, error: taskError.message };
  const { error } = await supabase.from("signals").update({ status: "linked" }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  await logActivity(supabase, "signal", s.id, "create_task", { title: s.title }, "research");
  revalidateSignal(s.account_id);
  return { ok: true };
}

/** Appends the signal to the account's working hypothesis as its next version. */
export async function addSignalToHypothesis(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data: signal } = await supabase
    .from("signals")
    .select("id, account_id, title, summary, so_what, source_name, source_url, status")
    .eq("id", id)
    .maybeSingle();
  const s = signal as
    | { id: string; account_id: string | null; title: string; summary: string; so_what: string; source_name: string; source_url: string; status: string }
    | null;
  if (!s) return { ok: false, error: "That signal no longer exists." };
  if (!s.account_id) return { ok: false, error: "Signals without an account can't join a hypothesis." };
  if (s.status !== "new") return { ok: true };

  const { data: latest } = await supabase
    .from("hypotheses")
    .select("content, version")
    .eq("account_id", s.account_id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const prev = latest as { content: string; version: number } | null;

  const addition = `- **Signal (${new Date().toISOString().slice(0, 10)}):** ${s.title}\n  ${s.so_what}\n  Source: [${s.source_name}](${s.source_url})`;
  const { error } = await supabase.from("hypotheses").insert({
    account_id: s.account_id,
    content: prev ? `${prev.content}\n\n${addition}` : addition,
    version: (prev?.version ?? 0) + 1,
    source: "signal",
  });
  if (error) return { ok: false, error: error.message };
  const { error: statusError } = await supabase.from("signals").update({ status: "linked" }).eq("id", id);
  if (statusError) return { ok: false, error: statusError.message };
  await logActivity(supabase, "signal", s.id, "add_to_hypothesis", { title: s.title }, "research");
  revalidateSignal(s.account_id);
  return { ok: true };
}

/** Saves a manual edit of the hypothesis as a new version; history is never rewritten. */
export async function saveHypothesis(accountId: string, content: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const parsed = z.uuid().safeParse(accountId);
  if (!parsed.success) return { ok: false, error: "That account no longer exists." };
  const clean = content.trim();
  if (!clean) return { ok: false, error: "Write something, or dismiss the edit." };
  if (clean.length > 50000) return { ok: false, error: "The hypothesis is too long to save." };

  const { data: latest } = await supabase
    .from("hypotheses")
    .select("version")
    .eq("account_id", accountId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase.from("hypotheses").insert({
    account_id: accountId,
    content: clean,
    version: ((latest as { version: number } | null)?.version ?? 0) + 1,
    source: "manual",
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/accounts/${accountId}`);
  return { ok: true };
}
