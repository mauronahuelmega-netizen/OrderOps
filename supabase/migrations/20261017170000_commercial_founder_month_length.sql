-- CC-C19. Due day is min(original anniversary day, days in the target month).
-- The target month is the service start plus the requested offset.
-- A previous clamped due date is not the base of the next offset.
-- Applied migrations 20261017120000 and 20261017143000 stay unchanged.

create or replace function commercial.founder_period_on(p_started date, p_offset int)
returns date
language plpgsql
immutable
set search_path = pg_catalog
as $$
declare
  v_next date;
begin
  if p_started is null or p_offset is null or p_offset < 0 then
    return null;
  end if;
  v_next := (p_started + make_interval(months => p_offset))::date;
  return v_next;
end;
$$;

create or replace function commercial.open_obligation(
  p_terms_id uuid,
  p_kind text,
  p_period_key text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid;
  v_terms commercial.conversion_terms%rowtype;
  v_period text;
  v_price bigint;
  v_existing commercial.platform_obligations%rowtype;
  v_id uuid;
  v_started date;
  v_due date;
  v_months int;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;

  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('collection.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;

  if p_kind is null or p_kind not in ('setup', 'subscription') or p_terms_id is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  select * into v_terms
  from commercial.conversion_terms
  where id = p_terms_id
  for update;

  if v_terms.id is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  v_period := nullif(btrim(coalesce(p_period_key, '')), '');
  if p_kind = 'setup' then
    if v_period is not null then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
    end if;
    v_price := v_terms.setup_price_cents;
  else
    if v_period is null then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
    end if;
    v_price := v_terms.monthly_price_cents;
    select service_started_on into v_started
    from commercial.founder_service_starts
    where conversion_terms_id = p_terms_id;
    if v_started is null then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'service_start_required');
    end if;
    if v_period !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
    end if;
    begin
      v_due := v_period::date;
    exception
      when datetime_field_overflow then
        return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
    end;
    if v_due = v_started then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'included_period');
    end if;
    v_months := ((extract(year from v_due) - extract(year from v_started)) * 12
      + (extract(month from v_due) - extract(month from v_started)))::int;
    if v_months < 1 or commercial.founder_period_on(v_started, v_months) is distinct from v_due then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
    end if;
  end if;

  if p_kind = 'setup' then
    select * into v_existing
    from commercial.platform_obligations
    where conversion_terms_id = p_terms_id
      and kind = 'setup';
  else
    select * into v_existing
    from commercial.platform_obligations
    where conversion_terms_id = p_terms_id
      and kind = 'subscription'
      and period_key = v_period;
  end if;

  if v_existing.id is not null then
    return jsonb_build_object(
      'ok', true,
      'duplicate', true,
      'obligation_id', v_existing.id,
      'status', v_existing.status,
      'list_price_cents', v_existing.list_price_cents,
      'kind', v_existing.kind,
      'period_key', v_existing.period_key
    );
  end if;

  if p_kind = 'subscription' and exists (
    select 1
    from commercial.platform_obligations
    where won_business_id = v_terms.won_business_id
      and kind = 'subscription'
      and period_key = v_period
      and conversion_terms_id <> p_terms_id
  ) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'period_conflict');
  end if;

  begin
    insert into commercial.platform_obligations (
      conversion_terms_id,
      won_business_id,
      kind,
      period_key,
      list_price_cents
    ) values (
      p_terms_id,
      v_terms.won_business_id,
      p_kind,
      v_period,
      v_price
    )
    returning id into v_id;
  exception
    when unique_violation then
      if p_kind = 'setup' then
        select * into v_existing
        from commercial.platform_obligations
        where conversion_terms_id = p_terms_id
          and kind = 'setup';
      else
        select * into v_existing
        from commercial.platform_obligations
        where conversion_terms_id = p_terms_id
          and kind = 'subscription'
          and period_key = v_period;
      end if;
      if v_existing.id is null and p_kind = 'subscription' then
        return jsonb_build_object('ok', false, 'commercial_error_code', 'period_conflict');
      end if;
      if v_existing.id is null then
        raise;
      end if;
      return jsonb_build_object(
        'ok', true,
        'duplicate', true,
        'obligation_id', v_existing.id,
        'status', v_existing.status,
        'list_price_cents', v_existing.list_price_cents,
        'kind', v_existing.kind,
        'period_key', v_existing.period_key
      );
  end;

  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    v_actor,
    'internal',
    'obligation.opened',
    'commercial',
    'platform_obligations',
    v_id,
    v_id,
    jsonb_build_object(
      'conversion_terms_id', p_terms_id,
      'won_business_id', v_terms.won_business_id,
      'kind', p_kind,
      'period_key', v_period,
      'list_price_cents', v_price
    )
  );

  return jsonb_build_object(
    'ok', true,
    'duplicate', false,
    'obligation_id', v_id,
    'status', 'open',
    'list_price_cents', v_price,
    'kind', p_kind,
    'period_key', v_period
  );
end;
$$;

revoke all on function commercial.open_obligation(uuid, text, text) from public, anon, authenticated, service_role;
grant execute on function public.open_obligation(uuid, text, text) to authenticated;
