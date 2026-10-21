-- Commercial Core PHASE-01 foundations.
-- Platform schema only. Does not alter public.profiles.role, orders, or finance tables.

create schema if not exists commercial;

revoke all on schema commercial from public;
grant usage on schema commercial to authenticated;

create table commercial.platform_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id),
  kind text not null check (kind in ('internal', 'promoter')),
  disabled_at timestamptz,
  created_at timestamptz not null default now()
);

create table commercial.internal_role_assignments (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references commercial.platform_accounts (id),
  role text not null check (role in ('superadmin', 'commercial', 'finance', 'support')),
  granted_by uuid references commercial.platform_accounts (id),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index internal_role_assignments_active_role
  on commercial.internal_role_assignments (account_id, role)
  where revoked_at is null;

create or replace function commercial.current_account_id()
returns uuid
language sql
stable
security definer
set search_path = pg_catalog, commercial
as $$
  select id
  from commercial.platform_accounts
  where user_id = auth.uid()
    and disabled_at is null
$$;

create or replace function commercial.has_internal_role(p_role text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, commercial
as $$
  select exists (
    select 1
    from commercial.internal_role_assignments assignment
    join commercial.platform_accounts account on account.id = assignment.account_id
    where account.user_id = auth.uid()
      and account.kind = 'internal'
      and account.disabled_at is null
      and assignment.role = p_role
      and assignment.revoked_at is null
  )
$$;

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

create table commercial.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_account_id uuid references commercial.platform_accounts (id),
  actor_kind text not null check (actor_kind in ('internal', 'promoter', 'business_member', 'system')),
  action text not null,
  entity_schema text not null,
  entity_table text not null,
  entity_id uuid not null,
  reason text,
  before jsonb,
  after jsonb,
  correlation_id uuid not null,
  created_at timestamptz not null default now(),
  check (actor_kind = 'system' or actor_account_id is not null)
);

create index audit_events_entity_idx
  on commercial.audit_events (entity_table, entity_id, created_at);

create table commercial.outbox_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  payload jsonb not null,
  occurred_at timestamptz not null,
  status text not null check (status in ('pending', 'processing', 'delivered', 'dead')),
  attempts int not null default 0,
  available_at timestamptz not null,
  locked_at timestamptz
);

create table commercial.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_account_id uuid not null references commercial.platform_accounts (id),
  event_name text not null,
  outbox_event_id uuid not null references commercial.outbox_events (id),
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (outbox_event_id, recipient_account_id)
);

create table commercial.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  outbox_event_id uuid not null references commercial.outbox_events (id),
  channel text not null check (channel in ('inbox', 'email')),
  destination text not null,
  status text not null check (status in ('pending', 'sent', 'failed', 'dead')),
  attempt_count int not null default 0,
  last_error text,
  unique (outbox_event_id, channel, destination)
);

create table commercial.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  subject_kind text,
  subject_ref text,
  request_kind text not null check (request_kind in ('access', 'rectification', 'deletion')),
  status text not null check (status in ('open', 'fulfilled', 'rejected')),
  opened_by uuid references commercial.platform_accounts (id),
  resolved_by uuid references commercial.platform_accounts (id),
  resolution_notes text,
  created_at timestamptz not null default now()
);

create table commercial.commercial_programs (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  version int not null,
  setup_price_cents bigint not null,
  monthly_price_cents bigint not null,
  setup_commission_cents bigint not null,
  recurring_bps int not null,
  max_recurring_slots int not null,
  effective_from date not null,
  retired_at timestamptz,
  unique (code, version)
);

create or replace function commercial.reject_promoter_business_member()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.kind = 'promoter' and exists (
    select 1
    from public.profiles profile
    where profile.id = new.user_id
      and profile.business_id is not null
  ) then
    raise exception 'promoter_business_member_forbidden' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger platform_accounts_reject_promoter_business_member
  before insert or update of user_id, kind on commercial.platform_accounts
  for each row execute function commercial.reject_promoter_business_member();

create or replace function commercial.reject_role_on_non_internal()
returns trigger
language plpgsql
set search_path = pg_catalog, commercial
as $$
begin
  if not exists (
    select 1
    from commercial.platform_accounts account
    where account.id = new.account_id
      and account.kind = 'internal'
  ) then
    raise exception 'role_requires_internal_account' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger internal_role_assignments_require_internal
  before insert or update of account_id on commercial.internal_role_assignments
  for each row execute function commercial.reject_role_on_non_internal();

create or replace function commercial.reject_audit_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  raise exception 'audit_append_only' using errcode = 'P0001';
end;
$$;

create trigger audit_events_append_only
  before update or delete on commercial.audit_events
  for each row execute function commercial.reject_audit_mutation();

create or replace function commercial.reject_program_economic_update()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if new.code is distinct from old.code
    or new.version is distinct from old.version
    or new.setup_price_cents is distinct from old.setup_price_cents
    or new.monthly_price_cents is distinct from old.monthly_price_cents
    or new.setup_commission_cents is distinct from old.setup_commission_cents
    or new.recurring_bps is distinct from old.recurring_bps
    or new.max_recurring_slots is distinct from old.max_recurring_slots
    or new.effective_from is distinct from old.effective_from
  then
    raise exception 'program_immutable' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger commercial_programs_immutable_economics
  before update on commercial.commercial_programs
  for each row execute function commercial.reject_program_economic_update();

