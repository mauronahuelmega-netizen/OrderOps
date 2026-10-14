-- P05-T04. Rolls back. Twelve slots, failed retry, and the 180-day reactivation window.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000', '55555555-5555-4555-8555-555555555501', 'authenticated', 'authenticated',
  'phase05-finance-slots@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
), (
  '00000000-0000-0000-0000-000000000000', '55555555-5555-4555-8555-555555555502', 'authenticated', 'authenticated',
  'phase05-super-slots@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
), (
  '00000000-0000-0000-0000-000000000000', '55555555-5555-4555-8555-555555555504', 'authenticated', 'authenticated',
  'phase05-promoter-slots@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
);
insert into commercial.platform_accounts (id, user_id, kind) values
  ('55555555-5555-4555-8555-555555555511', '55555555-5555-4555-8555-555555555501', 'internal'),
  ('55555555-5555-4555-8555-555555555512', '55555555-5555-4555-8555-555555555502', 'internal'),
  ('55555555-5555-4555-8555-555555555514', '55555555-5555-4555-8555-555555555504', 'promoter');
insert into commercial.internal_role_assignments (account_id, role) values
  ('55555555-5555-4555-8555-555555555511', 'finance'),
  ('55555555-5555-4555-8555-555555555512', 'superadmin');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('55555555-5555-4555-8555-555555555521', '55555555-5555-4555-8555-555555555514', 'pslot0000004', 'Promotor Slots', 'active');
insert into public.businesses (id, name, slug, whatsapp_number) values
  ('55555555-5555-4555-8555-555555555531', 'Negocio Slots A', 'negocio-slots-a', '5491100000351'),
  ('55555555-5555-4555-8555-555555555532', 'Negocio Slots B', 'negocio-slots-b', '5491100000352'),
  ('55555555-5555-4555-8555-555555555533', 'Negocio Slots C', 'negocio-slots-c', '5491100000353');
insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel) values
  ('55555555-5555-4555-8555-555555555541', 'Lead Slots A', 'lead slots a', 'promoter'),
  ('55555555-5555-4555-8555-555555555542', 'Lead Slots B', 'lead slots b', 'promoter'),
  ('55555555-5555-4555-8555-555555555543', 'Lead Slots C', 'lead slots c', 'promoter');
insert into commercial.commercial_opportunities (id, commercial_business_id, stage, owner_account_id) values
  ('55555555-5555-4555-8555-555555555551', '55555555-5555-4555-8555-555555555541', 'demo_done', '55555555-5555-4555-8555-555555555514'),
  ('55555555-5555-4555-8555-555555555552', '55555555-5555-4555-8555-555555555542', 'demo_done', '55555555-5555-4555-8555-555555555514'),
  ('55555555-5555-4555-8555-555555555553', '55555555-5555-4555-8555-555555555543', 'demo_done', '55555555-5555-4555-8555-555555555514');
insert into commercial.opportunity_attributions (id, opportunity_id, promoter_id, status, method, reason) values
  ('55555555-5555-4555-8555-555555555561', '55555555-5555-4555-8555-555555555551', '55555555-5555-4555-8555-555555555521', 'confirmed', 'manual', 'fixture'),
  ('55555555-5555-4555-8555-555555555562', '55555555-5555-4555-8555-555555555552', '55555555-5555-4555-8555-555555555521', 'confirmed', 'manual', 'fixture'),
  ('55555555-5555-4555-8555-555555555563', '55555555-5555-4555-8555-555555555553', '55555555-5555-4555-8555-555555555521', 'confirmed', 'manual', 'fixture');

select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555502', true);

do $$
declare
  v_terms uuid;
  v_other uuid;
  v_late uuid;
  v_win jsonb;
  v_open jsonb;
  v_collection uuid;
  v_result jsonb;
  v_i int;
  v_count int;
  v_sum bigint;
  v_slot int;
