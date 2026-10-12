-- P05-T01: manual platform obligations and collections.
-- No commissions, slots, settlements, invoices, payments, or reversals.

create table commercial.platform_obligations (
  id uuid primary key default gen_random_uuid(),
  conversion_terms_id uuid not null references commercial.conversion_terms (id),
  won_business_id uuid not null references public.businesses (id),
  kind text not null check (kind in ('setup', 'subscription')),
  period_key text,
  list_price_cents bigint not null check (list_price_cents >= 0),
  status text not null default 'open' check (status in ('open', 'satisfied', 'failed', 'void')),
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint platform_obligations_kind_period_chk check (
    (kind = 'setup' and period_key is null)
    or (
      kind = 'subscription'
      and period_key is not null
      and length(btrim(period_key)) > 0
    )
  )
);

create unique index platform_obligations_one_setup_idx
  on commercial.platform_obligations (conversion_terms_id)
  where kind = 'setup';

create unique index platform_obligations_subscription_period_idx
  on commercial.platform_obligations (conversion_terms_id, period_key)
  where kind = 'subscription';

create table commercial.platform_collections (
  id uuid primary key default gen_random_uuid(),
  obligation_id uuid not null references commercial.platform_obligations (id),
  idempotency_key text not null,
  status text not null check (status in ('posted', 'failed', 'reversed')),
  gross_cents bigint not null check (gross_cents >= 0),
  eligible_base_cents bigint,
  policy_status text not null check (policy_status in ('nominal', 'blocked_pending_policy')),
  posted_at timestamptz,
  failed_at timestamptz,
  reversed_at timestamptz,
  reversal_of_id uuid references commercial.platform_collections (id),
  recorded_by uuid not null references commercial.platform_accounts (id),
  external_ref text,
  created_at timestamptz not null default pg_catalog.now(),
  constraint platform_collections_idempotency_key_chk check (length(btrim(idempotency_key)) > 0),
  constraint platform_collections_eligible_non_negative_chk check (
    eligible_base_cents is null or eligible_base_cents >= 0
  ),
  constraint platform_collections_posted_at_chk check (status <> 'posted' or posted_at is not null),
  constraint platform_collections_failed_at_chk check (status <> 'failed' or failed_at is not null),
  constraint platform_collections_policy_chk check (
    (
      policy_status = 'nominal'
      and status = 'posted'
      and eligible_base_cents = gross_cents
    )
    or (
      policy_status = 'blocked_pending_policy'
      and eligible_base_cents is null
    )
  )
);

create unique index platform_collections_idempotency_key_idx
  on commercial.platform_collections (idempotency_key);

create unique index platform_collections_one_posted_idx
  on commercial.platform_collections (obligation_id)
  where status = 'posted';

alter table commercial.platform_obligations enable row level security;
alter table commercial.platform_obligations force row level security;
alter table commercial.platform_collections enable row level security;
alter table commercial.platform_collections force row level security;

revoke all on table commercial.platform_obligations from public, anon, authenticated;
revoke all on table commercial.platform_collections from public, anon, authenticated;

grant select on table commercial.platform_obligations to authenticated;
grant select on table commercial.platform_collections to authenticated;

create policy platform_obligations_select on commercial.platform_obligations
  for select to authenticated
  using (commercial.has_permission('collection.write'));

create policy platform_collections_select on commercial.platform_collections
  for select to authenticated
  using (commercial.has_permission('collection.write'));

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

