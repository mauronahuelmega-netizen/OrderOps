-- P04-T03. Promoter catalog writes go through this definer. Product RLS stays unchanged.

create or replace function commercial.promoter_apply_catalog(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_promoter uuid;
  v_kind text;
  v_business uuid;
  v_product uuid;
  v_category uuid;
  v_option uuid;
  v_grant_status text;
  v_ends timestamptz;
  v_key text;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_promoter := commercial.current_promoter_id();
  if v_promoter is null
    or not commercial.promoter_can_operate((select status from commercial.promoters where id = v_promoter)) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  if p_payload ?| array['price', 'stock', 'track_stock', 'is_available', 'sku', 'price_delta'] then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'grant_field_forbidden');
  end if;

  v_kind := p_payload->>'kind';
  if v_kind = 'product_update' then
    v_product := nullif(p_payload->>'product_id', '')::uuid;
    select business_id into v_business from public.products where id = v_product;
    if v_business is null then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
    end if;
  elsif v_kind = 'category_update' then
    v_category := nullif(p_payload->>'category_id', '')::uuid;
    select business_id into v_business from public.categories where id = v_category;
    if v_business is null then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
    end if;
  elsif v_kind = 'option_text' then
    v_option := nullif(p_payload->>'option_id', '')::uuid;
    select business_id into v_business from public.customization_options where id = v_option;
    if v_business is null then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
    end if;
  elsif v_kind = 'category_create' then
    if nullif(p_payload->>'business_id', '') is null then
      select business_id into v_business
      from commercial.onboarding_grants
      where promoter_id = v_promoter
        and status = 'active'
        and ends_at > pg_catalog.now();
      if v_business is null or (
        select count(distinct business_id) from commercial.onboarding_grants
        where promoter_id = v_promoter and status = 'active' and ends_at > pg_catalog.now()
      ) <> 1 then
        return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
      end if;
    else
      v_business := (p_payload->>'business_id')::uuid;
    end if;
    if not exists (select 1 from public.businesses where id = v_business) then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
    end if;
  else
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  select status, ends_at into v_grant_status, v_ends
  from commercial.onboarding_grants
  where promoter_id = v_promoter
    and business_id = v_business
    and status = 'active'
  order by ends_at desc
  limit 1;
  if v_grant_status = 'active' and v_ends <= pg_catalog.now() then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'grant_expired');
  end if;
  if v_grant_status is distinct from 'active' or v_ends is null or v_ends <= pg_catalog.now() then
    if exists (
      select 1 from commercial.onboarding_grants
      where promoter_id = v_promoter and business_id = v_business and status = 'pending_client'
    ) then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'grant_not_client_approved');
    end if;
    return jsonb_build_object('ok', false, 'commercial_error_code', 'grant_missing');
  end if;

  for v_key in select jsonb_object_keys(p_payload)
  loop
    if v_kind = 'product_update' and v_key not in ('kind', 'product_id', 'name', 'description', 'category_id', 'image_url') then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
    elsif v_kind = 'category_create' and v_key not in ('kind', 'business_id', 'name', 'position') then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
    elsif v_kind = 'category_update' and v_key not in ('kind', 'category_id', 'name', 'position') then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
    elsif v_kind = 'option_text' and v_key not in ('kind', 'option_id', 'name', 'description') then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
    end if;
  end loop;

  if v_kind = 'product_update' then
    if not (p_payload ?| array['name', 'description', 'category_id', 'image_url']) then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
    end if;
    update public.products
    set name = case when p_payload ? 'name' then p_payload->>'name' else name end,
        description = case when p_payload ? 'description' then nullif(p_payload->>'description', '') else description end,
        category_id = case when p_payload ? 'category_id' then (p_payload->>'category_id')::uuid else category_id end,
        image_url = case when p_payload ? 'image_url' then nullif(p_payload->>'image_url', '') else image_url end
    where id = v_product
      and business_id = v_business;
  elsif v_kind = 'category_create' then
    if length(btrim(coalesce(p_payload->>'name', ''))) = 0 then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
    end if;
    insert into public.categories (business_id, name, position)
    values (
      v_business,
      btrim(p_payload->>'name'),
      case when p_payload ? 'position' then (p_payload->>'position')::integer else null end
    );
  elsif v_kind = 'category_update' then
    if not (p_payload ?| array['name', 'position']) then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
    end if;
    update public.categories
    set name = case when p_payload ? 'name' then btrim(p_payload->>'name') else name end,
        position = case when p_payload ? 'position' then (p_payload->>'position')::integer else position end
    where id = v_category
      and business_id = v_business;
  else
    if not (p_payload ?| array['name', 'description']) then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
    end if;
    update public.customization_options
    set name = case when p_payload ? 'name' then btrim(p_payload->>'name') else name end,
        description = case when p_payload ? 'description' then nullif(p_payload->>'description', '') else description end
    where id = v_option
      and business_id = v_business;
  end if;

  return jsonb_build_object('ok', true);
exception
  when invalid_text_representation or not_null_violation or check_violation or foreign_key_violation then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
end;
$$;

revoke all on function commercial.promoter_apply_catalog(jsonb) from public, anon, authenticated, service_role;

create or replace function public.promoter_apply_catalog(p_payload jsonb)
returns jsonb
language sql
security definer
set search_path = pg_catalog, commercial
as $$
  select commercial.promoter_apply_catalog(p_payload);
$$;

revoke all on function public.promoter_apply_catalog(jsonb) from public, anon, service_role;
grant execute on function public.promoter_apply_catalog(jsonb) to authenticated;
