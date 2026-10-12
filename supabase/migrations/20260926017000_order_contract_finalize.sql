-- Apply only with nullable-aware OrderOps code deployed. delivery_time is intentionally untouched.

do $$
begin
  if exists (
    select 1
    from public.orders
    where composition_status <> 'itemized'
       or total_price is null
  ) then
    raise exception 'Cannot finalize order contract: existing orders are not itemized with totals';
  end if;
end;
$$;

alter table public.orders
  alter column total_price drop not null;

alter table public.orders
  drop constraint if exists orders_total_price_non_negative;

alter table public.orders
  add constraint orders_total_price_non_negative
    check (total_price is null or total_price >= 0),
  add constraint orders_composition_total_contract_chk
    check (
      (composition_status = 'itemized' and total_price is not null)
      or (composition_status = 'legacy_unknown' and total_price is null)
    );
