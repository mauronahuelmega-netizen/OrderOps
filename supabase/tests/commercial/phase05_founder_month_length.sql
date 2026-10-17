-- CC-C19. Rolls back. Anniversary day, or the last day of the target month.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '19191919-1919-4191-8191-191919191801', 'authenticated', 'authenticated', 'phase05-month-length@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '19191919-1919-4191-8191-191919191802', 'authenticated', 'authenticated', 'phase05-month-length-super@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '19191919-1919-4191-8191-191919191804', 'authenticated', 'authenticated', 'phase05-month-length-promoter@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());
insert into commercial.platform_accounts (id, user_id, kind) values
  ('19191919-1919-4191-8191-191919191811', '19191919-1919-4191-8191-191919191801', 'internal'),
  ('19191919-1919-4191-8191-191919191812', '19191919-1919-4191-8191-191919191802', 'internal'),
  ('19191919-1919-4191-8191-191919191814', '19191919-1919-4191-8191-191919191804', 'promoter');
insert into commercial.internal_role_assignments (account_id, role) values
  ('19191919-1919-4191-8191-191919191811', 'finance'),
  ('19191919-1919-4191-8191-191919191812', 'superadmin');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('19191919-1919-4191-8191-191919191821', '19191919-1919-4191-8191-191919191814', 'pml00000019', 'Promotor Fin De Mes', 'active');
insert into public.businesses (id, name, slug, whatsapp_number) values
  ('19191919-1919-4191-8191-191919191831', 'Negocio Dia 31', 'negocio-dia-31', '5491100001931'),
  ('19191919-1919-4191-8191-191919191832', 'Negocio Dia 30', 'negocio-dia-30', '5491100001932'),
  ('19191919-1919-4191-8191-191919191833', 'Negocio Dia 29', 'negocio-dia-29', '5491100001933'),
  ('19191919-1919-4191-8191-191919191834', 'Negocio Bisiesto', 'negocio-bisiesto', '5491100001934'),
  ('19191919-1919-4191-8191-191919191835', 'Negocio 29 Feb', 'negocio-29-feb', '5491100001935'),
  ('19191919-1919-4191-8191-191919191836', 'Negocio Dia 10', 'negocio-dia-10', '5491100001936'),
  ('19191919-1919-4191-8191-191919191837', 'Negocio Aislado', 'negocio-aislado', '5491100001937');
insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel) values
  ('19191919-1919-4191-8191-191919191841', 'Lead 31', 'lead 31', 'promoter'),
  ('19191919-1919-4191-8191-191919191842', 'Lead 31 B', 'lead 31 b', 'promoter'),
  ('19191919-1919-4191-8191-191919191843', 'Lead 30', 'lead 30', 'promoter'),
  ('19191919-1919-4191-8191-191919191844', 'Lead 29', 'lead 29', 'promoter'),
  ('19191919-1919-4191-8191-191919191845', 'Lead Leap', 'lead leap', 'promoter'),
  ('19191919-1919-4191-8191-191919191846', 'Lead Feb 29', 'lead feb 29', 'promoter'),
  ('19191919-1919-4191-8191-191919191847', 'Lead Day 10', 'lead day 10', 'promoter'),
  ('19191919-1919-4191-8191-191919191848', 'Lead Isolated', 'lead isolated', 'promoter');
insert into commercial.commercial_opportunities (id, commercial_business_id, stage, owner_account_id) values
  ('19191919-1919-4191-8191-191919191851', '19191919-1919-4191-8191-191919191841', 'demo_done', '19191919-1919-4191-8191-191919191814'),
  ('19191919-1919-4191-8191-191919191852', '19191919-1919-4191-8191-191919191842', 'demo_done', '19191919-1919-4191-8191-191919191814'),
  ('19191919-1919-4191-8191-191919191853', '19191919-1919-4191-8191-191919191843', 'demo_done', '19191919-1919-4191-8191-191919191814'),
  ('19191919-1919-4191-8191-191919191854', '19191919-1919-4191-8191-191919191844', 'demo_done', '19191919-1919-4191-8191-191919191814'),
  ('19191919-1919-4191-8191-191919191855', '19191919-1919-4191-8191-191919191845', 'demo_done', '19191919-1919-4191-8191-191919191814'),
  ('19191919-1919-4191-8191-191919191856', '19191919-1919-4191-8191-191919191846', 'demo_done', '19191919-1919-4191-8191-191919191814'),
  ('19191919-1919-4191-8191-191919191857', '19191919-1919-4191-8191-191919191847', 'demo_done', '19191919-1919-4191-8191-191919191814'),
  ('19191919-1919-4191-8191-191919191858', '19191919-1919-4191-8191-191919191848', 'demo_done', '19191919-1919-4191-8191-191919191814');
