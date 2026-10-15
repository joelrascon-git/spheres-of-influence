import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChatContentBlock } from "@/lib/ai/client";
import { runChatTurn } from "@/lib/chat/turn";
import { CHAT_TOOLS, filterWords, htmlSnippet } from "@/lib/chat/tools";

const supabase = {} as SupabaseClient;
const base = { supabase, model: "claude-opus-5-5", system: "sys", messages: [{ role: "user", content: "q" }] as never[] };

describe("runChatTurn", () => {
  it("returns a direct answer without tools", async () => {
    const transport = vi.fn().mockResolvedValue({ text: "Brian Secrest is your champion.", toolUses: [], blocks: [] });
    const r = await runChatTurn({ ...base, transport, executor: vi.fn() });
    expect(r).toEqual({ answer: "Brian Secrest is your champion.", citations: [] });
    expect(transport).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls[0][0].messages).toEqual([{ role: "user", content: "q" }]);
  });

  it("executes tools, feeds results back, and cites the records used", async () => {
    const transport = vi
      .fn()
      .mockResolvedValueOnce({
        text: "",
        toolUses: [{ id: "t1", name: "search_entities", input: { query: "vp of platform" } }],
        blocks: [{ type: "tool_use", id: "t1", name: "search_entities", input: { query: "vp of platform" } }],
      })
      .mockResolvedValueOnce({ text: "Ravi's influencers are…", toolUses: [], blocks: [] });
    const executor = vi.fn().mockResolvedValue({
      data: { people: [{ id: "p1", name: "Ravi Radhakrishnan" }] },
      records: [
        { type: "contact", id: "p1", name: "Ravi Radhakrishnan" },
        { type: "account", id: "a1", name: "AmEx" },
        { type: "contact", id: "p1", name: "Ravi Radhakrishnan" },
      ],
    });

    const r = await runChatTurn({ ...base, transport, executor });

    expect(executor).toHaveBeenCalledWith("search_entities", { query: "vp of platform" });
    expect(r.answer).toBe("Ravi's influencers are…");
    expect(r.citations).toEqual([
      { type: "contact", id: "p1", name: "Ravi Radhakrishnan" },
      { type: "account", id: "a1", name: "AmEx" },
    ]);

    // The second transport call carries the assistant tool_use plus the tool_result.
    const second = transport.mock.calls[1][0].messages as { role: string; content: string | ChatContentBlock[] }[];
    expect(second).toHaveLength(3);
    expect(second[1].role).toBe("assistant");
    const results = second[2].content as ChatContentBlock[];
    expect(second[2].role).toBe("user");
    expect(results[0]).toMatchObject({ type: "tool_result", tool_use_id: "t1" });
    expect(JSON.parse((results[0] as { content: string }).content)).toEqual({ people: [{ id: "p1", name: "Ravi Radhakrishnan" }] });
  });

  it("keeps going when a tool fails, marking the result as an error", async () => {
    const transport = vi
      .fn()
      .mockResolvedValueOnce({
        text: "",
        toolUses: [{ id: "t1", name: "get_person", input: { contact_id: "nope" } }],
        blocks: [{ type: "tool_use", id: "t1", name: "get_person", input: { contact_id: "nope" } }],
      })
      .mockResolvedValueOnce({ text: "I don't have that.", toolUses: [], blocks: [] });
    const executor = vi.fn().mockRejectedValue(new Error("No person with that id."));

    const r = await runChatTurn({ ...base, transport, executor });
    expect(r.answer).toBe("I don't have that.");
    expect(r.citations).toEqual([]);

    const results = (transport.mock.calls[1][0].messages as { role: string; content: ChatContentBlock[] }[])[2].content;
    expect(results[0]).toMatchObject({ type: "tool_result", tool_use_id: "t1", is_error: true });
    expect(JSON.parse((results[0] as { content: string }).content)).toEqual({ error: "No person with that id." });
  });

  it("stops a model that never answers", async () => {
    const roundTrip = {
      text: "",
      toolUses: [{ id: "t", name: "pending_inferences", input: {} }],
      blocks: [{ type: "tool_use", id: "t", name: "pending_inferences", input: {} }],
    };
    const transport = vi.fn().mockResolvedValue(roundTrip);
    const executor = vi.fn().mockResolvedValue({ data: {}, records: [] });
    await expect(runChatTurn({ ...base, transport, executor, maxRounds: 3 })).rejects.toThrow(/without answering/);
    expect(transport).toHaveBeenCalledTimes(3);
  });
});

describe("chat tool surface", () => {
  it("exposes unique, schema'd tools", () => {
    const names = CHAT_TOOLS.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
    for (const t of CHAT_TOOLS) {
      expect(t.description.length).toBeGreaterThan(10);
      expect(t.input_schema).toMatchObject({ type: "object" });
    }
    expect(names).toContain("search_entities");
    expect(names).toContain("graph_neighbors");
    expect(names).toContain("search_knowledge");
  });

  it("filters keywords safely for ilike filters", () => {
    expect(filterWords("Who's the VP of Platform? (a,b)")).toEqual(["who", "the", "platform"]);
    expect(filterWords("")).toEqual([]);
  });

  it("snippets html around the first keyword hit", () => {
    const html = "<p>start</p><p>lorem ipsum " + "x".repeat(600) + " Copilot budget</p>";
    const snippet = htmlSnippet(html, ["copilot"]);
    expect(snippet).toContain("Copilot");
    expect(snippet.startsWith("…") || snippet.startsWith("start")).toBe(true);
    expect(snippet.length).toBeLessThan(700);
  });
});
