-- ───────────────────────── Signals ─────────────────────────
-- The daily scan's output: something that happened in or near the account,
-- with the "so what for Factory" line already written. url_hash dedupes runs.
create table public.signals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete cascade,
  title text not null,
  summary text not null,
  so_what text not null,
  source_name text not null,
  source_url text not null,
  source_date date,
  relevance int not null default 3 check (relevance between 1 and 5),
  status text not null default 'new' check (status in ('new','linked','dismissed')),
  url_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, url_hash)
);
create index signals_feed_idx on public.signals (owner_id, status, source_date desc);
create index signals_account_idx on public.signals (account_id, source_date desc);
create trigger signals_updated_at before update on public.signals
  for each row execute function public.set_updated_at();

-- ───────────────────────── Hypotheses ─────────────────────────
-- The account's working hypothesis, versioned: every save is a new row.
create table public.hypotheses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  content text not null,
  version int not null default 1,
  source text not null default 'manual' check (source in ('manual','signal')),
  created_at timestamptz not null default now()
);
create index hypotheses_account_idx on public.hypotheses (account_id, version desc);

-- ───────────────────────── Row level security ─────────────────────────
do $$
declare
  tbl text;
begin
  foreach tbl in array array['signals','hypotheses'] loop
    execute format('alter table public.%I enable row level security', tbl);
    execute format(
      'create policy "owner full access" on public.%I for all to authenticated
         using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()))', tbl);
  end loop;
end $$;
