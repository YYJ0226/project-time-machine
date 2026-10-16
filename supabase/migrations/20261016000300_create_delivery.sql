create table public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('running','completed','failed')),
  review_status text not null default 'draft' check (review_status in ('draft','approved','rejected')),
  model text not null,
  prompt_version text not null,
  input_hash text not null,
  evidence_ids uuid[] not null,
  output jsonb,
  reviewed_output jsonb,
  usage jsonb,
  error_code text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  reviewed_at timestamptz,
  check (review_status <> 'approved' or (status = 'completed' and reviewed_output is not null and reviewed_at is not null))
);
-- Only one request per project at a time; a timed-out attempt can be marked failed before retry.
create unique index ai_runs_one_running on public.ai_runs(project_id) where status = 'running';
create index ai_runs_project_time on public.ai_runs(project_id, created_at desc);
alter table public.ai_runs enable row level security;
create policy "Owner manages AI ledger" on public.ai_runs for all to authenticated
using (owner_id = (select auth.uid()) and exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid())))
with check (owner_id = (select auth.uid()) and exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid())));

create table public.review_shares (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null check (expires_at <= created_at + interval '30 days' and expires_at > created_at),
  revoked_at timestamptz
);
alter table public.review_shares enable row level security;
create policy "Owner reads shares" on public.review_shares for select to authenticated
using (owner_id = (select auth.uid()));
create policy "Owner creates shares" on public.review_shares for insert to authenticated
with check (owner_id = (select auth.uid()) and exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid()) and p.visibility = 'public'));
-- Snapshot and expiry are immutable through the application role. Revocation is the only update.
revoke all on public.review_shares from anon, authenticated;
grant select, insert on public.review_shares to authenticated;
grant update (revoked_at) on public.review_shares to authenticated;
create policy "Owner revokes shares" on public.review_shares for update to authenticated
using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()) and revoked_at is not null);
revoke all on public.ai_runs from anon;
grant select, insert, update, delete on public.ai_runs to authenticated;

-- A bearer capability reveals exactly one immutable snapshot, never the underlying tables.
create function public.get_public_review(p_token text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select s.snapshot from public.review_shares s
  where p_token ~ '^[A-Za-z0-9_-]{43}$'
    and s.token_hash = pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p_token, 'UTF8')), 'hex')
    and s.revoked_at is null and s.expires_at > pg_catalog.now()
    and exists (select 1 from public.projects p where p.id = s.project_id and p.visibility = 'public')
  limit 1;
$$;
revoke all on function public.get_public_review(text) from public;
grant execute on function public.get_public_review(text) to anon, authenticated;
