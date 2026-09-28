-- Store each authenticated user's workspace snapshot after TOTP verification.
create table if not exists public.workspace_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.workspace_state enable row level security;

create policy "owner_reads_aal2" on public.workspace_state
  for select to authenticated
  using (user_id = (select auth.uid()) and (select auth.jwt()->>'aal') = 'aal2');

create policy "owner_inserts_aal2" on public.workspace_state
  for insert to authenticated
  with check (user_id = (select auth.uid()) and (select auth.jwt()->>'aal') = 'aal2');

create policy "owner_updates_aal2" on public.workspace_state
  for update to authenticated
  using (user_id = (select auth.uid()) and (select auth.jwt()->>'aal') = 'aal2')
  with check (user_id = (select auth.uid()) and (select auth.jwt()->>'aal') = 'aal2');

grant select, insert, update on public.workspace_state to authenticated;
