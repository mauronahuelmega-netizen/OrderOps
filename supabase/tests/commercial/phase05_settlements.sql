-- P05-T06. Rolls back. September includes only rights that became available inside that Argentina month.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-4333-8333-333333333301', 'authenticated', 'authenticated', 'phase05-finance-a@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-4333-8333-333333333303', 'authenticated', 'authenticated', 'phase05-finance-b@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-4333-8333-333333333302', 'authenticated', 'authenticated', 'phase05-super-set@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-4333-8333-333333333304', 'authenticated', 'authenticated', 'phase05-promoter-set@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());
insert into commercial.platform_accounts (id, user_id, kind) values
  ('33333333-3333-4333-8333-333333333311', '33333333-3333-4333-8333-333333333301', 'internal'),
  ('33333333-3333-4333-8333-333333333313', '33333333-3333-4333-8333-333333333303', 'internal'),
  ('33333333-3333-4333-8333-333333333312', '33333333-3333-4333-8333-333333333302', 'internal'),
  ('33333333-3333-4333-8333-333333333314', '33333333-3333-4333-8333-333333333304', 'promoter');
insert into commercial.internal_role_assignments (account_id, role) values
  ('33333333-3333-4333-8333-333333333311', 'finance'),
  ('33333333-3333-4333-8333-333333333313', 'finance'),
  ('33333333-3333-4333-8333-333333333312', 'superadmin');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('33333333-3333-4333-8333-333333333321', '33333333-3333-4333-8333-333333333314', 'pset00000006', 'Promotor Liquidacion', 'active');
insert into public.businesses (id, name, slug, whatsapp_number) values
  ('33333333-3333-4333-8333-333333333331', 'Negocio Liquidacion', 'negocio-liquidacion', '5491100000551');
insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel) values
  ('33333333-3333-4333-8333-333333333341', 'Lead Liquidacion', 'lead liquidacion', 'promoter');
insert into commercial.commercial_opportunities (id, commercial_business_id, stage, owner_account_id) values
  ('33333333-3333-4333-8333-333333333351', '33333333-3333-4333-8333-333333333341', 'demo_done', '33333333-3333-4333-8333-333333333314');
insert into commercial.opportunity_attributions (id, opportunity_id, promoter_id, status, method, reason) values
  ('33333333-3333-4333-8333-333333333361', '33333333-3333-4333-8333-333333333351', '33333333-3333-4333-8333-333333333321', 'confirmed', 'manual', 'fixture');

select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333302', true);

do $$
declare
  v_terms uuid;
  v_open jsonb;
  v_result jsonb;
  v_inside uuid;
  v_outside uuid;
  v_adjustment uuid;
  v_ignored uuid;
  v_settlement uuid;
  v_count int;
  v_total bigint;
begin
  v_terms := (commercial.win_opportunity('33333333-3333-4333-8333-333333333351', '33333333-3333-4333-8333-333333333331', null)->>'conversion_terms_id')::uuid;
  perform set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333301', true);

  v_open := public.open_obligation(v_terms, 'subscription', 'set:inside');
  v_result := public.record_collection((v_open->>'obligation_id')::uuid, 'set-inside', 'posted', 5500000, null);
  perform public.accrue_commissions_for_collection((v_result->>'collection_id')::uuid);
  v_inside := (select id from commercial.promoter_commissions where collection_id = (v_result->>'collection_id')::uuid);
  update commercial.promoter_commissions
  set status = 'available', available_at = '2026-09-16 15:00:00+00'
  where id = v_inside;

  v_open := public.open_obligation(v_terms, 'subscription', 'set:outside');
  v_result := public.record_collection((v_open->>'obligation_id')::uuid, 'set-outside', 'posted', 5500000, null);
  perform public.accrue_commissions_for_collection((v_result->>'collection_id')::uuid);
  v_outside := (select id from commercial.promoter_commissions where collection_id = (v_result->>'collection_id')::uuid);
  update commercial.promoter_commissions
  set status = 'available', available_at = '2026-10-02 15:00:00+00'
  where id = v_outside;

  v_result := public.post_adjustment(v_inside, -100, 'incluido', 'correction');
  v_adjustment := (v_result->>'adjustment_id')::uuid;
  v_result := public.post_adjustment(v_inside, -50, 'no elegido', 'correction');
  v_ignored := (v_result->>'adjustment_id')::uuid;

  v_result := public.prepare_settlement('33333333-3333-4333-8333-333333333321', '2026-09', array[v_adjustment]);
  if v_result->>'ok' is distinct from 'true' or v_result->>'total_cents' is distinct from '2199900' or v_result->>'due_on' is distinct from '2026-10-10' then
    raise exception 'G-13 %', v_result;
  end if;
  v_settlement := (v_result->>'settlement_id')::uuid;
  select count(*) into v_count from commercial.settlement_items where settlement_id = v_settlement;
  if v_count <> 2
     or (select status from commercial.promoter_commissions where id = v_outside) is distinct from 'available'
     or (select status from commercial.commission_adjustments where id = v_ignored) is distinct from 'available' then
    raise exception 'outside or ignored entered';
  end if;

  v_result := public.prepare_settlement('33333333-3333-4333-8333-333333333321', '2026-09', array[v_adjustment]);
  if v_result->>'duplicate' is distinct from 'true' or v_result->>'settlement_id' is distinct from v_settlement::text then
    raise exception 'second draft %', v_result;
  end if;

  v_result := public.approve_settlement(v_settlement);
  if v_result->>'commercial_error_code' is distinct from 'sod_conflict' then
    raise exception 'same approver %', v_result;
  end if;

  perform set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333302', true);
  v_result := public.prepare_settlement('33333333-3333-4333-8333-333333333321', '2026-10', null);
  if v_result->>'commercial_error_code' is distinct from 'forbidden' then
    raise exception 'superadmin prepare %', v_result;
  end if;

  perform set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333303', true);
  v_result := public.approve_settlement(v_settlement);
  if v_result->>'status' is distinct from 'approved' then
    raise exception 'E2E-03 approve %', v_result;
  end if;
  select total_cents into v_total from commercial.promoter_settlements where id = v_settlement;
  if v_total <> 2199900 or (select approved_by = prepared_by from commercial.promoter_settlements where id = v_settlement) then
    raise exception 'approved totals';
  end if;

  perform set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333301', true);
  v_result := public.prepare_settlement('33333333-3333-4333-8333-333333333321', '2026-09', null);
  if v_result->>'commercial_error_code' is distinct from 'settlement_exists' then
    raise exception 'approved replay %', v_result;
  end if;
end;
$$;

rollback;
