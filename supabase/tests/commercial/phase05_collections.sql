-- P05-T01. Rolls back. Does not create commissions, slots, or settlements.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '88888888-8888-4888-8888-888888888801', 'authenticated', 'authenticated', 'phase05-finance@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '88888888-8888-4888-8888-888888888802', 'authenticated', 'authenticated', 'phase05-super@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '88888888-8888-4888-8888-888888888803', 'authenticated', 'authenticated', 'phase05-commercial@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '88888888-8888-4888-8888-888888888804', 'authenticated', 'authenticated', 'phase05-promoter@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

insert into commercial.platform_accounts (id, user_id, kind) values
  ('88888888-8888-4888-8888-888888888811', '88888888-8888-4888-8888-888888888801', 'internal'),
  ('88888888-8888-4888-8888-888888888812', '88888888-8888-4888-8888-888888888802', 'internal'),
  ('88888888-8888-4888-8888-888888888813', '88888888-8888-4888-8888-888888888803', 'internal'),
  ('88888888-8888-4888-8888-888888888814', '88888888-8888-4888-8888-888888888804', 'promoter');
insert into commercial.internal_role_assignments (account_id, role) values
  ('88888888-8888-4888-8888-888888888811', 'finance'),
  ('88888888-8888-4888-8888-888888888812', 'superadmin'),
  ('88888888-8888-4888-8888-888888888813', 'commercial');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('88888888-8888-4888-8888-888888888821', '88888888-8888-4888-8888-888888888814', 'pcol00000001', 'Promotor Collections', 'active');
insert into public.businesses (id, name, slug, whatsapp_number) values
  ('88888888-8888-4888-8888-888888888831', 'Negocio Collections A', 'negocio-collections-a', '5491100000081'),
  ('88888888-8888-4888-8888-888888888832', 'Negocio Collections B', 'negocio-collections-b', '5491100000082');
insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel) values
  ('88888888-8888-4888-8888-888888888841', 'Lead Collections A', 'lead collections a', 'promoter'),
  ('88888888-8888-4888-8888-888888888842', 'Lead Collections B', 'lead collections b', 'promoter');
insert into commercial.commercial_opportunities (id, commercial_business_id, stage, owner_account_id) values
  ('88888888-8888-4888-8888-888888888851', '88888888-8888-4888-8888-888888888841', 'demo_done', '88888888-8888-4888-8888-888888888814'),
  ('88888888-8888-4888-8888-888888888852', '88888888-8888-4888-8888-888888888842', 'demo_done', '88888888-8888-4888-8888-888888888814');
insert into commercial.opportunity_attributions (id, opportunity_id, promoter_id, status, method, reason) values
  ('88888888-8888-4888-8888-888888888861', '88888888-8888-4888-8888-888888888851', '88888888-8888-4888-8888-888888888821', 'confirmed', 'manual', 'fixture'),
  ('88888888-8888-4888-8888-888888888862', '88888888-8888-4888-8888-888888888852', '88888888-8888-4888-8888-888888888821', 'confirmed', 'manual', 'fixture');

select set_config('request.jwt.claim.sub', '88888888-8888-4888-8888-888888888802', true);

do $$
declare
  v_a jsonb;
  v_b jsonb;
  v_result jsonb;
  v_setup uuid;
  v_month_one uuid;
  v_month_two uuid;
  v_other uuid;
  v_collection uuid;
  v_count int;
  v_obligation commercial.platform_obligations%rowtype;
  v_row commercial.platform_collections%rowtype;
