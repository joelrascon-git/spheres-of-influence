import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { NotesPanel } from "@/app/(app)/contacts/[id]/contact-panels";
import { requireUser } from "@/lib/auth";
import { getFieldDefs, listAccounts, listOrgs } from "@/lib/data";
import type { Account, Note, Org } from "@/lib/types";
import {
  AccountFactsPanel,
  AccountNameEdit,
  DeleteAccountButton,
  OrgsPanel,
  StructurePanel,
  WhysPanel,
} from "../account-editor";

export default async function AccountPage({ params }: PageProps<"/accounts/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();

  const { data: accountData } = await supabase.from("accounts").select("*").eq("id", id).maybeSingle();
  const account = accountData as Account | null;
  if (!account) notFound();

  const [accounts, orgs, fields, notes, contactRows] = await Promise.all([
    listAccounts(supabase),
    listOrgs(supabase, [id]),
    getFieldDefs(supabase, "account"),
    supabase.from("notes").select("*").eq("account_id", id).order("created_at", { ascending: false }),
    supabase.from("contacts").select("org_id").eq("account_id", id),
  ]);

  const contactCounts: Record<string, number> = {};
  for (const r of (contactRows.data ?? []) as { org_id: string | null }[]) {
    const key = r.org_id ?? "";
    contactCounts[key] = (contactCounts[key] ?? 0) + 1;
  }
  const contactTotal = (contactRows.data ?? []).length;

  return (
    <div className="min-h-screen">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Link href="/accounts" className="mr-1 text-muted-foreground hover:text-foreground" aria-label="Back to accounts">
              <ArrowLeft className="size-4" />
            </Link>
            <AccountNameEdit account={account} />
          </span>
        }
        description={
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            {account.domain && (
              <a
                href={account.website ?? `https://${account.domain}`}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                {account.domain}
              </a>
            )}
            {account.industry && <span className="text-muted-foreground">{account.industry}</span>}
            {account.employee_count != null && (
              <span className="text-muted-foreground">{account.employee_count.toLocaleString()} employees</span>
            )}
            {account.engineer_count != null && (
              <span className="text-muted-foreground">{account.engineer_count.toLocaleString()} engineers</span>
            )}
            {account.hq && <span className="text-muted-foreground">{account.hq}</span>}
          </span>
        }
        actions={
          <>
            <Link
              href={`/contacts?account=${account.id}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
            >
              <Users className="size-3.5" /> {contactTotal.toLocaleString()} contacts
            </Link>
            <DeleteAccountButton account={account} />
          </>
        }
      />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 p-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <StructurePanel account={account} accounts={accounts} />
          <OrgsPanel account={account} orgs={orgs as Org[]} contactCounts={contactCounts} />
          <NotesPanel target={{ account_id: account.id }} notes={(notes.data ?? []) as Note[]} />
        </div>
        <div className="space-y-4">
          <WhysPanel account={account} />
          <AccountFactsPanel account={account} fields={fields} />
        </div>
      </div>
    </div>
  );
}
