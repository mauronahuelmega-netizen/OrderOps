-- Talo First L4. Calendar in America/Argentina/Buenos_Aires and per-business service access.
-- Coverage is a posted, nominal collection; reversed or blocked collections never cover a period.
-- Period 0 is the included period and is covered by the activation (setup) collection.
-- Unpaid periods expire without debt: only the current period decides access.

create table commercial.service_access_exemptions (
  business_id uuid primary key references public.businesses (id),
  reason text not null check (length(btrim(reason)) between 8 and 300),
  granted_by uuid not null references commercial.platform_accounts (id),
  granted_at timestamptz not null default pg_catalog.now(),
  revoked_at timestamptz,
  revoked_by uuid references commercial.platform_accounts (id),
  constraint service_access_exemptions_revoked_chk check ((revoked_at is null) = (revoked_by is null))
);

alter table commercial.service_access_exemptions enable row level security;
alter table commercial.service_access_exemptions force row level security;
revoke all on table commercial.service_access_exemptions from public, anon, authenticated;
grant select on table commercial.service_access_exemptions to authenticated;

create policy service_access_exemptions_select on commercial.service_access_exemptions
  for select to authenticated
  using (commercial.has_permission('collection.write'));

create or replace function commercial.ba_date(p_at timestamptz)
returns date
language sql
immutable
set search_path = pg_catalog
as $$
  select (p_at at time zone 'America/Argentina/Buenos_Aires')::date
$$;

create or replace function commercial.ba_start(p_day date)
returns timestamptz
language sql
immutable
set search_path = pg_catalog
as $$
  select p_day::timestamp at time zone 'America/Argentina/Buenos_Aires'
$$;

-- Largest n >= 0 with founder_period_on(start, n) <= day; -1 before the start.
create or replace function commercial.founder_period_index(p_started date, p_day date)
returns int
language plpgsql
immutable
set search_path = pg_catalog, commercial
as $$
declare
  v_n int;
begin
  if p_started is null or p_day is null or p_day < p_started then
    return -1;
  end if;
  v_n := ((extract(year from p_day) - extract(year from p_started)) * 12
    + (extract(month from p_day) - extract(month from p_started)))::int;
  if commercial.founder_period_on(p_started, v_n) > p_day then
    v_n := v_n - 1;
  end if;
  return v_n;
end;
$$;

create or replace function commercial.founder_period_covered(p_terms_id uuid, p_started date, p_index int)
returns boolean
language sql
stable
set search_path = pg_catalog, public, commercial
as $$
  select exists (
    select 1
    from commercial.platform_obligations obligation
    join commercial.platform_collections collection on collection.obligation_id = obligation.id
    where obligation.conversion_terms_id = p_terms_id
      and collection.status = 'posted'
      and collection.policy_status = 'nominal'
      and (
        (p_index = 0 and obligation.kind = 'setup')
        or (
          p_index >= 1
          and obligation.kind = 'subscription'
          and obligation.period_key = commercial.founder_period_on(p_started, p_index)::text
        )
      )
  )
$$;

create or replace function commercial.business_service_access(p_business_id uuid, p_at timestamptz)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_day date := commercial.ba_date(p_at);
  v_terms commercial.conversion_terms%rowtype;
  v_count int;
  v_started date;
  v_n int;
  v_current date;
  v_next date;
  v_grace_ends timestamptz;
  v_state text;
  v_next_covered boolean;
  v_base jsonb;
begin
  if p_business_id is null or p_at is null then
    return jsonb_build_object('state', 'invalid', 'allows_orders', false);
  end if;
  if exists (select 1 from commercial.service_access_exemptions where business_id = p_business_id and revoked_at is null) then
    return jsonb_build_object('state', 'exempt', 'allows_orders', true, 'as_of', p_at);
  end if;

  select count(*) into v_count from commercial.conversion_terms where won_business_id = p_business_id;
  if v_count = 0 then
    return jsonb_build_object('state', 'no_terms', 'allows_orders', false, 'as_of', p_at);
  end if;
  if v_count > 1 then
    return jsonb_build_object('state', 'review_required', 'allows_orders', false, 'as_of', p_at);
  end if;
  select * into v_terms from commercial.conversion_terms where won_business_id = p_business_id;
  v_base := jsonb_build_object(
    'as_of', p_at,
    'conversion_terms_id', v_terms.id,
    'setup_price_cents', v_terms.setup_price_cents,
    'monthly_price_cents', v_terms.monthly_price_cents
  );

  if not commercial.founder_period_covered(v_terms.id, null, 0) then
    return v_base || jsonb_build_object('state', 'pending_activation', 'allows_orders', false);
  end if;

  select service_started_on into v_started from commercial.founder_service_starts where conversion_terms_id = v_terms.id;
  if v_started is null then
    return v_base || jsonb_build_object('state', 'active', 'allows_orders', true, 'start_pending', true);
  end if;

  v_n := commercial.founder_period_index(v_started, v_day);
  if v_n < 0 then
    return v_base || jsonb_build_object(
      'state', 'active', 'allows_orders', true, 'start_pending', false,
      'service_started_on', v_started, 'current_period_index', 0, 'current_period_on', v_started,
      'next_period_on', commercial.founder_period_on(v_started, 1), 'current_covered', true,
      'next_covered', commercial.founder_period_covered(v_terms.id, v_started, 1)
    );
  end if;

  v_current := commercial.founder_period_on(v_started, v_n);
  v_next := commercial.founder_period_on(v_started, v_n + 1);
  v_next_covered := commercial.founder_period_covered(v_terms.id, v_started, v_n + 1);
  if commercial.founder_period_covered(v_terms.id, v_started, v_n) then
    v_state := 'active';
  elsif v_n >= 1
    and commercial.founder_period_covered(v_terms.id, v_started, v_n - 1)
    and p_at < commercial.ba_start(v_current + 7) then
    v_state := 'grace';
    v_grace_ends := commercial.ba_start(v_current + 7);
  else
    v_state := 'suspended';
  end if;

  return v_base || jsonb_build_object(
    'state', v_state,
    'allows_orders', v_state in ('active', 'grace'),
    'start_pending', false,
    'service_started_on', v_started,
    'current_period_index', v_n,
    'current_period_on', v_current,
    'current_covered', v_state = 'active',
    'next_period_on', v_next,
    'next_covered', v_next_covered,
    'renewal_window_opens_on', v_next - 10,
    'grace_ends_at', v_grace_ends
  );
end;
$$;

revoke all on function commercial.founder_period_covered(uuid, date, int) from public, anon, authenticated, service_role;
revoke all on function commercial.business_service_access(uuid, timestamptz) from public, anon, authenticated, service_role;
grant execute on function commercial.ba_date(timestamptz) to authenticated, service_role;
grant execute on function commercial.ba_start(date) to authenticated, service_role;
grant execute on function commercial.founder_period_index(date, date) to authenticated, service_role;
