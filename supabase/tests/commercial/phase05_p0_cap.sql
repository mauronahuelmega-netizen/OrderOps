-- P05 P0. Rolls back. Twelve rights do not depend on slot order. A voided right cannot be paid again.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '99999999-9999-4999-8999-999999999901', 'authenticated', 'authenticated', 'p0fix-finance-a@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '99999999-9999-4999-8999-999999999903', 'authenticated', 'authenticated', 'p0fix-finance-b@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '99999999-9999-4999-8999-999999999902', 'authenticated', 'authenticated', 'p0fix-super@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '99999999-9999-4999-8999-999999999904', 'authenticated', 'authenticated', 'p0fix-promoter@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());
insert into commercial.platform_accounts (id, user_id, kind) values
  ('99999999-9999-4999-8999-999999999911', '99999999-9999-4999-8999-999999999901', 'internal'),
  ('99999999-9999-4999-8999-999999999913', '99999999-9999-4999-8999-999999999903', 'internal'),
  ('99999999-9999-4999-8999-999999999912', '99999999-9999-4999-8999-999999999902', 'internal'),
  ('99999999-9999-4999-8999-999999999914', '99999999-9999-4999-8999-999999999904', 'promoter');
insert into commercial.internal_role_assignments (account_id, role) values
  ('99999999-9999-4999-8999-999999999911', 'finance'),
  ('99999999-9999-4999-8999-999999999913', 'finance'),
  ('99999999-9999-4999-8999-999999999912', 'superadmin');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('99999999-9999-4999-8999-999999999921', '99999999-9999-4999-8999-999999999914', 'pp0fix000010', 'Promotor P0 Fix', 'active');
insert into commercial.promoter_bank_accounts (id, promoter_id, cbu_or_cvu, holder_name, is_current, created_by) values
  ('99999999-9999-4999-8999-999999999971', '99999999-9999-4999-8999-999999999921', '0000000000000000000010', 'Titular Fix', true, '99999999-9999-4999-8999-999999999911');
insert into public.businesses (id, name, slug, whatsapp_number) values
  ('99999999-9999-4999-8999-999999999931', 'Negocio P0 Fix', 'negocio-p0-fix', '5491100000951');
insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel) values
  ('99999999-9999-4999-8999-999999999941', 'Lead P0 Fix', 'lead p0 fix', 'promoter');
insert into commercial.commercial_opportunities (id, commercial_business_id, stage, owner_account_id) values
  ('99999999-9999-4999-8999-999999999951', '99999999-9999-4999-8999-999999999941', 'demo_done', '99999999-9999-4999-8999-999999999914');
insert into commercial.opportunity_attributions (id, opportunity_id, promoter_id, status, method, reason) values
  ('99999999-9999-4999-8999-999999999961', '99999999-9999-4999-8999-999999999951', '99999999-9999-4999-8999-999999999921', 'confirmed', 'manual', 'fixture');

select set_config('request.jwt.claim.sub', '99999999-9999-4999-8999-999999999902', true);

do $$
declare
  v_terms uuid;
  v_open jsonb;
  v_result jsonb;
  v_collection uuid;
  v_commission uuid;
  v_settlement uuid;
  v_i int;
  v_count int;
  v_sum bigint;
  v_promoter uuid := '99999999-9999-4999-8999-999999999921';
begin
  v_terms := (commercial.win_opportunity('99999999-9999-4999-8999-999999999951', '99999999-9999-4999-8999-999999999931', null)->>'conversion_terms_id')::uuid;
  perform set_config('request.jwt.claim.sub', '99999999-9999-4999-8999-999999999901', true);

  perform public.record_founder_service_start(v_terms, date '2019-01-10');
  for v_i in 1..13 loop
    v_open := public.open_obligation(v_terms, 'subscription', to_char(date '2019-01-10' + make_interval(months => v_i), 'YYYY-MM-DD'));
    v_result := public.record_collection((v_open->>'obligation_id')::uuid, 'cap-' || v_i::text, 'posted', 5500000, null);
    v_result := public.accrue_commissions_for_collection((v_result->>'collection_id')::uuid);
    if v_i <= 12 and v_result->>'accrued' is distinct from 'true' then
      raise exception 'accrue % %', v_i, v_result;
    end if;
    if v_i = 13 and v_result->>'commercial_error_code' is distinct from 'slot_exhausted' then
      raise exception 'thirteenth %', v_result;
    end if;
  end loop;
  v_result := public.accrue_commissions_for_collection((select id from commercial.platform_collections where idempotency_key = 'cap-1'));
  if v_result->>'duplicate' is distinct from 'true' then
    raise exception 'replay %', v_result;
  end if;
  for v_i in 1..13 loop
    v_result := public.satisfy_subscription_collection((select id from commercial.platform_collections where idempotency_key = 'cap-' || v_i::text));
    if v_i <= 12 and v_result->>'slot' is distinct from v_i::text then
      raise exception 'slot % %', v_i, v_result;
    end if;
    if v_i = 13 and v_result->>'commercial_error_code' is distinct from 'slot_exhausted' then
      raise exception 'slot 13 %', v_result;
    end if;
  end loop;
  select count(*) into v_count from commercial.promoter_commissions where conversion_terms_id = v_terms and right_kind = 'recurring';
  if v_count <> 12 or (select count(*) from commercial.founder_slots where conversion_terms_id = v_terms) <> 12 then
    raise exception 'cap counts %', v_count;
  end if;
  update commercial.promoter_commissions
  set status = 'available', available_at = '2026-01-16 15:00:00+00'
  where conversion_terms_id = v_terms;
  perform public.refresh_commission_availability();
  v_result := public.prepare_settlement(v_promoter, '2026-01', null);
  if v_result->>'total_cents' is distinct from '26400000' then
    raise exception 'twelve settled %', v_result;
  end if;
end;
$$;

rollback;
