import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mic, Network, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotesPanel } from "@/app/(app)/contacts/[id]/contact-panels";
import { requireUser } from "@/lib/auth";
import { getFieldDefs, listAccounts, listOrgs } from "@/lib/data";
import { ENTITY_TYPES } from "@/lib/constants";
import type { Account, Challenge, Initiative, Note, Opportunity, Org, ResearchDoc } from "@/lib/types";
import {
  AccountFactsPanel,
  AccountNameEdit,
  DeleteAccountButton,
  OrgsPanel,
  StructurePanel,
  WhysPanel,
} from "../account-editor";
import { ChallengesPanel, InitiativesPanel, ResearchDocsPanel, type ProgramOrgs, type ProgramPeople } from "./account-panels";
import { OpportunitiesPanel } from "./opportunities-panel";

type PersonLink = {
  initiative_id?: string;
  challenge_id?: string;
  strength: string;
  contacts: { id: string; full_name: string; title: string | null; avatar_path: string | null } | null;
};

const groupPeople = (links: PersonLink[], key: "initiative_id" | "challenge_id"): ProgramPeople => {
  const byId: ProgramPeople = {};
  for (const l of links) {
    if (!l.contacts || !l[key]) continue;
    (byId[l[key]!] ??= []).push({
      contact_id: l.contacts.id,
      full_name: l.contacts.full_name,
      title: l.contacts.title,
      avatar_path: l.contacts.avatar_path,
      strength: l.strength,
    });
  }
  return byId;
};

