create table public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'running'
    check (status in ('running', 'completed', 'failed')),
  issue_count integer not null default 0 check (issue_count >= 0),
  commit_count integer not null default 0 check (commit_count >= 0),
  pull_request_count integer not null default 0 check (pull_request_count >= 0),
  check_count integer not null default 0 check (check_count >= 0),
  suggestion_count integer not null default 0 check (suggestion_count >= 0),
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.evidence_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('issue', 'commit', 'pull_request', 'check')),
  external_id text not null,
  title text not null,
  summary text,
  state text,
  source_url text not null,
  occurred_at timestamptz not null,
  source_data jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (project_id, kind, external_id)
);

create table public.evidence_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid not null references public.evidence_items(id) on delete cascade,
  target_id uuid not null references public.evidence_items(id) on delete cascade,
  relation text not null check (relation in ('implements', 'contains', 'verifies')),
  status text not null default 'suggested'
    check (status in ('suggested', 'confirmed', 'rejected')),
  confidence numeric(4, 3) not null check (confidence >= 0 and confidence <= 1),
  reasons text[] not null default '{}',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (project_id, source_id, target_id, relation),
  check (source_id <> target_id)
);

alter table public.sync_runs enable row level security;
alter table public.evidence_items enable row level security;
alter table public.evidence_links enable row level security;

create policy "Users can manage sync runs for their projects"
on public.sync_runs for all to authenticated
using (
  (select auth.uid()) = owner_id and exists (
    select 1 from public.projects
    where projects.id = sync_runs.project_id
      and projects.owner_id = (select auth.uid())
  )
)
with check (
  (select auth.uid()) = owner_id and exists (
    select 1 from public.projects
    where projects.id = sync_runs.project_id
      and projects.owner_id = (select auth.uid())
  )
);

create policy "Users can manage evidence for their projects"
on public.evidence_items for all to authenticated
using (
  (select auth.uid()) = owner_id and exists (
    select 1 from public.projects
    where projects.id = evidence_items.project_id
      and projects.owner_id = (select auth.uid())
  )
)
with check (
  (select auth.uid()) = owner_id and exists (
    select 1 from public.projects
    where projects.id = evidence_items.project_id
      and projects.owner_id = (select auth.uid())
  )
);

create policy "Users can manage evidence links for their projects"
on public.evidence_links for all to authenticated
using (
  (select auth.uid()) = owner_id and exists (
    select 1 from public.projects
    where projects.id = evidence_links.project_id
      and projects.owner_id = (select auth.uid())
  )
)
with check (
  (select auth.uid()) = owner_id and exists (
    select 1 from public.projects
    where projects.id = evidence_links.project_id
      and projects.owner_id = (select auth.uid())
  )
  and exists (
    select 1 from public.evidence_items source_item
    where source_item.id = evidence_links.source_id
      and source_item.project_id = evidence_links.project_id
      and source_item.owner_id = (select auth.uid())
  )
  and exists (
    select 1 from public.evidence_items target_item
    where target_item.id = evidence_links.target_id
      and target_item.project_id = evidence_links.project_id
      and target_item.owner_id = (select auth.uid())
  )
);

create index sync_runs_project_started_idx
on public.sync_runs (project_id, started_at desc);

create index evidence_items_project_kind_time_idx
on public.evidence_items (project_id, kind, occurred_at desc);

create index evidence_links_project_status_idx
on public.evidence_links (project_id, status, created_at desc);
