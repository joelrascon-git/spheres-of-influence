-- ───────────────────────── Qualification templates ─────────────────────────
-- MEDDPICC is the seeded default; variants are saved as named templates so a
-- deal can start from any saved element set.
create table public.qualification_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  elements jsonb not null default '[]'::jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, name)
);
create trigger qualification_templates_updated_at before update on public.qualification_templates
  for each row execute function public.set_updated_at();

-- ───────────────────────── Opportunities ─────────────────────────
create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  name text not null,
  status text not null default 'open' check (status in ('open','won','lost','paused')),
  amount numeric(16,2) check (amount >= 0),
  currency text not null default 'USD',
  close_date date,
  next_step text,
  notes text,
  template_id uuid references public.qualification_templates(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index opportunities_account_idx on public.opportunities (account_id, created_at desc);
create trigger opportunities_updated_at before update on public.opportunities
  for each row execute function public.set_updated_at();

-- ───────────────────────── Qualification items ─────────────────────────
-- One row per element on a deal: the template seeds them, then the seller
-- renames, hides or adds elements without touching the template.
create table public.qualification_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  key text not null,
  label text not null,
  sort_order int not null default 0,
  status text not null default 'unknown' check (status in ('unknown','identified','validated')),
  summary text,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  unique (opportunity_id, key)
);
create index qualification_items_opportunity_idx on public.qualification_items (opportunity_id, sort_order);

-- ───────────────────────── Qualification evidence ─────────────────────────
-- Evidence backs each element: a note with an optional linked person, the
-- same quote-first discipline as the rest of the workspace.
create table public.qualification_evidence (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  item_id uuid not null references public.qualification_items(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  note text not null,
  source text not null default 'manual' check (source in ('manual','ai','research')),
  created_at timestamptz not null default now()
);
create index qualification_evidence_item_idx on public.qualification_evidence (item_id, created_at desc);

-- ───────────────────────── Tasks ─────────────────────────
-- Next steps from ingest land here; anything can be linked to a task.
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  document_id uuid references public.documents(id) on delete set null,
  title text not null,
  details text,
  status text not null default 'open' check (status in ('open','done','dismissed')),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tasks_today_idx on public.tasks (owner_id, status, due_date nulls first, created_at desc);
create trigger tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

-- ───────────────────────── Row level security ─────────────────────────
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'qualification_templates','opportunities','qualification_items','qualification_evidence','tasks'
  ] loop
    execute format('alter table public.%I enable row level security', tbl);
    execute format(
      'create policy "owner full access" on public.%I for all to authenticated
         using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()))', tbl);
  end loop;
end $$;