export default async function AccountPage({ params }: PageProps<"/accounts/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();

  const { data: accountData } = await supabase.from("accounts").select("*").eq("id", id).maybeSingle();
  const account = accountData as Account | null;
  if (!account) notFound();

  const [accounts, orgs, fields, notes, contactRows, initiativeRows, challengeRows, accountDocRows, sellerDocRows, opportunityRows] =
    await Promise.all([
      listAccounts(supabase),
      listOrgs(supabase, [id]),
      getFieldDefs(supabase, "account"),
      supabase.from("notes").select("*").eq("account_id", id).order("created_at", { ascending: false }),
      supabase.from("contacts").select("org_id").eq("account_id", id),
      supabase
        .from("initiatives")
        .select("*")
        .eq("account_id", id)
        .order("rank", { ascending: true, nullsFirst: false })
        .order("code"),
      supabase
        .from("challenges")
        .select("*")
        .eq("account_id", id)
        .order("rank", { ascending: true, nullsFirst: false })
        .order("code"),
      supabase.from("research_docs").select("*").eq("account_id", id).order("doc_type").order("title"),
      supabase.from("research_docs").select("*").eq("scope", "seller").order("title"),
      supabase.from("opportunities").select("*").eq("account_id", id).order("created_at", { ascending: false }),
    ]);

  const initiatives = (initiativeRows.data ?? []) as Initiative[];
  const challenges = (challengeRows.data ?? []) as Challenge[];
  const accountDocs = (accountDocRows.data ?? []) as ResearchDoc[];
  const sellerDocs = (sellerDocRows.data ?? []) as ResearchDoc[];
  const opportunities = (opportunityRows.data ?? []) as Opportunity[];

  // Key people and owning orgs per program, fetched once the program ids are known.
  const [initiativePeopleRows, challengePeopleRows, orgLinkRows] = await Promise.all([
    initiatives.length
      ? supabase
          .from("contact_initiatives")
          .select("initiative_id, strength, contacts(id, full_name, title, avatar_path)")
          .in("initiative_id", initiatives.map((i) => i.id))
      : Promise.resolve({ data: [] as PersonLink[] }),
    challenges.length
      ? supabase
          .from("contact_challenges")
          .select("challenge_id, strength, contacts(id, full_name, title, avatar_path)")
          .in("challenge_id", challenges.map((c) => c.id))
      : Promise.resolve({ data: [] as PersonLink[] }),
    initiatives.length
      ? supabase.from("org_initiatives").select("initiative_id, orgs(name)").in("initiative_id", initiatives.map((i) => i.id))
      : Promise.resolve({ data: [] as { initiative_id: string; orgs: { name: string } | null }[] }),
  ]);

  const initiativePeople = groupPeople((initiativePeopleRows.data ?? []) as PersonLink[], "initiative_id");
  const challengePeople = groupPeople((challengePeopleRows.data ?? []) as PersonLink[], "challenge_id");
  const orgLinks: ProgramOrgs = {};
  for (const l of (orgLinkRows.data ?? []) as { initiative_id: string; orgs: { name: string } | null }[]) {
    if (l.orgs) (orgLinks[l.initiative_id] ??= []).push(l.orgs.name);
  }

  const contactCounts: Record<string, number> = {};
  for (const r of (contactRows.data ?? []) as { org_id: string | null }[]) {
    const key = r.org_id ?? "";
    contactCounts[key] = (contactCounts[key] ?? 0) + 1;
  }
  const contactTotal = (contactRows.data ?? []).length;
  const entityLabel = ENTITY_TYPES.find((e) => e.value === account.entity_type)?.label;

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
            {entityLabel && (
              <span className="rounded bg-accent px-1.5 py-0.5 text-xs text-accent-foreground" title="Entity classification from research">
                {entityLabel}
              </span>
            )}
            {account.out_of_scope && (
              <span className="rounded border border-red-500/40 bg-red-500/10 px-1.5 py-0.5 text-xs text-red-400">
                Out of scope
              </span>
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
              href={`/canvas?account=${account.id}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-2.5 text-sm font-medium text-primary hover:bg-primary/20"
              title="Drag-and-drop org chart and entity map"
            >
              <Network className="size-3.5" /> Canvas
            </Link>
            <Link
              href={`/ingest?account=${account.id}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
              title="Paste a transcript or notes for this account"
            >
              <Mic className="size-3.5" /> Ingest
            </Link>
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
        <Tabs
          defaultValue={opportunities.length > 0 ? "opportunities" : initiatives.length > 0 ? "initiatives" : "orgs"}
          className="min-w-0 space-y-4 lg:col-span-2"
        >
          <TabsList>
            <TabsTrigger value="opportunities">Opportunities ({opportunities.length})</TabsTrigger>
            <TabsTrigger value="initiatives">Initiatives ({initiatives.length})</TabsTrigger>
            <TabsTrigger value="challenges">Challenges ({challenges.length})</TabsTrigger>
            <TabsTrigger value="orgs">Orgs ({orgs.length})</TabsTrigger>
            <TabsTrigger value="research">Research ({accountDocs.length + sellerDocs.length})</TabsTrigger>
            <TabsTrigger value="structure">Structure</TabsTrigger>
            <TabsTrigger value="notes">Notes ({(notes.data ?? []).length})</TabsTrigger>
          </TabsList>
          <TabsContent value="opportunities">
            <OpportunitiesPanel accountId={account.id} opportunities={opportunities} />
          </TabsContent>
          <TabsContent value="initiatives">
            <InitiativesPanel initiatives={initiatives} people={initiativePeople} orgs={orgLinks} />
          </TabsContent>
          <TabsContent value="challenges">
            <ChallengesPanel challenges={challenges} people={challengePeople} orgs={orgLinks} />
          </TabsContent>
          <TabsContent value="orgs">
            <OrgsPanel account={account} orgs={orgs as Org[]} contactCounts={contactCounts} />
          </TabsContent>
          <TabsContent value="research">
            <ResearchDocsPanel docs={accountDocs} sellerDocs={sellerDocs} />
          </TabsContent>
          <TabsContent value="structure">
            <StructurePanel account={account} accounts={accounts} />
          </TabsContent>
          <TabsContent value="notes">
            <NotesPanel target={{ account_id: account.id }} notes={(notes.data ?? []) as Note[]} />
          </TabsContent>
        </Tabs>

        <div className="space-y-4">
          <WhysPanel account={account} />
          <AccountFactsPanel account={account} fields={fields} />
        </div>
      </div>
    </div>
  );
}
