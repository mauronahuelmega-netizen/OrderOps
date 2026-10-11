-- P04-T02. Rolls back.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '88888888-8888-4888-8888-888888888801', 'authenticated', 'authenticated', 'phase04-grant-owner@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '88888888-8888-4888-8888-888888888802', 'authenticated', 'authenticated', 'phase04-grant-other@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '88888888-8888-4888-8888-888888888803', 'authenticated', 'authenticated', 'phase04-grant-promoter@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '88888888-8888-4888-8888-888888888804', 'authenticated', 'authenticated', 'phase04-grant-admin@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());
insert into public.businesses (id, name, slug, whatsapp_number) values
  ('88888888-8888-4888-8888-888888888811', 'Grant Shop', 'grant-shop-phase04', '5491100000002'),
  ('88888888-8888-4888-8888-888888888812', 'Other Shop', 'other-shop-phase04', '5491100000003');
insert into public.profiles (id, business_id, role) values
  ('88888888-8888-4888-8888-888888888801', '88888888-8888-4888-8888-888888888811', 'owner'),
  ('88888888-8888-4888-8888-888888888802', '88888888-8888-4888-8888-888888888812', 'owner');
insert into commercial.platform_accounts (id, user_id, kind) values
  ('88888888-8888-4888-8888-888888888821', '88888888-8888-4888-8888-888888888803', 'promoter'),
  ('88888888-8888-4888-8888-888888888822', '88888888-8888-4888-8888-888888888804', 'internal');
insert into commercial.internal_role_assignments (account_id, role) values
  ('88888888-8888-4888-8888-888888888822', 'superadmin');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('88888888-8888-4888-8888-888888888831', '88888888-8888-4888-8888-888888888821', 'pgrant000001', 'Promotor Grant', 'active');

select set_config('request.jwt.claim.sub', '88888888-8888-4888-8888-888888888803', true);

do $$
declare
  v_result jsonb;
  v_grant uuid;
  v_second uuid;
  v_status text;
  v_events int;
begin
  v_result := commercial.request_onboarding_grant(
    '88888888-8888-4888-8888-888888888831',
    '88888888-8888-4888-8888-888888888811',
    null
  );
  if v_result->>'status' is distinct from 'pending_client' then
    raise exception 'request returned %', v_result;
  end if;
  v_grant := (v_result->>'grant_id')::uuid;

  v_result := commercial.respond_onboarding_grant(v_grant, 'approve', now() + interval '30 days', null);
  if v_result->>'commercial_error_code' is distinct from 'forbidden' then
    raise exception 'promoter approval returned %', v_result;
  end if;

  perform set_config('request.jwt.claim.sub', '88888888-8888-4888-8888-888888888802', true);
  v_result := commercial.respond_onboarding_grant(v_grant, 'approve', now() + interval '30 days', null);
  if v_result->>'commercial_error_code' is distinct from 'forbidden' then
    raise exception 'other owner returned %', v_result;
  end if;

  perform set_config('request.jwt.claim.sub', '88888888-8888-4888-8888-888888888801', true);
  v_result := commercial.respond_onboarding_grant(v_grant, 'approve', now() + interval '31 days', null);
  if v_result->>'commercial_error_code' is distinct from 'validation' then
    raise exception '31 days returned %', v_result;
  end if;
  v_result := commercial.respond_onboarding_grant(v_grant, 'approve', null, null);
  if v_result->>'status' is distinct from 'active' then
    raise exception 'owner approval returned %', v_result;
  end if;

  begin
    update commercial.onboarding_grants set ends_at = ends_at + interval '1 day' where id = v_grant;
    raise exception 'silent extension was accepted';
  exception
    when sqlstate 'P0001' then
      if sqlerrm is distinct from 'grant_extension_forbidden' then
        raise exception 'unexpected extension error %', sqlerrm;
      end if;
  end;

  perform set_config('request.jwt.claim.sub', '88888888-8888-4888-8888-888888888803', true);
  v_result := commercial.request_onboarding_grant(
    '88888888-8888-4888-8888-888888888831',
    '88888888-8888-4888-8888-888888888811',
    null
  );
  v_second := (v_result->>'grant_id')::uuid;
  if v_second = v_grant or (select status from commercial.onboarding_grants where id = v_grant) is distinct from 'active' then
    raise exception 'renewal rewrote the old grant';
  end if;

  perform set_config('request.jwt.claim.sub', '88888888-8888-4888-8888-888888888804', true);
  v_result := commercial.respond_onboarding_grant(v_second, 'approve', null, null);
  if v_result->>'commercial_error_code' is distinct from 'validation' then
    raise exception 'exception without reason returned %', v_result;
  end if;
  v_result := commercial.respond_onboarding_grant(v_second, 'approve', null, 'alta urgente');
  if v_result->>'status' is distinct from 'active' then
    raise exception 'exception approval returned %', v_result;
  end if;
  select count(*) into v_events from commercial.onboarding_grant_events where grant_id = v_second and event_type = 'exception';
  if v_events <> 1 then
    raise exception 'missing exception event';
  end if;

  perform set_config('request.jwt.claim.sub', '88888888-8888-4888-8888-888888888801', true);
  v_result := commercial.revoke_onboarding_grant(v_grant, 'cliente revoca');
  select status into v_status from commercial.onboarding_grants where id = v_grant;
  if v_status is distinct from 'revoked' then
    raise exception 'revoke returned % status %', v_result, v_status;
  end if;
  v_result := commercial.complete_onboarding(v_second);
  if v_result->>'status' is distinct from 'completed' then
    raise exception 'complete returned %', v_result;
  end if;

  perform set_config('request.jwt.claim.sub', '88888888-8888-4888-8888-888888888803', true);
  v_result := commercial.request_onboarding_grant(
    '88888888-8888-4888-8888-888888888831',
    '88888888-8888-4888-8888-888888888811',
    null
  );
  perform set_config('request.jwt.claim.sub', '88888888-8888-4888-8888-888888888801', true);
  perform commercial.respond_onboarding_grant((v_result->>'grant_id')::uuid, 'approve', null, null);
  perform set_config('request.jwt.claim.sub', '88888888-8888-4888-8888-888888888804', true);
  perform commercial.separate_promoter(
    '88888888-8888-4888-8888-888888888831',
    '88888888-8888-4888-8888-888888888822',
    'fin de relacion',
    null
  );
  if exists (
    select 1 from commercial.onboarding_grants
    where promoter_id = '88888888-8888-4888-8888-888888888831'
      and status in ('pending_client', 'active')
  ) then
    raise exception 'separation left an open grant';
  end if;
end;
$$;

rollback;
