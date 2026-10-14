-- P05-T08: a human records a simulated transfer. Nothing is sent to a bank.

create table commercial.settlement_payments (
  id uuid primary key default gen_random_uuid(),
  settlement_id uuid not null references commercial.promoter_settlements (id),
  idempotency_key text not null unique,
  amount_cents bigint not null check (amount_cents > 0),
  status text not null check (status in ('recorded', 'failed')),
  bank_account_id uuid references commercial.promoter_bank_accounts (id),
  destination_snapshot jsonb not null,
  bank_reference text,
  receipt_path text,
  recorded_by uuid not null references commercial.platform_accounts (id),
  paid_at timestamptz,
  created_at timestamptz not null default pg_catalog.now()
);

alter table commercial.settlement_payments enable row level security;
alter table commercial.settlement_payments force row level security;
revoke all on table commercial.settlement_payments from public, anon, authenticated;
grant select on table commercial.settlement_payments to authenticated;

create policy settlement_payments_select on commercial.settlement_payments
  for select to authenticated
  using (
    commercial.has_permission('collection.write')
    or exists (
      select 1 from commercial.promoter_settlements settlement
      where settlement.id = settlement_payments.settlement_id
        and settlement.promoter_id = commercial.current_promoter_id()
    )
  );

create or replace function commercial.record_settlement_payment(
  p_settlement_id uuid,
  p_idempotency_key text,
  p_amount_cents bigint,
  p_status text,
  p_bank_reference text,
  p_receipt_path text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid;
  v_settlement commercial.promoter_settlements%rowtype;
  v_existing commercial.settlement_payments%rowtype;
  v_bank commercial.promoter_bank_accounts%rowtype;
  v_paid bigint;
  v_id uuid;
  v_next text;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('collection.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if p_idempotency_key is null or btrim(p_idempotency_key) = ''
     or p_amount_cents is null or p_amount_cents <= 0
     or p_status not in ('recorded', 'failed') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  select * into v_existing from commercial.settlement_payments where idempotency_key = p_idempotency_key;
  if v_existing.id is not null then
    return jsonb_build_object('ok', true, 'duplicate', true, 'payment_id', v_existing.id, 'status', v_existing.status);
  end if;

  select * into v_settlement from commercial.promoter_settlements where id = p_settlement_id for update;
  if v_settlement.id is null or v_settlement.status not in ('payable', 'partially_paid') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  if v_actor = v_settlement.approved_by and not exists (
    select 1 from commercial.audit_events
    where action = 'payment.sod_exception' and entity_id = v_settlement.id
  ) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'sod_conflict');
  end if;

  select * into v_bank from commercial.promoter_bank_accounts
  where promoter_id = v_settlement.promoter_id and is_current and disabled_at is null
  order by created_at desc limit 1;
  if v_bank.id is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  select coalesce(sum(amount_cents), 0) into v_paid
  from commercial.settlement_payments
  where settlement_id = v_settlement.id and status = 'recorded';
  if p_status = 'recorded' and v_paid + p_amount_cents > v_settlement.total_cents then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'amount_exceeds_total');
  end if;

  insert into commercial.settlement_payments (
    settlement_id, idempotency_key, amount_cents, status, bank_account_id, destination_snapshot,
    bank_reference, receipt_path, recorded_by, paid_at
  ) values (
    v_settlement.id, p_idempotency_key, p_amount_cents, p_status, v_bank.id,
    jsonb_build_object('holder_name', v_bank.holder_name, 'cbu_or_cvu', v_bank.cbu_or_cvu),
    nullif(btrim(coalesce(p_bank_reference, '')), ''),
    nullif(btrim(coalesce(p_receipt_path, '')), ''),
    v_actor,
    case when p_status = 'recorded' then pg_catalog.clock_timestamp() else null end
  ) returning id into v_id;

  if p_status = 'recorded' then
    v_paid := v_paid + p_amount_cents;
    v_next := case when v_paid = v_settlement.total_cents then 'paid' else 'partially_paid' end;
    update commercial.promoter_settlements set status = v_next where id = v_settlement.id;
    if v_next = 'paid' then
      update commercial.promoter_commissions
      set status = 'paid'
      where id in (
        select source_id from commercial.settlement_items
        where settlement_id = v_settlement.id and source_kind = 'commission'
      );
      update commercial.commission_adjustments
      set status = 'applied'
      where id in (
        select source_id from commercial.settlement_items
        where settlement_id = v_settlement.id and source_kind = 'adjustment'
      );
    end if;
  end if;

  perform commercial.enqueue(
    'payment.recorded',
    jsonb_build_object('payment_id', v_id, 'settlement_id', v_settlement.id, 'status', p_status, 'amount_cents', p_amount_cents),
    v_id
  );
  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    v_actor, 'internal', 'payment.recorded', 'commercial', 'settlement_payments', v_id, v_settlement.id,
    jsonb_build_object('status', p_status, 'amount_cents', p_amount_cents)
  );

  return jsonb_build_object('ok', true, 'duplicate', false, 'payment_id', v_id, 'status', p_status);
end;
$$;

revoke all on function commercial.record_settlement_payment(uuid, text, bigint, text, text, text) from public, anon, authenticated, service_role;

create or replace function public.record_settlement_payment(
  p_settlement_id uuid,
  p_idempotency_key text,
  p_amount_cents bigint,
  p_status text,
  p_bank_reference text,
  p_receipt_path text
)
returns jsonb language sql security definer set search_path = pg_catalog, public, commercial
as $$
  select commercial.record_settlement_payment(
    p_settlement_id, p_idempotency_key, p_amount_cents, p_status, p_bank_reference, p_receipt_path
  );
$$;

revoke all on function public.record_settlement_payment(uuid, text, bigint, text, text, text) from public, anon, service_role;
grant execute on function public.record_settlement_payment(uuid, text, bigint, text, text, text) to authenticated;
