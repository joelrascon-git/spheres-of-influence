import Link from "next/link";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ArrowLeft, ExternalLink, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ContactAvatar, KeyStar, PersonaBadge, StatusBadge } from "@/components/contact-bits";
import { requireUser } from "@/lib/auth";
import { DEFAULT_PERSONAS, DEFAULT_STATUSES, seniorityLabel } from "@/lib/constants";
import {
  getContact,
  getContactRelations,
  getFieldDefs,
  listAccounts,
  listContactRefs,
  listOrgs,
  listTags,
  type ContactRef,
} from "@/lib/data";
import { tenure } from "@/lib/tenure";
import {
  BasicsPanel,
  CustomFieldsPanel,
  DangerPanel,
  InfluencePanel,
  NotesPanel,
  PersonalDetailsPanel,
  ReportsToPanel,
  TagsPanel,
  type InfluenceEdge,
} from "./contact-panels";

export default async function ContactPage({ params }: PageProps<"/contacts/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const contact = await getContact(supabase, id);
  if (!contact) notFound();

  const [relations, accounts, orgs, tags, fields, refs, history] = await Promise.all([
    getContactRelations(supabase, id),
    listAccounts(supabase),
    listOrgs(supabase),
    listTags(supabase),
    getFieldDefs(supabase, "contact"),
    listContactRefs(supabase, contact.account_id ? [contact.account_id] : undefined),
    supabase
      .from("activity_log")
      .select("action, changes, source, created_at")
      .eq("entity", "contact")
      .eq("entity_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  // Names for influence edges and the manager, which may cross account boundaries.
  const edgeContactIds = [
    ...relations.influences.map((i) => i.to_contact_id),
    ...relations.influencedBy.map((i) => i.from_contact_id),
    contact.reports_to_id,
  ].filter((x): x is string => x != null);
  const missingIds = [...new Set(edgeContactIds)].filter((cid) => !refs.some((r) => r.id === cid));
  if (missingIds.length > 0) {
    const { data } = await supabase
      .from("contacts")
      .select("id, full_name, title, avatar_path, account_id, statuses")
      .in("id", missingIds);
    refs.push(...((data ?? []) as ContactRef[]));
  }
  const refById = new Map(refs.map((r) => [r.id, r]));
  const account = contact.account_id ? accounts.find((a) => a.id === contact.account_id) : null;
  const org = contact.org_id ? orgs.find((o) => o.id === contact.org_id) : null;

  const influenced: InfluenceEdge[] = relations.influences.map((i) => {
    const target = refById.get(i.to_contact_id);
    return {
      edgeId: i.id,
      contactId: i.to_contact_id,
      name: target?.full_name ?? "Unknown contact",
      title: target?.title ?? null,
      strength: i.strength,
      confidence: i.confidence,
      evidence: i.evidence,
    };
  });
  const influencedBy: InfluenceEdge[] = relations.influencedBy.map((i) => {
    const source = refById.get(i.from_contact_id);
    return {
      edgeId: i.id,
      contactId: i.from_contact_id,
      name: source?.full_name ?? "Unknown contact",
      title: source?.title ?? null,
      strength: i.strength,
      confidence: i.confidence,
      evidence: i.evidence,
    };
  });

  const personasOptions = fields.find((f) => f.key === "personas")?.options ?? DEFAULT_PERSONAS;
  const statusOptions = fields.find((f) => f.key === "statuses")?.options ?? DEFAULT_STATUSES;
  const customFields = fields.filter((f) => !f.is_system && f.show_in_profile);
  const t = tenure(contact.role_start, contact.company_start);

  return (
    <div className="min-h-screen">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Link href="/contacts" className="mr-1 text-muted-foreground hover:text-foreground" aria-label="Back to contacts">
              <ArrowLeft className="size-4" />
            </Link>
            <ContactAvatar name={contact.full_name} path={contact.avatar_path} size={36} />
            {contact.full_name}
            {contact.is_key && <KeyStar active />}
          </span>
        }
        description={
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            {contact.title && <span>{contact.title}</span>}
            {account && (
              <Link href={`/accounts/${account.id}`} className="text-primary hover:underline">
                {account.name}
              </Link>
            )}
            {org && <span className="text-muted-foreground">{org.name}</span>}
            {contact.seniority && <span className="text-muted-foreground">{seniorityLabel(contact.seniority)}</span>}
            {contact.location && (
              <span className="text-muted-foreground">
                {contact.location_city ?? contact.location}
              </span>
            )}
            {contact.linkedin_public_url && (
              <a
                href={contact.linkedin_public_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-0.5 text-primary hover:underline"
              >
                LinkedIn <ExternalLink className="size-3" />
              </a>
            )}
            {contact.sales_nav_url && (
              <a href={contact.sales_nav_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-primary hover:underline">
                Sales Nav <ExternalLink className="size-3" />
              </a>
            )}
          </span>
        }
      >
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {contact.statuses.map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
          {contact.personas.map((p) => (
            <PersonaBadge key={p} persona={p} />
          ))}
          <span className="text-xs text-muted-foreground">{t.label || "Tenure unknown"}</span>
          {t.isChangeAgent && (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] text-primary" title="In role under a year after 3+ years at the company — often the person who drives change.">
              <Sparkles className="size-3" /> Change agent
            </span>
          )}
        </div>
      </PageHeader>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 p-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <BasicsPanel
            contact={contact}
            accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
            orgs={orgs.map((o) => ({ id: o.id, name: o.name, account_id: o.account_id }))}
            personasOptions={personasOptions}
            statusOptions={statusOptions}
          />
          <ReportsToPanel contact={contact} directReports={relations.directReports} candidates={refs} />
          <InfluencePanel contact={contact} candidates={refs} influenced={influenced} influencedBy={influencedBy} />

          {(contact.headline || contact.summary || contact.job_description) && (
            <section className="space-y-3 rounded-lg border bg-card p-4">
              <h2 className="text-sm font-semibold">LinkedIn profile</h2>
              <details open={!!contact.summary && !contact.job_description}>
                <summary className="cursor-pointer text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Headline
                </summary>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{contact.headline}</p>
              </details>
              {contact.summary && (
                <details>
                  <summary className="cursor-pointer text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Profile summary
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{contact.summary}</p>
                </details>
              )}
              {contact.job_description && (
                <details>
                  <summary className="cursor-pointer text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Job description
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{contact.job_description}</p>
                </details>
              )}
            </section>
          )}

          <NotesPanel target={{ contact_id: contact.id }} notes={relations.notes} />
        </div>

        <div className="space-y-4">
          <TagsPanel contactId={contact.id} tagIds={relations.tagIds} tags={tags} />
          <PersonalDetailsPanel contact={contact} />
          <CustomFieldsPanel contact={contact} fields={customFields} />

          <section className="space-y-1.5 rounded-lg border bg-card p-4 text-sm">
            <h2 className="text-sm font-semibold">Import data</h2>
            <dl className="space-y-1 text-xs text-muted-foreground">
              {contact.connections != null && <div>Connections: {contact.connections.toLocaleString()}</div>}
              {contact.profile_industry && <div>Industry: {contact.profile_industry}</div>}
              {(contact.is_premium || contact.is_open_profile || contact.is_open_to_work) && (
                <div>
                  {contact.is_premium && "Premium "}
                  {contact.is_open_profile && "Open profile "}
                  {contact.is_open_to_work && "Open to work"}
                </div>
              )}
              {contact.current_jobs_count != null && (
                <div>
                  Current jobs: {contact.current_jobs_count} · total positions: {contact.total_positions_count ?? "?"}
                </div>
              )}
              {contact.email_provider_status && <div>Email status at export: {contact.email_provider_status}</div>}
              {contact.avatar_source_url && !contact.avatar_path && (
                <div>
                  Avatar:{" "}
                  <a href={contact.avatar_source_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    source URL
                  </a>{" "}
                  (not cached yet)
                </div>
              )}
              {contact.last_imported_at && (
                <div>Last imported: {format(parseISO(contact.last_imported_at), "MMM d, yyyy")}</div>
              )}
              <div>Created: {format(parseISO(contact.created_at), "MMM d, yyyy")}</div>
            </dl>
          </section>

          {(history.data ?? []).length > 0 && (
            <section className="space-y-1.5 rounded-lg border bg-card p-4">
              <h2 className="text-sm font-semibold">History</h2>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {(history.data ?? []).map((h, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="shrink-0">{format(parseISO(h.created_at), "MMM d")}</span>
                    <span className="shrink-0">{h.action}</span>
                    {h.source !== "manual" && <span className="shrink-0 rounded bg-accent px-1">{h.source}</span>}
                    <span className="min-w-0 flex-1 truncate">
                      {Object.keys((h.changes ?? {}) as Record<string, unknown>).join(", ")}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <DangerPanel contact={contact} />
        </div>
      </div>
    </div>
  );
}
