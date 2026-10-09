-- BLK-CRM-02: at most one open dispute per opportunity_id.
-- Rolls back fixtures. Case E uses dblink when available.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '68686868-6868-4868-8868-686868686801', 'authenticated', 'authenticated', 'blk02-admin@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '68686868-6868-4868-8868-686868686802', 'authenticated', 'authenticated', 'blk02-admin2@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '68686868-6868-4868-8868-686868686803', 'authenticated', 'authenticated', 'blk02-prom-a@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '68686868-6868-4868-8868-686868686804', 'authenticated', 'authenticated', 'blk02-prom-b@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '68686868-6868-4868-8868-686868686805', 'authenticated', 'authenticated', 'blk02-support@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

insert into commercial.platform_accounts (id, user_id, kind) values
  ('68686868-6868-4868-8868-686868686811', '68686868-6868-4868-8868-686868686801', 'internal'),
  ('68686868-6868-4868-8868-686868686812', '68686868-6868-4868-8868-686868686802', 'internal'),
  ('68686868-6868-4868-8868-686868686813', '68686868-6868-4868-8868-686868686803', 'promoter'),
  ('68686868-6868-4868-8868-686868686814', '68686868-6868-4868-8868-686868686804', 'promoter'),
  ('68686868-6868-4868-8868-686868686815', '68686868-6868-4868-8868-686868686805', 'internal');

insert into commercial.internal_role_assignments (account_id, role) values
  ('68686868-6868-4868-8868-686868686811', 'superadmin'),
  ('68686868-6868-4868-8868-686868686812', 'superadmin'),
  ('68686868-6868-4868-8868-686868686815', 'support');

insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('68686868-6868-4868-8868-686868686821', '68686868-6868-4868-8868-686868686813', 'pblk02a01', 'Ana Blk02', 'active'),
  ('68686868-6868-4868-8868-686868686822', '68686868-6868-4868-8868-686868686814', 'pblk02b01', 'Luis Blk02', 'active');

insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel)
values ('68686868-6868-4868-8868-686868686831', 'Pan Blk02', 'pan blk02', 'promoter');

insert into commercial.commercial_opportunities (id, commercial_business_id, stage)
values ('68686868-6868-4868-8868-686868686841', '68686868-6868-4868-8868-686868686831', 'new');

insert into commercial.opportunity_attributions (
  id, opportunity_id, promoter_id, status, method, reason
) values (
  '68686868-6868-4868-8868-686868686851',
  '68686868-6868-4868-8868-686868686841',
  '68686868-6868-4868-8868-686868686821',
  'confirmed', 'manual', 'fixture blk02'
);

insert into commercial.attribution_claims (
  id, promoter_id, commercial_business_id, opportunity_id, status, provisional_until
) values (
  '68686868-6868-4868-8868-686868686861',
  '68686868-6868-4868-8868-686868686822',
  '68686868-6868-4868-8868-686868686831',
  '68686868-6868-4868-8868-686868686841',
  'provisional', now() + interval '30 days'
);

do $$
begin
  if to_regclass('commercial.attribution_disputes_one_open_per_opportunity_idx') is null then
    raise exception 'missing attribution_disputes_one_open_per_opportunity_idx';
  end if;
end;
$$;

-- Case A: first open dispute succeeds (multi-party on same opportunity)
do $$
declare
  v_open jsonb;
  v_count int;
  v_parties int;
begin
  perform set_config('request.jwt.claim.sub', '68686868-6868-4868-8868-686868686801', true);
  v_open := commercial.open_dispute(
    '68686868-6868-4868-8868-686868686841',
    array[
      '68686868-6868-4868-8868-686868686821',
      '68686868-6868-4868-8868-686868686822'
    ]::uuid[],
    'primer expediente abierto'
  );
  if v_open->>'ok' is distinct from 'true' then
    raise exception 'case A open returned %', v_open;
  end if;
  select count(*) into v_count
  from commercial.attribution_disputes
  where opportunity_id = '68686868-6868-4868-8868-686868686841'
    and status = 'open';
  if v_count <> 1 then
    raise exception 'case A open count %', v_count;
  end if;
  select count(*) into v_parties
  from commercial.dispute_parties
  where dispute_id = (v_open->>'dispute_id')::uuid;
  if v_parties <> 2 then
    raise exception 'case A party count %', v_parties;
  end if;
  perform set_config('app.blk02_first_dispute', v_open->>'dispute_id', true);
