/**
 * One chat turn: send the conversation to the model, execute the tools it
 * calls against the workspace, and loop until it answers. Every record a tool
 * returns becomes a citation chip on the answer, in first-use order.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { aiChat, type ChatContentBlock, type ChatMessage, type ChatToolSpec } from "@/lib/ai/client";
import { CHAT_TOOLS, executeChatTool, type ChatRecord } from "@/lib/chat/tools";

export type ChatTurnResult = { answer: string; citations: ChatRecord[] };

const MAX_ROUNDS = 6;

/** Collects records in first-use order, deduped by type+id. */
function collectRecords(seen: Map<string, ChatRecord>, records: ChatRecord[]) {
  for (const r of records) {
    const key = `${r.type}:${r.id}`;
    if (!seen.has(key)) seen.set(key, r);
  }
}

export async function runChatTurn(opts: {
  supabase: SupabaseClient;
  model: string;
  system: string;
  /** The conversation so far, ending with the new user question. */
  messages: ChatMessage[];
  tools?: ChatToolSpec[];
  maxRounds?: number;
  /** Injectable for tests; defaults to the real transport. */
  transport?: typeof aiChat;
  /** Injectable for tests; defaults to the workspace executor. */
  executor?: (name: string, input: Record<string, unknown>) => Promise<{ data: unknown; records: ChatRecord[] }>;
}): Promise<ChatTurnResult> {
  const transport = opts.transport ?? aiChat;
  const executor = opts.executor ?? ((name, input) => executeChatTool(opts.supabase, name, input));
  const tools = opts.tools ?? CHAT_TOOLS;
  const maxRounds = opts.maxRounds ?? MAX_ROUNDS;

  const messages = [...opts.messages];
  const seen = new Map<string, ChatRecord>();

  for (let round = 0; round < maxRounds; round++) {
    const res = await transport({ model: opts.model, system: opts.system, messages, tools });

    if (!res.toolUses.length) {
      return { answer: res.text.trim() || "I don't have that.", citations: [...seen.values()] };
    }

    // Echo the assistant's blocks back exactly, then answer each tool call.
    messages.push({ role: "assistant", content: res.blocks });
    const results: ChatContentBlock[] = [];
    for (const t of res.toolUses) {
      let payload: unknown;
      let isError = false;
      try {
        const out = await executor(t.name, t.input ?? {});
        payload = out.data;
        collectRecords(seen, out.records);
      } catch (e) {
        payload = { error: e instanceof Error ? e.message : "The tool failed." };
        isError = true;
      }
      results.push({
        type: "tool_result",
        tool_use_id: t.id,
        content: JSON.stringify(payload).slice(0, 100_000),
        ...(isError ? { is_error: true } : {}),
      });
    }
    messages.push({ role: "user", content: results });
  }

  throw new Error("The assistant kept calling tools without answering. Try rephrasing the question.");
}
