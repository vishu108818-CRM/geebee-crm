-- GeeBee CRM private workspace storage and access policy.
create table if not exists public.crm_workspaces (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{"orders":[],"clients":[],"invoices":[],"catalogue":[]}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.crm_workspaces enable row level security;

drop policy if exists "Users manage only their GeeBee workspace" on public.crm_workspaces;
create policy "Users manage only their GeeBee workspace"
on public.crm_workspaces
for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);
