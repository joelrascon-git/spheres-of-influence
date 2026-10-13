-- Spheres of Influence: knowledge schema.
-- Initiatives, challenges, inferences (confidence-scored proposals with human review),
-- the persona catalog, research-doc scopes, and research columns on contacts/orgs/accounts.

-- ───────────────────────── Accounts: entity classification ─────────────────────────
alter table public.accounts add column entity_type text
  check (entity_type in ('parent','operating_sub','regulated_bank','jv','acquired_product','other_sub','partner','separate_company'));
alter table public.accounts add column out_of_scope boolean not null default false;

-- ───────────────────────── Orgs: research attributions ─────────────────────────
alter table public.orgs add column factory_fit text
  check (factory_fit in ('very_high','high','medium_high','medium','low'));
alter table public.orgs add column buying_role text;
alter table public.orgs add column rank integer;
alter table public.orgs add column confidence text
  check (confidence in ('confirmed','secondhand','unverified','inference'));

-- ───────────────────────── Contacts: persona + inference fields ─────────────────────────
alter table public.contacts add column seniority_level text
  check (seniority_level in ('L1','L2','L3','L4','L5','L6'));
alter table public.contacts add column function_bucket integer
  check (function_bucket between 1 and 20);
alter table public.contacts add column persona_status text
  check (persona_status in ('assumed','indicated','validated'));
alter table public.contacts add column champion_flag text not null default 'none'
  check (champion_flag in ('none','potential','validated'));
alter table public.contacts add column can_veto boolean;
alter table public.contacts add column influence_score integer
  check (influence_score between 0 and 100);
alter table public.contacts add column engage_stage text;
alter table public.contacts add column buying_role text;
alter table public.contacts add column evidence jsonb not null default '[]'::jsonb;
alter table public.contacts add column gaps text[] not null default '{}';
-- Maintained by contacts_build_search: names + codes of linked initiatives and challenges.
alter table public.contacts add column programs_text text not null default '';
create index contacts_persona_status_idx on public.contacts (owner_id, persona_status);
create index contacts_influence_idx on public.contacts (owner_id, influence_score desc nulls last);

-- ───────────────────────── Research docs: scopes and types ─────────────────────────
-- Seller-scoped documents (e.g. the Factory product knowledge base and persona rules)
-- are not tied to one account.
alter table public.research_docs alter column account_id drop not null;
alter table public.research_docs add column scope text not null default 'account'
  check (scope in ('account','seller'));
alter table public.research_docs add column doc_type text not null default 'other'
  check (doc_type in ('entity_map','org_map','key_contacts','initiatives','challenges','product_kb','personas','research','other'));

-- ───────────────────────── Imports: long applies run in chunks ─────────────────────────
alter table public.import_batches drop constraint import_batches_status_check;
alter table public.import_batches add constraint import_batches_status_check
  check (status in ('processing','review','applying','applied','discarded'));

-- ───────────────────────── Initiatives ─────────────────────────
create table public.initiatives (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  code text not null,
  name text not null,
  summary text,
  why_it_matters text,
  solving_for text,
  factory_fit text check (factory_fit in ('very_strong','strong','medium_strong','medium','weak')),
  factory_hypothesis text,
  technologies text[] not null default '{}',
  key_dates jsonb not null default '[]'::jsonb,
  rank integer,
  confidence text check (confidence in ('confirmed','secondhand','unverified','inference')),
  sources jsonb not null default '[]'::jsonb,
  doc_id uuid references public.research_docs(id) on delete set null,
  notes text,
  custom_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, account_id, code)
);
create index initiatives_account_idx on public.initiatives (account_id);
create trigger initiatives_updated_at before update on public.initiatives
  for each row execute function public.set_updated_at();

-- ───────────────────────── Challenges ─────────────────────────
create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  code text not null,
  name text not null,
  summary text,
  why_it_matters text,
  impact text,
  entity text,
  factory_fit text check (factory_fit in ('very_strong','strong','medium_strong','medium','weak')),
  factory_hypothesis text,
  key_dates jsonb not null default '[]'::jsonb,
  rank integer,
  confidence text check (confidence in ('confirmed','secondhand','unverified','inference')),
  sources jsonb not null default '[]'::jsonb,
  doc_id uuid references public.research_docs(id) on delete set null,
  notes text,
  custom_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, account_id, code)
);
create index challenges_account_idx on public.challenges (account_id);
create trigger challenges_updated_at before update on public.challenges
  for each row execute function public.set_updated_at();

