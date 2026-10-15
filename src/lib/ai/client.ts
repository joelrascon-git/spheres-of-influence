/**
 * Minimal Anthropic Messages API client over fetch: one endpoint, no SDK. The
 * workspace's prompts table already carries the model choice and system text, so
 * this stays a thin transport. Features degrade to a clear "AI not configured"
 * state when ANTHROPIC_API_KEY is absent — checked by callers before use.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2023-06-01";

export class AiNotConfiguredError extends Error {
  constructor() {
    super("AI is not configured. Add ANTHROPIC_API_KEY to .env.local and restart the dev server.");
    this.name = "AiNotConfiguredError";
  }
}

/** The model answered, but the answer is not JSON; retrying a slice is cheaper than aborting. */
export class AiBadJsonError extends Error {
  constructor() {
    super("The model did not return valid JSON.");
    this.name = "AiBadJsonError";
  }
}

export function aiConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export type AiRequest = {
  model: string;
  system: string;
  /** The user turn: structured context for extraction prompts, prose for chat. */
  user: string;
  maxTokens?: number;
};

/** Strip fences and surrounding prose, then parse the first JSON object or array. */
export function extractJson(text: string): unknown {
  const stripped = text.replace(/```(?:json)?\s*/g, "");
  for (const candidate of [text, stripped]) {
    try {
      return JSON.parse(candidate);
    } catch {
      // fall through to brace scanning
    }
  }
  const first = stripped.search(/[{[]/);
  if (first >= 0) {
    const open = stripped[first];
    const close = open === "{" ? "}" : "]";
    const last = stripped.lastIndexOf(close);
    if (last > first) {
      try {
        return JSON.parse(stripped.slice(first, last + 1));
      } catch {
        // fall through
      }
    }
  }
  throw new AiBadJsonError();
}

/** One Messages API completion. Throws with the API's own error text on failure. */
export async function aiComplete(req: AiRequest): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new AiNotConfiguredError();

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": API_VERSION,
    },
    body: JSON.stringify({
      model: req.model,
      max_tokens: req.maxTokens ?? 4096,
      // temperature is deprecated on current Anthropic models; the API rejects it.
      system: req.system,
      messages: [{ role: "user", content: req.user }],
    }),
    // Long extractions still answer; a wedged request does not hang the action.
    signal: AbortSignal.timeout(120_000),
  }).catch((e: unknown) => {
    if (e instanceof Error && e.name === "TimeoutError")
      throw new Error("The model took too long to answer. Try again or use a smaller batch.");
    throw e;
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    const message = detail ? `${res.status}: ${detail.slice(0, 500)}` : `${res.status} ${res.statusText}`;
    throw new Error(`Anthropic API error — ${message}`);
  }
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = (data.content ?? [])
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("");
  if (!text) throw new Error("Anthropic API returned an empty response.");
  return text;
}

/** A completion whose response is expected to be JSON of shape T. */
export async function aiCompleteJson<T>(req: AiRequest): Promise<T> {
  return extractJson(await aiComplete(req)) as T;
}

/** One source the web-search tool actually fetched, for citation checks. */
export type WebSearchSource = { url: string; title: string };

/**
 * A completion with Anthropic's server-side web search tool enabled. Returns
 * the answer text plus every search result the model fetched, so callers can
 * enforce that claims cite a real source. maxSearches caps the cost per call.
 */
export async function aiCompleteWebSearch(
  req: AiRequest & { maxSearches?: number },
): Promise<{ text: string; sources: WebSearchSource[] }> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new AiNotConfiguredError();

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": API_VERSION,
    },
    body: JSON.stringify({
      model: req.model,
      max_tokens: req.maxTokens ?? 4096,
      system: req.system,
      messages: [{ role: "user", content: req.user }],
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: req.maxSearches ?? 5 }],
    }),
    signal: AbortSignal.timeout(120_000),
  }).catch((e: unknown) => {
    if (e instanceof Error && e.name === "TimeoutError")
      throw new Error("The model took too long to answer. Try again or use a smaller batch.");
    throw e;
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    const message = detail ? `${res.status}: ${detail.slice(0, 500)}` : `${res.status} ${res.statusText}`;
    throw new Error(`Anthropic API error — ${message}`);
  }
  const data = (await res.json()) as {
    content?: {
      type: string;
      text?: string;
      content?: { type: string; url?: string; title?: string }[];
    }[];
  };
  let text = "";
  const sources: WebSearchSource[] = [];
  for (const block of data.content ?? []) {
    if (block.type === "text") text += block.text ?? "";
    if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
      for (const r of block.content) {
        if (r.type === "web_search_result" && r.url) sources.push({ url: r.url, title: r.title ?? r.url });
      }
    }
  }
  if (!text) throw new Error("Anthropic API returned an empty response.");
  return { text, sources };
}

/**
 * The stored prompt for a key, with the code seed as fallback. Admin edits in the
 * Prompts tab take effect on the next feature run; nothing is cached.
 */
export async function getStoredPrompt(
  supabase: SupabaseClient,
  key: string,
): Promise<{ model: string; system_prompt: string }> {
  const { data } = await supabase.from("prompts").select("model, system_prompt").eq("key", key).maybeSingle();
  if (data?.system_prompt) {
    return { model: data.model as string, system_prompt: data.system_prompt as string };
  }
  throw new Error(`Prompt "${key}" is not seeded. Sign out and back in to reseed defaults.`);
}

// ───────────────────────── Chat with tools ─────────────────────────

/** A custom tool the chat model may call; this app executes it server-side. */
export type ChatToolSpec = { name: string; description: string; input_schema: Record<string, unknown> };

/** One block of a chat message; the tool_use/tool_result pair drives the tool loop. */
export type ChatContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean };

export type ChatMessage = { role: "user" | "assistant"; content: string | ChatContentBlock[] };

export type AiChatResult = {
  /** The text blocks joined; empty when the model only called tools. */
  text: string;
  toolUses: { id: string; name: string; input: Record<string, unknown> }[];
  /** Assistant content, minimal and safe to echo back for the next round. */
  blocks: ChatContentBlock[];
};

/** One Messages API turn over a full conversation, with optional custom tools. */
export async function aiChat(req: {
  model: string;
  system: string;
  messages: ChatMessage[];
  tools?: ChatToolSpec[];
  maxTokens?: number;
}): Promise<AiChatResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new AiNotConfiguredError();

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": API_VERSION,
    },
    body: JSON.stringify({
      model: req.model,
      max_tokens: req.maxTokens ?? 4096,
      system: req.system,
      messages: req.messages,
      ...(req.tools?.length ? { tools: req.tools } : {}),
    }),
    signal: AbortSignal.timeout(120_000),
  }).catch((e: unknown) => {
    if (e instanceof Error && e.name === "TimeoutError")
      throw new Error("The model took too long to answer. Try again or use a smaller batch.");
    throw e;
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    const message = detail ? `${res.status}: ${detail.slice(0, 500)}` : `${res.status} ${res.statusText}`;
    throw new Error(`Anthropic API error — ${message}`);
  }
  const data = (await res.json()) as { content?: { type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> }[] };
  let text = "";
  const toolUses: AiChatResult["toolUses"] = [];
  const blocks: ChatContentBlock[] = [];
  for (const b of data.content ?? []) {
    if (b.type === "text" && b.text) {
      text += b.text;
      blocks.push({ type: "text", text: b.text });
    } else if (b.type === "tool_use" && b.id && b.name) {
      const input = b.input ?? {};
      toolUses.push({ id: b.id, name: b.name, input });
      blocks.push({ type: "tool_use", id: b.id, name: b.name, input });
    }
  }
  return { text, toolUses, blocks };
}
