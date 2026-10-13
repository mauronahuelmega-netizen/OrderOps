-- P04-T01. Rolls back.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '77777777-7777-4777-8777-777777777701', 'authenticated', 'authenticated', 'phase04-win-admin@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '77777777-7777-4777-8777-777777777702', 'authenticated', 'authenticated', 'phase04-win-promoter@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '77777777-7777-4777-8777-777777777703', 'authenticated', 'authenticated', 'phase04-win-commercial@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

insert into commercial.platform_accounts (id, user_id, kind) values
  ('77777777-7777-4777-8777-777777777711', '77777777-7777-4777-8777-777777777701', 'internal'),
  ('77777777-7777-4777-8777-777777777712', '77777777-7777-4777-8777-777777777702', 'promoter'),
  ('77777777-7777-4777-8777-777777777713', '77777777-7777-4777-8777-777777777703', 'internal');
insert into commercial.internal_role_assignments (account_id, role) values
  ('77777777-7777-4777-8777-777777777711', 'superadmin'),
  ('77777777-7777-4777-8777-777777777713', 'commercial');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('77777777-7777-4777-8777-777777777721', '77777777-7777-4777-8777-777777777712', 'pwin00000001', 'Promotor Win', 'active');
insert into public.businesses (id, name, slug, whatsapp_number) values
  ('77777777-7777-4777-8777-777777777731', 'Negocio Win', 'negocio-win-phase04', '5491100000001');
insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel) values
  ('77777777-7777-4777-8777-777777777741', 'Lead Win', 'lead win', 'promoter');
insert into commercial.commercial_opportunities (id, commercial_business_id, stage, owner_account_id) values
  ('77777777-7777-4777-8777-777777777751', '77777777-7777-4777-8777-777777777741', 'demo_done', '77777777-7777-4777-8777-777777777712');
insert into commercial.opportunity_attributions (id, opportunity_id, promoter_id, status, method, reason) values
  ('77777777-7777-4777-8777-777777777761', '77777777-7777-4777-8777-777777777751', '77777777-7777-4777-8777-777777777721', 'confirmed', 'manual', 'fixture');

select set_config('request.jwt.claim.sub', '77777777-7777-4777-8777-777777777702', true);

do $$
declare
  v_result jsonb;
  v_terms commercial.conversion_terms%rowtype;
  v_program_id uuid;
  v_def text;
begin
  v_result := commercial.win_opportunity(
    '77777777-7777-4777-8777-777777777751',
    '77777777-7777-4777-8777-777777777731',
    null
  );
  if v_result->>'commercial_error_code' is distinct from 'won_forbidden' then
    raise exception 'promoter win returned %', v_result;
  end if;

  perform set_config('request.jwt.claim.sub', '77777777-7777-4777-8777-777777777703', true);
  v_result := commercial.win_opportunity(
    '77777777-7777-4777-8777-777777777751',
    '77777777-7777-4777-8777-777777777731',
    null
  );
  if v_result->>'commercial_error_code' is distinct from 'won_forbidden' then
    raise exception 'commercial win returned %', v_result;
  end if;

  perform set_config('request.jwt.claim.sub', '77777777-7777-4777-8777-777777777701', true);
  v_result := commercial.win_opportunity(
    '77777777-7777-4777-8777-777777777751',
    null,
    null
  );
  if v_result->>'commercial_error_code' is distinct from 'won_requires_business' then
    raise exception 'missing business returned %', v_result;
  end if;

  v_result := commercial.win_opportunity(
    '77777777-7777-4777-8777-777777777751',
    '77777777-7777-4777-8777-777777777731',
    null
  );
  if v_result->>'status' is distinct from 'won' then
    raise exception 'superadmin win returned %', v_result;
  end if;

  select * into v_terms from commercial.conversion_terms
  where id = (v_result->>'conversion_terms_id')::uuid;
  if v_terms.program_code is distinct from 'founder'
    or v_terms.program_version <> 1
    or v_terms.setup_price_cents <> 29000000
    or v_terms.monthly_price_cents <> 5500000
    or v_terms.setup_commission_cents <> 12000000
    or v_terms.recurring_bps <> 4000
    or v_terms.max_recurring_slots <> 12
    or v_terms.won_business_id is distinct from '77777777-7777-4777-8777-777777777731' then
    raise exception 'snapshot mismatch';
  end if;

  insert into commercial.commercial_programs (
    code, version, setup_price_cents, monthly_price_cents, setup_commission_cents,
    recurring_bps, max_recurring_slots, effective_from
  ) values ('founder', 2, 1, 1, 1, 1, 1, date '2026-10-11')
  returning id into v_program_id;

  select * into v_terms from commercial.conversion_terms where opportunity_id = '77777777-7777-4777-8777-777777777751';
  if v_terms.program_version <> 1 or v_terms.setup_price_cents <> 29000000 then
    raise exception 'snapshot followed program version 2';
  end if;

  begin
    update commercial.conversion_terms set setup_price_cents = 1 where id = v_terms.id;
    raise exception 'terms update was accepted';
  exception
    when sqlstate 'P0001' then
      if sqlerrm is distinct from 'terms_immutable' then
        raise exception 'unexpected terms error %', sqlerrm;
      end if;
  end;

  if exists (select 1 from commercial.outbox_events where event_name = 'conversion.terms_frozen' and correlation_id = v_terms.id) is not true then
    raise exception 'missing frozen event';
  end if;
  if (select linked_business_id from commercial.commercial_businesses where id = '77777777-7777-4777-8777-777777777741')
    is distinct from '77777777-7777-4777-8777-777777777731' then
    raise exception 'business was not linked';
  end if;

  select pg_get_functiondef('commercial.win_opportunity(uuid,uuid,uuid)'::regprocedure) into v_def;
  if v_def ilike '%promoter_commission%' or v_def ilike '%platform_collections%' or v_def ilike '%service_subscriptions%' then
    raise exception 'win function mentions later money tables';
  end if;
  if exists (select 1 from commercial.promoter_commissions) then
    raise exception 'win created a commission row';
  end if;
end;
$$;

rollback;
