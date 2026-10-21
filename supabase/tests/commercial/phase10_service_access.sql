-- Talo First L4. Rolls back. Buenos Aires calendar, coverage, grace, suspension and reactivation.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '30303030-3030-4030-8030-303030303001', 'authenticated', 'authenticated', 'p10acc-super@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '30303030-3030-4030-8030-303030303002', 'authenticated', 'authenticated', 'p10acc-promoter@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '30303030-3030-4030-8030-303030303003', 'authenticated', 'authenticated', 'p10acc-finance@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());
insert into commercial.platform_accounts (id, user_id, kind) values
  ('30303030-3030-4030-8030-303030303011', '30303030-3030-4030-8030-303030303001', 'internal'),
  ('30303030-3030-4030-8030-303030303012', '30303030-3030-4030-8030-303030303002', 'promoter'),
  ('30303030-3030-4030-8030-303030303013', '30303030-3030-4030-8030-303030303003', 'internal');
insert into commercial.internal_role_assignments (account_id, role) values
  ('30303030-3030-4030-8030-303030303011', 'superadmin'),
  ('30303030-3030-4030-8030-303030303013', 'finance');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('30303030-3030-4030-8030-303030303021', '30303030-3030-4030-8030-303030303012', 'p10a000021', 'Promotor Acceso', 'active');
insert into public.businesses (id, name, slug, whatsapp_number) values
  ('30303030-3030-4030-8030-303030303031', 'Negocio Acceso A', 'negocio-acceso-a', '5491100303031'),
  ('30303030-3030-4030-8030-303030303032', 'Negocio Acceso Sin Terminos', 'negocio-acceso-sin', '5491100303032'),
  ('30303030-3030-4030-8030-303030303033', 'Negocio Acceso Doble', 'negocio-acceso-doble', '5491100303033');
insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel) values
  ('30303030-3030-4030-8030-303030303041', 'Lead Acceso A', 'lead acceso a', 'promoter'),
  ('30303030-3030-4030-8030-303030303042', 'Lead Acceso D1', 'lead acceso d1', 'promoter'),
  ('30303030-3030-4030-8030-303030303043', 'Lead Acceso D2', 'lead acceso d2', 'promoter');
insert into commercial.commercial_opportunities (id, commercial_business_id, stage, owner_account_id) values
  ('30303030-3030-4030-8030-303030303051', '30303030-3030-4030-8030-303030303041', 'demo_done', '30303030-3030-4030-8030-303030303012'),
  ('30303030-3030-4030-8030-303030303052', '30303030-3030-4030-8030-303030303042', 'demo_done', '30303030-3030-4030-8030-303030303012'),
  ('30303030-3030-4030-8030-303030303053', '30303030-3030-4030-8030-303030303043', 'demo_done', '30303030-3030-4030-8030-303030303012');
insert into commercial.opportunity_attributions (id, opportunity_id, promoter_id, status, method, reason) values
  ('30303030-3030-4030-8030-303030303061', '30303030-3030-4030-8030-303030303051', '30303030-3030-4030-8030-303030303021', 'confirmed', 'manual', 'fixture'),
  ('30303030-3030-4030-8030-303030303062', '30303030-3030-4030-8030-303030303052', '30303030-3030-4030-8030-303030303021', 'confirmed', 'manual', 'fixture'),
  ('30303030-3030-4030-8030-303030303063', '30303030-3030-4030-8030-303030303053', '30303030-3030-4030-8030-303030303021', 'confirmed', 'manual', 'fixture');

create function pg_temp.state(p_at text) returns text language sql as $$
  select commercial.business_service_access('30303030-3030-4030-8030-303030303031', p_at::timestamptz)->>'state'
$$;

