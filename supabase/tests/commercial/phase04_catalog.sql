-- P04-T03 catalog. Rolls back.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '99999999-9999-4999-8999-999999999901', 'authenticated', 'authenticated', 'phase04-cat-owner@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '99999999-9999-4999-8999-999999999903', 'authenticated', 'authenticated', 'phase04-cat-promoter@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());
insert into public.businesses (id, name, slug, whatsapp_number) values
  ('99999999-9999-4999-8999-999999999911', 'Catalog Shop', 'catalog-shop-phase04', '5491100000004');
insert into public.profiles (id, business_id, role) values
  ('99999999-9999-4999-8999-999999999901', '99999999-9999-4999-8999-999999999911', 'owner');
select set_config('request.jwt.claim.sub', '99999999-9999-4999-8999-999999999901', true);
insert into commercial.platform_accounts (id, user_id, kind) values
  ('99999999-9999-4999-8999-999999999921', '99999999-9999-4999-8999-999999999903', 'promoter');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('99999999-9999-4999-8999-999999999931', '99999999-9999-4999-8999-999999999921', 'pcatalog001', 'Promotor Catalogo', 'active');
insert into public.categories (id, business_id, name, position) values
  ('99999999-9999-4999-8999-999999999941', '99999999-9999-4999-8999-999999999911', 'Bebidas', 1);
insert into public.products (id, business_id, category_id, name, description, price) values
  ('99999999-9999-4999-8999-999999999951', '99999999-9999-4999-8999-999999999911', '99999999-9999-4999-8999-999999999941', 'Cafe', 'clasico', 100.00);

select set_config('request.jwt.claim.sub', '99999999-9999-4999-8999-999999999903', true);

do $$
declare
  v_price numeric;
  v_description text;
  v_name text;
  v_result jsonb;
  v_grant uuid;
begin
  v_result := commercial.request_onboarding_grant(
    '99999999-9999-4999-8999-999999999931',
    '99999999-9999-4999-8999-999999999911',
    null
  );
  v_grant := (v_result->>'grant_id')::uuid;
  perform set_config('request.jwt.claim.sub', '99999999-9999-4999-8999-999999999901', true);
  v_result := commercial.respond_onboarding_grant(v_grant, 'approve', null, null);
  if v_result->>'status' is distinct from 'active' then
    raise exception 'approval returned %', v_result;
  end if;
  perform set_config('request.jwt.claim.sub', '99999999-9999-4999-8999-999999999901', true);
  execute 'set local role authenticated';
  update public.products
  set price = 250.00
  where id = '99999999-9999-4999-8999-999999999951';
  execute 'set local role postgres';
  select price into v_price from public.products where id = '99999999-9999-4999-8999-999999999951';
  if v_price is distinct from 250.00 then
    raise exception 'owner price did not persist: %', v_price;
  end if;

  perform set_config('request.jwt.claim.sub', '99999999-9999-4999-8999-999999999903', true);
  v_result := commercial.promoter_apply_catalog(jsonb_build_object(
    'kind', 'product_update',
    'product_id', '99999999-9999-4999-8999-999999999951',
    'description', 'descripcion nueva'
  ));
  if v_result->>'ok' is distinct from 'true' then
    raise exception 'description update returned %', v_result;
  end if;
  select description, price into v_description, v_price
  from public.products where id = '99999999-9999-4999-8999-999999999951';
  if v_description is distinct from 'descripcion nueva' or v_price is distinct from 250.00 then
    raise exception 'description write changed price % %', v_description, v_price;
  end if;

  v_result := commercial.promoter_apply_catalog(jsonb_build_object(
    'kind', 'product_update',
    'product_id', '99999999-9999-4999-8999-999999999951',
    'description', 'no debe quedar',
    'price', 1
  ));
  if v_result->>'commercial_error_code' is distinct from 'grant_field_forbidden' then
    raise exception 'priced payload returned %', v_result;
  end if;
  select description, price into v_description, v_price
  from public.products where id = '99999999-9999-4999-8999-999999999951';
  if v_description is distinct from 'descripcion nueva' or v_price is distinct from 250.00 then
    raise exception 'priced payload wrote % %', v_description, v_price;
  end if;

  execute 'set local role authenticated';
  update public.products set price = 1
  where id = '99999999-9999-4999-8999-999999999951';
  execute 'set local role postgres';
  select price into v_price from public.products where id = '99999999-9999-4999-8999-999999999951';
  if v_price is distinct from 250.00 then
    raise exception 'promoter direct update changed price to %', v_price;
  end if;

  v_result := commercial.promoter_apply_catalog(jsonb_build_object('kind', 'category_create', 'name', 'Postres'));
  if v_result->>'ok' is distinct from 'true' then
    raise exception 'category create returned %', v_result;
  end if;
  select name into v_name from public.categories
  where business_id = '99999999-9999-4999-8999-999999999911' and name = 'Postres';
  if v_name is distinct from 'Postres' then
    raise exception 'category was not created';
  end if;

  perform set_config('request.jwt.claim.sub', '99999999-9999-4999-8999-999999999901', true);
  perform commercial.revoke_onboarding_grant(v_grant, 'fin');
  perform set_config('request.jwt.claim.sub', '99999999-9999-4999-8999-999999999903', true);
  v_result := commercial.promoter_apply_catalog(jsonb_build_object(
    'kind', 'product_update',
    'product_id', '99999999-9999-4999-8999-999999999951',
    'description', 'despues de revocar'
  ));
  if v_result->>'commercial_error_code' is distinct from 'grant_missing' then
    raise exception 'revoked grant returned %', v_result;
  end if;
  select description into v_description from public.products where id = '99999999-9999-4999-8999-999999999951';
  if v_description is distinct from 'descripcion nueva' then
    raise exception 'revoked grant wrote %', v_description;
  end if;
end;
$$;

rollback;
