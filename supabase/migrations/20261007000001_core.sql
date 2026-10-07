-- Spheres of Influence: core schema.
-- Single-owner model: every row carries owner_id and RLS restricts it to auth.uid().

create extension if not exists pg_trgm with schema extensions;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Strips HTML produced by the rich text editor down to searchable text.
create or replace function public.html_to_text(html text)
returns text language sql immutable set search_path = '' as $$
  select trim(regexp_replace(
    replace(replace(replace(regexp_replace(coalesce(html, ''), '<[^>]*>', ' ', 'g'),
      '&nbsp;', ' '), '&amp;', '&'), '&#39;', ''''),
    '\s+', ' ', 'g'));
$$;

-- ───────────────────────── Accounts ─────────────────────────
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  domain text,
  website text,
  linkedin_company_id text,
  parent_account_id uuid references public.accounts(id) on delete set null,
  parent_relationship text not null default 'unknown'
    check (parent_relationship in ('independent','semi_autonomous','centralized','unknown')),
  parent_relationship_notes text,
  industry text,
  employee_count integer,
  engineer_count integer,
  hq text,
  hq_lat double precision,
  hq_lng double precision,
  description text,
  specialities text,
  company_type text,
  year_founded integer,
  revenue_min_musd numeric,
  revenue_max_musd numeric,
  employee_growth jsonb not null default '{}'::jsonb,
  department_headcounts jsonb not null default '{}'::jsonb,
  logo_path text,
  why_anything text,
  why_factory text,
  why_now text,
  notes text,
  sumble_org_id bigint,
  sumble_data jsonb not null default '{}'::jsonb,
  sumble_fetched_at timestamptz,
  custom_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accounts_not_own_parent check (parent_account_id is null or parent_account_id <> id)
);
create index accounts_owner_idx on public.accounts (owner_id);
create index accounts_parent_idx on public.accounts (parent_account_id);
create unique index accounts_owner_domain_uidx on public.accounts (owner_id, lower(domain)) where domain is not null;
create unique index accounts_owner_li_uidx on public.accounts (owner_id, linkedin_company_id) where linkedin_company_id is not null;
create trigger accounts_updated_at before update on public.accounts
  for each row execute function public.set_updated_at();

-- ───────────────────────── Orgs ─────────────────────────
create table public.orgs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  parent_org_id uuid references public.orgs(id) on delete set null,
  name text not null,
  aliases text[] not null default '{}',
  description text,
  status text not null default 'inferred' check (status in ('confirmed','inferred')),
  notes text,
  color text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orgs_not_own_parent check (parent_org_id is null or parent_org_id <> id)
);
create index orgs_account_idx on public.orgs (account_id);
create trigger orgs_updated_at before update on public.orgs
  for each row execute function public.set_updated_at();

-- ───────────────────────── Contacts ─────────────────────────
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  org_id uuid references public.orgs(id) on delete set null,

  -- LinkedIn identity. linkedin_uid is the immutable member id (ACwAA...).
  linkedin_uid text,
  linkedin_public_url text,
  sales_nav_url text,

  first_name text not null default '',
  last_name text not null default '',
  full_name text generated always as (trim(first_name || ' ' || last_name)) stored,
  title text,
  headline text,
  summary text,
  job_description text,
  location text,
  location_lat double precision,
  location_lng double precision,
  location_city text,
  location_region text,
  location_country text,
  avatar_path text,
  avatar_source_url text,
  profile_industry text,
  connections integer,
  is_premium boolean,
  is_open_profile boolean,
  is_open_to_work boolean,
  current_jobs_count integer,
  total_positions_count integer,

  -- Start dates derived at import (export date minus reported tenure) so tenure stays live.
  role_start date,
  company_start date,

  email text,
  email_quality text check (email_quality in ('good','questionable','bad')),
  email_provider_status text,
  phone text,
  phone_quality text check (phone_quality in ('good','questionable','bad')),

  seniority text check (seniority in ('c_level','vp','director','manager','ic')),
  is_key boolean not null default false,
  key_reasoning text,
  personas text[] not null default '{}',
  statuses text[] not null default '{}',
  last_contacted date,

  reports_to_id uuid references public.contacts(id) on delete set null,
  reports_to_confidence text check (reports_to_confidence in ('confirmed','medium','low')),
  reports_to_evidence text,

  personal_details jsonb not null default '{}'::jsonb,
  custom_fields jsonb not null default '{}'::jsonb,
  evaboot_raw jsonb not null default '{}'::jsonb,
  sumble_person_id bigint,
  sumble_data jsonb not null default '{}'::jsonb,
  sumble_fetched_at timestamptz,
  last_imported_at timestamptz,

  -- Maintained by contacts_build_search; lowercase concatenation of everything searchable.
  search_text text not null default '',
  notes_text text not null default '',
  tags_text text not null default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contacts_not_own_manager check (reports_to_id is null or reports_to_id <> id)
);
create index contacts_owner_idx on public.contacts (owner_id);
create index contacts_account_idx on public.contacts (account_id);
create index contacts_org_idx on public.contacts (org_id);
create index contacts_reports_to_idx on public.contacts (reports_to_id);
create unique index contacts_owner_li_uidx on public.contacts (owner_id, linkedin_uid) where linkedin_uid is not null;
create index contacts_email_idx on public.contacts (owner_id, lower(email));
create index contacts_search_trgm_idx on public.contacts using gin (search_text extensions.gin_trgm_ops);
create index contacts_statuses_idx on public.contacts using gin (statuses);
create index contacts_personas_idx on public.contacts using gin (personas);

-- ───────────────────────── Influence ─────────────────────────
create table public.influences (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  from_contact_id uuid not null references public.contacts(id) on delete cascade,
  to_contact_id uuid not null references public.contacts(id) on delete cascade,
  strength text not null default 'medium' check (strength in ('high','medium','low')),
  confidence text not null default 'medium' check (confidence in ('confirmed','medium','low')),
  evidence text,
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (from_contact_id, to_contact_id),
  constraint influences_not_self check (from_contact_id <> to_contact_id)
);
create index influences_to_idx on public.influences (to_contact_id);
create trigger influences_updated_at before update on public.influences
  for each row execute function public.set_updated_at();

-- ───────────────────────── Notes ─────────────────────────
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete cascade,
  org_id uuid references public.orgs(id) on delete cascade,
  body_html text not null default '',
  body_text text generated always as (public.html_to_text(body_html)) stored,
  source text not null default 'manual' check (source in ('manual','ai','import')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notes_has_parent check (num_nonnulls(contact_id, account_id, org_id) >= 1)
);
create index notes_contact_idx on public.notes (contact_id, created_at desc);
create index notes_account_idx on public.notes (account_id, created_at desc);
create index notes_org_idx on public.notes (org_id, created_at desc);
create trigger notes_updated_at before update on public.notes
  for each row execute function public.set_updated_at();

-- ───────────────────────── Tags ─────────────────────────
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  description text not null check (length(trim(description)) > 0),
  color text not null default '#ef6f2e',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index tags_owner_name_uidx on public.tags (owner_id, lower(name));
create trigger tags_updated_at before update on public.tags
  for each row execute function public.set_updated_at();

create table public.contact_tags (
  contact_id uuid not null references public.contacts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (contact_id, tag_id)
);
create index contact_tags_tag_idx on public.contact_tags (tag_id);

-- ───────────────────────── Research docs (account deep research) ─────────────────────────
create table public.research_docs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  title text not null,
  body_html text not null default '',
  body_text text generated always as (public.html_to_text(body_html)) stored,
  source_file_path text,
  source_file_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index research_docs_account_idx on public.research_docs (account_id);
create trigger research_docs_updated_at before update on public.research_docs
  for each row execute function public.set_updated_at();

-- ───────────────────────── Admin configuration ─────────────────────────
-- System fields are seeded so labels, visibility, order and picklist options are editable.
-- Custom fields (is_system = false) store their values in <entity>.custom_fields.
create table public.field_definitions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entity text not null check (entity in ('contact','account','org')),
  key text not null,
  label text not null,
  field_type text not null check (field_type in
    ('text','long_text','rich_text','number','date','select','multi_select','boolean','url','email','phone')),
  options jsonb not null default '[]'::jsonb,
  is_system boolean not null default false,
  show_in_profile boolean not null default true,
  show_in_list boolean not null default false,
  show_on_canvas boolean not null default false,
  sort_order integer not null default 0,
  help_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, entity, key)
);
create trigger field_definitions_updated_at before update on public.field_definitions
  for each row execute function public.set_updated_at();

create table public.style_rules (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  field text not null,
  operator text not null check (operator in ('contains','equals','is_true','is_empty')),
  value text,
  style jsonb not null default '{}'::jsonb,
  priority integer not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger style_rules_updated_at before update on public.style_rules
  for each row execute function public.set_updated_at();

create table public.prompts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  key text not null,
  name text not null,
  description text,
  model text not null,
  system_prompt text not null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, key)
);
create trigger prompts_updated_at before update on public.prompts
  for each row execute function public.set_updated_at();

create table public.prompt_versions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  version integer not null,
  model text not null,
  system_prompt text not null,
  created_at timestamptz not null default now()
);

create table public.saved_views (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  surface text not null default 'contacts' check (surface in ('contacts','canvas','map')),
  query text not null default '',
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger saved_views_updated_at before update on public.saved_views
  for each row execute function public.set_updated_at();

-- ───────────────────────── Imports ─────────────────────────
create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  source text not null default 'csv' check (source in ('csv','evaboot_api')),
  file_name text,
  export_date date not null default current_date,
  status text not null default 'review' check (status in ('processing','review','applied','discarded')),
  stats jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  applied_at timestamptz
);

create table public.import_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  batch_id uuid not null references public.import_batches(id) on delete cascade,
  row_index integer not null,
  linkedin_uid text,
  full_name text,
  action text not null check (action in ('create','update','unchanged','review','error')),
  match_reason text,
  matched_contact_id uuid references public.contacts(id) on delete set null,
  candidate_contact_ids uuid[] not null default '{}',
  payload jsonb not null,
  diff jsonb not null default '[]'::jsonb,
  decision text not null default 'pending' check (decision in ('pending','accept','skip','merge')),
  merge_into_contact_id uuid references public.contacts(id) on delete set null,
  applied_contact_id uuid references public.contacts(id) on delete set null,
  error text,
  created_at timestamptz not null default now()
);
create index import_items_batch_idx on public.import_items (batch_id, row_index);

create table public.geocode_cache (
  query text primary key,
  label text,
  lat double precision,
  lng double precision,
  city text,
  region text,
  country text,
  created_at timestamptz not null default now()
);

-- ───────────────────────── Activity log ─────────────────────────
create table public.activity_log (
  id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entity text not null,
  entity_id uuid not null,
  action text not null,
  changes jsonb not null default '{}'::jsonb,
  source text not null default 'manual',
  created_at timestamptz not null default now()
);
create index activity_log_entity_idx on public.activity_log (entity, entity_id, created_at desc);

-- ───────────────────────── Search text + Last Updated ─────────────────────────
create or replace function public.contacts_build_search()
returns trigger language plpgsql set search_path = '' as $$
declare
  org_name text;
  acct_name text;
begin
  select o.name || ' ' || array_to_string(o.aliases, ' ') into org_name from public.orgs o where o.id = new.org_id;
  select a.name into acct_name from public.accounts a where a.id = new.account_id;
  select coalesce(string_agg(t.name, ' '), '') into new.tags_text
    from public.contact_tags ct join public.tags t on t.id = ct.tag_id where ct.contact_id = new.id;
  select coalesce(string_agg(n.body_text, ' '), '') into new.notes_text
    from public.notes n where n.contact_id = new.id;

  new.search_text := lower(concat_ws(' ',
    new.first_name, new.last_name, new.title, new.headline, new.summary, new.job_description,
    new.location, org_name, acct_name, new.tags_text, new.notes_text,
    public.html_to_text(new.key_reasoning), new.reports_to_evidence,
    array_to_string(new.personas, ' '), array_to_string(new.statuses, ' '),
    new.seniority, new.email, new.profile_industry,
    (select string_agg(key || ' ' || value, ' ') from jsonb_each_text(new.personal_details)),
    (select string_agg(value, ' ') from jsonb_each_text(new.custom_fields))
  ));
  -- Bump Last Updated only when the contact's own data changed. Child-row touches set
  -- updated_at explicitly; search refreshes after an org/account/tag rename leave it alone.
  if tg_op = 'UPDATE'
     and new.updated_at = old.updated_at
     and (to_jsonb(new) - array['search_text','notes_text','tags_text','updated_at','full_name'])
         is distinct from (to_jsonb(old) - array['search_text','notes_text','tags_text','updated_at','full_name']) then
    new.updated_at := now();
  end if;
  return new;
end $$;

create trigger contacts_search before insert or update on public.contacts
  for each row execute function public.contacts_build_search();

-- Child-row changes bump the parent contact so Last Updated and search stay current.
create or replace function public.touch_contact_from_child()
returns trigger language plpgsql set search_path = '' as $$
declare
  ids uuid[];
begin
  if tg_table_name = 'influences' then
    ids := array[coalesce(new.from_contact_id, old.from_contact_id), coalesce(new.to_contact_id, old.to_contact_id)];
  else
    ids := array[coalesce(new.contact_id, old.contact_id)];
  end if;
  update public.contacts set updated_at = now() where id = any(ids);
  return null;
end $$;

create trigger notes_touch_contact after insert or update or delete on public.notes
  for each row execute function public.touch_contact_from_child();
create trigger contact_tags_touch_contact after insert or update or delete on public.contact_tags
  for each row execute function public.touch_contact_from_child();
create trigger influences_touch_contact after insert or update or delete on public.influences
  for each row execute function public.touch_contact_from_child();

-- Renaming an org, account or tag changes what its contacts match in search.
create or replace function public.refresh_contacts_search()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_table_name = 'orgs' and (new.name, new.aliases) is distinct from (old.name, old.aliases) then
    update public.contacts set updated_at = updated_at where org_id = new.id;
  elsif tg_table_name = 'accounts' and new.name is distinct from old.name then
    update public.contacts set updated_at = updated_at where account_id = new.id;
  elsif tg_table_name = 'tags' and new.name is distinct from old.name then
    update public.contacts c set updated_at = c.updated_at
      from public.contact_tags ct where ct.tag_id = new.id and ct.contact_id = c.id;
  end if;
  return null;
end $$;

create trigger orgs_refresh_search after update on public.orgs
  for each row execute function public.refresh_contacts_search();
create trigger accounts_refresh_search after update on public.accounts
  for each row execute function public.refresh_contacts_search();
create trigger tags_refresh_search after update on public.tags
  for each row execute function public.refresh_contacts_search();

-- ───────────────────────── Boolean search ─────────────────────────
-- The client parses a query like  title:manager AND (AI OR "machine learning") -status:"Do Not Contact"
-- into a JSON AST. This function compiles that AST into a WHERE clause using format() with %L
-- literals, so user input never reaches the SQL text unquoted.
create or replace function public.compile_contact_filter(node jsonb)
returns text language plpgsql immutable set search_path = '' as $$
declare
  t text := node->>'t';
  f text := node->>'f';
  v text := node->>'v';
  parts text[];
  child jsonb;
  pattern text;
  col text;
begin
  if t = 'and' or t = 'or' then
    parts := '{}';
    for child in select * from jsonb_array_elements(node->'c') loop
      parts := parts || public.compile_contact_filter(child);
    end loop;
    if coalesce(array_length(parts, 1), 0) = 0 then return 'true'; end if;
    return '(' || array_to_string(parts, case when t = 'and' then ' and ' else ' or ' end) || ')';
  elsif t = 'not' then
    return '(not ' || public.compile_contact_filter(node->'c') || ')';
  elsif t = 'text' or t = 'field' then
    -- Word-boundary match so "AI" does not match "maintain". A trailing * makes it a prefix.
    pattern := regexp_replace(lower(v), '([.\\+*?\[^\]$(){}=!<>|:\-#/])', '\\\1', 'g');
    -- Boundaries only apply next to word characters, so ".net" and "c++" still match.
    pattern := case when v ~ '^\w' then '\m' else '' end || pattern ||
      case when coalesce((node->>'prefix')::boolean, false) or v !~ '\w$' then '' else '\M' end;
    if t = 'text' then
      return format('c.search_text ~ %L', pattern);
    end if;
    col := case f
      when 'name' then 'lower(c.full_name)'
      when 'title' then 'lower(coalesce(c.title, ''''))'
      when 'headline' then 'lower(coalesce(c.headline, ''''))'
      when 'summary' then 'lower(coalesce(c.summary, ''''))'
      when 'job' then 'lower(coalesce(c.job_description, ''''))'
      when 'location' then 'lower(coalesce(c.location, ''''))'
      when 'notes' then 'lower(c.notes_text)'
      when 'tag' then 'lower(c.tags_text)'
      when 'email' then 'lower(coalesce(c.email, ''''))'
      when 'industry' then 'lower(coalesce(c.profile_industry, ''''))'
      when 'org' then 'lower(coalesce((select o.name || '' '' || array_to_string(o.aliases, '' '') from public.orgs o where o.id = c.org_id), ''''))'
      when 'account' then 'lower(coalesce((select a.name from public.accounts a where a.id = c.account_id), ''''))'
      when 'status' then 'lower(array_to_string(c.statuses, '' | ''))'
      when 'persona' then 'lower(array_to_string(c.personas, '' | ''))'
      when 'seniority' then 'lower(coalesce(c.seniority, ''''))'
      else null
    end;
    if col is null then
      return format('c.search_text ~ %L', pattern);
    end if;
    return format('%s ~ %L', col, pattern);
  elsif t = 'in' then
    -- Exact-value facets. Array columns match if any value overlaps.
    return case f
      when 'account_id' then format('c.account_id = any(%L::uuid[])', array(select jsonb_array_elements_text(node->'v')))
      when 'org_id' then format('c.org_id = any(%L::uuid[])', array(select jsonb_array_elements_text(node->'v')))
      when 'seniority' then format('c.seniority = any(%L::text[])', array(select jsonb_array_elements_text(node->'v')))
      when 'email_quality' then format('c.email_quality = any(%L::text[])', array(select jsonb_array_elements_text(node->'v')))
      when 'phone_quality' then format('c.phone_quality = any(%L::text[])', array(select jsonb_array_elements_text(node->'v')))
      when 'personas' then format('c.personas && %L::text[]', array(select jsonb_array_elements_text(node->'v')))
      when 'statuses' then format('c.statuses && %L::text[]', array(select jsonb_array_elements_text(node->'v')))
      when 'tag_id' then format('exists (select 1 from public.contact_tags ct where ct.contact_id = c.id and ct.tag_id = any(%L::uuid[]))', array(select jsonb_array_elements_text(node->'v')))
      when 'location_city' then format('lower(c.location_city) = any(%L::text[])', array(select lower(x) from jsonb_array_elements_text(node->'v') x))
      else 'true'
    end;
  elsif t = 'bool' then
    return case f
      when 'is_key' then format('c.is_key = %L', (node->>'v')::boolean)
      when 'has_email' then case when (node->>'v')::boolean then '(c.email is not null and c.email <> '''')' else '(c.email is null or c.email = '''')' end
      when 'has_phone' then case when (node->>'v')::boolean then '(c.phone is not null and c.phone <> '''')' else '(c.phone is null or c.phone = '''')' end
      when 'has_manager' then case when (node->>'v')::boolean then 'c.reports_to_id is not null' else 'c.reports_to_id is null' end
      when 'has_org' then case when (node->>'v')::boolean then 'c.org_id is not null' else 'c.org_id is null' end
      when 'contacted' then case when (node->>'v')::boolean then 'c.last_contacted is not null' else 'c.last_contacted is null' end
      else 'true'
    end;
  elsif t = 'range' then
    -- Month-based tenure ranges, computed live from the stored start dates.
    col := case f
      when 'role_months' then '(extract(year from age(current_date, c.role_start)) * 12 + extract(month from age(current_date, c.role_start)))'
      when 'company_months' then '(extract(year from age(current_date, c.company_start)) * 12 + extract(month from age(current_date, c.company_start)))'
      when 'contacted_days' then '(current_date - c.last_contacted)'
      else null
    end;
    if col is null then return 'true'; end if;
    parts := '{}';
    if node ? 'min' then parts := parts || format('%s >= %L', col, (node->>'min')::numeric); end if;
    if node ? 'max' then parts := parts || format('%s <= %L', col, (node->>'max')::numeric); end if;
    if coalesce(array_length(parts, 1), 0) = 0 then return 'true'; end if;
    return '(' || array_to_string(parts, ' and ') || ')';
  end if;
  return 'true';
end $$;

create or replace function public.search_contacts(
  p_filter jsonb default '{"t":"and","c":[]}'::jsonb,
  p_sort text default 'default',
  p_limit integer default 100,
  p_offset integer default 0
)
returns table (id uuid, total bigint)
language plpgsql stable security invoker set search_path = '' as $$
declare
  where_sql text := public.compile_contact_filter(p_filter);
  order_sql text := case p_sort
    when 'name' then 'c.last_name, c.first_name'
    when 'updated' then 'c.updated_at desc'
    when 'contacted' then 'c.last_contacted desc nulls last'
    when 'role_start' then 'c.role_start desc nulls last'
    when 'created' then 'c.created_at desc'
    else 'c.is_key desc, array_position(array[''c_level'',''vp'',''director'',''manager'',''ic''], c.seniority) nulls last, c.last_name'
  end;
begin
  return query execute format(
    'select c.id, count(*) over () as total from public.contacts c where %s order by %s limit %s offset %s',
    where_sql, order_sql, greatest(1, least(p_limit, 1000)), greatest(0, p_offset));
end $$;

-- ───────────────────────── Row level security ─────────────────────────
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'accounts','orgs','contacts','influences','notes','tags','contact_tags','research_docs',
    'field_definitions','style_rules','prompts','prompt_versions','saved_views',
    'import_batches','import_items','activity_log'
  ] loop
    execute format('alter table public.%I enable row level security', tbl);
    execute format(
      'create policy "owner full access" on public.%I for all to authenticated
         using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()))', tbl);
  end loop;
end $$;

-- The geocode cache holds public place data only, shared across signed-in users.
alter table public.geocode_cache enable row level security;
create policy "authenticated read" on public.geocode_cache for select to authenticated using (true);
create policy "authenticated write" on public.geocode_cache for insert to authenticated with check (true);
create policy "authenticated update" on public.geocode_cache for update to authenticated using (true);

-- ───────────────────────── Storage ─────────────────────────
-- Avatars are public-read with unguessable paths so 10k images render without signed URLs.
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('uploads', 'uploads', false)
  on conflict (id) do nothing;

create policy "owner writes avatars" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "owner updates avatars" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "owner deletes avatars" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "owner manages uploads" on storage.objects for all to authenticated
  using (bucket_id = 'uploads' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'uploads' and (storage.foldername(name))[1] = (select auth.uid())::text);
