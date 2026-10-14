import Link from "next/link";
import { format } from "date-fns";
import { FileText } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { listAccounts } from "@/lib/data";
import { aiConfigured } from "@/lib/ai/client";
import { CALL_TYPE_LABELS, type CallType } from "@/lib/ingest/extract";
import { IngestForm } from "./ingest-form";

const callTypeLabel = (t: string) =>
  CALL_TYPE_LABELS[t as CallType] ?? (t === "unknown" ? "Unclassified" : "Call");

export default async function IngestPage({ searchParams }: PageProps<"/ingest">) {
  const { supabase } = await requireUser();
  const params = (await searchParams) as Record<string, string | string[] | undefined>;
  const preselect = typeof params.account === "string" ? params.account : "";

  const [accounts, docRows] = await Promise.all([
    listAccounts(supabase),
    supabase
      .from("documents")
      .select("id, account_id, title, call_type, status, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const docs = (docRows.data ?? []) as {
    id: string;
    account_id: string;
    title: string;
    call_type: string;
    status: string;
    created_at: string;
  }[];
  const accountNames = new Map(accounts.map((a) => [a.id, a.name]));

  return (
    <div className="flex min-h-screen flex-col">
      <PageHeader
        title="Ingest"
        description="Paste a call transcript, voice note or free-form notes. The call type is detected, notes are generated under your rules, and every change is proposed for review."
      />
      <div className="space-y-6 px-6 py-6">
        {accounts.length === 0 ? (
          <EmptyState
            title="No accounts yet"
            description="Create an account first — ingestion attaches its notes and proposals to one."
          />
        ) : (
          <IngestForm
            accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
            preselect={preselect}
            aiReady={aiConfigured()}
          />
        )}

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">Recent sources</h2>
          {docs.length === 0 ? (
            <EmptyState
              title="Nothing ingested yet"
              description="Pasted sources, their generated notes and their review columns live here after you ingest."
            />
          ) : (
            <ul className="divide-y rounded-lg border">
              {docs.map((d) => (
                <li key={d.id}>
                  <Link href={`/ingest/${d.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-muted/50">
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{d.title}</span>
                    <span className="text-xs text-muted-foreground">{accountNames.get(d.account_id) ?? "—"}</span>
                    <span className="rounded bg-accent px-1.5 py-0.5 text-[11px] text-accent-foreground">
                      {callTypeLabel(d.call_type)}
                    </span>
                    {d.status === "failed" && (
                      <span className="rounded border border-red-500/40 bg-red-500/10 px-1.5 py-0.5 text-[11px] text-red-400">
                        Failed
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{format(new Date(d.created_at), "MMM d, HH:mm")}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
