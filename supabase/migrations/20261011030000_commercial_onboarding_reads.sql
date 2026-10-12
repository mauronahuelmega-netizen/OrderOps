-- Post PHASE-04 read contracts for the onboarding UI.
-- These functions do not write, enqueue, or change grants.

create or replace function commercial.onboarding_grant_display_status(
  p_grant_id uuid,
  p_status text,
  p_ends_at timestamptz
)
returns text
language sql
stable
security definer
set search_path = pg_catalog, commercial
as $$
  select case
    when p_status = 'active' and p_ends_at <= pg_catalog.now() then 'expired'
    when p_status = 'revoked' then coalesce((
      select event.event_type
      from commercial.onboarding_grant_events event
      where event.grant_id = p_grant_id
        and event.event_type in ('rejected', 'revoked')
      order by event.created_at desc
      limit 1
    ), 'revoked')
    else p_status
  end;
$$;

revoke all on function commercial.onboarding_grant_display_status(uuid, text, timestamptz)
  from public, anon, authenticated, service_role;

create or replace function commercial.promoter_onboarding_businesses()
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_promoter uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_promoter := commercial.current_promoter_id();
  if v_promoter is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  return jsonb_build_object(
    'ok', true,
    'businesses', coalesce((
      select jsonb_agg(jsonb_build_object(
        'business_id', business.id,
        'name', business.name,
        'slug', business.slug,
        'can_edit', exists (
          select 1 from commercial.onboarding_grants open_grant
          where open_grant.promoter_id = v_promoter
            and open_grant.business_id = business.id
            and open_grant.status = 'active'
            and open_grant.ends_at > pg_catalog.now()
        ),
        'grants', coalesce((
          select jsonb_agg(jsonb_build_object(
            'grant_id', grant_row.id,
            'status', grant_row.status,
            'display_status', commercial.onboarding_grant_display_status(grant_row.id, grant_row.status, grant_row.ends_at),
            'starts_at', grant_row.starts_at,
            'ends_at', grant_row.ends_at,
            'can_edit', grant_row.status = 'active' and grant_row.ends_at > pg_catalog.now()
          ) order by grant_row.created_at desc)
          from commercial.onboarding_grants grant_row
          where grant_row.promoter_id = v_promoter
            and grant_row.business_id = business.id
        ), '[]'::jsonb)
      ) order by business.name)
      from public.businesses business
      where business.id in (
        select terms.won_business_id
        from commercial.conversion_terms terms
        join commercial.opportunity_attributions attribution
          on attribution.id = terms.attribution_id
        where attribution.promoter_id = v_promoter
          and attribution.status = 'confirmed'
          and attribution.voided_at is null
      )
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function commercial.promoter_onboarding_products(p_business_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_promoter uuid;
  v_status text;
  v_ends timestamptz;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_promoter := commercial.current_promoter_id();
  if v_promoter is null
    or not commercial.promoter_can_operate((select status from commercial.promoters where id = v_promoter)) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if p_business_id is null or not exists (
    select 1
    from commercial.conversion_terms terms
    join commercial.opportunity_attributions attribution on attribution.id = terms.attribution_id
    where terms.won_business_id = p_business_id
      and attribution.promoter_id = v_promoter
      and attribution.status = 'confirmed'
      and attribution.voided_at is null
  ) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  select grant_row.status, grant_row.ends_at
    into v_status, v_ends
  from commercial.onboarding_grants grant_row
  where grant_row.promoter_id = v_promoter
    and grant_row.business_id = p_business_id
    and grant_row.status = 'active'
  order by grant_row.ends_at desc
  limit 1;
  if v_status = 'active' and v_ends <= pg_catalog.now() then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'grant_expired');
  end if;
  if v_status is distinct from 'active' or v_ends is null or v_ends <= pg_catalog.now() then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'grant_missing');
  end if;
  return jsonb_build_object(
    'ok', true,
    'business_id', p_business_id,
    'products', coalesce((
      select jsonb_agg(jsonb_build_object(
        'product_id', product.id,
        'name', product.name,
        'description', product.description,
        'category_name', category.name
      ) order by product.name)
      from public.products product
      join public.categories category on category.id = product.category_id
      where product.business_id = p_business_id
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function commercial.business_onboarding_requests()
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_business uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  select profile.business_id into v_business
  from public.profiles profile
  where profile.id = auth.uid()
    and profile.role in ('owner', 'manager', 'admin');
  if v_business is null or not commercial.business_catalog_approver(v_business) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  return jsonb_build_object(
    'ok', true,
    'business_id', v_business,
    'requests', coalesce((
      select jsonb_agg(jsonb_build_object(
        'grant_id', grant_row.id,
        'status', grant_row.status,
        'display_status', commercial.onboarding_grant_display_status(grant_row.id, grant_row.status, grant_row.ends_at),
        'starts_at', grant_row.starts_at,
        'ends_at', grant_row.ends_at,
        'created_at', grant_row.created_at,
        'promoter_name', promoter.legal_name,
        'promoter_code', promoter.public_code,
        'can_decide', grant_row.status = 'pending_client',
        'can_revoke', grant_row.status = 'active' and grant_row.ends_at > pg_catalog.now()
      ) order by grant_row.created_at desc)
      from commercial.onboarding_grants grant_row
      join commercial.promoters promoter on promoter.id = grant_row.promoter_id
      where grant_row.business_id = v_business
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function commercial.promoter_onboarding_businesses() from public, anon, authenticated, service_role;
revoke all on function commercial.promoter_onboarding_products(uuid) from public, anon, authenticated, service_role;
revoke all on function commercial.business_onboarding_requests() from public, anon, authenticated, service_role;

create or replace function public.promoter_onboarding_businesses()
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, commercial
as $$
  select commercial.promoter_onboarding_businesses();
$$;

create or replace function public.promoter_onboarding_products(p_business_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, commercial
as $$
  select commercial.promoter_onboarding_products(p_business_id);
$$;

create or replace function public.business_onboarding_requests()
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, commercial
as $$
  select commercial.business_onboarding_requests();
$$;

revoke all on function public.promoter_onboarding_businesses() from public, anon, service_role;
revoke all on function public.promoter_onboarding_products(uuid) from public, anon, service_role;
revoke all on function public.business_onboarding_requests() from public, anon, service_role;
grant execute on function public.promoter_onboarding_businesses() to authenticated;
grant execute on function public.promoter_onboarding_products(uuid) to authenticated;
grant execute on function public.business_onboarding_requests() to authenticated;
