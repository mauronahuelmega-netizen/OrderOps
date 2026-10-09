-- P03-T01: promoter accounts and legal status edges.
-- Activation stays closed until P03-T02.

create table commercial.promoters (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null unique references commercial.platform_accounts (id),
  public_code text not null unique,
  legal_name text not null,
  cuit text,
  status text not null check (status in ('registered', 'pending_verification', 'active', 'suspended', 'separated')),
  activated_at timestamptz,
  separated_at timestamptz,
  created_at timestamptz not null default now(),
  check (char_length(btrim(legal_name)) > 0),
  check (char_length(btrim(public_code)) > 0)
);

create or replace function commercial.current_promoter_id()
returns uuid
language sql
stable
security definer
set search_path = pg_catalog, commercial
as $$
  select promoter.id
  from commercial.promoters promoter
  join commercial.platform_accounts account on account.id = promoter.account_id
  where account.user_id = auth.uid()
    and account.kind = 'promoter'
    and account.disabled_at is null
$$;

create or replace function commercial.promoter_can_operate(p_status text)
returns boolean
language sql
immutable
set search_path = pg_catalog
as $$
  select p_status = 'active'
$$;

create or replace function commercial.register_promoter(
  p_legal_name text,
  p_email text,
  p_cuit text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, auth, public, commercial
as $$
declare
  v_actor uuid;
  v_user uuid;
  v_account uuid;
  v_promoter uuid;
  v_code text;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('promoter.review') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if length(btrim(coalesce(p_legal_name, ''))) = 0 or length(btrim(coalesce(p_email, ''))) = 0 then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  v_user := gen_random_uuid();
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_user,
    'authenticated',
    'authenticated',
    btrim(p_email),
    'local-only',
    pg_catalog.now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    pg_catalog.now(),
    pg_catalog.now()
  );

  insert into commercial.platform_accounts (user_id, kind)
  values (v_user, 'promoter')
  returning id into v_account;

  loop
    v_code := 'p' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
    exit when not exists (select 1 from commercial.promoters where public_code = v_code);
  end loop;

  insert into commercial.promoters (account_id, public_code, legal_name, cuit, status)
  values (v_account, v_code, btrim(p_legal_name), nullif(btrim(coalesce(p_cuit, '')), ''), 'registered')
  returning id into v_promoter;

  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    v_actor, 'internal', 'promoter.registered', 'commercial', 'promoters', v_promoter, v_promoter,
    jsonb_build_object('status', 'registered', 'public_code', v_code)
  );

  return jsonb_build_object('ok', true, 'promoter_id', v_promoter, 'public_code', v_code, 'status', 'registered');
end;
$$;

create or replace function commercial.transition_promoter_status(
  p_promoter_id uuid,
  p_to_status text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_actor uuid;
  v_from text;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('promoter.review') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;

  select status into v_from from commercial.promoters where id = p_promoter_id;
  if v_from is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;

  if p_to_status = 'active' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'verification_incomplete');
  end if;

  if not (
    (v_from = 'registered' and p_to_status = 'pending_verification')
    or (v_from = 'active' and p_to_status = 'suspended')
    or (v_from in ('active', 'suspended') and p_to_status = 'separated')
  ) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  if p_to_status = 'separated' and not commercial.has_permission('promoter.separate') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;

  update commercial.promoters
  set status = p_to_status,
      separated_at = case when p_to_status = 'separated' then pg_catalog.now() else separated_at end
  where id = p_promoter_id;

  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, before, after
  ) values (
    v_actor, 'internal', 'promoter.status', 'commercial', 'promoters', p_promoter_id, p_promoter_id,
    jsonb_build_object('status', v_from),
    jsonb_build_object('status', p_to_status)
  );

  return jsonb_build_object('ok', true, 'status', p_to_status);
end;
$$;

alter table commercial.promoters enable row level security;
alter table commercial.promoters force row level security;
revoke all on table commercial.promoters from public, anon, authenticated;

create policy promoters_select on commercial.promoters
  for select to authenticated
  using (
    id = commercial.current_promoter_id()
    or commercial.has_internal_role('superadmin')
    or commercial.has_internal_role('commercial')
  );

revoke all on function commercial.current_promoter_id() from public, anon, service_role;
revoke all on function commercial.promoter_can_operate(text) from public, anon, service_role;
revoke all on function commercial.register_promoter(text, text, text) from public, anon, authenticated, service_role;
revoke all on function commercial.transition_promoter_status(uuid, text) from public, anon, authenticated, service_role;
grant execute on function commercial.current_promoter_id() to authenticated;
grant execute on function commercial.promoter_can_operate(text) to authenticated;

create or replace function public.register_promoter(p_legal_name text, p_email text, p_cuit text)
returns jsonb
language sql
security definer
set search_path = pg_catalog, commercial
as $$
  select commercial.register_promoter(p_legal_name, p_email, p_cuit);
$$;

create or replace function public.transition_promoter_status(p_promoter_id uuid, p_to_status text)
returns jsonb
language sql
security definer
set search_path = pg_catalog, commercial
as $$
  select commercial.transition_promoter_status(p_promoter_id, p_to_status);
$$;

revoke all on function public.register_promoter(text, text, text) from public, anon, service_role;
revoke all on function public.transition_promoter_status(uuid, text) from public, anon, service_role;
grant execute on function public.register_promoter(text, text, text) to authenticated;
grant execute on function public.transition_promoter_status(uuid, text) to authenticated;