insert into commercial.opportunity_attributions (id, opportunity_id, promoter_id, status, method, reason) values
  ('19191919-1919-4191-8191-191919191861', '19191919-1919-4191-8191-191919191851', '19191919-1919-4191-8191-191919191821', 'confirmed', 'manual', 'fixture'),
  ('19191919-1919-4191-8191-191919191862', '19191919-1919-4191-8191-191919191852', '19191919-1919-4191-8191-191919191821', 'confirmed', 'manual', 'fixture'),
  ('19191919-1919-4191-8191-191919191863', '19191919-1919-4191-8191-191919191853', '19191919-1919-4191-8191-191919191821', 'confirmed', 'manual', 'fixture'),
  ('19191919-1919-4191-8191-191919191864', '19191919-1919-4191-8191-191919191854', '19191919-1919-4191-8191-191919191821', 'confirmed', 'manual', 'fixture'),
  ('19191919-1919-4191-8191-191919191865', '19191919-1919-4191-8191-191919191855', '19191919-1919-4191-8191-191919191821', 'confirmed', 'manual', 'fixture'),
  ('19191919-1919-4191-8191-191919191866', '19191919-1919-4191-8191-191919191856', '19191919-1919-4191-8191-191919191821', 'confirmed', 'manual', 'fixture'),
  ('19191919-1919-4191-8191-191919191867', '19191919-1919-4191-8191-191919191857', '19191919-1919-4191-8191-191919191821', 'confirmed', 'manual', 'fixture'),
  ('19191919-1919-4191-8191-191919191868', '19191919-1919-4191-8191-191919191858', '19191919-1919-4191-8191-191919191821', 'confirmed', 'manual', 'fixture');

create function pg_temp.expect_due(p_terms uuid, p_offset int, p_due text)
returns uuid
language plpgsql
as $$
declare
  v_result jsonb;
begin
  v_result := public.ensure_founder_monthly(p_terms, p_offset);
  if v_result->>'period_key' is distinct from p_due
     or (v_result->>'list_price_cents')::bigint is distinct from 5500000
     or v_result->>'ok' is distinct from 'true' then
    raise exception 'offset % expected % got %', p_offset, p_due, v_result;
  end if;
  return (v_result->>'obligation_id')::uuid;
end;
$$;

select set_config('request.jwt.claim.sub', '19191919-1919-4191-8191-191919191802', true);

do $$
declare
  v_a uuid;
  v_a2 uuid;
  v_b uuid;
  v_c uuid;
  v_d uuid;
  v_e uuid;
  v_f uuid;
  v_other uuid;
  v_win jsonb;
  v_result jsonb;
  v_first uuid;
  v_retry uuid;
  v_collection uuid;
  v_count int;
  v_keys int;
