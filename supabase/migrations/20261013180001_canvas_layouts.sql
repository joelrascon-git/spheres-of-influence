-- ───────────────────────── Canvas layouts ─────────────────────────
-- Manual node positions and membership for each account canvas view, saved per
-- user so drag-and-drop arrangements survive reloads.

create table public.canvas_layouts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  view text not null check (view in ('people','hierarchy')),
  positions jsonb not null default '{}'::jsonb,
  added jsonb not null default '[]'::jsonb,
  hidden jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create unique index canvas_layouts_owner_view_uidx on public.canvas_layouts (owner_id, account_id, view);

alter table public.canvas_layouts enable row level security;

create policy "canvas layouts owner read" on public.canvas_layouts
  for select using (auth.uid() = owner_id);
create policy "canvas layouts owner insert" on public.canvas_layouts
  for insert with check (auth.uid() = owner_id);
create policy "canvas layouts owner update" on public.canvas_layouts
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "canvas layouts owner delete" on public.canvas_layouts
  for delete using (auth.uid() = owner_id);