begin
  v_a := commercial.win_opportunity(
    '88888888-8888-4888-8888-888888888851',
    '88888888-8888-4888-8888-888888888831',
    null
  );
  v_b := commercial.win_opportunity(
    '88888888-8888-4888-8888-888888888852',
    '88888888-8888-4888-8888-888888888832',
    null
  );
  if v_a->>'status' is distinct from 'won' or v_b->>'status' is distinct from 'won' then
    raise exception 'wins returned % and %', v_a, v_b;
  end if;
  if exists (select 1 from commercial.platform_obligations) then
    raise exception 'win created an obligation';
  end if;
  if exists (select 1 from commercial.platform_collections) then
    raise exception 'win created a collection';
  end if;

  perform set_config('request.jwt.claim.sub', '88888888-8888-4888-8888-888888888803', true);
  v_result := public.open_obligation((v_a->>'conversion_terms_id')::uuid, 'setup', null);
  if v_result->>'commercial_error_code' is distinct from 'forbidden' then
    raise exception 'commercial open returned %', v_result;
  end if;

  perform set_config('request.jwt.claim.sub', '88888888-8888-4888-8888-888888888802', true);
  v_result := public.open_obligation((v_a->>'conversion_terms_id')::uuid, 'setup', null);
  if v_result->>'commercial_error_code' is distinct from 'forbidden' then
    raise exception 'superadmin open returned %', v_result;
  end if;

  perform set_config('request.jwt.claim.sub', '', true);
  v_result := public.open_obligation((v_a->>'conversion_terms_id')::uuid, 'setup', null);
  if v_result->>'commercial_error_code' is distinct from 'unauthenticated' then
    raise exception 'empty session returned %', v_result;
  end if;

  perform set_config('request.jwt.claim.sub', '88888888-8888-4888-8888-888888888801', true);
  v_result := public.open_obligation((v_a->>'conversion_terms_id')::uuid, 'setup', 'month-1');
  if v_result->>'commercial_error_code' is distinct from 'validation' then
    raise exception 'setup with period returned %', v_result;
  end if;
  v_result := public.open_obligation((v_a->>'conversion_terms_id')::uuid, 'subscription', null);
  if v_result->>'commercial_error_code' is distinct from 'validation' then
    raise exception 'subscription without period returned %', v_result;
  end if;
  v_result := public.open_obligation((v_a->>'conversion_terms_id')::uuid, 'setup', null);
  if v_result->>'ok' is distinct from 'true'
    or v_result->>'duplicate' is distinct from 'false'
    or (v_result->>'list_price_cents')::bigint <> 29000000
    or v_result->>'status' is distinct from 'open' then
    raise exception 'setup open returned %', v_result;
  end if;
  v_setup := (v_result->>'obligation_id')::uuid;

  v_result := public.open_obligation((v_a->>'conversion_terms_id')::uuid, 'setup', '  ');
  if v_result->>'duplicate' is distinct from 'true'
    or (v_result->>'obligation_id')::uuid is distinct from v_setup then
    raise exception 'repeated setup returned %', v_result;
  end if;

  v_result := public.open_obligation((v_a->>'conversion_terms_id')::uuid, 'subscription', ' month-1 ');
  if v_result->>'duplicate' is distinct from 'false'
    or (v_result->>'list_price_cents')::bigint <> 5500000
    or v_result->>'period_key' is distinct from 'month-1' then
    raise exception 'subscription open returned %', v_result;
  end if;
  v_month_one := (v_result->>'obligation_id')::uuid;
  v_result := public.open_obligation((v_a->>'conversion_terms_id')::uuid, 'subscription', 'month-1');
  if (v_result->>'obligation_id')::uuid is distinct from v_month_one
    or v_result->>'duplicate' is distinct from 'true' then
    raise exception 'repeated period returned %', v_result;
  end if;
  v_result := public.open_obligation((v_a->>'conversion_terms_id')::uuid, 'subscription', 'month-2');
  v_month_two := (v_result->>'obligation_id')::uuid;
  if v_month_two is not distinct from v_month_one then
    raise exception 'distinct periods collapsed';
  end if;

  v_result := public.open_obligation((v_b->>'conversion_terms_id')::uuid, 'setup', null);
  v_other := (v_result->>'obligation_id')::uuid;
  if v_other is not distinct from v_setup then
    raise exception 'other conversion reused the setup obligation';
  end if;

  select * into v_obligation from commercial.platform_obligations where id = v_setup;
  if v_obligation.won_business_id is distinct from '88888888-8888-4888-8888-888888888831'
    or v_obligation.list_price_cents <> 29000000 then
    raise exception 'setup snapshot was not copied';
  end if;

  v_result := public.record_collection(v_setup, 'setup-pay-1', 'posted', 29000000, ' ref-a ');
  if v_result->>'policy_status' is distinct from 'nominal'
    or (v_result->>'eligible_base_cents')::bigint <> 29000000
    or v_result->>'obligation_status' is distinct from 'satisfied'
    or v_result->>'duplicate' is distinct from 'false' then
    raise exception 'nominal post returned %', v_result;
  end if;
  v_collection := (v_result->>'collection_id')::uuid;
  select * into v_row from commercial.platform_collections where id = v_collection;
  if v_row.posted_at is null or v_row.external_ref is distinct from 'ref-a' or v_row.eligible_base_cents <> 29000000 then
    raise exception 'nominal row mismatch';
  end if;

  v_result := public.record_collection(v_setup, '  setup-pay-1  ', 'posted', 29000000, 'ref-a');
  if v_result->>'duplicate' is distinct from 'true'
    or (v_result->>'collection_id')::uuid is distinct from v_collection then
    raise exception 'identical replay returned %', v_result;
  end if;
  select count(*) into v_count from commercial.platform_collections where obligation_id = v_setup;
  if v_count <> 1 then
    raise exception 'replay inserted another collection';
  end if;

  v_result := public.record_collection(v_setup, 'setup-pay-1', 'posted', 1, 'ref-a');
  if v_result->>'commercial_error_code' is distinct from 'idempotent_replay' then
    raise exception 'different gross replay returned %', v_result;
  end if;
  v_result := public.record_collection(v_setup, 'setup-pay-1', 'failed', 29000000, 'ref-a');
  if v_result->>'commercial_error_code' is distinct from 'idempotent_replay' then
    raise exception 'different status replay returned %', v_result;
  end if;
  v_result := public.record_collection(v_setup, 'setup-pay-1', 'posted', 29000000, 'other-ref');
  if v_result->>'commercial_error_code' is distinct from 'idempotent_replay' then
    raise exception 'different ref replay returned %', v_result;
  end if;
  v_result := public.record_collection(v_month_one, 'setup-pay-1', 'posted', 5500000, 'ref-a');
  if v_result->>'commercial_error_code' is distinct from 'idempotent_replay' then
    raise exception 'different obligation replay returned %', v_result;
  end if;

  perform set_config('request.jwt.claim.sub', '88888888-8888-4888-8888-888888888803', true);
  v_result := public.record_collection(v_setup, 'setup-pay-1', 'posted', 29000000, 'ref-a');
  if v_result->>'commercial_error_code' is distinct from 'forbidden' then
    raise exception 'replay without permission returned %', v_result;
  end if;
  perform set_config('request.jwt.claim.sub', '88888888-8888-4888-8888-888888888801', true);

  v_result := public.record_collection(v_setup, 'setup-pay-2', 'posted', 29000000, null);
  if v_result->>'commercial_error_code' is distinct from 'validation' then
    raise exception 'second posted returned %', v_result;
  end if;
  v_result := public.record_collection(v_setup, 'setup-fail-late', 'failed', 29000000, null);
  if v_result->>'commercial_error_code' is distinct from 'validation' then
    raise exception 'failed after satisfied returned %', v_result;
  end if;
  v_result := public.record_collection(v_setup, 'setup-reverse', 'reversed', 29000000, null);
  if v_result->>'commercial_error_code' is distinct from 'validation' then
    raise exception 'reversal was accepted %', v_result;
  end if;

  v_result := public.record_collection(v_month_one, 'month-fail-1', 'failed', 100, null);
  if v_result->>'policy_status' is distinct from 'blocked_pending_policy'
    or v_result->>'eligible_base_cents' is not null
    or v_result->>'obligation_status' is distinct from 'open' then
    raise exception 'failed collection returned %', v_result;
  end if;
  select status into v_obligation.status from commercial.platform_obligations where id = v_month_one;
  if v_obligation.status is distinct from 'open' then
    raise exception 'failed satisfied the obligation';
  end if;
  select * into v_row from commercial.platform_collections where idempotency_key = 'month-fail-1';
  if v_row.eligible_base_cents is not null or v_row.failed_at is null or v_row.posted_at is not null then
    raise exception 'failed row stored an eligible base';
  end if;

  v_result := public.record_collection(v_month_one, 'month-pay-1', 'posted', 5500000, null);
  if v_result->>'policy_status' is distinct from 'nominal'
    or v_result->>'obligation_status' is distinct from 'satisfied' then
    raise exception 'posted after failed returned %', v_result;
  end if;
  select count(*) into v_count
  from commercial.platform_collections
  where obligation_id = v_month_one and status = 'posted';
  if v_count <> 1 then
    raise exception 'retry created % posted rows', v_count;
  end if;

  v_result := public.record_collection(v_month_two, 'month-pay-2', 'posted', 5000000, null);
  if v_result->>'policy_status' is distinct from 'blocked_pending_policy'
    or v_result->>'eligible_base_cents' is not null
    or v_result->>'obligation_status' is distinct from 'satisfied' then
    raise exception 'blocked post returned %', v_result;
  end if;
  select eligible_base_cents into v_row.eligible_base_cents
  from commercial.platform_collections
  where idempotency_key = 'month-pay-2';
  if v_row.eligible_base_cents is not null then
    raise exception 'blocked collection stored an eligible base';
  end if;
  v_result := public.record_collection(v_month_two, 'month-pay-3', 'posted', 5500000, null);
  if v_result->>'commercial_error_code' is distinct from 'validation' then
    raise exception 'second posted on blocked obligation returned %', v_result;
  end if;

  select status into v_obligation.status from commercial.platform_obligations where id = v_other;
  if v_obligation.status is distinct from 'open' then
    raise exception 'other business obligation changed';
  end if;
  if exists (select 1 from commercial.platform_collections where obligation_id = v_other) then
    raise exception 'other business received a collection';
  end if;

  select count(*) into v_count
  from commercial.audit_events
  where action = 'obligation.opened'
    and entity_id in (v_setup, v_month_one, v_month_two, v_other);
  if v_count <> 4 then
    raise exception 'opened audit count %', v_count;
  end if;
  select count(*) into v_count
  from commercial.audit_events
  where action = 'collection.recorded'
    and correlation_id in (v_setup, v_month_one, v_month_two);
  if v_count <> 4 then
    raise exception 'collection audit count %', v_count;
  end if;

  if exists (
    select 1
    from commercial.promoter_commissions commission
    join commercial.platform_collections collection on collection.id = commission.collection_id
    where collection.obligation_id in (v_setup, v_month_one, v_month_two, v_other)
  ) or exists (
    select 1 from commercial.founder_slots
    where obligation_id in (v_setup, v_month_one, v_month_two, v_other)
  ) or exists (
    select 1
    from commercial.settlement_items item
    join commercial.promoter_commissions commission
      on commission.id = item.source_id and item.source_kind = 'commission'
    join commercial.platform_collections collection on collection.id = commission.collection_id
    where collection.obligation_id in (v_setup, v_month_one, v_month_two, v_other)
  ) or exists (
    select 1
    from commercial.promoter_invoices invoice
    join commercial.settlement_items item on item.settlement_id = invoice.settlement_id
    join commercial.promoter_commissions commission
      on commission.id = item.source_id and item.source_kind = 'commission'
    join commercial.platform_collections collection on collection.id = commission.collection_id
    where collection.obligation_id in (v_setup, v_month_one, v_month_two, v_other)
  ) or exists (
    select 1
    from commercial.settlement_payments payment
    join commercial.settlement_items item on item.settlement_id = payment.settlement_id
    join commercial.promoter_commissions commission
      on commission.id = item.source_id and item.source_kind = 'commission'
    join commercial.platform_collections collection on collection.id = commission.collection_id
    where collection.obligation_id in (v_setup, v_month_one, v_month_two, v_other)
  ) then
    raise exception 'collection created an implicit later effect';
  end if;
