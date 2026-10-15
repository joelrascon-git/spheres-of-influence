-- ───────────────────────── Campaigns ─────────────────────────
-- One object for every motion: outbound, an exec dinner, an account break-in,
-- a partner co-sell or a webinar. Scope is one account (null = multi-account).
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete cascade,
  name text not null,
  type text not null default 'event_dinner'
    check (type in ('outbound','event_dinner','account_break_in','partner_cosell','webinar')),
  status text not null default 'planning' check (status in ('planning','active','done')),
  messaging text,
  event_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index campaigns_account_idx on public.campaigns (account_id, created_at desc);
create trigger campaigns_updated_at before update on public.campaigns
  for each row execute function public.set_updated_at();

-- ───────────────────────── Campaign members ─────────────────────────
-- The funnel: one row per person, their account snapshotted so an attendee
-- from outside the campaign's account is flagged as net-new.
create table public.campaign_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  contact_account_id uuid references public.accounts(id) on delete set null,
  funnel_stage text not null default 'invited'
    check (funnel_stage in ('invited','registered','attended','engaged','declined','no_show')),
  outcome text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, contact_id)
);
create index campaign_members_campaign_idx on public.campaign_members (campaign_id, created_at desc);
create trigger campaign_members_updated_at before update on public.campaign_members
  for each row execute function public.set_updated_at();

-- ───────────────────────── Row level security ─────────────────────────
do $$
declare
  tbl text;
begin
  foreach tbl in array array['campaigns','campaign_members'] loop
    execute format('alter table public.%I enable row level security', tbl);
    execute format(
      'create policy "owner full access" on public.%I for all to authenticated
         using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()))', tbl);
  end loop;
end $$;
