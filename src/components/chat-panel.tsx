"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, MessageSquare, SendHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { sendChatMessage } from "@/app/(app)/chat/actions";
import type { ChatRecord } from "@/lib/chat/tools";

type Msg = { role: "user" | "assistant"; content: string; citations?: ChatRecord[] };

function CitationChip({ record }: { record: ChatRecord }) {
  const href = record.type === "contact" ? `/contacts/${record.id}` : record.type === "account" ? `/accounts/${record.id}` : null;
  const cls =
    "inline-flex max-w-56 shrink-0 items-center truncate rounded-full border bg-muted px-2 py-0.5 text-[11px] text-foreground hover:underline";
  return href ? (
    <Link href={href} className={cls} title={record.name}>
      {record.name}
    </Link>
  ) : (
    <span className={cls} title={record.name}>
      {record.name}
    </span>
  );
}

/** The second-brain chat: questions answered from workspace data, with citation chips. */
export function ChatPanel({ suggested = [], className }: { suggested?: string[]; className?: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, start] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pending]);

  const ask = (question: string) => {
    const q = question.trim();
    if (!q || pending) return;
    setInput("");
    start(async () => {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      setMessages((prev) => [...prev, { role: "user", content: q }]);
      const r = await sendChatMessage(history, q);
      if (!r.ok || !r.data) {
        toast.error(r.ok ? "The assistant returned an empty answer." : r.error);
        setMessages((prev) => prev.slice(0, -1));
        setInput(q);
        return;
      }
      setMessages((prev) => [...prev, { role: "assistant", content: r.data!.answer, citations: r.data!.citations }]);
    });
  };

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-1">
        {messages.length === 0 && suggested.length > 0 && (
          <div className="space-y-2 py-6 text-center">
            <p className="text-sm text-muted-foreground">Ask your second brain:</p>
            {suggested.map((s) => (
              <button
                key={s}
                onClick={() => ask(s)}
                className="block w-full rounded-lg border bg-card px-3 py-2 text-left text-sm hover:border-primary/40 hover:bg-accent/30"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[85%] space-y-1.5", m.role === "user" && "text-right")}>
              <div
                className={cn(
                  "inline-block whitespace-pre-wrap rounded-lg px-3 py-2 text-left text-sm leading-relaxed",
                  m.role === "user" ? "bg-primary text-primary-foreground" : "border bg-card",
                )}
              >
                {m.content}
              </div>
              {m.role === "assistant" && m.citations && m.citations.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground/70">cited</span>
                  {m.citations.map((c) => (
                    <CitationChip key={`${c.type}:${c.id}`} record={c} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {pending && (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Checking the workspace…
            </div>
          </div>
        )}
      </div>

      <form
        className="flex items-end gap-2 border-t pt-3"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              ask(input);
            }
          }}
          rows={2}
          maxLength={8000}
          placeholder="Ask about people, accounts, initiatives, signals…"
          className="min-h-10 flex-1 resize-none rounded-lg border border-border bg-background p-2 text-sm"
        />
        <Button type="submit" size="sm" disabled={pending || !input.trim()}>
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <SendHorizontal className="size-3.5" />}
        </Button>
      </form>
    </div>
  );
}

/** Floating chat available on every page; opens the same panel in a side sheet. */
export function ChatDock() {
  return (
    <Sheet>
      <SheetTrigger
        className="fixed bottom-5 right-5 z-40 inline-flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
        title="Ask your second brain"
      >
        <MessageSquare className="size-5" />
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-4 sm:max-w-md">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-sm font-semibold">Second brain</SheetTitle>
          <p className="text-xs text-muted-foreground">
            Answers from your workspace, with citations. Says “I don&rsquo;t have that” when nothing is stored.
          </p>
        </SheetHeader>
        <ChatPanel className="min-h-0 flex-1" />
      </SheetContent>
    </Sheet>
  );
}
