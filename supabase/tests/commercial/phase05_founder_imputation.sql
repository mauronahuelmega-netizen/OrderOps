-- T04-I. Rolls back. A collection stays on its own business obligation.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '19191919-1919-4191-8191-191919191901', 'authenticated', 'authenticated', 'phase05-founder-impute@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '19191919-1919-4191-8191-191919191902', 'authenticated', 'authenticated', 'phase05-founder-impute-super@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '19191919-1919-4191-8191-191919191904', 'authenticated', 'authenticated', 'phase05-founder-impute-promoter@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());
insert into commercial.platform_accounts (id, user_id, kind) values
  ('19191919-1919-4191-8191-191919191911', '19191919-1919-4191-8191-191919191901', 'internal'),
  ('19191919-1919-4191-8191-191919191912', '19191919-1919-4191-8191-191919191902', 'internal'),
  ('19191919-1919-4191-8191-191919191914', '19191919-1919-4191-8191-191919191904', 'promoter');
insert into commercial.internal_role_assignments (account_id, role) values
  ('19191919-1919-4191-8191-191919191911', 'finance'),
  ('19191919-1919-4191-8191-191919191912', 'superadmin');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('19191919-1919-4191-8191-191919191921', '19191919-1919-4191-8191-191919191914', 'pimp00000019', 'Promotor Imputacion', 'active');
insert into public.businesses (id, name, slug, whatsapp_number) values
  ('19191919-1919-4191-8191-191919191931', 'Negocio Imputacion A', 'negocio-imputacion-a', '5491100001919'),
  ('19191919-1919-4191-8191-191919191932', 'Negocio Imputacion B', 'negocio-imputacion-b', '5491100001920');
insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel) values
  ('19191919-1919-4191-8191-191919191941', 'Lead Imputacion A', 'lead imputacion a', 'promoter'),
  ('19191919-1919-4191-8191-191919191942', 'Lead Imputacion B', 'lead imputacion b', 'promoter');
insert into commercial.commercial_opportunities (id, commercial_business_id, stage, owner_account_id) values
  ('19191919-1919-4191-8191-191919191951', '19191919-1919-4191-8191-191919191941', 'demo_done', '19191919-1919-4191-8191-191919191914'),
  ('19191919-1919-4191-8191-191919191952', '19191919-1919-4191-8191-191919191942', 'demo_done', '19191919-1919-4191-8191-191919191914');
insert into commercial.opportunity_attributions (id, opportunity_id, promoter_id, status, method, reason) values
  ('19191919-1919-4191-8191-191919191961', '19191919-1919-4191-8191-191919191951', '19191919-1919-4191-8191-191919191921', 'confirmed', 'manual', 'fixture'),
  ('19191919-1919-4191-8191-191919191962', '19191919-1919-4191-8191-191919191952', '19191919-1919-4191-8191-191919191921', 'confirmed', 'manual', 'fixture');

select set_config('request.jwt.claim.sub', '19191919-1919-4191-8191-191919191902', true);

do $$
declare
  v_a uuid;
  v_b uuid;
  v_win jsonb;
  v_open_a jsonb;
  v_open_b jsonb;
  v_result jsonb;
  v_collection uuid;
  v_count int;
begin
  v_win := commercial.win_opportunity('19191919-1919-4191-8191-191919191951', '19191919-1919-4191-8191-191919191931', null);
  v_a := (v_win->>'conversion_terms_id')::uuid;
  v_win := commercial.win_opportunity('19191919-1919-4191-8191-191919191952', '19191919-1919-4191-8191-191919191932', null);
  if v_win->>'status' is distinct from 'won' or v_a is null then
    raise exception 'wins %', v_win;
  end if;
  v_b := (v_win->>'conversion_terms_id')::uuid;
  perform set_config('request.jwt.claim.sub', '19191919-1919-4191-8191-191919191901', true);
  perform public.record_founder_service_start(v_a, date '2026-11-10');
  perform public.record_founder_service_start(v_b, date '2026-11-10');
  v_open_a := public.ensure_founder_monthly(v_a, 1);
  v_open_b := public.ensure_founder_monthly(v_b, 1);
  if v_open_a->>'period_key' is distinct from '2026-12-10'
     or v_open_b->>'period_key' is distinct from '2026-12-10'
     or (v_open_a->>'obligation_id')::uuid = (v_open_b->>'obligation_id')::uuid then
    raise exception 'months % / %', v_open_a, v_open_b;
  end if;

  v_result := public.record_collection((v_open_a->>'obligation_id')::uuid, 'impute-a', 'posted', 5500000, 'solo-a');
  if v_result->>'policy_status' is distinct from 'nominal' then
    raise exception 'post A %', v_result;
  end if;
  v_collection := (v_result->>'collection_id')::uuid;
  if (select status from commercial.platform_obligations where id = (v_open_b->>'obligation_id')::uuid) is distinct from 'open'
     or exists (select 1 from commercial.platform_collections where obligation_id = (v_open_b->>'obligation_id')::uuid) then
    raise exception 'B changed when A was collected';
  end if;

  v_result := public.record_collection((v_open_b->>'obligation_id')::uuid, 'impute-a', 'posted', 5500000, 'solo-a');
  if v_result->>'commercial_error_code' is distinct from 'idempotent_replay' then
    raise exception 'A key on B %', v_result;
  end if;
  if (select status from commercial.platform_obligations where id = (v_open_b->>'obligation_id')::uuid) is distinct from 'open' then
    raise exception 'replay closed B';
  end if;
  select count(*) into v_count from commercial.platform_collections where idempotency_key = 'impute-a';
  if v_count <> 1 or (select obligation_id from commercial.platform_collections where id = v_collection) is distinct from (v_open_a->>'obligation_id')::uuid then
    raise exception 'key moved businesses';
  end if;

  perform public.accrue_commissions_for_collection(v_collection);
  v_result := public.satisfy_subscription_collection(v_collection);
  if v_result->>'slot' is distinct from '1' then
    raise exception 'slot A %', v_result;
  end if;
  if exists (select 1 from commercial.founder_slots where conversion_terms_id = v_b)
     or exists (select 1 from commercial.promoter_commissions where conversion_terms_id = v_b) then
    raise exception 'A collection recognized B';
  end if;

  perform set_config('request.jwt.claim.sub', '19191919-1919-4191-8191-191919191904', true);
  v_result := public.record_collection((v_open_b->>'obligation_id')::uuid, 'impute-b', 'posted', 5500000, 'promoter');
  if v_result->>'commercial_error_code' is distinct from 'forbidden' then
    raise exception 'promoter posted %', v_result;
  end if;
  if (select status from commercial.platform_obligations where id = (v_open_b->>'obligation_id')::uuid) is distinct from 'open' then
    raise exception 'promoter closed B';
  end if;
end;
$$;

rollback;
