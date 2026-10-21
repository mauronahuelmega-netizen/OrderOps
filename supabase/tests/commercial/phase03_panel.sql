-- P03-T07 isolation and inactive promoter. Rolls back.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '67676767-6767-4767-8767-676767676701', 'authenticated', 'authenticated', 'phase03-panel-a@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '67676767-6767-4767-8767-676767676702', 'authenticated', 'authenticated', 'phase03-panel-b@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());
insert into commercial.platform_accounts (id, user_id, kind) values
  ('67676767-6767-4767-8767-676767676711', '67676767-6767-4767-8767-676767676701', 'promoter'),
  ('67676767-6767-4767-8767-676767676712', '67676767-6767-4767-8767-676767676702', 'promoter');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('67676767-6767-4767-8767-676767676721', '67676767-6767-4767-8767-676767676711', 'ppanela', 'Ana Panel', 'active'),
  ('67676767-6767-4767-8767-676767676722', '67676767-6767-4767-8767-676767676712', 'ppanelb', 'Luis Panel', 'registered');
insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel)
values ('67676767-6767-4767-8767-676767676731', 'Pan De Ana', 'pan de ana', 'promoter');
insert into commercial.commercial_opportunities (id, commercial_business_id, stage, owner_account_id)
values ('67676767-6767-4767-8767-676767676741', '67676767-6767-4767-8767-676767676731', 'new', '67676767-6767-4767-8767-676767676711');
insert into commercial.attribution_claims (promoter_id, commercial_business_id, opportunity_id, status, provisional_until)
values ('67676767-6767-4767-8767-676767676721', '67676767-6767-4767-8767-676767676731', '67676767-6767-4767-8767-676767676741', 'provisional', now() + interval '30 days');

do $$
declare
  v_overview jsonb;
  v_register jsonb;
  v_won jsonb;
begin
  perform set_config('request.jwt.claim.sub', '67676767-6767-4767-8767-676767676702', true);
  v_overview := commercial.promoter_overview();
  if jsonb_array_length(v_overview->'claims') <> 0 or v_overview::text like '%Pan De Ana%' then
    raise exception 'promoter B saw A %', v_overview;
  end if;
  v_register := commercial.register_promoter_business('Otro', '11 8200-0001', 'kiosco');
  if v_register->>'commercial_error_code' is distinct from 'promoter_not_active' then
    raise exception 'inactive register returned %', v_register;
  end if;

  perform set_config('request.jwt.claim.sub', '67676767-6767-4767-8767-676767676701', true);
  v_overview := commercial.promoter_overview();
  if jsonb_array_length(v_overview->'claims') <> 1 then
    raise exception 'promoter A overview %', v_overview;
  end if;
  v_won := commercial.promoter_transition_opportunity('67676767-6767-4767-8767-676767676741', 'won', null);
  if v_won->>'commercial_error_code' is distinct from 'forbidden' then
    raise exception 'promoter won returned %', v_won;
  end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '67676767-6767-4767-8767-676767676702', true);
do $$
declare
  v_count int;
begin
  select count(*) into v_count from commercial.attribution_claims;
  if v_count <> 0 then
    raise exception 'promoter B selected % claims', v_count;
  end if;
end;
$$;
reset role;

rollback;
