-- PREPARED ONLY. All writes roll back. Runner MUST verify isolated Docker resources first.
begin;
set local lock_timeout='5s';
set local statement_timeout='45s';
do $$ begin
  if current_setting('statistics.test_token',true) is distinct from
    (select token from statistics_test_environment.identity where singleton) then
    raise exception 'ISOLATED_TOKEN_REQUIRED'; end if;
  if to_regclass('public.order_statistics_completions') is null then raise exception 'REVIEWED_MIGRATIONS_REQUIRED'; end if;
end $$;
create function pg_temp.assert_true(ok boolean,message text) returns void language plpgsql as $$ begin
  if ok is distinct from true then raise exception 'ASSERT: %',message; end if;
end $$;
create temporary table statistics_fixture as
select b.id business_id,p.id owner_id from public.businesses b join public.profiles p on p.business_id=b.id and p.role='owner' where b.slug='statistics-synthetic-a';
select pg_temp.assert_true((select count(*)=1 from statistics_fixture),'exact synthetic business');
grant select on statistics_fixture to authenticated;
insert into public.categories(id,business_id,name) select 'f2020000-0000-4000-8000-000000000001',business_id,'Synthetic historical category' from statistics_fixture;
insert into public.products(id,business_id,category_id,name,price) select 'f2020000-0000-4000-8000-000000000002',business_id,'f2020000-0000-4000-8000-000000000001','Synthetic main',10 from statistics_fixture;
insert into public.products(id,business_id,category_id,name,price) select 'f2020000-0000-4000-8000-000000000003',business_id,'f2020000-0000-4000-8000-000000000001','Synthetic upsell',3 from statistics_fixture;
insert into public.store_sessions(id,business_id,opened_at) select 'f2020000-0000-4000-8000-000000000004',business_id,date_trunc('day',clock_timestamp() at time zone 'America/Argentina/Buenos_Aires') at time zone 'America/Argentina/Buenos_Aires'-interval '1 hour' from statistics_fixture;
insert into public.orders(id,business_id,customer_name,phone,delivery_date,delivery_method,total_price,composition_status)
select 'f2020000-0000-4000-8000-000000000005',business_id,'SYNTHETIC ONLY','0000000000',current_date,'pickup',23,'itemized' from statistics_fixture;
insert into public.order_items(id,order_id,product_id,product_name,quantity,unit_price)
values('f2020000-0000-4000-8000-000000000006','f2020000-0000-4000-8000-000000000005','f2020000-0000-4000-8000-000000000002','Synthetic main',2,10);
insert into public.order_items(id,order_id,product_id,product_name,quantity,unit_price,item_kind,parent_order_item_id)
values('f2020000-0000-4000-8000-000000000007','f2020000-0000-4000-8000-000000000005','f2020000-0000-4000-8000-000000000003','Synthetic upsell',1,3,'upsell','f2020000-0000-4000-8000-000000000006');
insert into public.order_financials(order_id,business_id,agreed_total) select 'f2020000-0000-4000-8000-000000000005',business_id,23 from statistics_fixture;
insert into public.finance_audit_events(business_id,actor_id,event_type,entity_type,entity_id,payload)
select business_id,owner_id,'order_financials_initialized','order_financials','f2020000-0000-4000-8000-000000000005','{"mode":"copy_total_price","agreed_total":23}'::jsonb from statistics_fixture;
select pg_temp.assert_true(not exists(select 1 from public.order_statistics_completions where order_id='f2020000-0000-4000-8000-000000000005'),'insert is not completion evidence');
update public.orders set status='completed' where id='f2020000-0000-4000-8000-000000000005';
select pg_temp.assert_true((select active and cycle=1 and agreed_total=23 and products_net=23 and delivery=0 and main_units=2 and date_kind='verified_session' and commercial_date=(session_opened_at at time zone timezone)::date from public.order_statistics_completions where order_id='f2020000-0000-4000-8000-000000000005'),'atomic completion/main units/night session');
select pg_temp.assert_true((select count(*)=2 and sum(net_amount)=23 from public.order_statistics_completion_items where completion_id=(select id from public.order_statistics_completions where order_id='f2020000-0000-4000-8000-000000000005' and active)),'upsell identity and money once');
update public.orders set status='completed' where id='f2020000-0000-4000-8000-000000000005';
select pg_temp.assert_true((select count(*)=1 from public.order_statistics_completions where order_id='f2020000-0000-4000-8000-000000000005'),'idempotent same status');
update public.categories set name='Synthetic renamed' where id='f2020000-0000-4000-8000-000000000001';
select pg_temp.assert_true((select bool_and(category_name='Synthetic historical category') from public.order_statistics_completion_items where completion_id=(select id from public.order_statistics_completions where order_id='f2020000-0000-4000-8000-000000000005' and active)),'frozen category');
select set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true) from statistics_fixture;
set local role authenticated;
select pg_temp.assert_true((public.statistics_v1_summary('today')->'metrics'->'sales'->>'value')::numeric=23,'invoker/RLS RPC total');
select pg_temp.assert_true((public.statistics_v1_summary('today')->'metrics'->'mainUnits'->>'value')::bigint=2,'main units only');
reset role;
savepoint rollback_cycle;
update public.orders set status='in_progress' where id='f2020000-0000-4000-8000-000000000005';
select pg_temp.assert_true(not exists(select 1 from public.order_statistics_completions where order_id='f2020000-0000-4000-8000-000000000005' and active),'reopening excludes');
update public.orders set status='completed' where id='f2020000-0000-4000-8000-000000000005';
select pg_temp.assert_true((select count(*)=2 and max(cycle)=2 from public.order_statistics_completions where order_id='f2020000-0000-4000-8000-000000000005'),'new completion new cycle');
rollback to rollback_cycle;
select pg_temp.assert_true((select count(*)=1 and bool_and(active) from public.order_statistics_completions where order_id='f2020000-0000-4000-8000-000000000005'),'source and snapshot rollback together');
update public.order_financials set agreed_total=20 where order_id='f2020000-0000-4000-8000-000000000005';
select pg_temp.assert_true((select monetary_conflict and agreed_total=23 from public.order_statistics_completions where order_id='f2020000-0000-4000-8000-000000000005' and active),'agreement mutation explicit; immutable amount');
update public.orders set status='in_progress' where id='f2020000-0000-4000-8000-000000000005';
update public.orders set status='completed' where id='f2020000-0000-4000-8000-000000000005';
select pg_temp.assert_true((select breakdown_source='unresolved' and products_net is null and delivery is null and agreed_total=20 from public.order_statistics_completions where order_id='f2020000-0000-4000-8000-000000000005' and active),'unexplained difference never silently allocated');
select set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true) from statistics_fixture;
set local role authenticated;
select pg_temp.assert_true(public.statistics_v1_summary('today')->'metrics'->'sales'->>'value' is null,'unknown is not zero');
select pg_temp.assert_true((public.statistics_v1_summary('today')->'unattributed'->>'pendingAgreedTotal')::numeric=20,'pending authority is current agreement');
reset role;
update public.order_items set quantity=3 where id='f2020000-0000-4000-8000-000000000006';
select pg_temp.assert_true((select composition_conflict from public.order_statistics_completions where order_id='f2020000-0000-4000-8000-000000000005' and active),'post-completion source conflict');
update public.orders set status='cancelled' where id='f2020000-0000-4000-8000-000000000005';
select pg_temp.assert_true(not exists(select 1 from public.order_statistics_completions where order_id='f2020000-0000-4000-8000-000000000005' and active),'cancel excludes');
update public.store_sessions set status='closed',closed_at=clock_timestamp() where id='f2020000-0000-4000-8000-000000000004';
update public.orders set status='completed' where id='f2020000-0000-4000-8000-000000000005';
select pg_temp.assert_true((select date_kind='outside_session' and session_key is null and commercial_date=(completed_at at time zone timezone)::date from public.order_statistics_completions where order_id='f2020000-0000-4000-8000-000000000005' and active),'explicit outside-session fallback');
insert into public.orders(business_id,customer_name,phone,delivery_date,delivery_method,total_price,status,composition_status)
select business_id,'Synthetic historical unknown','0000000000',current_date,'pickup',0,'completed','legacy_unknown' from statistics_fixture;
select set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true) from statistics_fixture;
set local role authenticated;
select pg_temp.assert_true((public.statistics_v1_summary('today')->'coverage'->>'historicalWithoutDate')::bigint=1,'no inferred backfill');
select pg_temp.assert_true(public.statistics_v1_summary('today')->'comparison'->>'available'='false','unknown historical coverage prevents exact comparison');
reset role;
-- Force ONLY our deferred constraints after operational work; never SET CONSTRAINTS ALL in a writer.
set constraints statistics_v1_order_revision,statistics_v1_item_revision,statistics_v1_financial_revision,statistics_v1_session_revision immediate;
select pg_temp.assert_true((select revision>1 from public.business_statistics_state where business_id=(select business_id from statistics_fixture)),'revision deferred and transactional');
rollback;
