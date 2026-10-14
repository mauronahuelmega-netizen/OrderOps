-- P05-T05. Rolls back. Unpaid reverse voids the slot number. Paid reverse keeps the commission and posts a negative adjustment.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000', '44444444-4444-4444-8444-444444444401', 'authenticated', 'authenticated',
  'phase05-finance-rev@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
), (
  '00000000-0000-0000-0000-000000000000', '44444444-4444-4444-8444-444444444402', 'authenticated', 'authenticated',
  'phase05-super-rev@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
), (
  '00000000-0000-0000-0000-000000000000', '44444444-4444-4444-8444-444444444404', 'authenticated', 'authenticated',
  'phase05-promoter-rev@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
);
insert into commercial.platform_accounts (id, user_id, kind) values
  ('44444444-4444-4444-8444-444444444411', '44444444-4444-4444-8444-444444444401', 'internal'),
  ('44444444-4444-4444-8444-444444444412', '44444444-4444-4444-8444-444444444402', 'internal'),
  ('44444444-4444-4444-8444-444444444414', '44444444-4444-4444-8444-444444444404', 'promoter');
insert into commercial.internal_role_assignments (account_id, role) values
  ('44444444-4444-4444-8444-444444444411', 'finance'),
  ('44444444-4444-4444-8444-444444444412', 'superadmin');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('44444444-4444-4444-8444-444444444421', '44444444-4444-4444-8444-444444444414', 'prev00000005', 'Promotor Reversa', 'active');
insert into public.businesses (id, name, slug, whatsapp_number) values
  ('44444444-4444-4444-8444-444444444431', 'Negocio Reversa', 'negocio-reversa', '5491100000451');
insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel) values
  ('44444444-4444-4444-8444-444444444441', 'Lead Reversa', 'lead reversa', 'promoter');
insert into commercial.commercial_opportunities (id, commercial_business_id, stage, owner_account_id) values
  ('44444444-4444-4444-8444-444444444451', '44444444-4444-4444-8444-444444444441', 'demo_done', '44444444-4444-4444-8444-444444444414');
insert into commercial.opportunity_attributions (id, opportunity_id, promoter_id, status, method, reason) values
  ('44444444-4444-4444-8444-444444444461', '44444444-4444-4444-8444-444444444451', '44444444-4444-4444-8444-444444444421', 'confirmed', 'manual', 'fixture');

select set_config('request.jwt.claim.sub', '44444444-4444-4444-8444-444444444402', true);

do $$
declare
  v_terms uuid;
  v_open jsonb;
  v_result jsonb;
  v_unpaid uuid;
  v_paid uuid;
  v_amount bigint;
  v_count int;
  v_slot int;
begin
  v_terms := (commercial.win_opportunity('44444444-4444-4444-8444-444444444451', '44444444-4444-4444-8444-444444444431', null)->>'conversion_terms_id')::uuid;
  perform set_config('request.jwt.claim.sub', '44444444-4444-4444-8444-444444444401', true);

  v_open := public.open_obligation(v_terms, 'subscription', 'rev:1');
  v_result := public.record_collection((v_open->>'obligation_id')::uuid, 'rev-unpaid', 'posted', 5500000, null);
  v_unpaid := (v_result->>'collection_id')::uuid;
  perform public.accrue_commissions_for_collection(v_unpaid);
  perform public.satisfy_subscription_collection(v_unpaid);
  update commercial.platform_collections set posted_at = pg_catalog.clock_timestamp() - interval '2 days' where id = v_unpaid;
  v_result := public.reverse_collection(v_unpaid, 'cliente dentro de ventana');
  if v_result->>'ok' is distinct from 'true' or v_result->>'adjustment_id' is not null then
    raise exception 'G-10 reverse %', v_result;
  end if;
  perform public.refresh_commission_availability();
  if (select status from commercial.platform_collections where id = v_unpaid) is distinct from 'reversed'
     or (select status from commercial.promoter_commissions where collection_id = v_unpaid) is distinct from 'voided'
     or (select amount_cents from commercial.promoter_commissions where collection_id = v_unpaid) is distinct from 2200000
     or (select voided_at is null from commercial.founder_slots where collection_id = v_unpaid) then
    raise exception 'E2E-05 unpaid history changed';
  end if;

  v_open := public.open_obligation(v_terms, 'subscription', 'rev:2');
  v_result := public.record_collection((v_open->>'obligation_id')::uuid, 'rev-next', 'posted', 5500000, null);
  perform public.accrue_commissions_for_collection((v_result->>'collection_id')::uuid);
  v_result := public.satisfy_subscription_collection((v_result->>'collection_id')::uuid);
  if v_result->>'slot' is distinct from '2' then
    raise exception 'slot recycled %', v_result;
  end if;

  v_result := public.reverse_collection(v_unpaid, 'otra vez');
  if v_result->>'duplicate' is distinct from 'true' then
    raise exception 'idempotent %', v_result;
  end if;

  v_open := public.open_obligation(v_terms, 'subscription', 'rev:paid');
  v_result := public.record_collection((v_open->>'obligation_id')::uuid, 'rev-paid', 'posted', 5500000, null);
  v_paid := (v_result->>'collection_id')::uuid;
  perform public.accrue_commissions_for_collection(v_paid);
  perform public.satisfy_subscription_collection(v_paid);
  update commercial.promoter_commissions set status = 'paid' where collection_id = v_paid;
  select amount_cents, slot into v_amount, v_slot from commercial.promoter_commissions where collection_id = v_paid;
  v_result := public.reverse_collection(v_paid, 'ya pagada');
  if v_result->>'ok' is distinct from 'true' then
    raise exception 'G-11 %', v_result;
  end if;
  select count(*) into v_count from commercial.commission_adjustments
  where commission_id = (select id from commercial.promoter_commissions where collection_id = v_paid)
    and amount_cents = -2200000 and status = 'available' and source = 'void';
  if v_count <> 1
     or (select status from commercial.promoter_commissions where collection_id = v_paid) is distinct from 'paid'
     or (select amount_cents from commercial.promoter_commissions where collection_id = v_paid) is distinct from v_amount
     or (select voided_at is not null from commercial.founder_slots where collection_id = v_paid) then
    raise exception 'paid history rewritten';
  end if;

  v_result := public.post_adjustment(
    (select id from commercial.promoter_commissions where collection_id = v_paid),
    -100, 'correccion manual', 'correction'
  );
  if v_result->>'ok' is distinct from 'true'
     or (select amount_cents from commercial.promoter_commissions where collection_id = v_paid) is distinct from v_amount then
    raise exception 'CC-32 %', v_result;
  end if;

  perform set_config('request.jwt.claim.sub', '44444444-4444-4444-8444-444444444402', true);
  v_result := public.reverse_collection(v_paid, 'superadmin sin permiso');
  if v_result->>'commercial_error_code' is distinct from 'forbidden' then
    raise exception 'superadmin reverse %', v_result;
  end if;
end;
$$;

rollback;
