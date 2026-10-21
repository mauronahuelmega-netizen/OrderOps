-- P02-T01. Rolls back fixtures. Does not call a merge or dedup RPC.
begin;

do $$
begin
  if to_regclass('commercial.promoter_commissions') is not null then
    raise exception 'phase 02 crm migration created commission tables';
  end if;
end;
$$;

do $$
declare
  v_business uuid;
  v_store uuid := gen_random_uuid();
  v_promoter uuid := gen_random_uuid();
  v_open uuid;
begin
  insert into public.businesses (id, name, slug, whatsapp_number)
  values (v_store, 'Phase02 Store', 'phase02-store-' || left(v_store::text, 8), '5491100000101');

  insert into commercial.commercial_businesses (
    display_name, normalized_name, initial_channel, initial_promoter_id
  ) values (
    'Panadería Norte', 'panaderia norte', 'organic', v_promoter
  ) returning id into v_business;

  if not exists (
    select 1 from commercial.commercial_businesses
    where id = v_business and initial_promoter_id = v_promoter
  ) then
    raise exception 'informational promoter id was not stored';
  end if;

  begin
    insert into commercial.commercial_opportunities (commercial_business_id, stage)
    values (v_business, 'lost');
    raise exception 'lost without reason was accepted';
  exception when check_violation then
    null;
  end;

  begin
    insert into commercial.commercial_opportunities (
      commercial_business_id, stage, won_at
    ) values (v_business, 'won', now());
    raise exception 'won without conversion data was accepted';
  exception when check_violation then
    null;
  end;

  insert into commercial.commercial_opportunities (commercial_business_id, stage)
  values (v_business, 'new')
  returning id into v_open;

  begin
    insert into commercial.commercial_opportunities (commercial_business_id, stage)
    values (v_business, 'contacting');
    raise exception 'second open opportunity was accepted';
  exception when unique_violation then
    null;
  end;

  update commercial.commercial_opportunities
  set stage = 'lost', lost_reason = 'sin interes', lost_at = now()
  where id = v_open;

  insert into commercial.commercial_opportunities (commercial_business_id, stage)
  values (v_business, 'new');

  insert into commercial.commercial_opportunities (
    commercial_business_id, stage, won_business_id, won_at
  ) values (v_business, 'won', v_store, now());
end;
$$;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '20202020-2020-4020-8020-202020202001', 'authenticated', 'authenticated', 'phase02-support@local.test', 'test-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '20202020-2020-4020-8020-202020202002', 'authenticated', 'authenticated', 'phase02-commercial@local.test', 'test-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '20202020-2020-4020-8020-202020202003', 'authenticated', 'authenticated', 'phase02-finance@local.test', 'test-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

insert into commercial.platform_accounts (id, user_id, kind) values
  ('20202020-2020-4020-8020-202020202011', '20202020-2020-4020-8020-202020202001', 'internal'),
  ('20202020-2020-4020-8020-202020202012', '20202020-2020-4020-8020-202020202002', 'internal'),
  ('20202020-2020-4020-8020-202020202013', '20202020-2020-4020-8020-202020202003', 'internal');

insert into commercial.internal_role_assignments (account_id, role) values
  ('20202020-2020-4020-8020-202020202011', 'support'),
  ('20202020-2020-4020-8020-202020202012', 'commercial'),
  ('20202020-2020-4020-8020-202020202013', 'finance');

select set_config('request.jwt.claim.sub', '20202020-2020-4020-8020-202020202001', true);
set local role authenticated;
do $$
declare
  v_seen int;
begin
  select count(*) into v_seen from commercial.commercial_opportunities;
  if v_seen <> 0 then
    raise exception 'support saw % opportunities', v_seen;
  end if;
  select count(*) into v_seen from commercial.commercial_businesses;
  if v_seen <> 0 then
    raise exception 'support saw % businesses', v_seen;
  end if;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '20202020-2020-4020-8020-202020202002', true);
set local role authenticated;
do $$
declare
  v_seen int;
begin
  select count(*) into v_seen from commercial.commercial_opportunities;
  if v_seen <> 3 then
    raise exception 'commercial saw % opportunities', v_seen;
  end if;

  begin
    insert into commercial.commercial_businesses (display_name, normalized_name, initial_channel)
    values ('Directo', 'directo', 'internal');
    raise exception 'authenticated insert was accepted';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '20202020-2020-4020-8020-202020202003', true);
set local role authenticated;
do $$
declare
  v_seen int;
begin
  select count(*) into v_seen from commercial.commercial_opportunities;
  if v_seen <> 0 then
    raise exception 'finance saw % opportunities', v_seen;
  end if;
end;
$$;

reset role;
set local role anon;
do $$
begin
  begin
    perform count(*) from commercial.commercial_opportunities;
    raise exception 'anon crm read was accepted';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;
reset role;

rollback;
