"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, Home, ListChecks, LogOut, Network, Settings, Tags, Upload, Users } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/login/actions";

const NAV = [
  { href: "/", label: "Home", icon: Home, exact: true },
  { href: "/accounts", label: "Accounts", icon: Building2 },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/canvas", label: "Canvas", icon: Network },
  { href: "/inferences", label: "Review", icon: ListChecks, badge: true },
  { href: "/tags", label: "Tags", icon: Tags },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/admin", label: "Admin", icon: Settings },
];

export function AppNav({ email, pendingCount = 0 }: { email: string; pendingCount?: number }) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <Link href="/" className="flex items-center gap-2 px-4 py-4">
        <Logo />
        <span className="text-sm font-semibold tracking-tight">Spheres of Influence</span>
      </Link>
      <nav className="flex flex-1 flex-col gap-0.5 px-2">
        {NAV.map(({ href, label, icon: Icon, exact, badge }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                active && "bg-sidebar-accent text-sidebar-accent-foreground",
              )}
            >
              <Icon className={cn("size-4", active && "text-primary")} />
              {label}
              {badge && pendingCount > 0 && (
                <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <div className="truncate text-xs text-muted-foreground" title={email}>
          {email}
        </div>
        <form
          action={async () => {
            await signOut();
            router.push("/login");
          }}
        >
          <button className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <LogOut className="size-3.5" /> Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
