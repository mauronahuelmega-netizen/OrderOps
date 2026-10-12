-- Migration-only evidence. No runtime RPC, seed, monetary reinterpretation or guard bypass.
create schema migration_private;
revoke all on schema migration_private from public, anon, authenticated, service_role;

create table migration_private.runs (
  id uuid primary key,
  business_id uuid not null references public.businesses(id),
  snapshot_hash text not null check (snapshot_hash ~ '^[0-9a-f]{64}$'),
  rules_hash text not null check (rules_hash ~ '^[0-9a-f]{64}$'),
  config_hash text not null check (config_hash ~ '^[0-9a-f]{64}$'),
  dataset_hash text not null check (dataset_hash ~ '^[0-9a-f]{64}$'),
  executed_at timestamptz not null default now(),
  unique (id, business_id)
);
create table migration_private.evidence (
  id uuid primary key,
  run_id uuid not null,
  business_id uuid not null references public.businesses(id),
  source_table text not null,
  source_id text not null,
  source_hash text not null check (source_hash ~ '^[0-9a-f]{64}$'),
  source_actor_id text,
  target_table text,
  target_id uuid,
  classification text not null check (classification in (
    'MIGRATED', 'TRANSFORMED_WITH_EXPLICIT_RULE', 'EXCLUDED_WITH_EXPLICIT_REASON',
    'SOURCE_INCONSISTENT_REQUIRES_DECISION'
  )),
  rule text not null check (length(trim(rule)) > 0),
  source_row jsonb not null,
  unique(id, business_id),
  unique(run_id, source_table, source_id),
  check ((target_table is null) = (target_id is null)),
  foreign key (run_id, business_id) references migration_private.runs(id, business_id)
);
revoke all on all tables in schema migration_private from public, anon, authenticated, service_role;

-- Historical absence is explicit, never an implicit relaxation of native orders.
alter table public.orders
  add column migration_evidence_id uuid,
  alter column phone drop not null,
  alter column delivery_date drop not null,
  alter column delivery_method drop not null;
alter table public.orders add constraint orders_m3_evidence_business_fkey
  foreign key (migration_evidence_id, business_id)
  references migration_private.evidence(id, business_id);
alter table public.orders add constraint orders_native_required_fields_chk check (
  migration_evidence_id is not null
  or (phone is not null and delivery_date is not null and delivery_method is not null)
);

alter table public.finance_operations add column migration_evidence_id uuid,
  alter column created_by drop not null;
alter table public.finance_transactions add column migration_evidence_id uuid,
  alter column created_by drop not null;
alter table public.finance_audit_events add column migration_evidence_id uuid;

alter table public.finance_operations add constraint finance_operations_m3_actor_chk
  check (created_by is not null or migration_evidence_id is not null);
alter table public.finance_transactions add constraint finance_transactions_m3_actor_chk
  check (created_by is not null or migration_evidence_id is not null);
alter table public.finance_operations add constraint finance_operations_m3_evidence_fkey
  foreign key(migration_evidence_id, business_id) references migration_private.evidence(id, business_id);
alter table public.finance_transactions add constraint finance_transactions_m3_evidence_fkey
  foreign key(migration_evidence_id, business_id) references migration_private.evidence(id, business_id);
alter table public.finance_audit_events add constraint finance_audit_events_m3_evidence_fkey
  foreign key(migration_evidence_id, business_id) references migration_private.evidence(id, business_id);

-- INVOKER: current_user is the actual SQL role, not a user-controlled GUC.
create function private.guard_m3_import_identity()
returns trigger language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'INSERT' then
    if new.migration_evidence_id is not null and current_user <> 'postgres' then
      raise exception 'M3_IMPORT_PRIVILEGE_REQUIRED' using errcode = '42501';
    end if;
  elsif new.migration_evidence_id is distinct from old.migration_evidence_id then
    raise exception 'M3_IMPORT_IDENTITY_IMMUTABLE' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function private.guard_m3_import_identity() from public, anon, authenticated, service_role;

-- SECURITY DEFINER verifies private evidence without exposing it to runtime readers.
create function private.validate_m3_import_evidence()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public
as $$
begin
  if new.migration_evidence_id is not null and not exists (
    select 1 from migration_private.evidence e
    where e.id = new.migration_evidence_id and e.business_id = new.business_id
      and e.target_table = tg_table_name and e.target_id = new.id
      and e.classification in ('MIGRATED', 'TRANSFORMED_WITH_EXPLICIT_RULE')
      and (tg_table_name = 'orders' or e.source_actor_id is not null
           or e.source_row ? 'actor_id')
  ) then
    raise exception 'M3_IMPORT_EVIDENCE_MISMATCH' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function private.validate_m3_import_evidence() from public, anon, authenticated, service_role;

create trigger guard_m3_order_identity before insert or update on public.orders
  for each row execute function private.guard_m3_import_identity();
create trigger validate_m3_order_evidence before insert or update on public.orders
  for each row execute function private.validate_m3_import_evidence();
create trigger guard_m3_operation_identity before insert or update on public.finance_operations
  for each row execute function private.guard_m3_import_identity();
create trigger validate_m3_operation_evidence before insert or update on public.finance_operations
  for each row execute function private.validate_m3_import_evidence();
create trigger guard_m3_transaction_identity before insert or update on public.finance_transactions
  for each row execute function private.guard_m3_import_identity();
create trigger validate_m3_transaction_evidence before insert or update on public.finance_transactions
  for each row execute function private.validate_m3_import_evidence();
create trigger guard_m3_audit_identity before insert or update on public.finance_audit_events
  for each row execute function private.guard_m3_import_identity();
create trigger validate_m3_audit_evidence before insert or update on public.finance_audit_events
  for each row execute function private.validate_m3_import_evidence();

-- Historical NULL dates remain visible and sort explicitly, without inventing a date.
create or replace function public.business_order_finance_summaries(p_business_id uuid, p_limit integer default 100)
returns jsonb language plpgsql stable security definer
set search_path = pg_catalog, public
as $$
declare v_items jsonb;
begin
  perform private.require_finance_permission(p_business_id, 'read');
  if p_limit < 1 or p_limit > 500 then raise exception 'invalid pagination' using errcode='22023'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', o.id, 'order_code', o.order_code, 'customer_name', o.customer_name,
    'phone', o.phone, 'delivery_date', o.delivery_date, 'delivery_time', o.delivery_time,
    'delivery_method', o.delivery_method, 'notes', o.notes, 'total_price', o.total_price,
    'composition_status', o.composition_status, 'operational_status', o.status,
    'financial', case when ofn.order_id is null then null else public.order_financial_exception_summary(o.id) end
  ) order by o.delivery_date desc nulls last, o.created_at desc, o.id desc), '[]'::jsonb) into v_items
  from (select * from public.orders where business_id=p_business_id
    order by delivery_date desc nulls last, created_at desc, id desc limit p_limit) o
  left join public.order_financials ofn on ofn.order_id=o.id and ofn.business_id=o.business_id;
  return v_items;
end;
$$;