end;
$$;

set local role authenticated;
do $$
declare
  v_visible int;
begin
  perform set_config('request.jwt.claim.sub', '88888888-8888-4888-8888-888888888801', true);
  select count(*) into v_visible from commercial.platform_obligations;
  if v_visible <> 4 then
    raise exception 'finance saw % obligations', v_visible;
  end if;
  begin
    insert into commercial.platform_obligations (
      conversion_terms_id, won_business_id, kind, list_price_cents
    ) values (
      '88888888-8888-4888-8888-888888888851',
      '88888888-8888-4888-8888-888888888831',
      'setup',
      1
    );
    raise exception 'direct obligation insert was accepted';
  exception
    when insufficient_privilege then
      null;
  end;
end;
$$;

set local role authenticated;
do $$
declare
  v_visible int;
begin
  perform set_config('request.jwt.claim.sub', '88888888-8888-4888-8888-888888888802', true);
  select count(*) into v_visible from commercial.platform_collections;
  if v_visible <> 0 then
    raise exception 'superadmin saw % collections', v_visible;
  end if;
end;
$$;

reset role;
set local role anon;
do $$
begin
  begin
    perform public.open_obligation('88888888-8888-4888-8888-888888888851', 'setup', null);
    raise exception 'anon open was accepted';
  exception
    when insufficient_privilege then
      null;
  end;
  begin
    perform count(*) from commercial.platform_collections;
    raise exception 'anon table read was accepted';
  exception
    when insufficient_privilege then
      null;
  end;
end;
$$;
reset role;

rollback;