create or replace function commercial.record_collection(
  p_obligation_id uuid,
  p_idempotency_key text,
  p_status text,
  p_gross_cents bigint,
  p_external_ref text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid;
  v_key text;
  v_ref text;
  v_obligation commercial.platform_obligations%rowtype;
  v_existing commercial.platform_collections%rowtype;
  v_policy text;
  v_eligible bigint;
  v_posted_at timestamptz;
  v_failed_at timestamptz;
  v_id uuid;
  v_obligation_status text;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;

  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('collection.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;

  v_key := nullif(btrim(coalesce(p_idempotency_key, '')), '');
  v_ref := nullif(btrim(coalesce(p_external_ref, '')), '');
  if p_obligation_id is null
    or v_key is null
    or p_status is null
    or p_status not in ('posted', 'failed')
    or p_gross_cents is null
    or p_gross_cents < 0 then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  select * into v_obligation
  from commercial.platform_obligations
  where id = p_obligation_id
  for update;

  if v_obligation.id is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  select * into v_existing
  from commercial.platform_collections
  where idempotency_key = v_key
  for update;

  if v_existing.id is not null then
    if v_existing.obligation_id is not distinct from p_obligation_id
      and v_existing.status = p_status
      and v_existing.gross_cents = p_gross_cents
      and v_existing.external_ref is not distinct from v_ref then
      return jsonb_build_object(
        'ok', true,
        'duplicate', true,
        'collection_id', v_existing.id,
        'policy_status', v_existing.policy_status,
        'eligible_base_cents', v_existing.eligible_base_cents,
        'obligation_status', v_obligation.status
      );
    end if;
    return jsonb_build_object('ok', false, 'commercial_error_code', 'idempotent_replay');
  end if;

  if p_status = 'posted' and v_obligation.status <> 'open' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  if p_status = 'failed' and v_obligation.status <> 'open' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  if p_status = 'posted' and exists (
    select 1
    from commercial.platform_collections
    where obligation_id = p_obligation_id
      and status = 'posted'
  ) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  if p_status = 'posted' and p_gross_cents = v_obligation.list_price_cents then
    v_policy := 'nominal';
    v_eligible := p_gross_cents;
    v_posted_at := pg_catalog.now();
    v_failed_at := null;
    v_obligation_status := 'satisfied';
  elsif p_status = 'posted' then
    v_policy := 'blocked_pending_policy';
    v_eligible := null;
    v_posted_at := pg_catalog.now();
    v_failed_at := null;
    v_obligation_status := 'satisfied';
  else
    v_policy := 'blocked_pending_policy';
    v_eligible := null;
    v_posted_at := null;
    v_failed_at := pg_catalog.now();
    v_obligation_status := 'open';
  end if;

  begin
    insert into commercial.platform_collections (
      obligation_id,
      idempotency_key,
      status,
      gross_cents,
      eligible_base_cents,
      policy_status,
      posted_at,
      failed_at,
      recorded_by,
      external_ref
    ) values (
      p_obligation_id,
      v_key,
      p_status,
      p_gross_cents,
      v_eligible,
      v_policy,
      v_posted_at,
      v_failed_at,
      v_actor,
      v_ref
    )
    returning id into v_id;
  exception
    when unique_violation then
      select * into v_existing
      from commercial.platform_collections
      where idempotency_key = v_key;
      if v_existing.id is not null then
        if v_existing.obligation_id is not distinct from p_obligation_id
          and v_existing.status = p_status
          and v_existing.gross_cents = p_gross_cents
          and v_existing.external_ref is not distinct from v_ref then
          return jsonb_build_object(
            'ok', true,
            'duplicate', true,
            'collection_id', v_existing.id,
            'policy_status', v_existing.policy_status,
            'eligible_base_cents', v_existing.eligible_base_cents,
            'obligation_status', v_obligation.status
          );
        end if;
        return jsonb_build_object('ok', false, 'commercial_error_code', 'idempotent_replay');
      end if;
      return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end;

  if v_obligation_status is distinct from v_obligation.status then
    update commercial.platform_obligations
    set status = v_obligation_status,
        updated_at = pg_catalog.now()
    where id = p_obligation_id;
  end if;

  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    v_actor,
    'internal',
    'collection.recorded',
    'commercial',
    'platform_collections',
    v_id,
    p_obligation_id,
    jsonb_build_object(
      'obligation_id', p_obligation_id,
      'status', p_status,
      'gross_cents', p_gross_cents,
      'policy_status', v_policy,
      'eligible_base_cents', v_eligible,
      'obligation_status', v_obligation_status,
      'external_ref', v_ref
    )
  );

  return jsonb_build_object(
    'ok', true,
    'duplicate', false,
    'collection_id', v_id,
    'policy_status', v_policy,
    'eligible_base_cents', v_eligible,
    'obligation_status', v_obligation_status
  );
end;
$$;

revoke all on function commercial.open_obligation(uuid, text, text) from public, anon, authenticated, service_role;
revoke all on function commercial.record_collection(uuid, text, text, bigint, text) from public, anon, authenticated, service_role;

create or replace function public.open_obligation(
  p_terms_id uuid,
  p_kind text,
  p_period_key text
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, public, commercial
as $$
  select commercial.open_obligation(p_terms_id, p_kind, p_period_key);
$$;

create or replace function public.record_collection(
  p_obligation_id uuid,
  p_idempotency_key text,
  p_status text,
  p_gross_cents bigint,
  p_external_ref text
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, public, commercial
as $$
  select commercial.record_collection(
    p_obligation_id,
    p_idempotency_key,
    p_status,
    p_gross_cents,
    p_external_ref
  );
$$;

revoke all on function public.open_obligation(uuid, text, text) from public, anon, service_role;
revoke all on function public.record_collection(uuid, text, text, bigint, text) from public, anon, service_role;
grant execute on function public.open_obligation(uuid, text, text) to authenticated;
grant execute on function public.record_collection(uuid, text, text, bigint, text) to authenticated;