begin
  v_win := commercial.win_opportunity('55555555-5555-4555-8555-555555555551', '55555555-5555-4555-8555-555555555531', null);
  v_terms := (v_win->>'conversion_terms_id')::uuid;
  perform set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555501', true);

  v_open := public.open_obligation(v_terms, 'subscription', 'sub:failed');
  v_result := public.record_collection((v_open->>'obligation_id')::uuid, 'slots-failed', 'failed', 5500000, null);
  v_result := public.accrue_commissions_for_collection((v_result->>'collection_id')::uuid);
  if v_result->>'commercial_error_code' is distinct from 'policy_blocked' then
    raise exception 'G-06 accrue %', v_result;
  end if;
  v_result := public.satisfy_subscription_collection((
    select id from commercial.platform_collections where idempotency_key = 'slots-failed'
  ));
  if v_result->>'commercial_error_code' is distinct from 'policy_blocked' or exists (select 1 from commercial.founder_slots) then
    raise exception 'G-06 slot %', v_result;
  end if;

  v_result := public.record_collection((v_open->>'obligation_id')::uuid, 'slots-retry', 'posted', 5500000, null);
  v_collection := (v_result->>'collection_id')::uuid;
  perform public.accrue_commissions_for_collection(v_collection);
  v_result := public.satisfy_subscription_collection(v_collection);
  v_result := public.satisfy_subscription_collection(v_collection);
  if v_result->>'duplicate' is distinct from 'true' or v_result->>'slot' is distinct from '1' then
    raise exception 'G-07 %', v_result;
  end if;
  select count(*) into v_count from commercial.founder_slots where obligation_id = (v_open->>'obligation_id')::uuid;
  if v_count <> 1 then
    raise exception 'retry slots %', v_count;
  end if;

  for v_i in 2..12 loop
    v_open := public.open_obligation(v_terms, 'subscription', 'sub:' || v_i::text);
    v_result := public.record_collection((v_open->>'obligation_id')::uuid, 'slots-' || v_i::text, 'posted', 5500000, null);
    perform public.accrue_commissions_for_collection((v_result->>'collection_id')::uuid);
    v_result := public.satisfy_subscription_collection((v_result->>'collection_id')::uuid);
    if v_result->>'slot' is distinct from v_i::text then
      raise exception 'slot % returned %', v_i, v_result;
    end if;
  end loop;

  v_open := public.open_obligation(v_terms, 'subscription', 'sub:13');
  v_result := public.record_collection((v_open->>'obligation_id')::uuid, 'slots-13', 'posted', 5500000, null);
  v_result := public.accrue_commissions_for_collection((v_result->>'collection_id')::uuid);
  if v_result->>'commercial_error_code' is distinct from 'slot_exhausted' then
    raise exception 'G-08 accrue %', v_result;
  end if;
  select count(*), coalesce(sum(amount_cents), 0) into v_count, v_sum
  from commercial.promoter_commissions where right_kind = 'recurring';
  if v_count <> 12 or v_sum <> 26400000 then
    raise exception 'recurring total % / %', v_count, v_sum;
  end if;
  select count(*) into v_count from commercial.founder_slots where conversion_terms_id = v_terms;
  if v_count <> 12 then
    raise exception 'slot count %', v_count;
  end if;

  v_open := public.open_obligation(v_terms, 'setup', null);
  v_result := public.record_collection((v_open->>'obligation_id')::uuid, 'slots-setup', 'posted', 29000000, null);
  perform public.accrue_commissions_for_collection((v_result->>'collection_id')::uuid);
  select coalesce(sum(amount_cents), 0) into v_sum from commercial.promoter_commissions;
  if v_sum <> 38400000 then
    raise exception 'founder total %', v_sum;
  end if;

  perform set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555502', true);
  v_win := commercial.win_opportunity('55555555-5555-4555-8555-555555555552', '55555555-5555-4555-8555-555555555532', null);
  v_other := (v_win->>'conversion_terms_id')::uuid;
  perform set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555501', true);
  for v_i in 1..5 loop
    v_open := public.open_obligation(v_other, 'subscription', 'other:' || v_i::text);
    v_result := public.record_collection((v_open->>'obligation_id')::uuid, 'other-' || v_i::text, 'posted', 5500000, null);
    perform public.accrue_commissions_for_collection((v_result->>'collection_id')::uuid);
    perform public.satisfy_subscription_collection((v_result->>'collection_id')::uuid);
  end loop;
  perform public.end_service(v_other, pg_catalog.clock_timestamp() - interval '110 days', pg_catalog.clock_timestamp() - interval '100 days');
  if (select cancel_requested_at = ended_at from commercial.service_subscriptions where conversion_terms_id = v_other) then
    raise exception 'cancel and end collapsed';
  end if;
  v_result := public.reactivate_service(v_other);
  if v_result->>'ok' is distinct from 'true' or v_result->>'conversion_terms_id' is distinct from v_other::text then
    raise exception 'E2E-07 early %', v_result;
  end if;
  v_open := public.open_obligation(v_other, 'subscription', 'other:6');
  v_result := public.record_collection((v_open->>'obligation_id')::uuid, 'other-6', 'posted', 5500000, null);
  perform public.accrue_commissions_for_collection((v_result->>'collection_id')::uuid);
  v_result := public.satisfy_subscription_collection((v_result->>'collection_id')::uuid);
  if v_result->>'slot' is distinct from '6' then
    raise exception 'G-16 %', v_result;
  end if;

  perform set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555502', true);
  v_win := commercial.win_opportunity('55555555-5555-4555-8555-555555555553', '55555555-5555-4555-8555-555555555533', null);
  v_late := (v_win->>'conversion_terms_id')::uuid;
  perform set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555501', true);
  perform public.end_service(v_late, pg_catalog.clock_timestamp() - interval '200 days', pg_catalog.clock_timestamp() - interval '181 days');
  v_result := public.reactivate_service(v_late);
  if v_result->>'commercial_error_code' is distinct from 'reactivation_window_closed' then
    raise exception 'G-17 %', v_result;
  end if;
  select count(*) into v_count from commercial.founder_slots where conversion_terms_id = v_late;
  if v_count <> 0 or (select status from commercial.service_subscriptions where conversion_terms_id = v_late) is distinct from 'ended' then
    raise exception 'late terms changed';
  end if;

  v_result := public.end_service(
    v_other,
    pg_catalog.clock_timestamp() - interval '180 days',
    pg_catalog.clock_timestamp() - interval '180 days' + interval '1 minute'
  );
  v_result := public.reactivate_service(v_other);
  if v_result->>'ok' is distinct from 'true' then
    raise exception 'day 180 %', v_result;
  end if;
end;
$$;

rollback;
