-- PRODUCT-CUSTOMIZATION-ORDER-1
-- Evolve create_order for customization_snapshot + upsell child rows.
-- Backward-compatible: legacy p_items [{product_id, quantity}] unchanged.
-- Does NOT activate feature flags. Does NOT alter RLS.

create or replace function public.create_order(
  p_business_id uuid,
  p_customer_name text,
  p_phone text,
  p_delivery_date date,
  p_delivery_method text,
  p_address text default null,
  p_notes text default null,
  p_items jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_total_price numeric(12, 2) := 0;
  v_item_count integer;
  v_valid_item_count integer;
  v_scheduled_mode_active boolean;
  v_min_lead_hours integer;
  v_max_days_in_advance integer;
  v_cutoff_time time;
  v_inactive_days integer[];
  v_earliest_delivery_date date;
  v_item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_item_kind text;
  v_client_line_id text;
  v_parent_client_line_id text;
  v_snapshot jsonb;
  v_unit_price numeric(12, 2);
  v_product_name text;
  v_product_base_price numeric(12, 2);
  v_parent_order_item_id uuid;
  v_inserted_order_item_id uuid;
  v_line_map jsonb := '{}'::jsonb;
begin
  if p_business_id is null then
    raise exception 'business_id is required';
  end if;

  if p_customer_name is null or char_length(trim(p_customer_name)) = 0 then
    raise exception 'customer_name is required';
  end if;

  if p_phone is null or char_length(trim(p_phone)) = 0 then
    raise exception 'phone is required';
  end if;

  if p_delivery_date is null then
    raise exception 'delivery_date is required';
  end if;

  if p_delivery_method is null or p_delivery_method not in ('delivery', 'pickup') then
    raise exception 'delivery_method must be delivery or pickup';
  end if;

  if p_delivery_method = 'delivery'
     and char_length(trim(coalesce(p_address, ''))) = 0 then
    raise exception 'address is required when delivery_method is delivery';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'items must be a json array';
  end if;

  select jsonb_array_length(p_items)
    into v_item_count;

  if v_item_count = 0 then
    raise exception 'items must not be empty';
  end if;

  if not exists (
    select 1
    from public.businesses b
    where b.id = p_business_id
      and b.is_active = true
  ) then
    raise exception 'business not found or inactive';
  end if;

  if not exists (
    select 1
    from public.business_settings bs
    where bs.business_id = p_business_id
      and bs.on_demand_mode_active = true
  ) then
    raise exception 'on_demand_mode is not active for this business';
  end if;

  select
    coalesce(bs.scheduled_mode_active, false),
    coalesce(bs.scheduled_min_lead_time_hours, 24),
    coalesce(bs.scheduled_max_days_in_advance, 30),
    coalesce(bs.scheduled_cutoff_time, time '18:00'),
    coalesce(bs.inactive_working_days, '{}'::integer[])
  into
    v_scheduled_mode_active,
    v_min_lead_hours,
    v_max_days_in_advance,
    v_cutoff_time,
    v_inactive_days
  from public.business_settings bs
  where bs.business_id = p_business_id;

  if not found then
    v_scheduled_mode_active := false;
    v_min_lead_hours := 24;
    v_max_days_in_advance := 30;
    v_cutoff_time := time '18:00';
    v_inactive_days := '{}'::integer[];
  end if;

  if p_delivery_date < current_date then
    raise exception 'delivery_date cannot be in the past';
  end if;

  if p_delivery_date > current_date and not v_scheduled_mode_active then
    raise exception 'scheduled_mode is not active for this business';
  end if;

  if v_scheduled_mode_active then
    if extract(dow from p_delivery_date)::integer = any (v_inactive_days) then
      raise exception 'delivery_date falls on a non-operating day';
    end if;

    v_earliest_delivery_date := (now() + make_interval(hours => v_min_lead_hours))::date;

    if p_delivery_date < v_earliest_delivery_date then
      raise exception 'delivery_date does not meet minimum lead time';
    end if;

    if p_delivery_date = current_date + 1
       and current_time >= v_cutoff_time then
      raise exception 'delivery_date is past cutoff for next-day orders';
    end if;

    if p_delivery_date > current_date + v_max_days_in_advance then
      raise exception 'delivery_date exceeds maximum advance window';
    end if;
  end if;

  -- Validate shape + product ownership for every item (parents and upsells).
  with parsed_items as (
    select
      (item->>'product_id')::uuid as product_id,
      (item->>'quantity')::integer as quantity,
      coalesce(nullif(item->>'item_kind', ''), 'product') as item_kind
    from jsonb_array_elements(p_items) as item
  )
  select count(*)
    into v_valid_item_count
  from parsed_items pi
  where pi.product_id is not null
    and pi.quantity > 0
    and pi.item_kind in ('product', 'upsell');

  if v_valid_item_count <> v_item_count then
    raise exception 'each item must include product_id, quantity > 0, and valid item_kind';
  end if;

  with parsed_items as (
    select
      (item->>'product_id')::uuid as product_id,
      (item->>'quantity')::integer as quantity
    from jsonb_array_elements(p_items) as item
  )
  select count(*)
    into v_valid_item_count
  from parsed_items pi
  join public.products p
    on p.id = pi.product_id
  where p.business_id = p_business_id
    and p.is_available = true;

  if v_valid_item_count <> v_item_count then
    raise exception 'items contain invalid, unavailable, or foreign-business products';
  end if;

  -- Upsell rows must reference a parent_client_line_id present in the same payload.
  if exists (
    select 1
    from jsonb_array_elements(p_items) as item
    where coalesce(nullif(item->>'item_kind', ''), 'product') = 'upsell'
      and (
        nullif(item->>'parent_client_line_id', '') is null
        or not exists (
          select 1
          from jsonb_array_elements(p_items) as parent
          where coalesce(nullif(parent->>'item_kind', ''), 'product') = 'product'
            and nullif(parent->>'client_line_id', '') = item->>'parent_client_line_id'
        )
      )
  ) then
    raise exception 'upsell items require a valid parent_client_line_id';
  end if;

  insert into public.orders (
    business_id,
    customer_name,
    phone,
    delivery_date,
    delivery_method,
    address,
    notes,
    total_price,
    status
  )
  values (
    p_business_id,
    trim(p_customer_name),
    trim(p_phone),
    p_delivery_date,
    p_delivery_method,
    nullif(trim(coalesce(p_address, '')), ''),
    nullif(trim(coalesce(p_notes, '')), ''),
    0,
    'pending'
  )
  returning id into v_order_id;

  -- Pass 1: insert product parents (legacy + customized).
  for v_item in
    select value
    from jsonb_array_elements(p_items) as t(value)
    where coalesce(nullif(value->>'item_kind', ''), 'product') = 'product'
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    v_client_line_id := nullif(v_item->>'client_line_id', '');
    v_snapshot := case
      when v_item ? 'customization_snapshot'
           and jsonb_typeof(v_item->'customization_snapshot') = 'object'
        then v_item->'customization_snapshot'
      else null
    end;

    select p.name, p.price
      into v_product_name, v_product_base_price
    from public.products p
    where p.id = v_product_id
      and p.business_id = p_business_id
      and p.is_available = true;

    if not found then
      raise exception 'items contain invalid, unavailable, or foreign-business products';
    end if;

    if v_snapshot is not null then
      v_unit_price := coalesce(
        nullif(v_item->>'unit_price', '')::numeric,
        nullif(v_snapshot->'pricing'->>'final_unit_price', '')::numeric,
        v_product_base_price
      );
      if v_unit_price < v_product_base_price then
        raise exception 'customized unit_price cannot be below product base price';
      end if;
    else
      v_unit_price := v_product_base_price;
    end if;

    insert into public.order_items (
      order_id,
      product_id,
      product_name,
      unit_price,
      quantity,
      item_kind,
      parent_order_item_id,
      customization_snapshot
    )
    values (
      v_order_id,
      v_product_id,
      v_product_name,
      v_unit_price,
      v_quantity,
      'product',
      null,
      v_snapshot
    )
    returning id into v_inserted_order_item_id;

    if v_client_line_id is not null then
      v_line_map := v_line_map || jsonb_build_object(v_client_line_id, v_inserted_order_item_id);
    end if;

    v_total_price := v_total_price + (v_unit_price * v_quantity);
  end loop;

  -- Pass 2: insert upsell children.
  for v_item in
    select value
    from jsonb_array_elements(p_items) as t(value)
    where coalesce(nullif(value->>'item_kind', ''), 'product') = 'upsell'
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    v_parent_client_line_id := nullif(v_item->>'parent_client_line_id', '');

    if v_parent_client_line_id is null or not (v_line_map ? v_parent_client_line_id) then
      raise exception 'upsell items require a valid parent_client_line_id';
    end if;

    v_parent_order_item_id := (v_line_map->>v_parent_client_line_id)::uuid;

    select p.name, p.price
      into v_product_name, v_product_base_price
    from public.products p
    where p.id = v_product_id
      and p.business_id = p_business_id
      and p.is_available = true;

    if not found then
      raise exception 'items contain invalid, unavailable, or foreign-business products';
    end if;

    v_unit_price := v_product_base_price;

    insert into public.order_items (
      order_id,
      product_id,
      product_name,
      unit_price,
      quantity,
      item_kind,
      parent_order_item_id,
      customization_snapshot
    )
    values (
      v_order_id,
      v_product_id,
      v_product_name,
      v_unit_price,
      v_quantity,
      'upsell',
      v_parent_order_item_id,
      null
    );

    v_total_price := v_total_price + (v_unit_price * v_quantity);
  end loop;

  update public.orders
  set total_price = v_total_price
  where id = v_order_id;

  return v_order_id;
end;
$$;

comment on function public.create_order(
  uuid, text, text, date, text, text, text, jsonb
) is
  'ORDER-1: creates orders + order_items. Legacy items {product_id,quantity}. Customized parents may include client_line_id, unit_price, customization_snapshot. Upsells use item_kind=upsell + parent_client_line_id.';
