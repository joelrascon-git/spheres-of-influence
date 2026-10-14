-- ───────────────────────── Ingested documents ─────────────────────────
-- Raw pasted sources (call transcripts, voice notes, free-form notes) are kept
-- verbatim for provenance. Notes generated from them are appended to `notes`
-- (never replaced), and the rendered notes live on the document for the review
-- view. The validated AI extraction is stored alongside so the review page can
-- render new people and next steps without re-running the model.
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  title text not null default '',
  raw_text text not null,
  call_type text not null default 'unknown'
    check (call_type in ('discovery','adaptive_non_discovery','partner_or_internal','personal_note','unknown')),
  notes_html text not null default '',
  extraction jsonb not null default '{}'::jsonb,
  status text not null default 'processing' check (status in ('processing','done','failed')),
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index documents_account_idx on public.documents (account_id, created_at desc);
create trigger documents_updated_at before update on public.documents
  for each row execute function public.set_updated_at();

-- Proposals carry the document they came from so the ingest page shows its own
-- review column while the global queue stays the source of truth. Deleting a
-- document keeps its proposals; they just lose the link.
alter table public.inferences add column document_id uuid references public.documents(id) on delete set null;
create index inferences_document_idx on public.inferences (document_id) where document_id is not null;

-- Influence edges become reviewable proposals: the influence map only turns
-- from inferred to confirmed when a human accepts the quote-backed edge.
alter table public.inferences drop constraint inferences_kind_check;
alter table public.inferences add constraint inferences_kind_check check (kind in
  ('persona','seniority_level','org_assignment','key_person','reporting_line',
   'initiative_link','challenge_link','field','summary','influence_edge'));

alter table public.documents enable row level security;
create policy "owner full access" on public.documents for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
