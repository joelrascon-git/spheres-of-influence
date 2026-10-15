import { PageHeader } from "@/components/page-header";
import { ChatPanel } from "@/components/chat-panel";

/** The full-page chat; the same panel floats on every page via the dock. */
export default function ChatPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PageHeader
        title="Chat"
        description="Ask your second brain. Every answer comes from the workspace and cites the records it used; anything not stored gets a plain “I don’t have that.”"
      />
      <div className="mx-auto w-full max-w-3xl flex-1 p-4">
        <div className="flex h-[calc(100vh-13rem)] min-h-96 flex-col rounded-lg border bg-card p-4">
          <ChatPanel
            className="min-h-0 flex-1"
            suggested={[
              "Who influences the VP of Platform, and what did they say about Copilot?",
              "What is my working hypothesis for AmEx, and what supports it?",
              "Which initiatives at AmEx are the strongest Factory fit?",
              "What signals came in for AmEx lately?",
            ]}
          />
        </div>
      </div>
    </div>
  );
}
