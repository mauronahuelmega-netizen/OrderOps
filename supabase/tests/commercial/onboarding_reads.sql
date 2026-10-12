-- Onboarding read contracts. Rolls back.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', 'abababab-abab-4aba-8aba-ababababab01', 'authenticated', 'authenticated', 'onboarding-read-owner@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'abababab-abab-4aba-8aba-ababababab02', 'authenticated', 'authenticated', 'onboarding-read-other@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'abababab-abab-4aba-8aba-ababababab03', 'authenticated', 'authenticated', 'onboarding-read-promoter@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'abababab-abab-4aba-8aba-ababababab04', 'authenticated', 'authenticated', 'onboarding-read-other-promoter@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'abababab-abab-4aba-8aba-ababababab05', 'authenticated', 'authenticated', 'onboarding-read-admin@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'abababab-abab-4aba-8aba-ababababab06', 'authenticated', 'authenticated', 'onboarding-read-viewer@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

insert into public.businesses (id, name, slug, whatsapp_number) values
  ('abababab-abab-4aba-8aba-ababababab11', 'Read Shop', 'read-shop-onboarding-ui', '5491100000101'),
  ('abababab-abab-4aba-8aba-ababababab12', 'Other Read Shop', 'other-read-shop-onboarding-ui', '5491100000102');
insert into public.profiles (id, business_id, role) values
  ('abababab-abab-4aba-8aba-ababababab01', 'abababab-abab-4aba-8aba-ababababab11', 'owner'),
  ('abababab-abab-4aba-8aba-ababababab02', 'abababab-abab-4aba-8aba-ababababab12', 'owner'),
  ('abababab-abab-4aba-8aba-ababababab06', 'abababab-abab-4aba-8aba-ababababab11', 'viewer');
select set_config('request.jwt.claim.sub', 'abababab-abab-4aba-8aba-ababababab01', true);
insert into public.categories (id, business_id, name) values
  ('abababab-abab-4aba-8aba-ababababab41', 'abababab-abab-4aba-8aba-ababababab11', 'Bebidas');
insert into public.products (id, business_id, category_id, name, description, price) values
  ('abababab-abab-4aba-8aba-ababababab51', 'abababab-abab-4aba-8aba-ababababab11', 'abababab-abab-4aba-8aba-ababababab41', 'Cafe', 'clasico', 180.00);

insert into commercial.platform_accounts (id, user_id, kind) values
  ('abababab-abab-4aba-8aba-ababababab21', 'abababab-abab-4aba-8aba-ababababab03', 'promoter'),
  ('abababab-abab-4aba-8aba-ababababab22', 'abababab-abab-4aba-8aba-ababababab04', 'promoter'),
  ('abababab-abab-4aba-8aba-ababababab23', 'abababab-abab-4aba-8aba-ababababab05', 'internal');
insert into commercial.internal_role_assignments (account_id, role) values
  ('abababab-abab-4aba-8aba-ababababab23', 'superadmin');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('abababab-abab-4aba-8aba-ababababab31', 'abababab-abab-4aba-8aba-ababababab21', 'pread000001', 'Promotor Lectura', 'active'),
  ('abababab-abab-4aba-8aba-ababababab32', 'abababab-abab-4aba-8aba-ababababab22', 'pread000002', 'Otro Promotor', 'active');
insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel) values
  ('abababab-abab-4aba-8aba-ababababab61', 'Read Shop', 'read shop', 'promoter'),
  ('abababab-abab-4aba-8aba-ababababab62', 'Lead abierto', 'lead abierto', 'promoter');
insert into commercial.commercial_opportunities (id, commercial_business_id, stage, owner_account_id) values
  ('abababab-abab-4aba-8aba-ababababab71', 'abababab-abab-4aba-8aba-ababababab61', 'qualified', 'abababab-abab-4aba-8aba-ababababab23'),
  ('abababab-abab-4aba-8aba-ababababab72', 'abababab-abab-4aba-8aba-ababababab62', 'new', 'abababab-abab-4aba-8aba-ababababab21');
insert into commercial.opportunity_attributions (opportunity_id, promoter_id, status, method, reason, confirmed_by) values
  ('abababab-abab-4aba-8aba-ababababab71', 'abababab-abab-4aba-8aba-ababababab31', 'confirmed', 'manual', 'fixture de lectura', 'abababab-abab-4aba-8aba-ababababab23');

select set_config('request.jwt.claim.sub', 'abababab-abab-4aba-8aba-ababababab05', true);

do $$
declare
  v_result jsonb;
  v_price numeric;
  v_visible int;
  v_body text;