-- Calendar edges.
do $$
begin
  if commercial.ba_date('2026-10-21 02:59:59+00') <> date '2026-10-20' then raise exception 'ba_date before midnight'; end if;
  if commercial.ba_date('2026-10-21 03:00:00+00') <> date '2026-10-21' then raise exception 'ba_date midnight'; end if;
  if commercial.ba_start(date '2026-10-23') <> timestamptz '2026-10-23 03:00:00+00' then raise exception 'ba_start'; end if;
  if commercial.founder_period_index(date '2026-01-31', date '2026-02-27') <> 0 then raise exception 'idx feb 27'; end if;
  if commercial.founder_period_index(date '2026-01-31', date '2026-02-28') <> 1 then raise exception 'idx feb 28 clamp'; end if;
  if commercial.founder_period_index(date '2026-01-31', date '2026-03-30') <> 1 then raise exception 'idx mar 30'; end if;
  if commercial.founder_period_index(date '2026-01-31', date '2026-03-31') <> 2 then raise exception 'idx mar 31'; end if;
  if commercial.founder_period_index(date '2027-01-31', date '2028-02-28') <> 12 then raise exception 'idx leap 28'; end if;
  if commercial.founder_period_index(date '2027-01-31', date '2028-02-29') <> 13 then raise exception 'idx leap 29'; end if;
  if commercial.founder_period_index(date '2026-12-10', date '2027-01-09') <> 0 then raise exception 'idx year 9'; end if;
  if commercial.founder_period_index(date '2026-12-10', date '2027-01-10') <> 1 then raise exception 'idx year 10'; end if;
  if commercial.founder_period_index(date '2026-12-10', date '2026-12-09') <> -1 then raise exception 'idx before start'; end if;
  if commercial.founder_period_index(date '2026-08-30', date '2027-02-28') <> 6 then raise exception 'idx 30 to feb'; end if;
end;
$$;

do $$
declare
  v jsonb;
  v_terms uuid;
  v_setup uuid;
  v_sub uuid;
  v_feb uuid;
  v_collection uuid;
