-- P02-T03. Rolls back fixtures.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '30303030-3030-4030-8030-303030303001',
  'authenticated',
  'authenticated',
  'phase02-pipeline@local.test',
  'test-only',
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
);

insert into commercial.platform_accounts (id, user_id, kind)
values ('30303030-3030-4030-8030-303030303011', '30303030-3030-4030-8030-303030303001', 'internal');

insert into commercial.internal_role_assignments (account_id, role)
values ('30303030-3030-4030-8030-303030303011', 'commercial');

insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel)
values ('30303030-3030-4030-8030-303030303021', 'Pipeline Demo', 'pipeline demo', 'organic');

insert into commercial.commercial_opportunities (id, commercial_business_id, stage)
values ('30303030-3030-4030-8030-303030303031', '30303030-3030-4030-8030-303030303021', 'new');

select set_config('request.jwt.claim.sub', '30303030-3030-4030-8030-303030303001', true);

do $$
declare
  v_result jsonb;
  v_events int;
  v_audits int;
begin
  v_result := commercial.transition_opportunity('30303030-3030-4030-8030-303030303031', 'demo_done', null);
  if v_result->>'ok' is distinct from 'true' then
    raise exception 'demo_done transition failed: %', v_result;
  end if;

  select count(*) into v_events
  from commercial.opportunity_stage_events
  where opportunity_id = '30303030-3030-4030-8030-303030303031'
    and from_stage = 'new'
    and to_stage = 'demo_done';
  select count(*) into v_audits
  from commercial.audit_events
  where entity_id = '30303030-3030-4030-8030-303030303031'
    and action = 'opportunity.stage';
  if v_events <> 1 or v_audits <> 1 then
    raise exception 'stage event % audit %', v_events, v_audits;
  end if;

  v_result := commercial.transition_opportunity('30303030-3030-4030-8030-303030303031', 'lost', null);
  if v_result->>'commercial_error_code' is distinct from 'lost_reason_required' then
    raise exception 'lost without reason returned %', v_result;
  end if;

  v_result := commercial.transition_opportunity('30303030-3030-4030-8030-303030303031', 'won', null);
  if v_result->>'commercial_error_code' is distinct from 'won_requires_business' then
    raise exception 'won returned %', v_result;
  end if;

  v_result := commercial.upsert_task(
    '30303030-3030-4030-8030-303030303031', null, 'Llamar', 'open', now(), 'normal', null
  );
  if v_result->>'ok' is distinct from 'true' then
    raise exception 'task insert failed: %', v_result;
  end if;

  v_result := commercial.transition_opportunity('30303030-3030-4030-8030-303030303031', 'lost', 'sin interes');
  if v_result->>'commercial_error_code' is distinct from 'open_tasks_remaining' then
    raise exception 'open task did not block close: %', v_result;
  end if;

  if position('attribution_claims' in pg_get_functiondef('commercial.transition_opportunity(uuid,text,text)'::regprocedure)) > 0 then
    raise exception 'pipeline writes attribution claims';
  end if;
end;
$$;

set local role anon;
do $$
begin
  begin
    perform commercial.transition_opportunity('30303030-3030-4030-8030-303030303031', 'contacting', null);
    raise exception 'anon transition was accepted';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;
reset role;

rollback;
