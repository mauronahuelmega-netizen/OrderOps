-- P05-T02: nominal commission accrual.
-- Does not set slots, available_at, windows, reversals, settlements, invoices, or payments.
-- win_opportunity and record_collection do not call this function.

create table commercial.promoter_commissions (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references commercial.platform_collections (id),
  right_kind text not null check (right_kind in ('setup', 'recurring')),
  conversion_terms_id uuid not null references commercial.conversion_terms (id),
  promoter_id uuid not null references commercial.promoters (id),
  slot int check (slot is null or slot between 1 and 12),
  amount_cents bigint not null check (amount_cents >= 0),
  status text not null default 'pending' check (
    status in ('pending', 'available', 'in_settlement', 'paid', 'held', 'voided')
  ),
  available_at timestamptz,
  release_exception_reason text,
  release_exception_by uuid references commercial.platform_accounts (id),
  settlement_id uuid,
  created_at timestamptz not null default pg_catalog.now(),
  constraint promoter_commissions_setup_slot_chk check (right_kind <> 'setup' or slot is null)
);

create unique index promoter_commissions_collection_kind_idx
  on commercial.promoter_commissions (collection_id, right_kind);

alter table commercial.promoter_commissions enable row level security;
alter table commercial.promoter_commissions force row level security;

revoke all on table commercial.promoter_commissions from public, anon, authenticated;
grant select on table commercial.promoter_commissions to authenticated;

create policy promoter_commissions_select on commercial.promoter_commissions
  for select to authenticated
  using (
    commercial.has_permission('collection.write')
    or promoter_id = commercial.current_promoter_id()
  );

create or replace function commercial.accrue_commissions_for_collection(
  p_collection_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid;
  v_collection commercial.platform_collections%rowtype;
  v_obligation commercial.platform_obligations%rowtype;
  v_terms commercial.conversion_terms%rowtype;
  v_promoter uuid;
  v_kind text;
  v_amount bigint;
  v_existing commercial.promoter_commissions%rowtype;
  v_id uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;

  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('collection.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;

  if p_collection_id is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  select * into v_collection
  from commercial.platform_collections
  where id = p_collection_id
  for update;

  if v_collection.id is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  if v_collection.status is distinct from 'posted'
    or v_collection.policy_status is distinct from 'nominal'
    or v_collection.eligible_base_cents is null then
    return jsonb_build_object(
      'ok', true,
      'accrued', false,
      'commercial_error_code', 'policy_blocked'
    );
  end if;

  select * into v_obligation
  from commercial.platform_obligations
  where id = v_collection.obligation_id;

  select * into v_terms
  from commercial.conversion_terms
  where id = v_obligation.conversion_terms_id;

  select attribution.promoter_id into v_promoter
  from commercial.opportunity_attributions attribution
  where attribution.id = v_terms.attribution_id;

  if v_obligation.id is null or v_terms.id is null or v_promoter is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  if v_obligation.kind = 'setup' then
    v_kind := 'setup';
    v_amount := v_terms.setup_commission_cents;
  elsif v_obligation.kind = 'subscription' then
    v_kind := 'recurring';
    v_amount := v_collection.eligible_base_cents * v_terms.recurring_bps / 10000;
  else
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  select * into v_existing
  from commercial.promoter_commissions
  where collection_id = p_collection_id
    and right_kind = v_kind;

  if v_existing.id is not null then
    return jsonb_build_object(
      'ok', true,
      'duplicate', true,
      'accrued', false,
      'commission_id', v_existing.id,
      'amount_cents', v_existing.amount_cents,
      'status', v_existing.status
    );
  end if;

  begin
    insert into commercial.promoter_commissions (
      collection_id,
      right_kind,
      conversion_terms_id,
      promoter_id,
      slot,
      amount_cents,
      status,
      available_at
    ) values (
      p_collection_id,
      v_kind,
      v_terms.id,
      v_promoter,
      null,
      v_amount,
      'pending',
      null
    )
    returning id into v_id;
  exception
    when unique_violation then
      select * into v_existing
      from commercial.promoter_commissions
      where collection_id = p_collection_id
        and right_kind = v_kind;
      if v_existing.id is null then
        return jsonb_build_object('ok', false, 'commercial_error_code', 'duplicate_commission');
      end if;
      return jsonb_build_object(
        'ok', true,
        'duplicate', true,
        'accrued', false,
        'commission_id', v_existing.id,
        'amount_cents', v_existing.amount_cents,
        'status', v_existing.status
      );
  end;

  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    v_actor,
    'internal',
    'commission.accrued',
    'commercial',
    'promoter_commissions',
    v_id,
    p_collection_id,
    jsonb_build_object(
      'collection_id', p_collection_id,
      'right_kind', v_kind,
      'amount_cents', v_amount,
      'status', 'pending',
      'slot', null,
      'available_at', null
    )
  );

  return jsonb_build_object(
    'ok', true,
    'duplicate', false,
    'accrued', true,
    'commission_id', v_id,
    'right_kind', v_kind,
    'amount_cents', v_amount,
    'status', 'pending'
  );
end;
$$;

revoke all on function commercial.accrue_commissions_for_collection(uuid) from public, anon, authenticated, service_role;

create or replace function public.accrue_commissions_for_collection(
  p_collection_id uuid
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, public, commercial
as $$
  select commercial.accrue_commissions_for_collection(p_collection_id);
$$;

revoke all on function public.accrue_commissions_for_collection(uuid) from public, anon, service_role;
grant execute on function public.accrue_commissions_for_collection(uuid) to authenticated;