begin
  v_win := commercial.win_opportunity('19191919-1919-4191-8191-191919191851', '19191919-1919-4191-8191-191919191831', null);
  v_a := (v_win->>'conversion_terms_id')::uuid;
  v_win := commercial.win_opportunity('19191919-1919-4191-8191-191919191853', '19191919-1919-4191-8191-191919191832', null);
  v_b := (v_win->>'conversion_terms_id')::uuid;
  v_win := commercial.win_opportunity('19191919-1919-4191-8191-191919191854', '19191919-1919-4191-8191-191919191833', null);
  v_c := (v_win->>'conversion_terms_id')::uuid;
  v_win := commercial.win_opportunity('19191919-1919-4191-8191-191919191855', '19191919-1919-4191-8191-191919191834', null);
  v_d := (v_win->>'conversion_terms_id')::uuid;
  v_win := commercial.win_opportunity('19191919-1919-4191-8191-191919191856', '19191919-1919-4191-8191-191919191835', null);
  v_e := (v_win->>'conversion_terms_id')::uuid;
  v_win := commercial.win_opportunity('19191919-1919-4191-8191-191919191857', '19191919-1919-4191-8191-191919191836', null);
  v_f := (v_win->>'conversion_terms_id')::uuid;
  v_win := commercial.win_opportunity('19191919-1919-4191-8191-191919191858', '19191919-1919-4191-8191-191919191837', null);
  v_other := (v_win->>'conversion_terms_id')::uuid;
  if v_a is null or v_b is null or v_c is null or v_d is null or v_e is null or v_f is null or v_other is null then
    raise exception 'win failed';
  end if;

  perform set_config('request.jwt.claim.sub', '19191919-1919-4191-8191-191919191804', true);
  v_result := public.ensure_founder_monthly(v_a, 1);
  if v_result->>'commercial_error_code' is distinct from 'forbidden' then
    raise exception 'promoter opened %', v_result;
  end if;

  perform set_config('request.jwt.claim.sub', '19191919-1919-4191-8191-191919191801', true);
  perform public.record_founder_service_start(v_a, date '2027-01-31');
  perform public.record_founder_service_start(v_b, date '2027-01-30');
  perform public.record_founder_service_start(v_c, date '2027-01-29');
  perform public.record_founder_service_start(v_d, date '2028-01-31');
  perform public.record_founder_service_start(v_e, date '2028-02-29');
  perform public.record_founder_service_start(v_f, date '2026-11-10');
  perform public.record_founder_service_start(v_other, date '2026-11-10');

  v_result := public.ensure_founder_monthly(v_a, 0);
  if v_result->>'commercial_error_code' is distinct from 'included_period' then
    raise exception 'A included %', v_result;
  end if;
  if exists (
    select 1 from commercial.platform_obligations
    where conversion_terms_id = v_a and kind = 'subscription'
  ) then
    raise exception 'A included created a row';
  end if;

  perform pg_temp.expect_due(v_a, 1, '2027-02-28');
  perform pg_temp.expect_due(v_a, 2, '2027-03-31');
  perform pg_temp.expect_due(v_a, 3, '2027-04-30');
  perform pg_temp.expect_due(v_a, 4, '2027-05-31');
  select count(distinct period_key) into v_keys
  from commercial.platform_obligations
  where conversion_terms_id = v_a and kind = 'subscription';
  if v_keys <> 4 then
    raise exception 'A offsets collided %', v_keys;
  end if;

  perform pg_temp.expect_due(v_b, 1, '2027-02-28');
  perform pg_temp.expect_due(v_b, 2, '2027-03-30');
  perform pg_temp.expect_due(v_b, 3, '2027-04-30');
  perform pg_temp.expect_due(v_c, 1, '2027-02-28');
  perform pg_temp.expect_due(v_c, 2, '2027-03-29');
  perform pg_temp.expect_due(v_d, 1, '2028-02-29');
  perform pg_temp.expect_due(v_d, 2, '2028-03-31');
  perform pg_temp.expect_due(v_d, 3, '2028-04-30');
  perform pg_temp.expect_due(v_e, 1, '2028-03-29');
  perform pg_temp.expect_due(v_e, 2, '2028-04-29');
  perform pg_temp.expect_due(v_e, 12, '2029-02-28');
  perform pg_temp.expect_due(v_e, 13, '2029-03-29');
  if (select service_started_on from commercial.founder_service_starts where conversion_terms_id = v_e)
     is distinct from date '2028-02-29' then
    raise exception 'E anniversary changed';
  end if;

  perform pg_temp.expect_due(v_f, 1, '2026-12-10');
  perform pg_temp.expect_due(v_f, 2, '2027-01-10');
  perform pg_temp.expect_due(v_f, 3, '2027-02-10');

  v_first := pg_temp.expect_due(v_a, 1, '2027-02-28');
  v_retry := pg_temp.expect_due(v_a, 1, '2027-02-28');
  if v_first is distinct from v_retry then
    raise exception 'G new obligation';
  end if;
  select count(*) into v_count from commercial.platform_obligations
  where conversion_terms_id = v_a and period_key = '2027-02-28';
  if v_count <> 1 then
    raise exception 'G duplicate %', v_count;
  end if;
  select count(*) into v_count from commercial.founder_slots where conversion_terms_id = v_a;
  if v_count <> 0 then
    raise exception 'G open consumed a slot';
  end if;

  v_first := (select id from commercial.platform_obligations
    where conversion_terms_id = v_f and period_key = '2026-12-10');
  v_result := public.record_collection(v_first, 'month-length-late', 'posted', 5500000, 'late');
  v_collection := (v_result->>'collection_id')::uuid;
  update commercial.platform_collections set posted_at = '2027-01-20 12:00:00+00' where id = v_collection;
  v_result := public.ensure_founder_monthly(v_f, 2);
  if v_result->>'period_key' is distinct from '2027-01-10'
     or (select period_key from commercial.platform_obligations where id = v_first) is distinct from '2026-12-10'
     or (select service_started_on from commercial.founder_service_starts where conversion_terms_id = v_f)
        is distinct from date '2026-11-10' then
    raise exception 'H calendar moved %', v_result;
  end if;

  v_result := public.open_obligation(v_a, 'subscription', '2027-02-27');
  if v_result->>'commercial_error_code' is distinct from 'validation' then
    raise exception 'non anniversary accepted %', v_result;
  end if;
  v_result := public.open_obligation(v_a, 'subscription', '2027-02-31');
  if v_result->>'commercial_error_code' is distinct from 'validation' then
    raise exception 'invalid date %', v_result;
  end if;

  perform set_config('request.jwt.claim.sub', '19191919-1919-4191-8191-191919191802', true);
  v_win := commercial.win_opportunity('19191919-1919-4191-8191-191919191852', '19191919-1919-4191-8191-191919191831', null);
  if v_win->>'status' is distinct from 'won' then
    raise exception 'second win %', v_win;
  end if;
  v_a2 := (v_win->>'conversion_terms_id')::uuid;
  perform set_config('request.jwt.claim.sub', '19191919-1919-4191-8191-191919191801', true);
  perform public.record_founder_service_start(v_a2, date '2027-01-30');
  v_result := public.ensure_founder_monthly(v_a2, 1);
  if v_result->>'commercial_error_code' is distinct from 'period_conflict' then
    raise exception 'I clamp conflict %', v_result;
  end if;
  perform pg_temp.expect_due(v_other, 1, '2026-12-10');
  v_result := public.record_collection(
    (select id from commercial.platform_obligations where conversion_terms_id = v_other and period_key = '2026-12-10'),
    'month-length-late',
    'posted',
    5500000,
    'cross'
  );
  if v_result->>'commercial_error_code' is distinct from 'idempotent_replay' then
    raise exception 'I cross key %', v_result;
  end if;
  if (select status from commercial.platform_obligations where conversion_terms_id = v_other and period_key = '2026-12-10')
     is distinct from 'open' then
    raise exception 'I other business was satisfied';
  end if;

  select count(*) into v_count from commercial.promoter_commissions
  where conversion_terms_id = v_c and right_kind = 'recurring';
  if v_count <> 0 then
    raise exception 'J open created commission';
  end if;
  v_first := (select id from commercial.platform_obligations
    where conversion_terms_id = v_c and period_key = '2027-02-28');
  v_result := public.record_collection(v_first, 'month-length-exact', 'posted', 5500000, 'exact');
  v_collection := (v_result->>'collection_id')::uuid;
  v_result := public.accrue_commissions_for_collection(v_collection);
  if v_result->>'amount_cents' is distinct from '2200000' or v_result->>'right_kind' is distinct from 'recurring' then
    raise exception 'J commission %', v_result;
  end if;
  v_result := public.satisfy_subscription_collection(v_collection);
  if v_result->>'slot' is distinct from '1' then
    raise exception 'J slot %', v_result;
  end if;
  select count(*) into v_count from commercial.founder_slots where conversion_terms_id = v_c;
  if v_count <> 1 then
    raise exception 'J slot count %', v_count;
  end if;
  select count(*) into v_count from commercial.promoter_commissions
  where conversion_terms_id = v_c and right_kind = 'recurring';
  if v_count <> 1 then
    raise exception 'J commission count %', v_count;
  end if;
end;
$$;

rollback;
