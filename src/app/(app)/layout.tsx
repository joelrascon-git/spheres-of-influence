import { AppNav } from "@/components/app-nav";
import { ChatDock } from "@/components/chat-panel";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { supabase, user } = await requireUser();
  // The review-queue badge: one cheap count per page load keeps the queue visible.
  const { count: pendingCount } = await supabase
    .from("inferences")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  return (
    <div className="flex min-h-screen">
      <AppNav email={user.email ?? ""} pendingCount={pendingCount ?? 0} />
      <main className="min-w-0 flex-1">{children}</main>
      <ChatDock />
    </div>
  );
}
