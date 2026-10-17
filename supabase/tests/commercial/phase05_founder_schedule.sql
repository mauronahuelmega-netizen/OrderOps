-- T03. Rolls back. Anchored monthly dues, late payment, and unsupported month lengths.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '18181818-1818-4181-8181-181818181801', 'authenticated', 'authenticated', 'phase05-founder-schedule@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '18181818-1818-4181-8181-181818181802', 'authenticated', 'authenticated', 'phase05-founder-schedule-super@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '18181818-1818-4181-8181-181818181804', 'authenticated', 'authenticated', 'phase05-founder-schedule-promoter@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());
insert into commercial.platform_accounts (id, user_id, kind) values
  ('18181818-1818-4181-8181-181818181811', '18181818-1818-4181-8181-181818181801', 'internal'),
  ('18181818-1818-4181-8181-181818181812', '18181818-1818-4181-8181-181818181802', 'internal'),
  ('18181818-1818-4181-8181-181818181814', '18181818-1818-4181-8181-181818181804', 'promoter');
insert into commercial.internal_role_assignments (account_id, role) values
  ('18181818-1818-4181-8181-181818181811', 'finance'),
  ('18181818-1818-4181-8181-181818181812', 'superadmin');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('18181818-1818-4181-8181-181818181821', '18181818-1818-4181-8181-181818181814', 'psch00000018', 'Promotor Calendario', 'active');
insert into public.businesses (id, name, slug, whatsapp_number) values
  ('18181818-1818-4181-8181-181818181831', 'Negocio Calendario', 'negocio-calendario', '5491100001818'),
  ('18181818-1818-4181-8181-181818181832', 'Negocio Fin De Mes', 'negocio-fin-de-mes', '5491100001819');
insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel) values
  ('18181818-1818-4181-8181-181818181841', 'Lead Calendario', 'lead calendario', 'promoter'),
  ('18181818-1818-4181-8181-181818181842', 'Lead Conflicto', 'lead conflicto', 'promoter'),
  ('18181818-1818-4181-8181-181818181843', 'Lead Fin De Mes', 'lead fin de mes', 'promoter');
insert into commercial.commercial_opportunities (id, commercial_business_id, stage, owner_account_id) values
  ('18181818-1818-4181-8181-181818181851', '18181818-1818-4181-8181-181818181841', 'demo_done', '18181818-1818-4181-8181-181818181814'),
  ('18181818-1818-4181-8181-181818181852', '18181818-1818-4181-8181-181818181842', 'demo_done', '18181818-1818-4181-8181-181818181814'),
  ('18181818-1818-4181-8181-181818181853', '18181818-1818-4181-8181-181818181843', 'demo_done', '18181818-1818-4181-8181-181818181814');
insert into commercial.opportunity_attributions (id, opportunity_id, promoter_id, status, method, reason) values
  ('18181818-1818-4181-8181-181818181861', '18181818-1818-4181-8181-181818181851', '18181818-1818-4181-8181-181818181821', 'confirmed', 'manual', 'fixture'),
  ('18181818-1818-4181-8181-181818181862', '18181818-1818-4181-8181-181818181852', '18181818-1818-4181-8181-181818181821', 'confirmed', 'manual', 'fixture'),
  ('18181818-1818-4181-8181-181818181863', '18181818-1818-4181-8181-181818181853', '18181818-1818-4181-8181-181818181821', 'confirmed', 'manual', 'fixture');

select set_config('request.jwt.claim.sub', '18181818-1818-4181-8181-181818181802', true);

do $$
declare
  v_terms uuid;
  v_other uuid;
  v_edge uuid;
  v_win jsonb;
  v_dec jsonb;
  v_jan jsonb;
  v_feb jsonb;
  v_result jsonb;
  v_collection uuid;
  v_count int;
