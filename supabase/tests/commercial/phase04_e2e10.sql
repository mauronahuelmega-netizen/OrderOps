-- E2E-10. Rolls back. No commissions, collections, or subscriptions.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '98989898-9898-4989-8989-989898989801', 'authenticated', 'authenticated', 'phase04-e2e-owner@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '98989898-9898-4989-8989-989898989803', 'authenticated', 'authenticated', 'phase04-e2e-promoter@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());
insert into public.businesses (id, name, slug, whatsapp_number) values
  ('98989898-9898-4989-8989-989898989811', 'E2E Shop', 'e2e-shop-phase04', '5491100000005');
insert into public.profiles (id, business_id, role) values
  ('98989898-9898-4989-8989-989898989801', '98989898-9898-4989-8989-989898989811', 'owner');
select set_config('request.jwt.claim.sub', '98989898-9898-4989-8989-989898989801', true);
insert into commercial.platform_accounts (id, user_id, kind) values
  ('98989898-9898-4989-8989-989898989821', '98989898-9898-4989-8989-989898989803', 'promoter');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('98989898-9898-4989-8989-989898989831', '98989898-9898-4989-8989-989898989821', 'pe2e100001', 'Promotor E2E', 'active');
insert into public.categories (id, business_id, name) values
  ('98989898-9898-4989-8989-989898989841', '98989898-9898-4989-8989-989898989811', 'Bebidas');
insert into public.products (id, business_id, category_id, name, description, price) values
  ('98989898-9898-4989-8989-989898989851', '98989898-9898-4989-8989-989898989811', '98989898-9898-4989-8989-989898989841', 'Cafe', 'clasico', 100.00);

do $$
declare
  v_result jsonb;
  v_grant uuid;
  v_price numeric;
  v_description text;
  v_status text;
  v_rows int;
  v_events int;
begin
  if to_regclass('commercial.promoter_commissions') is not null
    or to_regclass('commercial.platform_collections') is not null
    or to_regclass('commercial.service_subscriptions') is not null then
    raise exception 'phase 04 created an economy table';
  end if;

  perform set_config('request.jwt.claim.sub', '98989898-9898-4989-8989-989898989803', true);
  v_result := commercial.request_onboarding_grant(
    '98989898-9898-4989-8989-989898989831',
    '98989898-9898-4989-8989-989898989811',
    null
  );
  v_grant := (v_result->>'grant_id')::uuid;
  perform set_config('request.jwt.claim.sub', '98989898-9898-4989-8989-989898989801', true);
  v_result := commercial.respond_onboarding_grant(v_grant, 'approve', null, null);
  if v_result->>'status' is distinct from 'active' then
    raise exception 'approval returned %', v_result;
  end if;
  if exists (
    select 1 from commercial.onboarding_grants
    where id = v_grant and ends_at > starts_at + interval '30 days'
  ) then
    raise exception 'grant exceeds 30 days';
  end if;

  execute 'set local role authenticated';
  update public.products set price = 250.00 where id = '98989898-9898-4989-8989-989898989851';
  execute 'set local role postgres';
  select price into v_price from public.products where id = '98989898-9898-4989-8989-989898989851';
  if v_price is distinct from 250.00 then
    raise exception 'owner price did not persist: %', v_price;
  end if;

  perform set_config('request.jwt.claim.sub', '98989898-9898-4989-8989-989898989803', true);
  v_result := commercial.promoter_apply_catalog(jsonb_build_object(
    'kind', 'product_update',
    'product_id', '98989898-9898-4989-8989-989898989851',
    'description', 'descripcion nueva'
  ));
  if v_result->>'ok' is distinct from 'true' then
    raise exception 'description update returned %', v_result;
  end if;
  v_result := commercial.promoter_apply_catalog(jsonb_build_object(
    'kind', 'product_update',
    'product_id', '98989898-9898-4989-8989-989898989851',
    'description', 'no debe quedar',
    'price', 1
  ));
  if v_result->>'commercial_error_code' is distinct from 'grant_field_forbidden' then
    raise exception 'priced payload returned %', v_result;
  end if;
  select description, price into v_description, v_price
  from public.products where id = '98989898-9898-4989-8989-989898989851';
  if v_description is distinct from 'descripcion nueva' or v_price is distinct from 250.00 then
    raise exception 'catalog state % %', v_description, v_price;
  end if;

  perform set_config('request.jwt.claim.sub', '98989898-9898-4989-8989-989898989801', true);
  perform commercial.revoke_onboarding_grant(v_grant, 'cliente revoca');
  perform set_config('request.jwt.claim.sub', '98989898-9898-4989-8989-989898989803', true);
  v_result := commercial.promoter_apply_catalog(jsonb_build_object(
    'kind', 'product_update',
    'product_id', '98989898-9898-4989-8989-989898989851',
    'description', 'despues de revocar'
  ));
  if v_result->>'commercial_error_code' is distinct from 'grant_missing' then
    raise exception 'revoked grant returned %', v_result;
  end if;

  perform set_config('request.jwt.claim.sub', '98989898-9898-4989-8989-989898989803', true);
  v_result := commercial.request_onboarding_grant(
    '98989898-9898-4989-8989-989898989831',
    '98989898-9898-4989-8989-989898989811',
    null
  );
  v_grant := (v_result->>'grant_id')::uuid;
  perform set_config('request.jwt.claim.sub', '98989898-9898-4989-8989-989898989801', true);
  perform commercial.respond_onboarding_grant(v_grant, 'approve', null, null);
  update commercial.onboarding_grants
  set ends_at = pg_catalog.now() - interval '1 minute'
  where id = v_grant and status = 'active';
  perform set_config('request.jwt.claim.sub', '98989898-9898-4989-8989-989898989803', true);
  v_result := commercial.promoter_apply_catalog(jsonb_build_object(
    'kind', 'product_update',
    'product_id', '98989898-9898-4989-8989-989898989851',
    'description', 'vencido'
  ));
  if v_result->>'commercial_error_code' is distinct from 'grant_expired' then
    raise exception 'expired clock returned %', v_result;
  end if;
  select status into v_status from commercial.onboarding_grants where id = v_grant;
  if v_status is distinct from 'active' then
    raise exception 'clock check rewrote status before the job: %', v_status;
  end if;

  perform set_config('request.jwt.claim.sub', '', true);
  v_result := commercial.expire_onboarding_grants();
  if v_result->>'ok' is distinct from 'true' or (v_result->>'expired_count')::int < 1 then
    raise exception 'expire job returned %', v_result;
  end if;
  select status into v_status from commercial.onboarding_grants where id = v_grant;
  select count(*) into v_rows from commercial.onboarding_grants where id = v_grant;
  select count(*) into v_events from commercial.onboarding_grant_events where grant_id = v_grant and event_type = 'expired';
  if v_status is distinct from 'expired' or v_rows <> 1 or v_events <> 1 then
    raise exception 'expire history status % rows % events %', v_status, v_rows, v_events;
  end if;
  select description into v_description from public.products where id = '98989898-9898-4989-8989-989898989851';
  if v_description is distinct from 'descripcion nueva' then
    raise exception 'expiry wrote description %', v_description;
  end if;
end;
$$;

rollback;
