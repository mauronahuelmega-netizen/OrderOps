-- M1.A/M1.B: exception capabilities, derived amounts, and atomic order outflows.

create or replace function private.require_finance_permission(
  p_business_id uuid,
  p_permission text
)
returns uuid
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid;
  v_role text;
begin
  v_uid := private.require_business_member(p_business_id);
  if p_permission not in (
    'read', 'operate', 'reconcile', 'correct', 'admin',
    'manage_order_contract', 'record_historical_deposit',
    'manage_finance_corrections', 'manage_finance_reconciliation',
    'manage_order_exceptions'
  ) then
    raise exception 'unknown finance permission' using errcode = '22023';
  end if;
  if p_permission <> 'read' then
    perform private.require_finance_enabled(p_business_id);
  end if;
  select p.role into v_role from public.profiles p where p.id = v_uid;
  if v_role in ('owner', 'admin')
     or (v_role = 'manager' and p_permission in (
       'read', 'operate', 'reconcile', 'correct',
       'manage_order_contract', 'record_historical_deposit',
       'manage_finance_corrections', 'manage_finance_reconciliation',
       'manage_order_exceptions'
     ))
     or (v_role = 'operator' and p_permission in ('read', 'operate'))
     or (v_role = 'viewer' and p_permission = 'read') then
    return v_uid;
  end if;
  raise exception 'finance permission denied' using errcode = '42501';
end;
$$;

create or replace function private.order_refunded_amount(
  p_business_id uuid,
  p_order_id uuid
)
returns numeric
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(sum(a.total_amount), 0)::numeric(14, 2)
  from public.finance_order_outflow_allocations a
  join public.finance_operations o
    on o.id = a.operation_id and o.business_id = a.business_id
  where a.business_id = p_business_id
    and a.order_id = p_order_id
    and a.outflow_kind = 'refund'
    and o.operation_type = 'order_refund';
$$;

create or replace function private.order_refunded_from_protected(
  p_business_id uuid,
  p_order_id uuid
)
returns numeric
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(sum(a.protected_amount), 0)::numeric(14, 2)
  from public.finance_order_outflow_allocations a
  join public.finance_operations o
    on o.id = a.operation_id and o.business_id = a.business_id
  where a.business_id = p_business_id
    and a.order_id = p_order_id
    and a.outflow_kind = 'refund'
    and o.operation_type = 'order_refund';
$$;

create or replace function private.order_refunded_from_released(
  p_business_id uuid,
  p_order_id uuid
)
returns numeric
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(sum(a.released_amount), 0)::numeric(14, 2)
  from public.finance_order_outflow_allocations a
  join public.finance_operations o
    on o.id = a.operation_id and o.business_id = a.business_id
  where a.business_id = p_business_id
    and a.order_id = p_order_id
    and a.outflow_kind = 'refund'
    and o.operation_type = 'order_refund';
$$;

create or replace function private.order_reversed_amount(
  p_business_id uuid,
  p_order_id uuid
)
returns numeric
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(sum(a.total_amount), 0)::numeric(14, 2)
  from public.finance_order_outflow_allocations a
  join public.finance_operations o
    on o.id = a.operation_id and o.business_id = a.business_id
  where a.business_id = p_business_id
    and a.order_id = p_order_id
    and a.outflow_kind = 'payment_reversal'
    and o.operation_type = 'order_payment_reversal';
$$;

create or replace function private.order_paid_net(
  p_business_id uuid,
  p_order_id uuid
)
returns numeric
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  with collected as (
    select coalesce(sum(e.amount), 0)::numeric(14, 2) amount
    from public.finance_transaction_entries e
    join public.finance_transactions t
      on t.id = e.transaction_id and t.business_id = e.business_id
    join public.finance_operations o
      on o.id = t.operation_id and o.business_id = t.business_id
    join public.finance_funds f
      on f.id = e.fund_id and f.business_id = e.business_id
    where t.business_id = p_business_id
      and t.order_id = p_order_id
      and t.status = 'posted'
      and e.direction = 'in'
      and (
        (
          o.operation_type in ('deposit', 'order_payment')
          and not exists (
            select 1 from public.finance_transaction_entries x
            where x.transaction_id = t.id
              and x.business_id = t.business_id
              and x.direction = 'out'
          )
        )
        or (
          o.operation_type = 'historical_deposit'
          and f.fund_type = 'committed'
          and f.order_id = p_order_id
        )
      )
  )
  select greatest(
    collected.amount - private.order_reversed_amount(p_business_id, p_order_id),
    0
  )::numeric(14, 2)
  from collected;
$$;

