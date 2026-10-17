-- P05-T03. Rolls back. Window, onboarding, exception, and dispute hold.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '66666666-6666-4666-8666-666666666601', 'authenticated', 'authenticated', 'phase05-finance-window@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '66666666-6666-4666-8666-666666666602', 'authenticated', 'authenticated', 'phase05-super-window@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '66666666-6666-4666-8666-666666666604', 'authenticated', 'authenticated', 'phase05-promoter-window@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

insert into commercial.platform_accounts (id, user_id, kind) values
  ('66666666-6666-4666-8666-666666666611', '66666666-6666-4666-8666-666666666601', 'internal'),
  ('66666666-6666-4666-8666-666666666612', '66666666-6666-4666-8666-666666666602', 'internal'),
  ('66666666-6666-4666-8666-666666666614', '66666666-6666-4666-8666-666666666604', 'promoter');
insert into commercial.internal_role_assignments (account_id, role) values
  ('66666666-6666-4666-8666-666666666611', 'finance'),
  ('66666666-6666-4666-8666-666666666612', 'superadmin');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('66666666-6666-4666-8666-666666666621', '66666666-6666-4666-8666-666666666614', 'pwin00000003', 'Promotor Window', 'active');
insert into public.businesses (id, name, slug, whatsapp_number) values
  ('66666666-6666-4666-8666-666666666631', 'Negocio Window A', 'negocio-window-a', '5491100000261'),
  ('66666666-6666-4666-8666-666666666632', 'Negocio Window B', 'negocio-window-b', '5491100000262');
insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel) values
  ('66666666-6666-4666-8666-666666666641', 'Lead Window A', 'lead window a', 'promoter'),
  ('66666666-6666-4666-8666-666666666642', 'Lead Window B', 'lead window b', 'promoter');
insert into commercial.commercial_opportunities (id, commercial_business_id, stage, owner_account_id) values
  ('66666666-6666-4666-8666-666666666651', '66666666-6666-4666-8666-666666666641', 'demo_done', '66666666-6666-4666-8666-666666666614'),
  ('66666666-6666-4666-8666-666666666652', '66666666-6666-4666-8666-666666666642', 'demo_done', '66666666-6666-4666-8666-666666666614');
insert into commercial.opportunity_attributions (id, opportunity_id, promoter_id, status, method, reason) values
  ('66666666-6666-4666-8666-666666666661', '66666666-6666-4666-8666-666666666651', '66666666-6666-4666-8666-666666666621', 'confirmed', 'manual', 'fixture'),
  ('66666666-6666-4666-8666-666666666662', '66666666-6666-4666-8666-666666666652', '66666666-6666-4666-8666-666666666621', 'confirmed', 'manual', 'fixture');

select set_config('request.jwt.claim.sub', '66666666-6666-4666-8666-666666666602', true);

do $$
declare
  v_win jsonb;
  v_terms uuid;
  v_result jsonb;
  v_setup uuid;
  v_month uuid;
  v_status text;
  v_slot int;
