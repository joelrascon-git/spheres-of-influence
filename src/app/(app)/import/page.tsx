import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { UploadForm } from "./upload-form";

type Batch = {
  id: string;
  file_name: string | null;
  export_date: string;
  status: string;
  stats: Record<string, number>;
  created_at: string;
  applied_at: string | null;
};

const STATUS_STYLE: Record<string, string> = {
  review: "border-primary/40 bg-primary/10 text-primary",
  processing: "border-yellow-500/40 bg-yellow-500/10 text-yellow-400",
  applying: "border-blue-500/40 bg-blue-500/10 text-blue-400",
  applied: "border-green-500/40 bg-green-500/10 text-green-400",
  discarded: "border-foreground/20 text-muted-foreground",
};

export default async function ImportPage() {
  const { supabase } = await requireUser();
  const { data: batches } = await supabase
    .from("import_batches")
    .select("id, file_name, export_date, status, stats, created_at, applied_at")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="flex h-screen flex-col">
      <PageHeader
        title="Import"
        description="Bring in Evaboot exports. Rows are matched to existing contacts; you review every change before it lands."
      />
      <div className="space-y-6 px-6 py-4">
        <UploadForm />

        <section>
          <h2 className="mb-2 text-sm font-semibold">Recent imports</h2>
          {(batches ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No imports yet.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {(batches as Batch[]).map((b) => (
                <li key={b.id}>
                  <Link href={`/import/${b.id}`} className="flex items-center gap-3 px-3 py-2 hover:bg-accent/50">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {b.file_name ?? "Untitled"}
                    </span>
                    <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                      exported {format(parseISO(b.export_date), "MMM d, yyyy")}
                    </span>
                    {b.status === "applied" ? (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        applied {b.applied_at ? format(parseISO(b.applied_at), "MMM d") : ""}
                      </span>
                    ) : null}
                    {b.stats && Object.keys(b.stats).length > 0 && (
                      <span className="hidden shrink-0 text-xs text-muted-foreground md:block">
                        {Object.entries(b.stats)
                          .map(([k, v]) => `${v} ${k}`)
                          .join(" · ")}
                      </span>
                    )}
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${STATUS_STYLE[b.status] ?? ""}`}
                    >
                      {b.status === "review" ? "needs review" : b.status}
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
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
