import { AppNav } from "@/components/app-nav";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { user } = await requireUser();
  return (
    <div className="flex min-h-screen">
      <AppNav email={user.email ?? ""} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
