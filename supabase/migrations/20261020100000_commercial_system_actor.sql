-- Talo First L1. Non-human system actor for automated, audited economic work.
-- The account cannot sign in, holds only collection.write, and is reachable only through
-- service_role-only system_* wrappers. No Finance user is impersonated.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  banned_until, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  'c0000000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'system@commercial.orderops.invalid',
  null,
  null,
  'infinity',
  '{"provider":"system","providers":[]}'::jsonb,
  '{"orderops_system_actor":true}'::jsonb,
  pg_catalog.now(),
  pg_catalog.now()
)
on conflict (id) do nothing;

alter table commercial.platform_accounts drop constraint platform_accounts_kind_check;
alter table commercial.platform_accounts add constraint platform_accounts_kind_check
  check (kind in ('internal', 'promoter', 'system'));

create unique index platform_accounts_single_system_idx
  on commercial.platform_accounts (kind)
  where kind = 'system';

insert into commercial.platform_accounts (id, user_id, kind)
values ('c0000000-0000-4000-8000-000000000011', 'c0000000-0000-4000-8000-000000000001', 'system')
on conflict (id) do nothing;

create or replace function commercial.has_permission(p_code text)
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_roles text[];
begin
  if exists (
    select 1
    from commercial.platform_accounts account
    where account.user_id = auth.uid()
      and account.kind = 'system'
      and account.disabled_at is null
  ) then
    return p_code = 'collection.write';
  end if;

  select array_agg(assignment.role) into v_roles
  from commercial.internal_role_assignments assignment
  join commercial.platform_accounts account on account.id = assignment.account_id
  where account.user_id = auth.uid()
    and account.kind = 'internal'
    and account.disabled_at is null
    and assignment.revoked_at is null;

  if v_roles is null then
    return false;
  end if;

  return case p_code
    when 'crm.read' then v_roles && array['superadmin', 'commercial', 'support']
    when 'crm.write' then v_roles && array['superadmin', 'commercial']
    when 'opportunity.win' then v_roles && array['superadmin']
    when 'opportunity.lose' then v_roles && array['superadmin', 'commercial']
    when 'attribution.confirm' then v_roles && array['superadmin']
    when 'dispute.decide' then v_roles && array['superadmin']
    when 'promoter.review' then v_roles && array['superadmin', 'commercial']
    when 'promoter.activate' then v_roles && array['superadmin']
    when 'promoter.separate' then v_roles && array['superadmin']
    when 'onboarding.manage' then v_roles && array['superadmin', 'commercial', 'support']
    when 'onboarding.exception' then v_roles && array['superadmin']
    when 'collection.write' then v_roles && array['finance']
    when 'commission.release_exception' then v_roles && array['superadmin']
    when 'settlement.prepare' then v_roles && array['finance']
    when 'settlement.approve' then v_roles && array['superadmin', 'finance']
    when 'payment.record' then v_roles && array['finance']
    when 'program.write' then v_roles && array['superadmin']
    when 'role.grant' then v_roles && array['superadmin']
    when 'audit.read_all' then v_roles && array['superadmin', 'finance']
    when 'privacy.resolve' then v_roles && array['superadmin']
    when 'bank.read_any' then v_roles && array['superadmin', 'finance']
    else false
  end;
end;
$$;

create or replace function commercial.system_account_id()
returns uuid
language sql
stable
security definer
set search_path = pg_catalog, commercial
as $$
  select id from commercial.platform_accounts where kind = 'system' and disabled_at is null
$$;

create or replace function commercial.stamp_system_audit_actor()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
begin
  if new.actor_account_id is not null and exists (
    select 1 from commercial.platform_accounts where id = new.actor_account_id and kind = 'system'
  ) then
    new.actor_kind := 'system';
  end if;
  return new;
end;
$$;

create trigger audit_events_stamp_system_actor
  before insert on commercial.audit_events
  for each row execute function commercial.stamp_system_audit_actor();

-- Switches the transaction-local identity to the system account. Only callable by
-- other security definer functions owned by the migration role.
create or replace function commercial.system_enter()
returns text
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_prev text := coalesce(current_setting('request.jwt.claim.sub', true), '');
begin
  perform pg_catalog.set_config('request.jwt.claim.sub', 'c0000000-0000-4000-8000-000000000001', true);
  return v_prev;
end;
$$;

create or replace function commercial.system_exit(p_prev text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
begin
  perform pg_catalog.set_config('request.jwt.claim.sub', coalesce(p_prev, ''), true);
end;
$$;

revoke all on function commercial.system_account_id() from public, anon, authenticated, service_role;
revoke all on function commercial.stamp_system_audit_actor() from public, anon, authenticated, service_role;
revoke all on function commercial.system_enter() from public, anon, authenticated, service_role;
revoke all on function commercial.system_exit(text) from public, anon, authenticated, service_role;

-- First system wrapper: idempotent provider customer link for the CVU provisioning worker.
create or replace function public.system_link_provider_customer(
  p_business_id uuid,
  p_provider text,
  p_environment text,
  p_external_customer_id text,
  p_cvu text,
  p_alias text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_prev text;
  v_result jsonb;
begin
  v_prev := commercial.system_enter();
  v_result := commercial.link_provider_customer(
    p_business_id, p_provider, p_environment, p_external_customer_id, p_cvu, p_alias
  );
  perform commercial.system_exit(v_prev);
  return v_result;
end;
$$;

revoke all on function public.system_link_provider_customer(uuid, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.system_link_provider_customer(uuid, text, text, text, text, text) to service_role;
