-- P05 P0: the twelve-right cap does not depend on calling satisfy before accrue.
-- Live recurring rights and assigned slot numbers both count. Voided rights are not eligible.
-- Slot numbers stay occupied. A right beyond the cap cannot become available or be settled.

create or replace function commercial.eligible_recurring_rank(p_commission_id uuid)
returns integer
language sql
stable
set search_path = pg_catalog, public, commercial
as $$
  select count(*)::integer
  from commercial.promoter_commissions self
  join commercial.promoter_commissions earlier
    on earlier.conversion_terms_id = self.conversion_terms_id
   and earlier.right_kind = 'recurring'
   and earlier.status <> 'voided'
   and (earlier.created_at, earlier.id) <= (self.created_at, self.id)
  where self.id = p_commission_id
    and self.right_kind = 'recurring'
    and self.status <> 'voided';
$$;

revoke all on function commercial.eligible_recurring_rank(uuid) from public, anon, authenticated, service_role;

create or replace function commercial.enforce_founder_recurring_cap()
returns trigger
language plpgsql
set search_path = pg_catalog, public, commercial
as $$
declare
  v_max integer;
  v_live integer;
  v_slots integer;
  v_has_slot boolean;
begin
  if new.right_kind <> 'recurring' or new.status = 'voided' then
    return new;
  end if;
  select max_recurring_slots into v_max
  from commercial.conversion_terms
  where id = new.conversion_terms_id
  for update;
  select count(*) into v_live
  from commercial.promoter_commissions
  where conversion_terms_id = new.conversion_terms_id
    and right_kind = 'recurring'
    and status <> 'voided';
  select coalesce(max(slot), 0) into v_slots
  from commercial.founder_slots
  where conversion_terms_id = new.conversion_terms_id;
  select exists (
    select 1
    from commercial.founder_slots slot
    join commercial.platform_collections collection on collection.obligation_id = slot.obligation_id
    where collection.id = new.collection_id
  ) into v_has_slot;
  if v_live >= v_max or (v_slots >= v_max and not v_has_slot) then
    raise exception 'slot_exhausted' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists promoter_commissions_founder_cap on commercial.promoter_commissions;
create trigger promoter_commissions_founder_cap
  before insert on commercial.promoter_commissions
  for each row
  execute function commercial.enforce_founder_recurring_cap();

create or replace function commercial.accrue_commissions_for_collection(p_collection_id uuid)
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
  v_slot int;
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

  select * into v_collection from commercial.platform_collections where id = p_collection_id for update;
  if v_collection.id is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  if v_collection.status is distinct from 'posted'
    or v_collection.policy_status is distinct from 'nominal'
    or v_collection.eligible_base_cents is null then
    return jsonb_build_object('ok', true, 'accrued', false, 'commercial_error_code', 'policy_blocked');
  end if;

  select * into v_obligation from commercial.platform_obligations where id = v_collection.obligation_id;
  select * into v_terms from commercial.conversion_terms where id = v_obligation.conversion_terms_id for update;
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
  where collection_id = p_collection_id and right_kind = v_kind;
  if v_existing.id is not null then
    return jsonb_build_object(
      'ok', true, 'duplicate', true, 'accrued', false,
      'commission_id', v_existing.id, 'amount_cents', v_existing.amount_cents, 'status', v_existing.status
    );
  end if;

  if v_kind = 'recurring'
    and (
      (
        select count(*)
        from commercial.promoter_commissions
        where conversion_terms_id = v_terms.id
          and right_kind = 'recurring'
          and status <> 'voided'
      ) >= v_terms.max_recurring_slots
      or (
        coalesce((select max(slot) from commercial.founder_slots where conversion_terms_id = v_terms.id), 0) >= v_terms.max_recurring_slots
        and not exists (
          select 1 from commercial.founder_slots where obligation_id = v_obligation.id
        )
      )
    ) then
    return jsonb_build_object('ok', true, 'accrued', false, 'commercial_error_code', 'slot_exhausted');
  end if;

  select slot into v_slot from commercial.founder_slots where obligation_id = v_obligation.id and voided_at is null;

  begin
    insert into commercial.promoter_commissions (
      collection_id, right_kind, conversion_terms_id, promoter_id, slot, amount_cents, status, available_at
    ) values (
      p_collection_id, v_kind, v_terms.id, v_promoter, v_slot, v_amount, 'pending', null
    ) returning id into v_id;
  exception
    when sqlstate 'P0001' then
      if sqlerrm = 'slot_exhausted' then
        return jsonb_build_object('ok', true, 'accrued', false, 'commercial_error_code', 'slot_exhausted');
      end if;
      raise;
    when unique_violation then
      select * into v_existing from commercial.promoter_commissions
      where collection_id = p_collection_id and right_kind = v_kind;
      return jsonb_build_object(
        'ok', true, 'duplicate', true, 'accrued', false,
        'commission_id', v_existing.id, 'amount_cents', v_existing.amount_cents, 'status', v_existing.status
      );
  end;

  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    v_actor, 'internal', 'commission.accrued', 'commercial', 'promoter_commissions', v_id, p_collection_id,
    jsonb_build_object('collection_id', p_collection_id, 'right_kind', v_kind, 'amount_cents', v_amount, 'status', 'pending', 'slot', v_slot)
  );

  return jsonb_build_object(
    'ok', true, 'duplicate', false, 'accrued', true,
    'commission_id', v_id, 'right_kind', v_kind, 'amount_cents', v_amount, 'status', 'pending', 'slot', v_slot
  );
