-- Exact recovery of ONLY the failed stock test fixture; no reset or schema changes.
begin;
do $$ begin if current_setting('statistics.test_token',true) is distinct from (select token from statistics_test_environment.identity where singleton) then raise exception 'ISOLATED_TOKEN_REQUIRED';end if;
perform set_config('request.jwt.claims',(select jsonb_build_object('sub',p.id,'role','authenticated')::text from public.profiles p join public.businesses b on b.id=p.business_id where b.slug='statistics-synthetic-a' and p.role='owner'),true);end $$;
create temporary table stock_recovery_orders as select distinct o.id from public.orders o join public.order_items i on i.order_id=o.id join public.businesses b on b.id=o.business_id where b.slug='statistics-synthetic-a' and o.customer_name like 'SYNTHETIC STOCK CONCURRENCY%' and i.product_id='f2050000-0000-4000-8000-000000000002';
delete from public.stock_movements where order_id in(select id from stock_recovery_orders) and product_id='f2050000-0000-4000-8000-000000000002';
delete from public.orders where id in(select id from stock_recovery_orders);
delete from public.products where id='f2050000-0000-4000-8000-000000000002' and business_id=(select id from public.businesses where slug='statistics-synthetic-a');
delete from public.categories where id='f2050000-0000-4000-8000-000000000001' and business_id=(select id from public.businesses where slug='statistics-synthetic-a');
commit;