end;
$$;

-- Case B + C: second open rejected for same opportunity even with different parties; no second row
do $$
declare
  v_dup jsonb;
  v_count int;
  v_first uuid := current_setting('app.blk02_first_dispute')::uuid;
begin
  perform set_config('request.jwt.claim.sub', '68686868-6868-4868-8868-686868686802', true);
  v_dup := commercial.open_dispute(
    '68686868-6868-4868-8868-686868686841',
    array['68686868-6868-4868-8868-686868686822']::uuid[],
    'segundo expediente con otras partes'
  );
  if v_dup->>'commercial_error_code' is distinct from 'dispute_open_exists' then
    raise exception 'case B/C duplicate returned %', v_dup;
  end if;
  if v_dup ? 'dispute_id' then
    raise exception 'case B/C leaked dispute_id %', v_dup;
  end if;
  select count(*) into v_count
  from commercial.attribution_disputes
  where opportunity_id = '68686868-6868-4868-8868-686868686841';
  if v_count <> 1 then
    raise exception 'case B/C total disputes %', v_count;
  end if;
  if not exists (
    select 1 from commercial.attribution_disputes
    where id = v_first and status = 'open'
  ) then
    raise exception 'case B/C first dispute altered';
  end if;
end;
$$;

-- Case D: after decide, history kept and a new open dispute is allowed
do $$
declare
  v_first uuid := current_setting('app.blk02_first_dispute')::uuid;
  v_decision jsonb;
  v_second jsonb;
  v_open_count int;
  v_total int;
  v_events int;
  v_parties int;
  v_status text;
  v_decision_text text;
begin
  perform set_config('request.jwt.claim.sub', '68686868-6868-4868-8868-686868686801', true);
  v_decision := commercial.decide_dispute(v_first, 'mantener', 'cierra el primero', 'none', false);
  if v_decision->>'status' is distinct from 'decided' then
    raise exception 'case D decide returned %', v_decision;
  end if;

  select status, decision into v_status, v_decision_text
  from commercial.attribution_disputes where id = v_first;
  if v_status is distinct from 'decided' or v_decision_text is distinct from 'mantener' then
    raise exception 'case D history status/decision % / %', v_status, v_decision_text;
  end if;
  select count(*) into v_events from commercial.dispute_events where dispute_id = v_first;
  if v_events < 2 then
    raise exception 'case D events lost %', v_events;
  end if;
  select count(*) into v_parties from commercial.dispute_parties where dispute_id = v_first;
  if v_parties <> 2 then
    raise exception 'case D parties lost %', v_parties;
  end if;

  v_second := commercial.open_dispute(
    '68686868-6868-4868-8868-686868686841',
    array['68686868-6868-4868-8868-686868686821']::uuid[],
    'nuevo expediente tras cierre'
  );
  if v_second->>'ok' is distinct from 'true' then
    raise exception 'case D reopen returned %', v_second;
  end if;
  if (v_second->>'dispute_id')::uuid = v_first then
    raise exception 'case D silently reopened closed dispute';
  end if;

  select count(*) into v_open_count
  from commercial.attribution_disputes
  where opportunity_id = '68686868-6868-4868-8868-686868686841' and status = 'open';
  select count(*) into v_total
  from commercial.attribution_disputes
  where opportunity_id = '68686868-6868-4868-8868-686868686841';
  if v_open_count <> 1 or v_total <> 2 then
    raise exception 'case D open/total % / %', v_open_count, v_total;
  end if;

  -- closed decision cannot be decided again
  v_decision := commercial.decide_dispute(v_first, 'otra', 'reintento', 'none', false);
  if v_decision->>'commercial_error_code' is distinct from 'dispute_scope' then
    raise exception 'case D redecide returned %', v_decision;
  end if;

  perform set_config('app.blk02_second_dispute', v_second->>'dispute_id', true);
