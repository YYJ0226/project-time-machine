-- Execute against a migrated database containing at least one real project.
-- All test rows and role changes are rolled back. Never publishes a persistent link.
begin;
select set_config('test.owner', owner_id::text, true), set_config('test.project', id::text, true) from public.projects limit 1;
do $$ begin
  if current_setting('test.project', true) is null then raise exception 'Import a project before running this test'; end if;
end $$;
insert into public.review_shares(project_id, owner_id, token_hash, snapshot, expires_at)
values (current_setting('test.project')::uuid, current_setting('test.owner')::uuid,
 encode(sha256(convert_to(repeat('a',43),'UTF8')),'hex'), '{"version":1,"test":"safe projection"}', now() + interval '1 day');
insert into public.review_shares(project_id, owner_id, token_hash, snapshot, created_at, expires_at)
values (current_setting('test.project')::uuid, current_setting('test.owner')::uuid,
 encode(sha256(convert_to(repeat('b',43),'UTF8')),'hex'), '{"version":1}', now() - interval '3 days', now() - interval '1 day');
set local role anon;
do $$ begin
  if public.get_public_review(repeat('a',43))->>'test' is distinct from 'safe projection' then raise exception 'valid capability failed'; end if;
  if public.get_public_review(repeat('b',43)) is not null then raise exception 'expired capability leaked'; end if;
  if public.get_public_review(repeat('c',43)) is not null then raise exception 'wrong capability leaked'; end if;
  if public.get_public_review('malformed') is not null then raise exception 'malformed capability accepted'; end if;
  begin perform * from public.review_shares; raise exception 'anon can enumerate shares'; exception when insufficient_privilege then null; end;
  begin perform * from public.ai_runs; raise exception 'anon can read AI drafts'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
set local role authenticated;
do $$ begin
  if exists(select 1 from public.review_shares) then raise exception 'other owner can enumerate shares'; end if;
  if exists(select 1 from public.ai_runs) then raise exception 'other owner can read AI runs'; end if;
  begin
    insert into public.review_shares(project_id, owner_id, token_hash, snapshot, expires_at)
    values(current_setting('test.project')::uuid, current_setting('test.owner')::uuid, repeat('d',64), '{}', now() + interval '1 day');
    raise exception 'cross owner insert allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub', current_setting('test.owner'), true);
set local role authenticated;
do $$ begin
  begin update public.review_shares set snapshot = '{"test":"changed"}'; raise exception 'snapshot mutable'; exception when insufficient_privilege then null; end;
  begin update public.review_shares set expires_at = now() + interval '2 days'; raise exception 'expiry mutable'; exception when insufficient_privilege then null; end;
end $$;
update public.review_shares set revoked_at = now() where token_hash = encode(sha256(convert_to(repeat('a',43),'UTF8')),'hex');
reset role;
set local role anon;
do $$ begin if public.get_public_review(repeat('a',43)) is not null then raise exception 'revoked capability leaked'; end if; end $$;
reset role;
rollback;
