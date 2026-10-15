import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ConfidenceBadge, FitBadge, ContactAvatar } from "@/components/contact-bits";
import { ResearchDocItem } from "./research-doc-editor";
import type { Challenge, Initiative, ResearchDoc, Source } from "@/lib/types";

/** People linked to a program, keyed by program id. */
export type ProgramPeople = Record<
  string,
  { contact_id: string; full_name: string; title: string | null; avatar_path: string | null; strength: string }[]
>;
/** Org names linked to a program, keyed by program id. */
export type ProgramOrgs = Record<string, string[]>;

function Sources({ sources }: { sources: Source[] }) {
  if (!sources.length) return null;
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1">
      {sources.map((s, i) => (
        <li key={i} className="text-xs">
          {s.url ? (
            <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-primary hover:underline">
              {s.label} <ExternalLink className="size-3" />
            </a>
          ) : (
            <span className="text-muted-foreground">{s.label}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function KeyDates({ dates }: { dates: { label: string; date: string }[] }) {
  if (!dates.length) return null;
  return (
    <ul className="space-y-0.5 text-xs text-muted-foreground">
      {dates.map((d, i) => (
        <li key={i}>
          <span className="font-medium text-foreground">{d.date}</span> — {d.label}
        </li>
      ))}
    </ul>
  );
}

function PeopleChips({ people }: { people: ProgramPeople[string] }) {
  if (!people?.length) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {people.map((p) => (
        <li key={p.contact_id}>
          <Link
            href={`/contacts/${p.contact_id}`}
            className="flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs hover:bg-accent"
            title={p.title ?? undefined}
          >
            <ContactAvatar name={p.full_name} path={p.avatar_path} size={16} />
            {p.full_name}
            {p.strength === "inferred" && <span className="text-muted-foreground" title="Inferred link">~</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ProgramCard({
  program,
  people,
  orgs,
  solvingFor,
  impact,
  technologies,
}: {
  program: Initiative | Challenge;
  people: ProgramPeople[string];
  orgs: string[];
  solvingFor: string | null;
  impact: string | null;
  technologies: string[];
}) {
  return (
    <li className="space-y-2 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        {program.rank != null && (
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary" title="Research priority rank">
            #{program.rank}
          </span>
        )}
        <span className="text-xs font-mono text-muted-foreground">{program.code}</span>
        <h3 className="text-sm font-semibold">{program.name}</h3>
        <FitBadge fit={program.factory_fit} />
        {program.confidence && <ConfidenceBadge confidence={program.confidence} />}
      </div>
      {program.summary && <p className="text-sm text-muted-foreground">{program.summary}</p>}
      {solvingFor && (
        <p className="text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Solving for </span>
          {solvingFor}
        </p>
      )}
      {impact && (
        <p className="text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Impact </span>
          {impact}
        </p>
      )}
      {program.why_it_matters && (
        <details>
          <summary className="cursor-pointer text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Why it matters
          </summary>
          <p className="mt-1 text-sm text-muted-foreground">{program.why_it_matters}</p>
        </details>
      )}
      {program.factory_hypothesis && (
        <p className="rounded border border-primary/20 bg-primary/5 px-2 py-1.5 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-primary/80">Factory hypothesis </span>
          {program.factory_hypothesis}
        </p>
      )}
      {technologies.length > 0 && (
        <ul className="flex flex-wrap gap-1">
          {technologies.map((t) => (
            <li key={t} className="rounded bg-accent px-1.5 py-0.5 text-[11px] text-accent-foreground">
              {t}
            </li>
          ))}
        </ul>
      )}
      <KeyDates dates={program.key_dates ?? []} />
      {orgs.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Owning orgs: {orgs.join(", ")}
        </p>
      )}
      <PeopleChips people={people} />
      <Sources sources={program.sources ?? []} />
    </li>
  );
}

/** The account's strategic initiatives, ranked for Factory fit. */
export function InitiativesPanel({
  initiatives,
  people,
  orgs,
}: {
  initiatives: Initiative[];
  people: ProgramPeople;
  orgs: ProgramOrgs;
}) {
  return (
    <section className="space-y-3">
      {initiatives.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No initiatives recorded yet. They come from the research migration, or add them here as research lands.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {initiatives.map((i) => (
            <ProgramCard
              key={i.id}
              program={i}
              people={people[i.id]}
              orgs={orgs[i.id] ?? []}
              solvingFor={i.solving_for}
              impact={null}
              technologies={i.technologies ?? []}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

/** The account's challenges and pains. */
export function ChallengesPanel({
  challenges,
  people,
  orgs,
}: {
  challenges: Challenge[];
  people: ProgramPeople;
  orgs: ProgramOrgs;
}) {
  return (
    <section className="space-y-3">
      {challenges.length === 0 ? (
        <p className="text-sm text-muted-foreground">No challenges recorded yet.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {challenges.map((c) => (
            <ProgramCard
              key={c.id}
              program={c}
              people={people[c.id]}
              orgs={orgs[c.id] ?? []}
              solvingFor={null}
              impact={c.impact}
              technologies={(c.custom_fields?.technologies as string[] | undefined) ?? []}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

/** The account's research library, plus the seller-scoped documents shared by every account. */
export function ResearchDocsPanel({ docs, sellerDocs }: { docs: ResearchDoc[]; sellerDocs: ResearchDoc[] }) {
  return (
    <section className="space-y-4">
      {docs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No account research yet.</p>
      ) : (
        <ul className="space-y-2">
          {docs.map((d) => (
            <ResearchDocItem key={d.id} doc={d} />
          ))}
        </ul>
      )}
      {sellerDocs.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Seller library (all accounts)</p>
          <ul className="space-y-2">
            {sellerDocs.map((d) => (
              <ResearchDocItem key={d.id} doc={d} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