end;
$$;

-- Case E: real two-connection concurrency via async dblink, or NOT_EXECUTED notice
do $$
declare
  v_opp uuid := '68686868-6868-4868-8868-686868686842';
  v_a text;
  v_b text;
  v_open_count int;
  v_ok_count int := 0;
  v_sql_a text;
  v_sql_b text;
begin
  if not exists (select 1 from pg_extension where extname = 'dblink') then
    raise notice 'CONCURRENCY_RUNTIME_VALIDATION: NOT_EXECUTED';
    return;
  end if;

  insert into commercial.commercial_opportunities (id, commercial_business_id, stage)
  values (v_opp, '68686868-6868-4868-8868-686868686831', 'new');
  insert into commercial.opportunity_attributions (
    opportunity_id, promoter_id, status, method, reason
  ) values (
    v_opp, '68686868-6868-4868-8868-686868686821', 'confirmed', 'manual', 'concurrency fixture'
  );

  perform dblink_connect(
    'blk02_a',
    'dbname=' || current_database() || ' user=' || current_user
  );
  perform dblink_connect(
    'blk02_b',
    'dbname=' || current_database() || ' user=' || current_user
  );
  perform dblink_exec('blk02_a', 'begin');
  perform dblink_exec('blk02_b', 'begin');
  perform dblink_exec(
    'blk02_a',
    $sql$select set_config('request.jwt.claim.sub', '68686868-6868-4868-8868-686868686801', true)$sql$
  );
  perform dblink_exec(
    'blk02_b',
    $sql$select set_config('request.jwt.claim.sub', '68686868-6868-4868-8868-686868686802', true)$sql$
  );

  v_sql_a := format(
    $sql$select commercial.open_dispute(%L::uuid, array[%L::uuid], 'race a')::text$sql$,
    v_opp, '68686868-6868-4868-8868-686868686821'
  );
  v_sql_b := format(
    $sql$select commercial.open_dispute(%L::uuid, array[%L::uuid], 'race b')::text$sql$,
    v_opp, '68686868-6868-4868-8868-686868686821'
  );

  if dblink_send_query('blk02_a', v_sql_a) <> 1
    or dblink_send_query('blk02_b', v_sql_b) <> 1 then
    raise exception 'case E failed to send concurrent queries';
  end if;

  select r into v_a from dblink_get_result('blk02_a') as t(r text);
  perform dblink_get_result('blk02_a');
  select r into v_b from dblink_get_result('blk02_b') as t(r text);
  perform dblink_get_result('blk02_b');

  perform dblink_exec('blk02_a', 'commit');
  perform dblink_exec('blk02_b', 'commit');
  perform dblink_disconnect('blk02_a');
  perform dblink_disconnect('blk02_b');

  select count(*) into v_open_count
  from commercial.attribution_disputes
  where opportunity_id = v_opp and status = 'open';
  if v_open_count <> 1 then
    raise exception 'case E open count % (a=% b=%)', v_open_count, v_a, v_b;
  end if;

  if (v_a::jsonb->>'ok') = 'true' then v_ok_count := v_ok_count + 1; end if;
  if (v_b::jsonb->>'ok') = 'true' then v_ok_count := v_ok_count + 1; end if;
  if v_ok_count <> 1 then
    raise exception 'case E expected exactly one ok (a=% b=%)', v_a, v_b;
  end if;
  if (v_a::jsonb->>'ok') is distinct from 'true'
    and (v_a::jsonb->>'commercial_error_code') is distinct from 'dispute_open_exists' then
    raise exception 'case E unexpected a %', v_a;
  end if;
  if (v_b::jsonb->>'ok') is distinct from 'true'
    and (v_b::jsonb->>'commercial_error_code') is distinct from 'dispute_open_exists' then
    raise exception 'case E unexpected b %', v_b;
  end if;

  -- cleanup committed dblink rows so the outer ROLLBACK leaves no residue
  delete from commercial.dispute_events
  where dispute_id in (
    select id from commercial.attribution_disputes where opportunity_id = v_opp
  );
  delete from commercial.dispute_parties
  where dispute_id in (
    select id from commercial.attribution_disputes where opportunity_id = v_opp
  );
  delete from commercial.attribution_disputes where opportunity_id = v_opp;
  delete from commercial.opportunity_attributions where opportunity_id = v_opp;
  delete from commercial.commercial_opportunities where id = v_opp;
