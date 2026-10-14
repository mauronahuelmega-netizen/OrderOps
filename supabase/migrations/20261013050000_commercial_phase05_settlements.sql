-- P05-T06: one settlement per promoter and Argentina month.
-- Finance chooses which adjustments to include. Approval requires a different account.

create table commercial.promoter_settlements (
  id uuid primary key default gen_random_uuid(),
  promoter_id uuid not null references commercial.promoters (id),
  period_key text not null check (period_key ~ '^[0-9]{4}-[0-9]{2}$'),
  timezone text not null default 'America/Argentina/Buenos_Aires',
  status text not null check (status in ('draft', 'approved', 'invoiced', 'payable', 'partially_paid', 'paid', 'void')),
  prepared_by uuid not null references commercial.platform_accounts (id),
  approved_by uuid references commercial.platform_accounts (id),
  approved_at timestamptz,
  total_cents bigint not null check (total_cents >= 0),
  due_on date not null,
  created_at timestamptz not null default pg_catalog.now(),
  unique (promoter_id, period_key),
  constraint promoter_settlements_sod_chk check (approved_by is null or approved_by <> prepared_by)
);

create table commercial.settlement_items (
  id uuid primary key default gen_random_uuid(),
  settlement_id uuid not null references commercial.promoter_settlements (id),
  source_kind text not null check (source_kind in ('commission', 'adjustment')),
  source_id uuid not null,
  amount_cents bigint not null,
  label text not null,
  unique (source_kind, source_id)
);

alter table commercial.promoter_settlements enable row level security;
alter table commercial.promoter_settlements force row level security;
alter table commercial.settlement_items enable row level security;
alter table commercial.settlement_items force row level security;
revoke all on table commercial.promoter_settlements from public, anon, authenticated;
revoke all on table commercial.settlement_items from public, anon, authenticated;
grant select on table commercial.promoter_settlements to authenticated;
grant select on table commercial.settlement_items to authenticated;

create policy promoter_settlements_select on commercial.promoter_settlements
  for select to authenticated
  using (
    commercial.has_permission('collection.write')
    or promoter_id = commercial.current_promoter_id()
  );

create policy settlement_items_select on commercial.settlement_items
  for select to authenticated
  using (
    exists (
      select 1 from commercial.promoter_settlements settlement
      where settlement.id = settlement_items.settlement_id
        and (
          commercial.has_permission('collection.write')
          or settlement.promoter_id = commercial.current_promoter_id()
        )
    )
  );