begin
  v_win := commercial.win_opportunity('18181818-1818-4181-8181-181818181851', '18181818-1818-4181-8181-181818181831', null);
  if v_win->>'status' is distinct from 'won' then
    raise exception 'win returned %', v_win;
  end if;
  v_terms := (v_win->>'conversion_terms_id')::uuid;
  perform set_config('request.jwt.claim.sub', '18181818-1818-4181-8181-181818181801', true);
  v_result := public.open_obligation(v_terms, 'setup', null);
  if (v_result->>'list_price_cents')::bigint is distinct from 29000000 then
    raise exception 'activation %', v_result;
  end if;
  perform public.record_founder_service_start(v_terms, date '2026-11-10');

  v_result := public.ensure_founder_monthly(v_terms, 0);
  if v_result->>'commercial_error_code' is distinct from 'included_period' then
    raise exception 'E included %', v_result;
  end if;
  if exists (
    select 1 from commercial.platform_obligations
    where conversion_terms_id = v_terms and period_key = '2026-11-10'
  ) then
    raise exception 'E included row exists';
  end if;

  v_dec := public.ensure_founder_monthly(v_terms, 1);
  v_jan := public.ensure_founder_monthly(v_terms, 2);
  v_feb := public.ensure_founder_monthly(v_terms, 3);
  if v_dec->>'period_key' is distinct from '2026-12-10'
     or v_jan->>'period_key' is distinct from '2027-01-10'
     or v_feb->>'period_key' is distinct from '2027-02-10'
     or (v_dec->>'list_price_cents')::bigint is distinct from 5500000
     or v_dec->>'status' is distinct from 'open' then
    raise exception 'A calendar % / % / %', v_dec, v_jan, v_feb;
  end if;
  if (v_dec->>'obligation_id')::uuid = (v_jan->>'obligation_id')::uuid
     or (v_jan->>'obligation_id')::uuid = (v_feb->>'obligation_id')::uuid then
    raise exception 'D periods collapsed';
  end if;
  select count(*) into v_count from commercial.promoter_commissions where conversion_terms_id = v_terms and right_kind = 'recurring';
  if v_count <> 0 then
    raise exception 'opening created a commission';
  end if;

  v_result := public.ensure_founder_monthly(v_terms, 1);
  if v_result->>'duplicate' is distinct from 'true'
     or (v_result->>'obligation_id')::uuid is distinct from (v_dec->>'obligation_id')::uuid then
    raise exception 'B retry %', v_result;
  end if;
  select count(*) into v_count from commercial.platform_obligations
  where conversion_terms_id = v_terms and kind = 'subscription' and period_key = '2026-12-10';
  if v_count <> 1 then
    raise exception 'B count %', v_count;
  end if;

  v_result := public.record_collection((v_dec->>'obligation_id')::uuid, 'schedule-dec', 'posted', 5500000, 'dec-late');
  v_collection := (v_result->>'collection_id')::uuid;
  update commercial.platform_collections set posted_at = '2026-12-20 15:00:00+00' where id = v_collection;
  v_result := public.accrue_commissions_for_collection(v_collection);
  if v_result->>'amount_cents' is distinct from '2200000' then
    raise exception 'F commission %', v_result;
  end if;
  v_result := public.satisfy_subscription_collection(v_collection);
  if v_result->>'slot' is distinct from '1' then
    raise exception 'F slot %', v_result;
  end if;
  v_jan := public.ensure_founder_monthly(v_terms, 2);
  if v_jan->>'period_key' is distinct from '2027-01-10'
     or v_jan->>'status' is distinct from 'open'
     or (select service_started_on from commercial.founder_service_starts where conversion_terms_id = v_terms) is distinct from date '2026-11-10'
     or (select period_key from commercial.platform_obligations where id = (v_dec->>'obligation_id')::uuid) is distinct from '2026-12-10'
     or (select status from commercial.platform_obligations where id = (v_dec->>'obligation_id')::uuid) is distinct from 'satisfied'
     or (select posted_at::date from commercial.platform_collections where id = v_collection) is distinct from date '2026-12-20' then
    raise exception 'C late payment moved the calendar %', v_jan;
  end if;
  select count(*) into v_count from commercial.platform_collections
  where obligation_id = (v_jan->>'obligation_id')::uuid;
  if v_count <> 0 then
    raise exception 'D january received december money';
  end if;
  select count(*) into v_count from commercial.promoter_commissions
  where conversion_terms_id = v_terms and right_kind = 'recurring';
  if v_count <> 1 then
    raise exception 'C delay created a commission %', v_count;
  end if;

  v_result := public.record_collection((v_feb->>'obligation_id')::uuid, 'schedule-feb-wrong', 'posted', 6500000, 'wrong');
  if v_result->>'policy_status' is distinct from 'blocked_pending_policy' or v_result->>'eligible_base_cents' is not null then
    raise exception 'F blocked %', v_result;
  end if;
  select count(*) into v_count from commercial.founder_slots where conversion_terms_id = v_terms;
  if v_count <> 1 then
    raise exception 'F blocked consumed a slot %', v_count;
  end if;

  perform set_config('request.jwt.claim.sub', '18181818-1818-4181-8181-181818181802', true);
  v_win := commercial.win_opportunity('18181818-1818-4181-8181-181818181852', '18181818-1818-4181-8181-181818181831', null);
  if v_win->>'status' is distinct from 'won' then
    raise exception 'second win %', v_win;
  end if;
  v_other := (v_win->>'conversion_terms_id')::uuid;
  perform set_config('request.jwt.claim.sub', '18181818-1818-4181-8181-181818181801', true);
  perform public.record_founder_service_start(v_other, date '2026-11-10');
  v_result := public.ensure_founder_monthly(v_other, 1);
  if v_result->>'commercial_error_code' is distinct from 'period_conflict' then
    raise exception 'D conflict %', v_result;
  end if;

  perform set_config('request.jwt.claim.sub', '18181818-1818-4181-8181-181818181802', true);
  v_win := commercial.win_opportunity('18181818-1818-4181-8181-181818181853', '18181818-1818-4181-8181-181818181832', null);
  v_edge := (v_win->>'conversion_terms_id')::uuid;
  perform set_config('request.jwt.claim.sub', '18181818-1818-4181-8181-181818181801', true);
  perform public.record_founder_service_start(v_edge, date '2026-01-31');
  v_result := public.ensure_founder_monthly(v_edge, 1);
  if v_result->>'commercial_error_code' is distinct from 'month_length_unspecified' then
    raise exception 'G month end %', v_result;
  end if;
  select count(*) into v_count from commercial.platform_obligations
  where conversion_terms_id = v_edge and kind = 'subscription';
  if v_count <> 0 then
    raise exception 'G created a shifted date';
  end if;
end;
$$;

rollback;
