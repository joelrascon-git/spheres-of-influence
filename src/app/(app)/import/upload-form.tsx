"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { startImport } from "./actions";

export function UploadForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <form
      className="space-y-3 rounded-lg border bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        start(async () => {
          const r = await startImport(fd);
          if (!r.ok || !r.data) {
            toast.error(r.ok ? "Planned, but couldn't open the review." : r.error);
            return;
          }
          form.reset();
          setFileName(null);
          router.push(`/import/${r.data.batchId}`);
        });
      }}
    >
      <div className="flex items-center gap-2">
        <FileSpreadsheet className="size-4 text-muted-foreground" />
        <p className="text-sm font-medium">Evaboot CSV export</p>
      </div>
      <p className="text-xs text-muted-foreground">
        Drag the file in or browse. Required columns: First Name, Last Name. Everything else —
        LinkedIn IDs, tenure, emails, company facts — is detected. The export date is read from the
        file name (e.g. <span className="font-mono">carvana_leads_8_24_2026.csv</span>) so tenure
        stays accurate.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted">
          <Upload className="size-3.5" />
          {fileName ?? "Choose CSV…"}
          <input
            type="file"
            name="file"
            accept=".csv,text/csv"
            required
            className="sr-only"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
        </label>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" /> Reading and matching…
            </>
          ) : (
            "Plan import"
          )}
        </Button>
        {pending && (
          <span className="text-xs text-muted-foreground">
            Matching against existing contacts. Large files can take a minute.
          </span>
        )}
      </div>
    </form>
  );
}