begin
  v_win := commercial.win_opportunity('66666666-6666-4666-8666-666666666651', '66666666-6666-4666-8666-666666666631', null);
  v_terms := (v_win->>'conversion_terms_id')::uuid;
  perform set_config('request.jwt.claim.sub', '66666666-6666-4666-8666-666666666601', true);
  v_result := public.open_obligation(v_terms, 'setup', null);
  v_result := public.record_collection((v_result->>'obligation_id')::uuid, 'window-setup-a', 'posted', 29000000, null);
  v_setup := (v_result->>'collection_id')::uuid;
  perform public.accrue_commissions_for_collection(v_setup);
  update commercial.platform_collections set posted_at = pg_catalog.clock_timestamp() - interval '16 days' where id = v_setup;
  v_result := public.refresh_commission_availability();
  select status, slot into v_status, v_slot from commercial.promoter_commissions where collection_id = v_setup;
  if v_status is distinct from 'pending' or v_slot is not null then
    raise exception 'G-01 returned % / %', v_status, v_slot;
  end if;

  perform public.record_founder_service_start(v_terms, date '2019-01-10');
  v_result := public.open_obligation(v_terms, 'subscription', '2019-02-10');
  v_result := public.record_collection((v_result->>'obligation_id')::uuid, 'window-month-a', 'posted', 5500000, null);
  v_month := (v_result->>'collection_id')::uuid;
  perform public.accrue_commissions_for_collection(v_month);
  update commercial.platform_collections set posted_at = pg_catalog.clock_timestamp() - interval '16 days' where id = v_month;
  perform public.refresh_commission_availability();
  select status, slot into v_status, v_slot from commercial.promoter_commissions where collection_id = v_month;
  if v_status is distinct from 'available' or v_slot is not null then
    raise exception 'recurring day 16 returned % / %', v_status, v_slot;
  end if;

  insert into commercial.onboarding_grants (promoter_id, business_id, status, completed_at)
  values ('66666666-6666-4666-8666-666666666621', '66666666-6666-4666-8666-666666666631', 'completed', pg_catalog.clock_timestamp());
  perform public.refresh_commission_availability();
  select status into v_status from commercial.promoter_commissions where collection_id = v_setup;
  if v_status is distinct from 'available' then
    raise exception 'G-02 returned %', v_status;
  end if;

  perform set_config('request.jwt.claim.sub', '66666666-6666-4666-8666-666666666602', true);
  v_win := commercial.win_opportunity('66666666-6666-4666-8666-666666666652', '66666666-6666-4666-8666-666666666632', null);
  v_terms := (v_win->>'conversion_terms_id')::uuid;
  perform set_config('request.jwt.claim.sub', '66666666-6666-4666-8666-666666666601', true);
  v_result := public.open_obligation(v_terms, 'setup', null);
  v_result := public.record_collection((v_result->>'obligation_id')::uuid, 'window-setup-b', 'posted', 29000000, null);
  v_setup := (v_result->>'collection_id')::uuid;
  v_result := public.accrue_commissions_for_collection(v_setup);
  update commercial.platform_collections set posted_at = pg_catalog.clock_timestamp() - interval '10 days' where id = v_setup;
  insert into commercial.onboarding_grants (promoter_id, business_id, status, completed_at)
  values ('66666666-6666-4666-8666-666666666621', '66666666-6666-4666-8666-666666666632', 'completed', pg_catalog.clock_timestamp());
  perform public.refresh_commission_availability();
  select status into v_status from commercial.promoter_commissions where id = (v_result->>'commission_id')::uuid;
  if v_status is distinct from 'pending' then
    raise exception 'G-03 returned %', v_status;
  end if;

  v_result := public.release_setup_commission((v_result->>'commission_id')::uuid, 'finance must not release');
  if v_result->>'commercial_error_code' is distinct from 'forbidden' then
    raise exception 'finance release returned %', v_result;
  end if;
  perform set_config('request.jwt.claim.sub', '66666666-6666-4666-8666-666666666602', true);
  v_result := public.release_setup_commission((
    select id from commercial.promoter_commissions where collection_id = v_setup
  ), 'onboarding stuck');
  if v_result->>'status' is distinct from 'available' then
    raise exception 'G-04 returned %', v_result;
  end if;

  insert into commercial.attribution_disputes (opportunity_id, status, opened_by, economic_effect)
  values ('66666666-6666-4666-8666-666666666652', 'decided', '66666666-6666-4666-8666-666666666612', 'hold_unpaid_commissions');
  perform set_config('request.jwt.claim.sub', '66666666-6666-4666-8666-666666666601', true);
  perform public.refresh_commission_availability();
  select status into v_status from commercial.promoter_commissions where collection_id = v_setup;
  if v_status is distinct from 'held' then
    raise exception 'hold returned %', v_status;
  end if;
  select status into v_status from commercial.promoter_commissions where collection_id = v_month;
  if v_status is distinct from 'available' then
    raise exception 'other opportunity was held: %', v_status;
  end if;
end;
$$;

rollback;