begin
  perform set_config('request.jwt.claim.sub', '30303030-3030-4030-8030-303030303001', true);
  v := commercial.win_opportunity('30303030-3030-4030-8030-303030303051', '30303030-3030-4030-8030-303030303031', null);
  v_terms := (v->>'conversion_terms_id')::uuid;
  perform commercial.win_opportunity('30303030-3030-4030-8030-303030303052', '30303030-3030-4030-8030-303030303033', null);
  perform commercial.win_opportunity('30303030-3030-4030-8030-303030303053', '30303030-3030-4030-8030-303030303033', null);

  if commercial.business_service_access('30303030-3030-4030-8030-303030303032', now())->>'state' <> 'no_terms'
    or (commercial.business_service_access('30303030-3030-4030-8030-303030303032', now())->>'allows_orders')::boolean then
    raise exception 'no terms must block';
  end if;
  if commercial.business_service_access('30303030-3030-4030-8030-303030303033', now())->>'state' <> 'review_required' then
    raise exception 'two terms';
  end if;
  insert into commercial.service_access_exemptions (business_id, reason, granted_by)
  values ('30303030-3030-4030-8030-303030303032', 'legacy tenant authorized in fixture', '30303030-3030-4030-8030-303030303011');
  v := commercial.business_service_access('30303030-3030-4030-8030-303030303032', now());
  if v->>'state' <> 'exempt' or not (v->>'allows_orders')::boolean then raise exception 'exempt %', v; end if;
  update commercial.service_access_exemptions set revoked_at = now(), revoked_by = '30303030-3030-4030-8030-303030303011'
  where business_id = '30303030-3030-4030-8030-303030303032';
  if commercial.business_service_access('30303030-3030-4030-8030-303030303032', now())->>'state' <> 'no_terms' then
    raise exception 'revoked exemption';
  end if;

  if pg_temp.state('2026-11-01 12:00+00') <> 'pending_activation' then raise exception 'pending activation'; end if;

  perform set_config('request.jwt.claim.sub', '30303030-3030-4030-8030-303030303003', true);
  v := public.open_obligation(v_terms, 'setup', null);
  v_setup := (v->>'obligation_id')::uuid;
  v := commercial.record_collection(v_setup, 'p10acc-setup', 'posted', 29000000, 'fixture');
  v := commercial.business_service_access('30303030-3030-4030-8030-303030303031', '2026-11-01 12:00+00');
  if v->>'state' <> 'active' or not (v->>'start_pending')::boolean then raise exception 'start pending %', v; end if;

  v := public.record_founder_service_start(v_terms, date '2026-11-16');
  if (v->>'ok')::boolean is not true then raise exception 'start %', v; end if;

  -- Before the start and during the included period.
  if pg_temp.state('2026-11-10 12:00+00') <> 'active' then raise exception 'before start'; end if;
  v := commercial.business_service_access('30303030-3030-4030-8030-303030303031', '2026-11-20 12:00+00');
  if v->>'state' <> 'active' or (v->>'current_period_index')::int <> 0
    or v->>'next_period_on' <> '2026-12-16' or v->>'renewal_window_opens_on' <> '2026-12-06' then
    raise exception 'included period %', v;
  end if;

  -- Anniversary at Buenos Aires midnight, seven days of grace, suspension on the 23rd at 00:00.
  if pg_temp.state('2026-12-16 02:59:59+00') <> 'active' then raise exception 'just before anniversary'; end if;
  v := commercial.business_service_access('30303030-3030-4030-8030-303030303031', '2026-12-16 03:00:00+00');
  if v->>'state' <> 'grace' or (v->>'grace_ends_at')::timestamptz <> timestamptz '2026-12-23 03:00:00+00' or not (v->>'allows_orders')::boolean then
    raise exception 'grace %', v;
  end if;
  if pg_temp.state('2026-12-23 02:59:59+00') <> 'grace' then raise exception 'last grace second'; end if;
  v := commercial.business_service_access('30303030-3030-4030-8030-303030303031', '2026-12-23 03:00:00+00');
  if v->>'state' <> 'suspended' or (v->>'allows_orders')::boolean then raise exception 'suspended %', v; end if;

  -- A valid payment for the current period reactivates.
  v := public.open_obligation(v_terms, 'subscription', '2026-12-16');
  v_sub := (v->>'obligation_id')::uuid;
  v := commercial.record_collection(v_sub, 'p10acc-dec', 'posted', 5500000, 'fixture');
  v_collection := (v->>'collection_id')::uuid;
  if pg_temp.state('2026-12-23 03:00:00+00') <> 'active' then raise exception 'reactivated'; end if;
  if pg_temp.state('2027-01-16 03:00:00+00') <> 'grace' then raise exception 'second grace'; end if;
  -- Unpaid months expire without debt; two unpaid periods in a row give no new grace.
  if pg_temp.state('2027-02-17 12:00:00+00') <> 'suspended' then raise exception 'no grace after an unpaid period'; end if;

  -- A non-nominal amount never covers the period.
  v := public.open_obligation(v_terms, 'subscription', '2027-02-16');
  v_feb := (v->>'obligation_id')::uuid;
  v := commercial.record_collection(v_feb, 'p10acc-feb', 'posted', 6500000, 'fixture');
  if v->>'policy_status' <> 'blocked_pending_policy' then raise exception 'policy %', v; end if;
  if pg_temp.state('2027-02-17 12:00:00+00') <> 'suspended' then raise exception 'blocked collection covered'; end if;

  -- A reversed collection never covers the period; history is kept.
  v := commercial.reverse_collection(v_collection, 'fixture reversal');
  if (v->>'ok')::boolean is not true then raise exception 'reverse %', v; end if;
  if pg_temp.state('2026-12-20 12:00:00+00') <> 'grace' then raise exception 'reversed in grace'; end if;
  if pg_temp.state('2026-12-24 12:00:00+00') <> 'suspended' then raise exception 'reversed covered'; end if;
  if not exists (select 1 from commercial.platform_collections where id = v_collection and status = 'reversed') then
    raise exception 'history removed';
  end if;
end;
$$;

do $$
begin
  if has_function_privilege('anon', 'commercial.business_service_access(uuid, timestamptz)', 'execute')
    or has_function_privilege('authenticated', 'commercial.business_service_access(uuid, timestamptz)', 'execute')
    or has_function_privilege('service_role', 'commercial.business_service_access(uuid, timestamptz)', 'execute') then
    raise exception 'access function grants';
  end if;
  if has_table_privilege('authenticated', 'commercial.service_access_exemptions', 'insert') then
    raise exception 'exemptions writable';
  end if;
end;
$$;

select 'phase10_service_access: PASS' as result;
rollback;