-- ───────────────────────── Contact ↔ program links ─────────────────────────
create table public.contact_initiatives (
  contact_id uuid not null references public.contacts(id) on delete cascade,
  initiative_id uuid not null references public.initiatives(id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  strength text not null default 'documented' check (strength in ('documented','inferred')),
  source text not null default 'manual' check (source in ('research','import','ai','manual')),
  note text,
  created_at timestamptz not null default now(),
  primary key (contact_id, initiative_id)
);
create index contact_initiatives_initiative_idx on public.contact_initiatives (initiative_id);

create table public.contact_challenges (
  contact_id uuid not null references public.contacts(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  strength text not null default 'documented' check (strength in ('documented','inferred')),
  source text not null default 'manual' check (source in ('research','import','ai','manual')),
  note text,
  created_at timestamptz not null default now(),
  primary key (contact_id, challenge_id)
);
create index contact_challenges_challenge_idx on public.contact_challenges (challenge_id);

create table public.org_initiatives (
  org_id uuid not null references public.orgs(id) on delete cascade,
  initiative_id uuid not null references public.initiatives(id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  source text not null default 'manual' check (source in ('research','import','ai','manual')),
  created_at timestamptz not null default now(),
  primary key (org_id, initiative_id)
);
create index org_initiatives_initiative_idx on public.org_initiatives (initiative_id);

-- ───────────────────────── Inferences (proposals awaiting human review) ─────────────────────────
-- subject_id is intentionally not a foreign key: the subject is polymorphic.
create table public.inferences (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  subject_type text not null check (subject_type in ('contact','org','account','initiative','challenge')),
  subject_id uuid not null,
  kind text not null check (kind in
    ('persona','seniority_level','org_assignment','key_person','reporting_line','initiative_link','challenge_link','field','summary')),
  value jsonb not null default '{}'::jsonb,
  confidence text not null default 'inference'
    check (confidence in ('confirmed','secondhand','unverified','inference')),
  evidence jsonb not null default '[]'::jsonb,
  rationale text,
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  source text not null default 'import' check (source in ('research','import','ai','manual')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index inferences_queue_idx on public.inferences (owner_id, status, subject_type, created_at desc);
create index inferences_subject_idx on public.inferences (subject_id);

-- ───────────────────────── Persona catalog ─────────────────────────
create table public.persona_catalog (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  code text not null,
  name text not null,
  definition text,
  one_liner text,
  weight integer not null default 5 check (weight between 1 and 10),
  can_veto boolean not null default false,
  meddpicc text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, code)
);
create trigger persona_catalog_updated_at before update on public.persona_catalog
  for each row execute function public.set_updated_at();

-- ───────────────────────── Search text: programs and new persona fields ─────────────────────────
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
  select coalesce(string_agg(x.txt, ' '), '') into new.programs_text from (
    select i.name || ' ' || i.code as txt
      from public.contact_initiatives ci join public.initiatives i on i.id = ci.initiative_id
     where ci.contact_id = new.id
    union all
    select c.name || ' ' || c.code
      from public.contact_challenges cc join public.challenges c on c.id = cc.challenge_id
     where cc.contact_id = new.id
  ) x;

  new.search_text := lower(concat_ws(' ',
    new.first_name, new.last_name, new.title, new.headline, new.summary, new.job_description,
    new.location, org_name, acct_name, new.tags_text, new.notes_text, new.programs_text,
    public.html_to_text(new.key_reasoning), new.reports_to_evidence,
    array_to_string(new.personas, ' '), array_to_string(new.statuses, ' '),
    new.seniority, new.seniority_level, new.email, new.profile_industry,
    new.buying_role, new.engage_stage, array_to_string(new.gaps, ' '),
    (select string_agg(key || ' ' || value, ' ') from jsonb_each_text(new.personal_details)),
    (select string_agg(value, ' ') from jsonb_each_text(new.custom_fields))
  ));
  -- Bump Last Updated only when the contact's own data changed. Child-row touches set
  -- updated_at explicitly; search refreshes after an org/account/tag/program rename leave it alone.
  if tg_op = 'UPDATE'
     and new.updated_at = old.updated_at
     and (to_jsonb(new) - array['search_text','notes_text','tags_text','programs_text','updated_at','full_name'])
         is distinct from (to_jsonb(old) - array['search_text','notes_text','tags_text','programs_text','updated_at','full_name']) then
    new.updated_at := now();
  end if;
  return new;
end $$;

-- Program links and renames keep contact search current, like tags and notes.
create trigger contact_initiatives_touch_contact after insert or update or delete on public.contact_initiatives
  for each row execute function public.touch_contact_from_child();
create trigger contact_challenges_touch_contact after insert or update or delete on public.contact_challenges
  for each row execute function public.touch_contact_from_child();

create or replace function public.refresh_contacts_search()
returns trigger language plpgsql set search_path = '' as $$
begin
  -- Nested ifs keep each branch's row-field access lazy: this function serves several
  -- tables, and Postgres does not guarantee AND short-circuits row constructors.
  if tg_table_name = 'orgs' then
    if (new.name, new.aliases) is distinct from (old.name, old.aliases) then
      update public.contacts set updated_at = updated_at where org_id = new.id;
    end if;
  elsif tg_table_name = 'accounts' then
    if new.name is distinct from old.name then
      update public.contacts set updated_at = updated_at where account_id = new.id;
    end if;
  elsif tg_table_name = 'tags' then
    if new.name is distinct from old.name then
      update public.contacts c set updated_at = c.updated_at
        from public.contact_tags ct where ct.tag_id = new.id and ct.contact_id = c.id;
    end if;
  elsif tg_table_name = 'initiatives' then
    if new.name is distinct from old.name then
      update public.contacts c set updated_at = c.updated_at
        from public.contact_initiatives ci where ci.initiative_id = new.id and ci.contact_id = c.id;
    end if;
  elsif tg_table_name = 'challenges' then
    if new.name is distinct from old.name then
      update public.contacts c set updated_at = c.updated_at
        from public.contact_challenges cc where cc.challenge_id = new.id and cc.contact_id = c.id;
    end if;
  end if;
  return null;
end $$;

create trigger initiatives_refresh_search after update on public.initiatives
  for each row execute function public.refresh_contacts_search();
create trigger challenges_refresh_search after update on public.challenges
  for each row execute function public.refresh_contacts_search();

-- ───────────────────────── Boolean search: new facets, vetoes, influence ─────────────────────────
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
      when 'buying_role' then 'lower(coalesce(c.buying_role, ''''))'
      when 'seniority' then 'lower(coalesce(c.seniority, ''''))'
      when 'level' then 'lower(coalesce(c.seniority_level, ''''))'
      when 'engage_stage' then 'lower(coalesce(c.engage_stage, ''''))'
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
      when 'seniority_level' then format('c.seniority_level = any(%L::text[])', array(select jsonb_array_elements_text(node->'v')))
      when 'persona_status' then format('c.persona_status = any(%L::text[])', array(select jsonb_array_elements_text(node->'v')))
      when 'champion_flag' then format('c.champion_flag = any(%L::text[])', array(select jsonb_array_elements_text(node->'v')))
      when 'engage_stage' then format('c.engage_stage = any(%L::text[])', array(select jsonb_array_elements_text(node->'v')))
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
      when 'can_veto' then case when (node->>'v')::boolean then 'c.can_veto is true' else 'c.can_veto is not true' end
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
      when 'influence_score' then 'c.influence_score'
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
    when 'influence' then 'c.influence_score desc nulls last, c.last_name, c.first_name'
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
    'initiatives','challenges','contact_initiatives','contact_challenges','org_initiatives',
    'inferences','persona_catalog'
  ] loop
    execute format('alter table public.%I enable row level security', tbl);
    execute format(
      'create policy "owner full access" on public.%I for all to authenticated
         using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()))', tbl);
  end loop;
end $$;
