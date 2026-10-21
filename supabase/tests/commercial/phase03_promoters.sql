-- P03-T01. Rolls back fixtures.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000', '61616161-6161-4161-8161-616161616101', 'authenticated', 'authenticated',
  'phase03-reviewer@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
);

insert into commercial.platform_accounts (id, user_id, kind)
values ('61616161-6161-4161-8161-616161616111', '61616161-6161-4161-8161-616161616101', 'internal');
insert into commercial.internal_role_assignments (account_id, role)
values ('61616161-6161-4161-8161-616161616111', 'superadmin');

select set_config('request.jwt.claim.sub', '61616161-6161-4161-8161-616161616101', true);

do $$
declare
  v_first jsonb;
  v_second jsonb;
  v_move jsonb;
  v_active jsonb;
  v_codes int;
begin
  v_first := commercial.register_promoter('Ana Promotora', 'phase03-ana@local.test', null);
  v_second := commercial.register_promoter('Luis Promotor', 'phase03-luis@local.test', null);
  if v_first->>'ok' is distinct from 'true' or v_first->>'status' is distinct from 'registered' then
    raise exception 'register returned %', v_first;
  end if;
  if v_first->>'public_code' = v_second->>'public_code' then
    raise exception 'public codes collided';
  end if;
  select count(*) into v_codes from commercial.promoters where public_code = v_first->>'public_code';
  if v_codes <> 1 then
    raise exception 'public code count %', v_codes;
  end if;
  if commercial.promoter_can_operate('registered') then
    raise exception 'registered can operate';
  end if;

  v_move := commercial.transition_promoter_status((v_first->>'promoter_id')::uuid, 'pending_verification');
  if v_move->>'status' is distinct from 'pending_verification' then
    raise exception 'pending transition returned %', v_move;
  end if;
  v_active := commercial.transition_promoter_status((v_first->>'promoter_id')::uuid, 'active');
  if v_active->>'commercial_error_code' is distinct from 'verification_incomplete' then
    raise exception 'active path returned %', v_active;
  end if;
end;
$$;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000', '61616161-6161-4161-8161-616161616102', 'authenticated', 'authenticated',
  'phase03-owner@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
);
insert into public.businesses (id, name, slug, whatsapp_number)
values ('61616161-6161-4161-8161-616161616190', 'Local Fixture', 'phase03-fixture', '5491100000000');
insert into public.profiles (id, business_id, role)
values ('61616161-6161-4161-8161-616161616102', '61616161-6161-4161-8161-616161616190', 'owner');

do $$
begin
  begin
    insert into commercial.platform_accounts (user_id, kind)
    values ('61616161-6161-4161-8161-616161616102', 'promoter');
    raise exception 'business member became promoter';
  exception when others then
    if sqlerrm is distinct from 'promoter_business_member_forbidden' then
      raise;
    end if;
  end;
end;
$$;

rollback;
