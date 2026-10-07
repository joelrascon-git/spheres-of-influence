import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { listAccounts } from "@/lib/data";
import { AccountsTable, NewAccountButton } from "./account-editor";

export default async function AccountsPage() {
  const { supabase } = await requireUser();
  const accounts = await listAccounts(supabase);

  return (
    <div className="flex h-screen flex-col">
      <PageHeader
        title="Accounts"
        description="Parent companies and their subsidiaries. One org chart lives under each account."
        actions={<NewAccountButton />}
      />
      <AccountsTable accounts={accounts} />
    </div>
  );
}
