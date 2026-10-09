-- P02-T05 read scope. Rolls back fixtures.
begin;

select set_config('request.jwt.claim.sub', '40404040-4040-4040-8040-404040404001', true);
do $$
declare
  v_list jsonb;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values
    ('00000000-0000-0000-0000-000000000000', '40404040-4040-4040-8040-404040404001', 'authenticated', 'authenticated', 'phase02-board-support@local.test', 'test-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    ('00000000-0000-0000-0000-000000000000', '40404040-4040-4040-8040-404040404002', 'authenticated', 'authenticated', 'phase02-board-commercial@local.test', 'test-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

  insert into commercial.platform_accounts (id, user_id, kind) values
    ('40404040-4040-4040-8040-404040404011', '40404040-4040-4040-8040-404040404001', 'internal'),
    ('40404040-4040-4040-8040-404040404012', '40404040-4040-4040-8040-404040404002', 'internal');
  insert into commercial.internal_role_assignments (account_id, role) values
    ('40404040-4040-4040-8040-404040404011', 'support'),
    ('40404040-4040-4040-8040-404040404012', 'commercial');

  perform commercial.submit_demo_request(
    'Nora', 'Heladeria Centro', '11 5555-0301', 'heladeria', null, null, null, null, 'board-demo-1', 'board-ip'
  );

  perform set_config('request.jwt.claim.sub', '40404040-4040-4040-8040-404040404001', true);
  v_list := commercial.list_open_opportunities();
  if jsonb_array_length(v_list->'opportunities') <> 0 then
    raise exception 'support board returned %', v_list;
  end if;

  perform set_config('request.jwt.claim.sub', '40404040-4040-4040-8040-404040404002', true);
  v_list := commercial.list_open_opportunities();
  if jsonb_array_length(v_list->'opportunities') <> 1 then
    raise exception 'commercial board returned %', v_list;
  end if;

  if (commercial.transition_opportunity((v_list->'opportunities'->0->>'id')::uuid, 'contacting', null)->>'ok') is distinct from 'true' then
    raise exception 'contacting transition failed';
  end if;
  if not exists (
    select 1 from commercial.opportunity_stage_events
    where opportunity_id = (v_list->'opportunities'->0->>'id')::uuid
      and to_stage = 'contacting'
  ) then
    raise exception 'contacting event missing';
  end if;
end;
$$;

rollback;