end;
$$;

create or replace function commercial.refresh_commission_availability()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_row commercial.promoter_commissions%rowtype;
  v_collection commercial.platform_collections%rowtype;
  v_terms commercial.conversion_terms%rowtype;
  v_available_at timestamptz;
  v_hold boolean;
  v_completed boolean;
  v_next text;
  v_changed int := 0;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('collection.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;

  for v_row in
    select * from commercial.promoter_commissions
    where status in ('pending', 'available', 'held')
    order by id
    for update
  loop
    select * into v_collection from commercial.platform_collections where id = v_row.collection_id;
    select * into v_terms from commercial.conversion_terms where id = v_row.conversion_terms_id;
    v_available_at := coalesce(v_row.available_at, v_collection.posted_at + interval '15 days');
    v_hold := exists (
      select 1
      from commercial.attribution_disputes dispute
      where dispute.opportunity_id = v_terms.opportunity_id
        and dispute.economic_effect = 'hold_unpaid_commissions'
        and dispute.status <> 'closed'
    );
    v_completed := exists (
      select 1
      from commercial.onboarding_grants grant_row
      where grant_row.business_id = v_terms.won_business_id
        and grant_row.promoter_id = v_row.promoter_id
        and grant_row.status = 'completed'
    );
    if v_hold then
      v_next := 'held';
    elsif v_row.release_exception_by is not null and v_row.right_kind = 'setup' then
      v_next := 'available';
    elsif v_now < v_available_at then
      v_next := 'pending';
    elsif v_row.right_kind = 'recurring' and commercial.eligible_recurring_rank(v_row.id) <= v_terms.max_recurring_slots then
      v_next := 'available';
    elsif v_row.right_kind = 'recurring' then
      v_next := 'pending';
    elsif v_completed then
      v_next := 'available';
    else
      v_next := 'pending';
    end if;

    if v_row.status is distinct from v_next or v_row.available_at is distinct from v_available_at then
      update commercial.promoter_commissions
      set status = v_next,
          available_at = v_available_at
      where id = v_row.id;
      v_changed := v_changed + 1;
    end if;
  end loop;

  return jsonb_build_object('ok', true, 'changed', v_changed, 'as_of', v_now);
end;
$$;

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
      and (
        right_kind <> 'recurring'
        or commercial.eligible_recurring_rank(id) <= (
          select terms.max_recurring_slots
          from commercial.conversion_terms terms
          where terms.id = promoter_commissions.conversion_terms_id
        )
      )
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
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    v_actor, 'internal', 'settlement.prepared', 'commercial', 'promoter_settlements', v_id, v_id,
    jsonb_build_object('period_key', p_period_key, 'total_cents', v_total, 'due_on', v_due)
  );

  return jsonb_build_object('ok', true, 'duplicate', false, 'settlement_id', v_id, 'total_cents', v_total, 'due_on', v_due);
end;
$$;

