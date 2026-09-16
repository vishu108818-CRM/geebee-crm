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

-- Run the following access-control upgrade after the original table exists.
create table if not exists public.crm_workspace_members (
  id bigint generated always as identity primary key,
  workspace_owner_id uuid not null references public.crm_workspaces(owner_id) on delete cascade,
  email text not null,
  role text not null default 'employee' check (role in ('admin', 'employee')),
  modules text[] not null default array['Overview'],
  created_at timestamptz not null default now(),
  unique (workspace_owner_id, email)
);

alter table public.crm_workspace_members enable row level security;

drop policy if exists "Workspace members can view their own access" on public.crm_workspace_members;
create policy "Workspace members can view their own access"
on public.crm_workspace_members for select to authenticated
using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')) or workspace_owner_id = auth.uid());

drop policy if exists "Workspace owner manages member access" on public.crm_workspace_members;
create policy "Workspace owner manages member access"
on public.crm_workspace_members for all to authenticated
using (workspace_owner_id = auth.uid())
with check (workspace_owner_id = auth.uid());

drop policy if exists "Workspace members can access shared CRM data" on public.crm_workspaces;
create policy "Workspace members can access shared CRM data"
on public.crm_workspaces for select to authenticated
using (owner_id = auth.uid() or exists (
  select 1 from public.crm_workspace_members m
  where m.workspace_owner_id = crm_workspaces.owner_id
  and lower(m.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
));

drop policy if exists "Workspace members can update shared CRM data" on public.crm_workspaces;
create policy "Workspace members can update shared CRM data"
on public.crm_workspaces for update to authenticated
using (owner_id = auth.uid() or exists (
  select 1 from public.crm_workspace_members m
  where m.workspace_owner_id = crm_workspaces.owner_id
  and lower(m.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
));

create table if not exists public.crm_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  email text not null,
  created_at timestamptz not null default now()
);
alter table public.crm_profiles enable row level security;
drop policy if exists "Users manage their own profile" on public.crm_profiles;
create policy "Users manage their own profile" on public.crm_profiles for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.crm_audit_events (
  id bigint generated always as identity primary key,
  workspace_owner_id uuid not null references public.crm_workspaces(owner_id) on delete cascade,
  actor_email text not null,
  action text not null,
  module text not null,
  details text not null default '',
  created_at timestamptz not null default now()
);
alter table public.crm_audit_events enable row level security;
drop policy if exists "Workspace can read audit history" on public.crm_audit_events;
create policy "Workspace can read audit history" on public.crm_audit_events for select to authenticated using (workspace_owner_id = auth.uid() or exists (select 1 from public.crm_workspace_members m where m.workspace_owner_id = crm_audit_events.workspace_owner_id and lower(m.email) = lower(coalesce(auth.jwt() ->> 'email', ''))));
drop policy if exists "Workspace can write audit history" on public.crm_audit_events;
create policy "Workspace can write audit history" on public.crm_audit_events for insert to authenticated with check (workspace_owner_id = auth.uid() or exists (select 1 from public.crm_workspace_members m where m.workspace_owner_id = crm_audit_events.workspace_owner_id and lower(m.email) = lower(coalesce(auth.jwt() ->> 'email', ''))));
