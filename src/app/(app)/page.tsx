import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ContactAvatar } from "@/components/contact-bits";
import { QuickAddTask, TaskRow } from "@/components/task-bits";
import { SignalCard } from "@/components/signal-bits";
import { requireUser } from "@/lib/auth";
import type { Signal, Task } from "@/lib/types";

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/30"
    >
      <p className="text-2xl font-semibold tracking-tight">{value.toLocaleString()}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </Link>
  );
}

export default async function HomePage() {
  const { supabase, user } = await requireUser();

  const [accounts, contacts, keyContacts, noOrg, batches, recent, activity, openTasks, pendingInferences, signalRows] = await Promise.all([
    supabase.from("accounts").select("id", { count: "exact", head: true }),
    supabase.from("contacts").select("id", { count: "exact", head: true }),
    supabase.from("contacts").select("id", { count: "exact", head: true }).eq("is_key", true),
    supabase.from("contacts").select("id", { count: "exact", head: true }).or("org_id.is.null"),
    supabase
      .from("import_batches")
      .select("id, file_name, created_at, status")
      .in("status", ["review", "processing"])
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("contacts")
      .select("id, full_name, title, avatar_path, updated_at")
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase.from("activity_log").select("entity, action, source, created_at").order("created_at", { ascending: false }).limit(10),
    supabase
      .from("tasks")
      .select("id, title, due_date")
      .eq("status", "open")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(8),
    supabase.from("inferences").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("signals")
      .select("*, accounts(id, name)")
      .eq("status", "new")
      .order("relevance", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const tasks = (openTasks.data ?? []) as Pick<Task, "id" | "title" | "due_date">[];
  const signals = (signalRows.data ?? []) as unknown as (Signal & { accounts: { id: string; name: string } | null })[];
  const dueLabel = (d: string | null) => {
    if (!d) return null;
    const due = parseISO(d);
    return due < new Date() ? `overdue · ${format(due, "MMM d")}` : format(due, "MMM d");
  };

  const n = (r: { count: number | null }) => r.count ?? 0;
  const totalContacts = n(contacts);
  const greeting = user.email?.split("@")[0] ?? "there";

  return (
    <div className="min-h-screen">
      <PageHeader
        title={`Welcome back, ${greeting}`}
        description="Your accounts, the people in them, and the influence that actually decides deals."
      />

      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Accounts" value={n(accounts)} href="/accounts" />
          <Stat label="Contacts" value={totalContacts} href="/contacts" />
          <Stat label="Key contacts" value={n(keyContacts)} href="/contacts?key=1" />
          <Stat label="Contacts without an org" value={n(noOrg)} href="/contacts?noorg=1" />
        </div>

        {totalContacts === 0 && (
          <div className="rounded-lg border border-dashed p-10 text-center">
            <p className="text-sm font-medium">Start with an Evaboot export</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Export your leads list from Evaboot (CSV), then import it here. Accounts, orgs and live
              tenure are built for you; you curate the influence map on top.
            </p>
            <Link
              href="/import"
              className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80"
            >
              Import a CSV <ArrowRight className="size-3.5" />
            </Link>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {signals.length > 0 && (
              <section className="rounded-lg border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold">Today — new signals</h2>
                  <span className="text-xs text-muted-foreground">Link them, fold them into the hypothesis, make them a task, or dismiss.</span>
                </div>
                <ul className="mt-1 divide-y">
                  {signals.map((s) => (
                    <SignalCard key={s.id} signal={s} account={s.accounts ? { id: s.accounts.id, name: s.accounts.name } : null} />
                  ))}
                </ul>
              </section>
            )}

            <section className="rounded-lg border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">Today — tasks</h2>
                {(pendingInferences.count ?? 0) > 0 && (
                  <Link href="/inferences" className="text-xs text-primary hover:underline">
                    Review queue: {pendingInferences.count} waiting
                  </Link>
                )}
              </div>
              {tasks.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">No open tasks. Ingested next steps land here.</p>
              ) : (
                <ul className="mt-1 divide-y">
                  {tasks.map((t) => (
                    <TaskRow key={t.id} id={t.id} title={t.title} due={dueLabel(t.due_date)} />
                  ))}
                </ul>
              )}
              <div className="pt-2">
                <QuickAddTask />
              </div>
            </section>

            {(batches.data ?? []).length > 0 && (
              <section className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <h2 className="text-sm font-semibold">Imports waiting for review</h2>
                <ul className="mt-2 space-y-1.5">
                  {(batches.data ?? []).map((b) => (
                    <li key={b.id}>
                      <Link href={`/import/${b.id}`} className="flex items-center gap-2 text-sm hover:underline">
                        <span className="truncate font-medium">{b.file_name ?? "Untitled file"}</span>
                        <span className="text-xs text-muted-foreground">
                          {b.status === "processing" ? "processing…" : `ready since ${format(parseISO(b.created_at), "MMM d")}`}
                        </span>
                        <ArrowRight className="ml-auto size-3.5 text-primary" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="rounded-lg border bg-card p-4">
              <h2 className="text-sm font-semibold">Recently touched</h2>
              {(recent.data ?? []).length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Nothing yet — import a CSV to get started.</p>
              ) : (
                <ul className="mt-2 divide-y">
                  {(recent.data ?? []).map((c) => (
                    <li key={c.id}>
                      <Link href={`/contacts/${c.id}`} className="flex items-center gap-2.5 py-1.5 hover:bg-accent/40">
                        <ContactAvatar name={c.full_name} path={c.avatar_path} size={24} />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{c.full_name}</span>
                        {c.title && <span className="hidden min-w-0 flex-1 truncate text-xs text-muted-foreground md:block">{c.title}</span>}
                        <span className="shrink-0 text-xs text-muted-foreground">{format(parseISO(c.updated_at), "MMM d")}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="space-y-4">
            <div className="rounded-lg border bg-card p-4">
              <h2 className="text-sm font-semibold">Where things live</h2>
              <ul className="mt-2 space-y-2 text-sm">
                {[
                  ["/contacts", "Contacts", "Boolean search across every profile, note and tag."],
                  ["/accounts", "Accounts", "Subsidiaries, orgs and the three whys."],
                  ["/tags", "Tags", "Slices of your people, with a reason for each."],
                  ["/import", "Import", "Evaboot CSVs with match review and diffs."],
                  ["/admin", "Admin", "Fields, picklists, style rules and AI prompts."],
                ].map(([href, label, desc]) => (
                  <li key={href}>
                    <Link href={href} className="group flex items-start gap-2">
                      <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                      <span>
                        <span className="font-medium group-hover:underline">{label}</span>
                        <span className="block text-xs text-muted-foreground">{desc}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {(activity.data ?? []).length > 0 && (
              <div className="rounded-lg border bg-card p-4">
                <h2 className="text-sm font-semibold">Activity</h2>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {(activity.data ?? []).map((a, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="shrink-0">{format(parseISO(a.created_at), "MMM d")}</span>
                      <span className="min-w-0 flex-1">
                        {a.action} on {a.entity}
                        {a.source !== "manual" && <span className="ml-1 rounded bg-accent px-1">{a.source}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
