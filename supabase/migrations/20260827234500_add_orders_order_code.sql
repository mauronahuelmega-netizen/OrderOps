-- ADMIN-ORDERS-ORDER-CODE-SCHEMA-RPC-1
-- Add persistent public/operator order_code to public.orders.
-- Preserves UUID orders.id as internal primary key, foreign key target, routing key, and realtime mutation key.

-- 1. Helper function for generating 6-character uppercase unambiguous alphanumeric code
create or replace function public.generate_order_code()
returns text
language plpgsql
as $$
declare
  chars text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  result text := '';
  i integer;
begin
  for i in 1..6 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  end loop;
  return result;
end;
$$;

comment on function public.generate_order_code() is
  'Generates a 6-character random code from unambiguous uppercase alphanumeric alphabet (no 0, O, 1, I, L).';

-- 2. Add nullable column first
alter table public.orders
add column if not exists order_code text;

-- 3. Idempotent backfill of existing rows per business
do $$
declare
  r record;
  v_new_code text;
  v_exists boolean;
  v_retry_count integer;
begin
  for r in select id, business_id from public.orders where order_code is null loop
    v_retry_count := 0;
    loop
      v_new_code := public.generate_order_code();
      select exists(
        select 1
        from public.orders
        where business_id = r.business_id
          and order_code = v_new_code
      ) into v_exists;

      if not v_exists then
        exit;
      end if;

      v_retry_count := v_retry_count + 1;
      if v_retry_count > 50 then
        raise exception 'failed to backfill unique order_code for order %', r.id;
      end if;
    end loop;

    update public.orders
    set order_code = v_new_code
    where id = r.id;
  end loop;
end;
$$;

-- 4. Enforce NOT NULL and format constraint
alter table public.orders
alter column order_code set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_order_code_format_chk'
  ) then
    alter table public.orders
    add constraint orders_order_code_format_chk
    check (order_code ~ '^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$');
  end if;
end;
$$;

-- 5. Per-business unique index
create unique index if not exists orders_business_order_code_uidx
on public.orders (business_id, order_code);

-- 6. Update authoritative create_order RPC to generate order_code inside transaction
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
  v_order_code text;
  v_code_exists boolean;
  v_code_retry integer := 0;
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
  v_demand_qty integer;
  v_current_stock integer;
  v_stock_before_map jsonb := '{}'::jsonb;
  v_stock_before_item integer;
  v_stock_after_item integer;
  v_ledger_item record;
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

  -- STOCK-DECREMENT-ORDER-1: aggregate demand, lock tracked rows, validate stock.
  -- Also capture stock_before per product for ledger running balances.
  for v_product_id, v_demand_qty, v_current_stock in
    select
      d.product_id,
      d.total_qty,
      p.stock
    from (
      select
        (item->>'product_id')::uuid as product_id,
        sum((item->>'quantity')::integer)::integer as total_qty
      from jsonb_array_elements(p_items) as item
      where coalesce(nullif(item->>'item_kind', ''), 'product') in ('product', 'upsell')
      group by 1
    ) d
    join public.products p
      on p.id = d.product_id
     and p.business_id = p_business_id
     and p.track_stock = true
    order by d.product_id
    for update of p
  loop
    if v_current_stock < v_demand_qty then
      raise exception 'INSUFFICIENT_STOCK';
    end if;

    v_stock_before_map := v_stock_before_map
      || jsonb_build_object(v_product_id::text, v_current_stock);
  end loop;

  -- Generate unique order_code for business (up to 5 retries)
  v_code_retry := 0;
  loop
    v_order_code := public.generate_order_code();
    select exists (
      select 1
      from public.orders
      where business_id = p_business_id
        and order_code = v_order_code
    ) into v_code_exists;

    if not v_code_exists then
      exit;
    end if;

    v_code_retry := v_code_retry + 1;
    if v_code_retry >= 5 then
      raise exception 'failed to generate unique order code';
    end if;
  end loop;

  insert into public.orders (
    business_id,
    order_code,
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
    v_order_code,
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

  -- STOCK-DECREMENT-ORDER-1: decrement tracked stock in the same transaction.
  update public.products p
  set
    stock = p.stock - d.total_qty,
    is_available = case
      when (p.stock - d.total_qty) <= 0 then false
      else p.is_available
    end
  from (
    select
      (item->>'product_id')::uuid as product_id,
      sum((item->>'quantity')::integer)::integer as total_qty
    from jsonb_array_elements(p_items) as item
    where coalesce(nullif(item->>'item_kind', ''), 'product') in ('product', 'upsell')
    group by 1
  ) d
  where p.id = d.product_id
    and p.business_id = p_business_id
    and p.track_stock = true;

  -- STOCK-DECREMENT-LEDGER-1: one order_decrement per tracked order_item (running stock).
  for v_ledger_item in
    select
      oi.id as order_item_id,
      oi.product_id,
      oi.quantity,
      oi.item_kind,
      oi.parent_order_item_id
    from public.order_items oi
    join public.products p
      on p.id = oi.product_id
     and p.business_id = p_business_id
     and p.track_stock = true
    where oi.order_id = v_order_id
      and oi.product_id is not null
      and oi.quantity > 0
    order by
      case when oi.item_kind = 'product' then 0 else 1 end,
      oi.id
  loop
    v_stock_before_item := (v_stock_before_map ->> v_ledger_item.product_id::text)::integer;

    if v_stock_before_item is null then
      raise exception 'tracked product missing stock_before for ledger';
    end if;

    v_stock_after_item := v_stock_before_item - v_ledger_item.quantity;

    insert into public.stock_movements (
      business_id,
      product_id,
      order_id,
      order_item_id,
      movement_type,
      quantity_delta,
      stock_before,
      stock_after,
      reason,
      metadata,
      created_by
    )
    values (
      p_business_id,
      v_ledger_item.product_id,
      v_order_id,
      v_ledger_item.order_item_id,
      'order_decrement',
      -v_ledger_item.quantity,
      v_stock_before_item,
      v_stock_after_item,
      'order_create',
      jsonb_strip_nulls(
        jsonb_build_object(
          'source', 'create_order',
          'item_kind', v_ledger_item.item_kind,
          'parent_order_item_id', v_ledger_item.parent_order_item_id
        )
      ),
      null
    );

    v_stock_before_map := jsonb_set(
      v_stock_before_map,
      array[v_ledger_item.product_id::text],
      to_jsonb(v_stock_after_item),
      true
    );
  end loop;

  return v_order_id;
end;
$$;

comment on function public.create_order(
  uuid, text, text, date, text, text, text, jsonb
) is
  'ADMIN-ORDERS-ORDER-CODE-SCHEMA-RPC-1: creates orders + order_items with 6-char order_code; validates/decrements track_stock=true; records stock_movements.order_decrement per tracked order_item.';

grant execute on function public.create_order(
  uuid,
  text,
  text,
  date,
  text,
  text,
  text,
  jsonb
) to anon, authenticated;
