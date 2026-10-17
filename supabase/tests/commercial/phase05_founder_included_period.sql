-- T02. Rolls back. Included first period and the next monthly obligation.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '17171717-1717-4171-8171-171717171701', 'authenticated', 'authenticated', 'phase05-founder-included@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '17171717-1717-4171-8171-171717171702', 'authenticated', 'authenticated', 'phase05-founder-included-super@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '17171717-1717-4171-8171-171717171704', 'authenticated', 'authenticated', 'phase05-founder-included-promoter@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());
insert into commercial.platform_accounts (id, user_id, kind) values
  ('17171717-1717-4171-8171-171717171711', '17171717-1717-4171-8171-171717171701', 'internal'),
  ('17171717-1717-4171-8171-171717171712', '17171717-1717-4171-8171-171717171702', 'internal'),
  ('17171717-1717-4171-8171-171717171714', '17171717-1717-4171-8171-171717171704', 'promoter');
insert into commercial.internal_role_assignments (account_id, role) values
  ('17171717-1717-4171-8171-171717171711', 'finance'),
  ('17171717-1717-4171-8171-171717171712', 'superadmin');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('17171717-1717-4171-8171-171717171721', '17171717-1717-4171-8171-171717171714', 'pinc00000017', 'Promotor Incluido', 'active');
insert into public.businesses (id, name, slug, whatsapp_number) values
  ('17171717-1717-4171-8171-171717171731', 'Negocio Incluido', 'negocio-incluido', '5491100001717');
insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel) values
  ('17171717-1717-4171-8171-171717171741', 'Lead Incluido', 'lead incluido', 'promoter');
insert into commercial.commercial_opportunities (id, commercial_business_id, stage, owner_account_id) values
  ('17171717-1717-4171-8171-171717171751', '17171717-1717-4171-8171-171717171741', 'demo_done', '17171717-1717-4171-8171-171717171714');
insert into commercial.opportunity_attributions (id, opportunity_id, promoter_id, status, method, reason) values
  ('17171717-1717-4171-8171-171717171761', '17171717-1717-4171-8171-171717171751', '17171717-1717-4171-8171-171717171721', 'confirmed', 'manual', 'fixture');

select set_config('request.jwt.claim.sub', '17171717-1717-4171-8171-171717171702', true);

do $$
declare
  v_terms uuid;
  v_result jsonb;
  v_first uuid;
  v_count int;
begin
  v_result := commercial.win_opportunity(
    '17171717-1717-4171-8171-171717171751',
    '17171717-1717-4171-8171-171717171731',
    null
  );
  if v_result->>'status' is distinct from 'won' then
    raise exception 'win returned %', v_result;
  end if;
  v_terms := (v_result->>'conversion_terms_id')::uuid;
  perform set_config('request.jwt.claim.sub', '17171717-1717-4171-8171-171717171701', true);
  v_result := public.open_obligation(v_terms, 'setup', null);
  if (v_result->>'list_price_cents')::bigint <> 29000000 then
    raise exception 'activation price %', v_result;
  end if;

  v_result := public.open_obligation(v_terms, 'subscription', '2026-11-10');
  if v_result->>'commercial_error_code' is distinct from 'service_start_required' then
    raise exception 'missing start %', v_result;
  end if;

  v_result := public.record_founder_service_start(v_terms, date '2026-11-10');
  if v_result->>'ok' is distinct from 'true' or v_result->>'duplicate' is distinct from 'false' then
    raise exception 'record start %', v_result;
  end if;
  v_result := public.record_founder_service_start(v_terms, date '2026-11-10');
  if v_result->>'duplicate' is distinct from 'true' then
    raise exception 'start replay %', v_result;
  end if;
  v_result := public.record_founder_service_start(v_terms, date '2026-12-10');
  if v_result->>'commercial_error_code' is distinct from 'service_start_conflict' then
    raise exception 'start change %', v_result;
  end if;

  v_result := public.open_obligation(v_terms, 'subscription', '2026-11-10');
  if v_result->>'commercial_error_code' is distinct from 'included_period' then
    raise exception 'included period %', v_result;
  end if;
  v_result := public.open_obligation(v_terms, 'subscription', '2026-11-10');
  if v_result->>'commercial_error_code' is distinct from 'included_period' then
    raise exception 'included retry %', v_result;
  end if;
  select count(*) into v_count from commercial.platform_obligations
  where conversion_terms_id = v_terms and kind = 'subscription';
  if v_count <> 0 or exists (select 1 from commercial.founder_slots where conversion_terms_id = v_terms)
     or exists (select 1 from commercial.promoter_commissions where conversion_terms_id = v_terms and right_kind = 'recurring') then
    raise exception 'included period created an economic row';
  end if;

  v_result := public.open_obligation(v_terms, 'subscription', '2026-12-10');
  if v_result->>'ok' is distinct from 'true'
     or v_result->>'duplicate' is distinct from 'false'
     or v_result->>'period_key' is distinct from '2026-12-10'
     or v_result->>'status' is distinct from 'open'
     or (v_result->>'list_price_cents')::bigint <> 5500000 then
    raise exception 'first monthly %', v_result;
  end if;
  v_first := (v_result->>'obligation_id')::uuid;
  v_result := public.open_obligation(v_terms, 'subscription', '2026-12-10');
  if v_result->>'duplicate' is distinct from 'true' or (v_result->>'obligation_id')::uuid is distinct from v_first then
    raise exception 'monthly retry %', v_result;
  end if;
  select count(*) into v_count from commercial.platform_obligations
  where conversion_terms_id = v_terms and kind = 'subscription';
  if v_count <> 1 then
    raise exception 'monthly duplicated %', v_count;
  end if;

  v_result := public.record_collection(v_first, 'included-month-1', 'posted', 5500000, 'dec');
  v_result := public.accrue_commissions_for_collection((v_result->>'collection_id')::uuid);
  if v_result->>'amount_cents' is distinct from '2200000' or v_result->>'right_kind' is distinct from 'recurring' then
    raise exception 'first commission %', v_result;
  end if;
  v_result := public.satisfy_subscription_collection((
    select id from commercial.platform_collections where idempotency_key = 'included-month-1'
  ));
  if v_result->>'slot' is distinct from '1' then
    raise exception 'first slot %', v_result;
  end if;

  v_result := public.open_obligation(v_terms, 'subscription', '2026-11-30');
  if v_result->>'commercial_error_code' is distinct from 'month_length_unspecified' then
    raise exception 'month end %', v_result;
  end if;
  v_result := public.open_obligation(v_terms, 'subscription', 'month-1');
  if v_result->>'commercial_error_code' is distinct from 'validation' then
    raise exception 'opaque key %', v_result;
  end if;
end;
$$;

rollback;