create or replace function private.order_released_amount(
  p_business_id uuid,
  p_order_id uuid
)
returns numeric
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  with gross_release as (
    select coalesce(sum(e.amount), 0)::numeric(14, 2) amount
    from public.finance_transaction_entries e
    join public.finance_transactions t
      on t.id = e.transaction_id and t.business_id = e.business_id
    join public.finance_operations o
      on o.id = t.operation_id and o.business_id = t.business_id
    join public.finance_funds f
      on f.id = e.fund_id and f.business_id = e.business_id
    where t.business_id = p_business_id
      and t.order_id = p_order_id
      and t.status = 'posted'
      and o.operation_type in ('release_deposit', 'order_retention')
      and e.direction = 'out'
      and f.fund_type = 'committed'
      and f.order_id = p_order_id
  ), reversed_release as (
    select coalesce(sum(a.released_amount), 0)::numeric(14, 2) amount
    from public.finance_order_outflow_allocations a
    join public.finance_operations o
      on o.id = a.operation_id and o.business_id = a.business_id
    where a.business_id = p_business_id
      and a.order_id = p_order_id
      and a.outflow_kind = 'payment_reversal'
      and o.operation_type = 'order_payment_reversal'
  )
  select greatest(gross_release.amount - reversed_release.amount, 0)::numeric(14, 2)
  from gross_release, reversed_release;
$$;

create or replace function private.order_retained_amount(
  p_business_id uuid,
  p_order_id uuid
)
returns numeric
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(sum(e.amount), 0)::numeric(14, 2)
  from public.finance_transaction_entries e
  join public.finance_transactions t
    on t.id = e.transaction_id and t.business_id = e.business_id
  join public.finance_operations o
    on o.id = t.operation_id and o.business_id = t.business_id
  join public.finance_funds f
    on f.id = e.fund_id and f.business_id = e.business_id
  where t.business_id = p_business_id
    and t.order_id = p_order_id
    and t.status = 'posted'
    and o.operation_type = 'order_retention'
    and e.direction = 'out'
    and f.fund_type = 'committed'
    and f.order_id = p_order_id;
$$;

create or replace function private.order_protection_variance(
  p_business_id uuid,
  p_order_id uuid
)
returns numeric
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select (
    private.order_paid_net(p_business_id, p_order_id)
    - private.order_released_amount(p_business_id, p_order_id)
    - private.order_committed_amount(p_business_id, p_order_id)
    - private.order_refunded_from_protected(p_business_id, p_order_id)
  )::numeric(14, 2);
$$;

create or replace function private.order_refundable_amount(
  p_business_id uuid,
  p_order_id uuid
)
returns numeric
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select greatest(
    private.order_paid_net(p_business_id, p_order_id)
    - private.order_refunded_amount(p_business_id, p_order_id),
    0
  )::numeric(14, 2);
$$;

create or replace function private.order_collection_operation_amount(
  p_business_id uuid,
  p_order_id uuid,
  p_operation_id uuid
)
returns numeric
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(sum(e.amount), 0)::numeric(14, 2)
  from public.finance_transaction_entries e
  join public.finance_transactions t
    on t.id = e.transaction_id and t.business_id = e.business_id
  join public.finance_operations o
    on o.id = t.operation_id and o.business_id = t.business_id
  join public.finance_funds f
    on f.id = e.fund_id and f.business_id = e.business_id
  where t.business_id = p_business_id
    and t.order_id = p_order_id
    and t.operation_id = p_operation_id
    and t.status = 'posted'
    and e.direction = 'in'
    and (
      (
        o.operation_type in ('deposit', 'order_payment')
        and not exists (
          select 1 from public.finance_transaction_entries x
          where x.transaction_id = t.id
            and x.business_id = t.business_id
            and x.direction = 'out'
        )
      )
      or (
        o.operation_type = 'historical_deposit'
        and f.fund_type = 'committed'
        and f.order_id = p_order_id
      )
    );
$$;

create or replace function private.parse_order_outflow_splits(p_splits jsonb)
returns table (fund_id uuid, amount numeric)
language plpgsql
stable
security definer
set search_path = pg_catalog
as $$
declare
  v_item jsonb;
  v_keys text[];
