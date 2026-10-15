"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { aiConfigured, getStoredPrompt, type ChatMessage } from "@/lib/ai/client";
import { runChatTurn } from "@/lib/chat/turn";
import type { ChatRecord } from "@/lib/chat/tools";
import type { ActionResult } from "@/app/(app)/contacts/actions";

const historySchema = z
  .array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1).max(8000),
    }),
  )
  .max(30);

/** One chat turn: the conversation so far plus the new question, answered with citations. */
export async function sendChatMessage(
  history: unknown,
  question: string,
): Promise<ActionResult<{ answer: string; citations: ChatRecord[] }>> {
  const { supabase } = await requireUser();
  const parsedHistory = historySchema.safeParse(history);
  const q = z.string().min(1).max(8000).safeParse(question);
  if (!parsedHistory.success || !q.success) return { ok: false, error: "Write a question first." };
  if (!aiConfigured()) return { ok: false, error: "AI is not configured. Add ANTHROPIC_API_KEY to .env.local and retry." };

  let prompt;
  try {
    prompt = await getStoredPrompt(supabase, "chat_assistant");
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "The chat prompt is missing." };
  }

  const messages: ChatMessage[] = [
    ...parsedHistory.data.map((m) => ({ role: m.role, content: m.content }) as ChatMessage),
    { role: "user", content: q.data },
  ];

  try {
    const result = await runChatTurn({ supabase, model: prompt.model, system: prompt.system_prompt, messages });
    return { ok: true, data: result };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "The chat turn failed." };
  }
}
