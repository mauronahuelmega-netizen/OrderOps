-- Bounded synthetic test: 200 orders, one transaction, no load generator; always rolled back.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
do $$ begin
  if current_setting('statistics.test_token',true) is distinct from
    (select token from statistics_test_environment.identity where singleton) then raise exception 'ISOLATED_TOKEN_REQUIRED';end if;
end $$;
create function pg_temp.assert_true(ok boolean,message text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'ASSERT: %',message;end if;end $$;
create temporary table perf_context as
select b.id business_id,p.id actor from public.businesses b join public.profiles p on p.business_id=b.id
where b.slug='statistics-synthetic-a' and p.role='owner';
select pg_temp.assert_true((select count(*)=1 from perf_context),'one synthetic owner');
do $$ begin perform set_config('request.jwt.claims',(select jsonb_build_object('sub',actor,'role','authenticated')::text from perf_context),true);end $$;
create temporary table perf_orders as select gen_random_uuid() id,n from generate_series(1,200) n;
insert into public.orders(id,business_id,customer_name,phone,delivery_date,delivery_method,total_price,composition_status,order_code)
select o.id,c.business_id,'SYNTHETIC P03-B PERFORMANCE','0000000000',current_date,'pickup',10,'itemized',
  'P3B'||substr('23456789',1+o.n/64,1)||substr('23456789',1+(o.n/8)%8,1)||substr('23456789',1+o.n%8,1)
  from perf_orders o cross join perf_context c;
insert into public.order_items(order_id,product_name,quantity,unit_price)
select id,'Synthetic performance main',1,10 from perf_orders;
insert into public.order_financials(order_id,business_id,agreed_total)
select o.id,c.business_id,10 from perf_orders o cross join perf_context c;
insert into public.finance_audit_events(business_id,actor_id,event_type,entity_type,entity_id,payload)
select c.business_id,c.actor,'order_financials_initialized','order_financials',o.id,'{"mode":"copy_total_price","agreed_total":10}'::jsonb from perf_orders o cross join perf_context c;
update public.orders set status='completed' where id in (select id from perf_orders);
set constraints statistics_v1_order_revision,statistics_v1_item_revision,statistics_v1_financial_revision immediate;
select pg_temp.assert_true((select count(*)=200 from public.order_statistics_completions where order_id in(select id from perf_orders) and active),'200 captured synthetic completions');
set local role authenticated;
do $$ declare a jsonb;b jsonb;begin
  select private.statistics_v1_summary_base('today'),public.statistics_v1_summary('today') into a,b;
  perform pg_temp.assert_true(b-'series'=a,'nonempty bounded-cohort legacy equality');
  perform pg_temp.assert_true(b#>>'{metrics,sales,value}'='2000.00','exact cohort money');
  perform pg_temp.assert_true((b#>>'{metrics,mainUnits,value}')::numeric=200,'exact main units');
  perform pg_temp.assert_true(jsonb_array_length(b#>'{series,points}')<=200,'point limit');
  perform pg_temp.assert_true((select sum((p#>>'{current,metrics,completedOrders,value}')::numeric)=200 from jsonb_array_elements(b#>'{series,points}') p),'point conservation');
end $$;
explain (analyze,buffers,format json) select public.statistics_v1_summary('today');
explain (analyze,buffers,format json) select public.statistics_v1_summary('last_7_days');
explain (analyze,buffers,format json) select public.statistics_v1_summary('last_30_days');
reset role;
rollback;