exception
  when others then
    begin perform dblink_disconnect('blk02_a'); exception when others then null; end;
    begin perform dblink_disconnect('blk02_b'); exception when others then null; end;
    raise;
end;
$$;

-- Case F: security — promoter cannot open; support cannot open; duplicate response leaks no id;
-- other promoter cannot read; support cannot decide
do $$
declare
  v_promoter jsonb;
  v_support jsonb;
  v_dup jsonb;
  v_read jsonb;
  v_decide jsonb;
  v_second uuid := current_setting('app.blk02_second_dispute')::uuid;
begin
  perform set_config('request.jwt.claim.sub', '68686868-6868-4868-8868-686868686803', true);
  v_promoter := commercial.open_dispute(
    '68686868-6868-4868-8868-686868686841',
    array['68686868-6868-4868-8868-686868686821']::uuid[],
    'promotor no abre'
  );
  if v_promoter->>'commercial_error_code' is distinct from 'dispute_scope' then
    raise exception 'case F promoter open returned %', v_promoter;
  end if;

  perform set_config('request.jwt.claim.sub', '68686868-6868-4868-8868-686868686805', true);
  v_support := commercial.open_dispute(
    '68686868-6868-4868-8868-686868686841',
    array['68686868-6868-4868-8868-686868686821']::uuid[],
    'soporte no abre'
  );
  if v_support->>'commercial_error_code' is distinct from 'forbidden' then
    raise exception 'case F support open returned %', v_support;
  end if;

  perform set_config('request.jwt.claim.sub', '68686868-6868-4868-8868-686868686802', true);
  v_dup := commercial.open_dispute(
    '68686868-6868-4868-8868-686868686841',
    array['68686868-6868-4868-8868-686868686821']::uuid[],
    'duplicado sin filtrar id'
  );
  if v_dup->>'commercial_error_code' is distinct from 'dispute_open_exists' or v_dup ? 'dispute_id' then
    raise exception 'case F duplicate leak %', v_dup;
  end if;

  perform set_config('request.jwt.claim.sub', '68686868-6868-4868-8868-686868686804', true);
  v_read := commercial.read_dispute(v_second);
  if v_read->>'commercial_error_code' is distinct from 'forbidden' then
    raise exception 'case F other promoter read returned %', v_read;
  end if;

  perform set_config('request.jwt.claim.sub', '68686868-6868-4868-8868-686868686805', true);
  v_decide := commercial.decide_dispute(v_second, 'x', 'motivo', 'none', false);
  if v_decide->>'commercial_error_code' is distinct from 'forbidden' then
    raise exception 'case F support decide returned %', v_decide;
  end if;
end;
$$;

-- Case G: historical decided row remains; attribution untouched by none-effect decide
do $$
declare
  v_first uuid := current_setting('app.blk02_first_dispute')::uuid;
  v_attr text;
  v_hist int;
begin
  select status into v_attr
  from commercial.opportunity_attributions
  where id = '68686868-6868-4868-8868-686868686851';
  if v_attr is distinct from 'confirmed' then
    raise exception 'case G attribution altered %', v_attr;
  end if;

  select count(*) into v_hist
  from commercial.attribution_disputes
  where id = v_first and status = 'decided' and decision = 'mantener';
  if v_hist <> 1 then
    raise exception 'case G historical decided missing';
  end if;

  if to_regclass('commercial.promoter_commissions') is not null then
    raise exception 'case G commissions table unexpectedly present';
  end if;
end;
$$;

rollback;
