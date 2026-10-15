import Link from "next/link";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { QuickAddTask, TaskRow } from "@/components/task-bits";
import { requireUser } from "@/lib/auth";
import type { Opportunity, QualificationItem, Task } from "@/lib/types";
import { AddElementForm, DeleteOpportunityButton, HiddenItemRow, ItemCard, OppHeaderForm, type EvidenceRow } from "./opportunity-bits";

export default async function OpportunityPage({ params }: PageProps<"/opportunities/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();

  const { data: oppRow } = (await supabase.from("opportunities").select("*").eq("id", id).maybeSingle()) as {
    data: Opportunity | null;
  };
  if (!oppRow) notFound();
  const opp = oppRow;

  const [accountRes, itemRows, contactRows, taskRows] = await Promise.all([
    supabase.from("accounts").select("id, name").eq("id", opp.account_id).maybeSingle(),
    supabase.from("qualification_items").select("*").eq("opportunity_id", id).order("sort_order"),
    supabase.from("contacts").select("id, full_name, title").eq("account_id", opp.account_id).order("full_name").limit(500),
    supabase
      .from("tasks")
      .select("*")
      .eq("opportunity_id", id)
      .neq("status", "dismissed")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(30),
  ]);

  // Evidence needs the item ids first, so it follows the items query.
  const { data: evidenceRows } = await supabase
    .from("qualification_evidence")
    .select("id, item_id, contact_id, note, created_at, contacts(full_name)")
    .in("item_id", ((itemRows.data ?? []) as { id: string }[]).map((r) => r.id))
    .order("created_at", { ascending: false });

  const account = accountRes.data as { id: string; name: string } | null;
  const items = (itemRows.data ?? []) as QualificationItem[];
  const contacts = (contactRows.data ?? []).map((c) => ({
    id: c.id as string,
    name: c.title ? `${c.full_name} · ${c.title}` : (c.full_name as string),
  }));

  const evidenceByItem = new Map<string, EvidenceRow[]>();
  for (const e of (evidenceRows ?? []) as unknown as {
    id: string;
    item_id: string;
    contact_id: string | null;
    note: string;
    created_at: string;
    contacts: { full_name: string } | null;
  }[]) {
    const list = evidenceByItem.get(e.item_id) ?? [];
    list.push({
      id: e.id,
      note: e.note,
      contact_id: e.contact_id,
      contact_name: e.contacts?.full_name ?? null,
      created_at: e.created_at,
    });
    evidenceByItem.set(e.item_id, list);
  }

  const visible = items.filter((i) => !i.hidden);
  const hidden = items.filter((i) => i.hidden);
  const tasks = (taskRows.data ?? []) as Task[];
  const openTasks = tasks.filter((t) => t.status === "open");
  const doneTasks = tasks.filter((t) => t.status === "done");
  const validated = visible.filter((i) => i.status === "validated").length;

  return (
    <div className="min-h-screen">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Link href={`/accounts/${opp.account_id}`} className="mr-1 text-muted-foreground hover:text-foreground" aria-label="Back to account">
              <ArrowLeft className="size-4" />
            </Link>
            {opp.name}
          </span>
        }
        description={
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            {account && (
              <Link href={`/accounts/${account.id}`} className="text-primary hover:underline">
                {account.name}
              </Link>
            )}
            <span className="rounded bg-accent px-1.5 py-0.5 text-xs text-accent-foreground">{opp.status}</span>
            {opp.amount != null && <span className="text-muted-foreground">{opp.amount.toLocaleString()}</span>}
            {opp.close_date && <span className="text-muted-foreground">closes {format(parseISO(opp.close_date), "MMM d, yyyy")}</span>}
            <span className="text-muted-foreground">
              {validated}/{visible.length} elements validated
            </span>
          </span>
        }
        actions={<DeleteOpportunityButton opportunityId={opp.id} name={opp.name} />}
      />

      <div className="mx-auto max-w-7xl space-y-4 p-4">
        <section className="rounded-lg border bg-card p-4">
          <OppHeaderForm opportunity={opp} />
        </section>

        <div className="grid gap-4 lg:grid-cols-3">
          <section className="space-y-3 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Qualification board</h2>
              <span className="text-xs text-muted-foreground">
                Rename, hide or add elements — this board belongs to the deal, not the template.
              </span>
            </div>
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {visible.map((item) => (
                <ItemCard key={item.id} item={item} evidence={evidenceByItem.get(item.id) ?? []} contacts={contacts} />
              ))}
            </ul>
            {hidden.length > 0 && (
              <div className="space-y-1 rounded-lg border border-dashed p-3">
                <p className="text-xs font-medium text-muted-foreground">Hidden on this deal</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {hidden.map((h) => (
                    <HiddenItemRow key={h.id} item={h} />
                  ))}
                </div>
              </div>
            )}
            <AddElementForm opportunityId={opp.id} />
          </section>

          <section className="space-y-3 rounded-lg border bg-card p-4">
            <h2 className="text-sm font-semibold">Tasks ({openTasks.length} open)</h2>
            <ul className="divide-y">
              {openTasks.map((t) => (
                <TaskRow key={t.id} id={t.id} title={t.title} due={t.due_date ? format(parseISO(t.due_date), "MMM d") : null} />
              ))}
              {openTasks.length === 0 && <li className="py-1.5 text-sm text-muted-foreground">No open tasks.</li>}
            </ul>
            <QuickAddTask accountId={opp.account_id} opportunityId={opp.id} />
            {doneTasks.length > 0 && (
              <details className="pt-1">
                <summary className="cursor-pointer text-xs font-medium text-muted-foreground">Done ({doneTasks.length})</summary>
                <ul className="divide-y">
                  {doneTasks.map((t) => (
                    <TaskRow key={t.id} id={t.id} title={t.title} done due={t.due_date ? format(parseISO(t.due_date), "MMM d") : null} />
                  ))}
                </ul>
              </details>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