create or replace function commercial.prepare_settlement(
  p_promoter_id uuid,
  p_period_key text,
  p_adjustment_ids uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid;
  v_existing commercial.promoter_settlements%rowtype;
  v_start timestamptz;
  v_end timestamptz;
  v_id uuid;
  v_total bigint := 0;
  v_due date;
  v_row record;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('collection.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if p_promoter_id is null or p_period_key is null or p_period_key !~ '^[0-9]{4}-[0-9]{2}$' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  select * into v_existing from commercial.promoter_settlements
  where promoter_id = p_promoter_id and period_key = p_period_key
  for update;
  if v_existing.id is not null and v_existing.status = 'draft' then
    return jsonb_build_object('ok', true, 'duplicate', true, 'settlement_id', v_existing.id, 'status', 'draft');
  end if;
  if v_existing.id is not null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'settlement_exists', 'status', v_existing.status);
  end if;

  v_start := (p_period_key || '-01')::date::timestamp at time zone 'America/Argentina/Buenos_Aires';
  v_end := v_start + interval '1 month';
  v_due := ((p_period_key || '-01')::date + interval '1 month')::date + 9;

  insert into commercial.promoter_settlements (
    promoter_id, period_key, timezone, status, prepared_by, total_cents, due_on
  ) values (
    p_promoter_id, p_period_key, 'America/Argentina/Buenos_Aires', 'draft', v_actor, 0, v_due
  ) returning id into v_id;

  for v_row in
    select id, amount_cents, right_kind
    from commercial.promoter_commissions
    where promoter_id = p_promoter_id
      and status = 'available'
      and available_at >= v_start
      and available_at < v_end
    order by available_at, id
    for update
  loop
    insert into commercial.settlement_items (settlement_id, source_kind, source_id, amount_cents, label)
    values (v_id, 'commission', v_row.id, v_row.amount_cents, v_row.right_kind);
    update commercial.promoter_commissions set status = 'in_settlement' where id = v_row.id;
    v_total := v_total + v_row.amount_cents;
  end loop;

  if p_adjustment_ids is not null then
    for v_row in
      select adjustment.id, adjustment.amount_cents, adjustment.source
      from commercial.commission_adjustments adjustment
      join commercial.promoter_commissions commission on commission.id = adjustment.commission_id
      where adjustment.id = any (p_adjustment_ids)
        and commission.promoter_id = p_promoter_id
        and adjustment.status = 'available'
      order by adjustment.id
      for update of adjustment
    loop
      insert into commercial.settlement_items (settlement_id, source_kind, source_id, amount_cents, label)
      values (v_id, 'adjustment', v_row.id, v_row.amount_cents, v_row.source);
      update commercial.commission_adjustments set status = 'in_settlement' where id = v_row.id;
      v_total := v_total + v_row.amount_cents;
    end loop;
  end if;

  if v_total < 0 then
    raise exception 'settlement total is negative';
  end if;
  update commercial.promoter_settlements set total_cents = v_total where id = v_id;

  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, after
  ) values (
    v_actor, 'internal', 'settlement.prepared', 'commercial', 'promoter_settlements', v_id,
    jsonb_build_object('period_key', p_period_key, 'total_cents', v_total, 'due_on', v_due)
  );

  return jsonb_build_object('ok', true, 'duplicate', false, 'settlement_id', v_id, 'total_cents', v_total, 'due_on', v_due);
end;
$$;

create or replace function commercial.approve_settlement(p_settlement_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid;
  v_row commercial.promoter_settlements%rowtype;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('collection.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  select * into v_row from commercial.promoter_settlements where id = p_settlement_id for update;
  if v_row.id is null or v_row.status <> 'draft' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  if v_actor = v_row.prepared_by then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'sod_conflict');
  end if;
  update commercial.promoter_settlements
  set status = 'approved', approved_by = v_actor, approved_at = pg_catalog.clock_timestamp()
  where id = v_row.id;
  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, after
  ) values (
    v_actor, 'internal', 'settlement.approved', 'commercial', 'promoter_settlements', v_row.id,
    jsonb_build_object('prepared_by', v_row.prepared_by, 'approved_by', v_actor)
  );
  return jsonb_build_object('ok', true, 'settlement_id', v_row.id, 'status', 'approved');
end;
$$;

revoke all on function commercial.prepare_settlement(uuid, text, uuid[]) from public, anon, authenticated, service_role;
revoke all on function commercial.approve_settlement(uuid) from public, anon, authenticated, service_role;

create or replace function public.prepare_settlement(p_promoter_id uuid, p_period_key text, p_adjustment_ids uuid[])
returns jsonb language sql security definer set search_path = pg_catalog, public, commercial
as $$ select commercial.prepare_settlement(p_promoter_id, p_period_key, p_adjustment_ids); $$;

create or replace function public.approve_settlement(p_settlement_id uuid)
returns jsonb language sql security definer set search_path = pg_catalog, public, commercial
as $$ select commercial.approve_settlement(p_settlement_id); $$;

revoke all on function public.prepare_settlement(uuid, text, uuid[]) from public, anon, service_role;
revoke all on function public.approve_settlement(uuid) from public, anon, service_role;
grant execute on function public.prepare_settlement(uuid, text, uuid[]) to authenticated;
grant execute on function public.approve_settlement(uuid) to authenticated;
