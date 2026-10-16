create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  github_repo_id bigint not null,
  owner_login text not null,
  name text not null,
  full_name text not null,
  description text,
  html_url text not null,
  visibility text not null default 'public' check (visibility = 'public'),
  default_branch text not null,
  language text,
  stargazers_count integer not null default 0 check (stargazers_count >= 0),
  forks_count integer not null default 0 check (forks_count >= 0),
  open_issues_count integer not null default 0 check (open_issues_count >= 0),
  github_created_at timestamptz not null,
  github_updated_at timestamptz not null,
  github_pushed_at timestamptz,
  imported_at timestamptz not null default now(),
  last_synced_at timestamptz,
  unique (owner_id, github_repo_id)
);

alter table public.projects enable row level security;

create policy "Users can read their own projects"
on public.projects for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "Users can import their own projects"
on public.projects for insert
to authenticated
with check ((select auth.uid()) = owner_id);

create policy "Users can update their own projects"
on public.projects for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "Users can delete their own projects"
on public.projects for delete
to authenticated
using ((select auth.uid()) = owner_id);

create index projects_owner_imported_idx
on public.projects (owner_id, imported_at desc);
