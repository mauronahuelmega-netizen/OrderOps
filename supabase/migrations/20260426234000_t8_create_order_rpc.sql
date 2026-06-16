-- T8: RPC create_order
-- Alcance:
-- - validar negocio activo
-- - validar datos obligatorios
-- - validar delivery_method
-- - validar address si delivery_method = delivery
-- - validar que los productos existan, esten disponibles y pertenezcan al negocio
-- - calcular total_price server-side
-- - crear order
-- - crear order_items con snapshot
-- - devolver order_id

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
  v_total_price numeric(12, 2);
  v_item_count integer;
  v_valid_item_count integer;
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

  with parsed_items as (
    select
      (item->>'product_id')::uuid as product_id,
      (item->>'quantity')::integer as quantity
    from jsonb_array_elements(p_items) as item
  )
  select count(*)
    into v_valid_item_count
  from parsed_items pi
  where pi.product_id is not null
    and pi.quantity > 0;

  if v_valid_item_count <> v_item_count then
    raise exception 'each item must include product_id and quantity > 0';
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

  with parsed_items as (
    select
      (item->>'product_id')::uuid as product_id,
      (item->>'quantity')::integer as quantity
    from jsonb_array_elements(p_items) as item
  )
  select coalesce(sum(p.price * pi.quantity), 0)::numeric(12, 2)
    into v_total_price
  from parsed_items pi
  join public.products p
    on p.id = pi.product_id
  where p.business_id = p_business_id
    and p.is_available = true;

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
    v_total_price,
    'pending'
  )
  returning id into v_order_id;

  with parsed_items as (
    select
      (item->>'product_id')::uuid as product_id,
      (item->>'quantity')::integer as quantity
    from jsonb_array_elements(p_items) as item
  )
  insert into public.order_items (
    order_id,
    product_id,
    product_name,
    unit_price,
    quantity
  )
  select
    v_order_id,
    p.id,
    p.name,
    p.price,
    pi.quantity
  from parsed_items pi
  join public.products p
    on p.id = pi.product_id
  where p.business_id = p_business_id
    and p.is_available = true;

  return v_order_id;
end;
$$;

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