begin
  v_result := commercial.win_opportunity(
    'abababab-abab-4aba-8aba-ababababab71',
    'abababab-abab-4aba-8aba-ababababab11',
    null
  );
  if v_result->>'ok' is distinct from 'true' then
    raise exception 'win returned %', v_result;
  end if;

  perform set_config('request.jwt.claim.sub', 'abababab-abab-4aba-8aba-ababababab03', true);
  v_result := commercial.promoter_onboarding_businesses();
  if v_result->>'ok' is distinct from 'true'
    or jsonb_array_length(v_result->'businesses') <> 1
    or v_result->'businesses'->0->>'business_id' is distinct from 'abababab-abab-4aba-8aba-ababababab11'
    or v_result::text like '%lead abierto%'
    or v_result::text like '%setup_price%' then
    raise exception 'promoter businesses returned %', v_result;
  end if;

  perform set_config('request.jwt.claim.sub', 'abababab-abab-4aba-8aba-ababababab04', true);
  v_result := commercial.promoter_onboarding_businesses();
  if v_result->>'ok' is distinct from 'true' or jsonb_array_length(v_result->'businesses') <> 0 then
    raise exception 'other promoter saw %', v_result;
  end if;

  perform set_config('request.jwt.claim.sub', 'abababab-abab-4aba-8aba-ababababab03', true);
  v_result := commercial.promoter_onboarding_products('abababab-abab-4aba-8aba-ababababab11');
  if v_result->>'commercial_error_code' is distinct from 'grant_missing' then
    raise exception 'catalog without grant returned %', v_result;
  end if;

  v_result := commercial.request_onboarding_grant(
    'abababab-abab-4aba-8aba-ababababab31',
    'abababab-abab-4aba-8aba-ababababab11',
    'abababab-abab-4aba-8aba-ababababab71'
  );
  perform set_config('request.jwt.claim.sub', 'abababab-abab-4aba-8aba-ababababab01', true);
  v_result := commercial.business_onboarding_requests();
  if v_result->>'ok' is distinct from 'true'
    or v_result->'requests'->0->>'promoter_code' is distinct from 'pread000001'
    or v_result->'requests'->0->>'can_decide' is distinct from 'true' then
    raise exception 'owner queue returned %', v_result;
  end if;
  perform commercial.respond_onboarding_grant((v_result->'requests'->0->>'grant_id')::uuid, 'approve', null, null);

  perform set_config('request.jwt.claim.sub', 'abababab-abab-4aba-8aba-ababababab02', true);
  v_result := commercial.business_onboarding_requests();
  if v_result->>'ok' is distinct from 'true' or jsonb_array_length(v_result->'requests') <> 0 then
    raise exception 'other owner saw %', v_result;
  end if;

  perform set_config('request.jwt.claim.sub', 'abababab-abab-4aba-8aba-ababababab06', true);
  v_result := commercial.business_onboarding_requests();
  if v_result->>'commercial_error_code' is distinct from 'forbidden' then
    raise exception 'viewer returned %', v_result;
  end if;

  perform set_config('request.jwt.claim.sub', 'abababab-abab-4aba-8aba-ababababab03', true);
  v_result := commercial.promoter_onboarding_products('abababab-abab-4aba-8aba-ababababab11');
  if v_result->>'ok' is distinct from 'true'
    or v_result->'products'->0->>'name' is distinct from 'Cafe'
    or v_result::text like '%180%'
    or v_result::text like '%price%' then
    raise exception 'product read returned %', v_result;
  end if;
  select price into v_price from public.products where id = 'abababab-abab-4aba-8aba-ababababab51';
  if v_price is distinct from 180.00 then
    raise exception 'read changed price %', v_price;
  end if;

  execute 'set local role authenticated';
  select count(*) into v_visible from public.products where id = 'abababab-abab-4aba-8aba-ababababab51';
  execute 'set local role postgres';
  if v_visible <> 0 then
    raise exception 'promoter read products through table RLS: %', v_visible;
  end if;

  perform set_config('request.jwt.claim.sub', 'abababab-abab-4aba-8aba-ababababab01', true);
  perform commercial.revoke_onboarding_grant(
    (select id from commercial.onboarding_grants where promoter_id = 'abababab-abab-4aba-8aba-ababababab31' and status = 'active'),
    'fin'
  );
  perform set_config('request.jwt.claim.sub', 'abababab-abab-4aba-8aba-ababababab03', true);
  v_result := commercial.promoter_onboarding_products('abababab-abab-4aba-8aba-ababababab11');
  if v_result->>'commercial_error_code' is distinct from 'grant_missing' then
    raise exception 'revoked catalog returned %', v_result;
  end if;
  v_result := commercial.promoter_onboarding_businesses();
  if v_result->'businesses'->0->'grants'->0->>'display_status' is distinct from 'revoked'
    or v_result->'businesses'->0->>'can_edit' is distinct from 'false' then
    raise exception 'history after revoke returned %', v_result;
  end if;

  perform set_config('request.jwt.claim.sub', 'abababab-abab-4aba-8aba-ababababab03', true);
  v_result := commercial.request_onboarding_grant(
    'abababab-abab-4aba-8aba-ababababab31',
    'abababab-abab-4aba-8aba-ababababab11',
    'abababab-abab-4aba-8aba-ababababab71'
  );
  perform set_config('request.jwt.claim.sub', 'abababab-abab-4aba-8aba-ababababab01', true);
  perform commercial.respond_onboarding_grant((v_result->>'grant_id')::uuid, 'approve', null, null);
  update commercial.onboarding_grants
  set ends_at = pg_catalog.now() - interval '1 minute'
  where id = (v_result->>'grant_id')::uuid;
  perform set_config('request.jwt.claim.sub', 'abababab-abab-4aba-8aba-ababababab03', true);
  v_result := commercial.promoter_onboarding_products('abababab-abab-4aba-8aba-ababababab11');
  if v_result->>'commercial_error_code' is distinct from 'grant_expired' then
    raise exception 'expired catalog returned %', v_result;
  end if;

  select pg_get_functiondef('commercial.promoter_onboarding_products(uuid)'::regprocedure) into v_body;
  if v_body ~* '\m(insert|update|delete)\M' then
    raise exception 'product read function writes';
  end if;
end;
$$;

rollback;
