-- PRODUCT-STOCK-RESTOCK-CANCEL-1
-- Transactional order status transition with idempotent cancel restock via stock_movements.
-- Restocks only when prior order_decrement exists and order_restock does not.
-- Does NOT modify create_order. Does NOT alter stock_movements schema. Does NOT backfill.

create or replace function public.transition_order_status(
  p_order_id uuid,
  p_target_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_old_status text;
  v_caller_ok boolean := false;
  v_decrement record;
  v_product_ids uuid[] := '{}'::uuid[];
  v_running_stock jsonb := '{}'::jsonb;
  v_stock_before integer;
  v_stock_after integer;
  v_restore_qty integer;
  v_restocked_count integer := 0;
  v_product_id uuid;
  v_final_stock integer;
begin
  if p_order_id is null then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if p_target_status is null
     or p_target_status not in ('pending', 'preparing', 'ready', 'completed', 'cancelled') then
    raise exception 'INVALID_ORDER_STATUS';
  end if;

  select *
  into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        p.role = 'super_admin'
        or (
          p.business_id = v_order.business_id
          and coalesce(p.role::text, '') <> 'viewer'
        )
      )
  )
  into v_caller_ok;

  if not v_caller_ok then
    raise exception 'ORDER_BUSINESS_MISMATCH';
  end if;

  v_old_status := v_order.status;

  if v_old_status = p_target_status then
    return jsonb_build_object(
      'changed', false,
      'order_id', v_order.id,
      'previous_status', v_old_status,
      'status', v_old_status,
      'restocked_items', 0
    );
  end if;

  -- Restock only for cancel from operational (non-completed) statuses,
  -- and only for ledger-backed order_decrement rows without order_restock.
  if p_target_status = 'cancelled'
     and v_old_status in ('pending', 'preparing', 'ready') then
    select coalesce(array_agg(distinct sm.product_id order by sm.product_id), '{}'::uuid[])
    into v_product_ids
    from public.stock_movements sm
    join public.products p
      on p.id = sm.product_id
     and p.business_id = v_order.business_id
    where sm.order_id = v_order.id
      and sm.business_id = v_order.business_id
      and sm.movement_type = 'order_decrement'
      and sm.order_item_id is not null
      and sm.product_id is not null
      and p.track_stock = true
      and not exists (
        select 1
        from public.stock_movements r
        where r.order_item_id = sm.order_item_id
          and r.movement_type = 'order_restock'
      );

    if coalesce(array_length(v_product_ids, 1), 0) > 0 then
      for v_product_id in
        select p.id
        from public.products p
        where p.id = any (v_product_ids)
          and p.business_id = v_order.business_id
        order by p.id
        for update
      loop
        select p.stock
        into v_stock_before
        from public.products p
        where p.id = v_product_id;

        v_running_stock := jsonb_set(
          v_running_stock,
          array[v_product_id::text],
          to_jsonb(coalesce(v_stock_before, 0))
        );
      end loop;

      for v_decrement in
        select
          sm.id as decrement_movement_id,
          sm.product_id,
          sm.order_item_id,
          sm.quantity_delta
        from public.stock_movements sm
        join public.products p
          on p.id = sm.product_id
         and p.business_id = v_order.business_id
        where sm.order_id = v_order.id
          and sm.business_id = v_order.business_id
          and sm.movement_type = 'order_decrement'
          and sm.order_item_id is not null
          and sm.product_id is not null
          and p.track_stock = true
          and not exists (
            select 1
            from public.stock_movements r
            where r.order_item_id = sm.order_item_id
              and r.movement_type = 'order_restock'
          )
        order by sm.created_at asc, sm.order_item_id asc
      loop
        v_restore_qty := abs(v_decrement.quantity_delta);
        v_stock_before := (v_running_stock ->> v_decrement.product_id::text)::integer;
        v_stock_after := v_stock_before + v_restore_qty;

        begin
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
          ) values (
            v_order.business_id,
            v_decrement.product_id,
            v_order.id,
            v_decrement.order_item_id,
            'order_restock',
            v_restore_qty,
            v_stock_before,
            v_stock_after,
            'order_cancel',
            jsonb_build_object(
              'source', 'transition_order_status',
              'previous_status', v_old_status,
              'target_status', 'cancelled',
              'decrement_movement_id', v_decrement.decrement_movement_id
            ),
            null
          );
        exception
          when unique_violation then
            raise exception 'RESTOCK_CONFLICT';
        end;

        v_running_stock := jsonb_set(
          v_running_stock,
          array[v_decrement.product_id::text],
          to_jsonb(v_stock_after)
        );
        v_restocked_count := v_restocked_count + 1;
      end loop;

      for v_product_id in
        select unnest(v_product_ids)
        order by 1
      loop
        v_final_stock := (v_running_stock ->> v_product_id::text)::integer;

        update public.products
        set
          stock = v_final_stock,
          is_available = case
            when v_final_stock > 0 then true
            else is_available
          end
        where id = v_product_id
          and business_id = v_order.business_id;
      end loop;
    end if;
  end if;

  update public.orders
  set status = p_target_status
  where id = v_order.id
    and business_id = v_order.business_id;

  return jsonb_build_object(
    'changed', true,
    'order_id', v_order.id,
    'previous_status', v_old_status,
    'status', p_target_status,
    'restocked_items', v_restocked_count
  );
end;
$$;

comment on function public.transition_order_status(uuid, text) is
  'Atomically transitions order status. On cancel from pending/preparing/ready, restocks only items with prior stock_movements.order_decrement and no order_restock.';

revoke all on function public.transition_order_status(uuid, text) from public;
grant execute on function public.transition_order_status(uuid, text) to authenticated;