begin
  if p_splits is null or jsonb_typeof(p_splits) <> 'array'
     or jsonb_array_length(p_splits) = 0 then
    raise exception 'outflow_splits must be a non-empty array' using errcode = '22023';
  end if;
  for v_item in select * from jsonb_array_elements(p_splits)
  loop
    select coalesce(array_agg(k order by k), '{}') into v_keys
    from jsonb_object_keys(v_item) k;
    if jsonb_typeof(v_item) <> 'object'
       or v_keys <> array['amount', 'fund_id']::text[]
       or jsonb_typeof(v_item->'fund_id') <> 'string'
       or jsonb_typeof(v_item->'amount') <> 'number' then
      raise exception 'invalid outflow split' using errcode = '22023';
    end if;
    begin
      fund_id := (v_item->>'fund_id')::uuid;
      amount := private.assert_finance_amount((v_item->>'amount')::numeric);
    exception when others then
      raise exception 'invalid outflow split' using errcode = '22023';
    end;
    return next;
  end loop;
end;
$$;

create or replace function private.create_order_outflow(
  p_business_id uuid,
  p_order_id uuid,
  p_operation_type public.finance_operation_type,
  p_client_request_id uuid,
  p_request_hash text,
  p_target_operation_id uuid,
  p_splits jsonb,
  p_protected_amount numeric,
  p_released_amount numeric,
  p_note text,
  p_occurred_at timestamptz,
  p_actor_id uuid
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, public
as $$
declare
  v_kind public.finance_order_outflow_kind;
  v_protected numeric(14, 2) := coalesce(p_protected_amount, 0);
  v_released numeric(14, 2) := coalesce(p_released_amount, 0);
  v_total numeric(14, 2);
  v_split_total numeric(14, 2);
  v_committed public.finance_funds%rowtype;
  v_destination public.finance_funds%rowtype;
  v_direct_committed numeric(14, 2) := 0;
  v_unwind numeric(14, 2) := 0;
  v_fund_ids uuid[];
  v_locked_count integer;
  v_fund public.finance_funds%rowtype;
  v_fund_id uuid;
  v_out numeric;
  v_in numeric;
  v_operation_id uuid;
  v_transaction_id uuid;
  v_item record;
begin
  if p_operation_type = 'order_refund' then
    v_kind := 'refund';
  elsif p_operation_type = 'order_payment_reversal' then
    v_kind := 'payment_reversal';
  else
    raise exception 'invalid order outflow operation type' using errcode = '22023';
  end if;
  if v_protected < 0 or v_released < 0 then
    raise exception 'outflow allocation cannot be negative' using errcode = '22023';
  end if;
  v_total := private.assert_finance_amount(v_protected + v_released);
  select sum(s.amount)::numeric(14, 2) into v_split_total
  from private.parse_order_outflow_splits(p_splits) s;
  if v_split_total <> v_total then
    raise exception 'outflow splits must equal lifecycle allocation' using errcode = '22023';
  end if;

  if v_protected > private.order_committed_amount(p_business_id, p_order_id) then
    raise exception 'protected outflow exceeds committed amount' using errcode = 'P0001';
  end if;
  if v_kind = 'refund' then
    if v_total > private.order_refundable_amount(p_business_id, p_order_id) then
      raise exception 'refund exceeds refundable amount' using errcode = 'P0001';
    end if;
    if v_released > greatest(
      private.order_released_amount(p_business_id, p_order_id)
      - private.order_refunded_from_released(p_business_id, p_order_id), 0
    ) then
      raise exception 'released refund allocation exceeds available released amount'
        using errcode = 'P0001';
    end if;
  end if;

  if v_protected > 0 then
    select * into v_committed
    from public.finance_funds
    where business_id = p_business_id
      and order_id = p_order_id
      and fund_type = 'committed'
      and private.finance_fund_balance(business_id, id) > 0
    order by active desc, created_at desc
    limit 1;
    if not found then
      raise exception 'committed fund missing for protected outflow' using errcode = 'P0001';
    end if;
    select coalesce(sum(s.amount), 0)::numeric(14, 2)
    into v_direct_committed
    from private.parse_order_outflow_splits(p_splits) s
    where s.fund_id = v_committed.id;
    if v_direct_committed > v_protected then
      raise exception 'committed payout exceeds protected allocation' using errcode = 'P0001';
    end if;
    v_unwind := v_protected - v_direct_committed;
    if v_unwind > 0 then
      v_destination := private.resolve_order_coverage_fund(p_business_id, null);
    end if;
  else
    if exists (
      select 1 from private.parse_order_outflow_splits(p_splits) s
      join public.finance_funds f on f.id = s.fund_id
      where f.business_id = p_business_id
        and (f.fund_type = 'committed' or f.order_id is not null)
    ) then
      raise exception 'released outflow cannot use committed fund' using errcode = 'P0001';
    end if;
  end if;

  select array_agg(distinct id order by id) into v_fund_ids
  from (
    select s.fund_id id from private.parse_order_outflow_splits(p_splits) s
    union all select v_committed.id where v_protected > 0
    union all select v_destination.id where v_unwind > 0
  ) ids;
  select count(*) into v_locked_count
  from private.lock_finance_funds(p_business_id, v_fund_ids);
  if v_locked_count <> cardinality(v_fund_ids) then
    raise exception 'invalid fund in outflow' using errcode = '22023';
  end if;

  for v_fund_id in select unnest(v_fund_ids)
  loop
    select * into strict v_fund from public.finance_funds
    where id = v_fund_id and business_id = p_business_id;
    if not v_fund.active and v_fund.id <> v_committed.id then
      raise exception 'inactive outflow fund' using errcode = 'P0001';
    end if;
    if (v_fund.fund_type = 'committed' or v_fund.order_id is not null)
       and v_fund.id is distinct from v_committed.id then
      raise exception 'cross-order outflow fund rejected' using errcode = 'P0001';
    end if;
    select coalesce(sum(s.amount), 0) into v_out
    from private.parse_order_outflow_splits(p_splits) s where s.fund_id = v_fund_id;
    if v_fund_id = v_committed.id then
      v_out := v_out + v_unwind;
    end if;
    v_in := case when v_fund_id = v_destination.id then v_unwind else 0 end;
    if private.finance_fund_balance(p_business_id, v_fund_id) + v_in - v_out < 0 then
      raise exception 'insufficient fund balance for order outflow' using errcode = 'P0001';
    end if;
  end loop;

  insert into public.finance_operations (
    business_id, operation_type, client_request_id, request_hash, note,
    created_by, target_operation_id
  ) values (
    p_business_id, p_operation_type, p_client_request_id, p_request_hash,
    p_note, p_actor_id, p_target_operation_id
  ) returning id into v_operation_id;
  insert into public.finance_transactions (
    business_id, operation_id, status, order_id, occurred_at, note, created_by
  ) values (
    p_business_id, v_operation_id, 'posted', p_order_id,
    coalesce(p_occurred_at, now()), p_note, p_actor_id
  ) returning id into v_transaction_id;
  for v_item in select * from private.parse_order_outflow_splits(p_splits)
  loop
    insert into public.finance_transaction_entries (
      business_id, transaction_id, fund_id, direction, amount
    ) values (p_business_id, v_transaction_id, v_item.fund_id, 'out', v_item.amount);
  end loop;
  if v_unwind > 0 then
    insert into public.finance_transaction_entries (
      business_id, transaction_id, fund_id, direction, amount
    ) values
      (p_business_id, v_transaction_id, v_committed.id, 'out', v_unwind),
      (p_business_id, v_transaction_id, v_destination.id, 'in', v_unwind);
  end if;
  insert into public.finance_order_outflow_allocations (
    operation_id, business_id, order_id, outflow_kind,
    protected_amount, released_amount
  ) values (
    v_operation_id, p_business_id, p_order_id, v_kind, v_protected, v_released
  );
  insert into public.finance_audit_events (
    business_id, actor_id, event_type, entity_type, entity_id, payload
  ) values (
    p_business_id, p_actor_id,
    case when v_kind = 'refund' then 'order_refund_created'
         else 'order_payment_reversed' end,
    'order_financials', p_order_id,
    jsonb_build_object(
      'operation_id', v_operation_id,
      'target_operation_id', p_target_operation_id,
      'protected_amount', v_protected,
      'released_amount', v_released
    )
  );
  if v_protected > 0
     and private.finance_fund_balance(p_business_id, v_committed.id) = 0 then
    update public.finance_funds set active = false
    where id = v_committed.id and business_id = p_business_id;
  end if;
  return jsonb_build_object(
    'operation_id', v_operation_id,
    'transaction_id', v_transaction_id,
    'amount', v_total,
    'protected_amount', v_protected,
    'released_amount', v_released
  );
end;
$$;

revoke all on function private.order_refunded_amount(uuid, uuid) from public, anon, authenticated;
revoke all on function private.order_refunded_from_protected(uuid, uuid) from public, anon, authenticated;
revoke all on function private.order_refunded_from_released(uuid, uuid) from public, anon, authenticated;
revoke all on function private.order_reversed_amount(uuid, uuid) from public, anon, authenticated;
revoke all on function private.order_retained_amount(uuid, uuid) from public, anon, authenticated;
revoke all on function private.order_refundable_amount(uuid, uuid) from public, anon, authenticated;
revoke all on function private.order_collection_operation_amount(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function private.parse_order_outflow_splits(jsonb) from public, anon, authenticated;
revoke all on function private.create_order_outflow(
  uuid, uuid, public.finance_operation_type, uuid, text, uuid, jsonb,
  numeric, numeric, text, timestamptz, uuid
) from public, anon, authenticated;