insert into commercial.commercial_programs (
  code,
  version,
  setup_price_cents,
  monthly_price_cents,
  setup_commission_cents,
  recurring_bps,
  max_recurring_slots,
  effective_from
) values (
  'founder',
  1,
  29000000,
  5500000,
  12000000,
  4000,
  12,
  date '2026-10-08'
);

create or replace function commercial.grant_internal_role(p_account_id uuid, p_role text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_actor uuid;
  v_kind text;
  v_assignment_id uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;

  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('role.grant') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;

  if p_role not in ('superadmin', 'commercial', 'finance', 'support') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;

  select kind into v_kind
  from commercial.platform_accounts
  where id = p_account_id
    and disabled_at is null;

  if v_kind is distinct from 'internal' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;

  insert into commercial.internal_role_assignments (account_id, role, granted_by)
  values (p_account_id, p_role, v_actor)
  on conflict (account_id, role) where revoked_at is null do nothing
  returning id into v_assignment_id;

  if v_assignment_id is not null then
    insert into commercial.audit_events (
      actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
    ) values (
      v_actor,
      'internal',
      'role.granted',
      'commercial',
      'internal_role_assignments',
      v_assignment_id,
      gen_random_uuid(),
      jsonb_build_object('account_id', p_account_id, 'role', p_role)
    );
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function commercial.revoke_internal_role(p_account_id uuid, p_role text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_actor uuid;
  v_assignment_id uuid;
  v_active_superadmins int;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;

  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('role.grant') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;

  select id into v_assignment_id
  from commercial.internal_role_assignments
  where account_id = p_account_id
    and role = p_role
    and revoked_at is null;

  if v_assignment_id is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;

  if p_role = 'superadmin' then
    select count(*) into v_active_superadmins
    from commercial.internal_role_assignments
    where role = 'superadmin'
      and revoked_at is null;
    if v_active_superadmins <= 1 then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'last_superadmin');
    end if;
  end if;

  update commercial.internal_role_assignments
  set revoked_at = now()
  where id = v_assignment_id;

  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, before
  ) values (
    v_actor,
    'internal',
    'role.revoked',
    'commercial',
    'internal_role_assignments',
    v_assignment_id,
    gen_random_uuid(),
    jsonb_build_object('account_id', p_account_id, 'role', p_role)
  );

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on all tables in schema commercial from public, anon, authenticated;
grant select on all tables in schema commercial to authenticated;

revoke all on all functions in schema commercial from public, anon, authenticated;
grant execute on function commercial.current_account_id() to authenticated;
grant execute on function commercial.has_internal_role(text) to authenticated;
grant execute on function commercial.has_permission(text) to authenticated;
grant execute on function commercial.grant_internal_role(uuid, text) to authenticated;
grant execute on function commercial.revoke_internal_role(uuid, text) to authenticated;

alter table commercial.platform_accounts enable row level security;
alter table commercial.internal_role_assignments enable row level security;
alter table commercial.audit_events enable row level security;
alter table commercial.outbox_events enable row level security;
alter table commercial.notifications enable row level security;
alter table commercial.notification_deliveries enable row level security;
alter table commercial.privacy_requests enable row level security;
alter table commercial.commercial_programs enable row level security;

alter table commercial.platform_accounts force row level security;
alter table commercial.internal_role_assignments force row level security;
alter table commercial.audit_events force row level security;
alter table commercial.outbox_events force row level security;
alter table commercial.notifications force row level security;
alter table commercial.notification_deliveries force row level security;
alter table commercial.privacy_requests force row level security;
alter table commercial.commercial_programs force row level security;

create policy platform_accounts_select on commercial.platform_accounts
  for select to authenticated
  using (id = commercial.current_account_id() or commercial.has_permission('role.grant'));

create policy internal_role_assignments_select on commercial.internal_role_assignments
  for select to authenticated
  using (account_id = commercial.current_account_id() or commercial.has_permission('role.grant'));

create policy audit_events_select on commercial.audit_events
  for select to authenticated
  using (
    commercial.has_internal_role('superadmin')
    or (
      commercial.has_internal_role('finance')
      and (
        action like 'collection.%'
        or action like 'commission.%'
        or action like 'settlement.%'
        or action like 'payment.%'
        or action like 'invoice.%'
      )
    )
  );

create policy outbox_events_select on commercial.outbox_events
  for select to authenticated
  using (commercial.has_internal_role('superadmin'));

create policy notifications_select on commercial.notifications
  for select to authenticated
  using (recipient_account_id = commercial.current_account_id());

create policy notification_deliveries_select on commercial.notification_deliveries
  for select to authenticated
  using (commercial.has_internal_role('superadmin'));

create policy privacy_requests_select on commercial.privacy_requests
  for select to authenticated
  using (commercial.has_permission('privacy.resolve'));

create policy commercial_programs_select on commercial.commercial_programs
  for select to authenticated
  using (commercial.current_account_id() is not null);
