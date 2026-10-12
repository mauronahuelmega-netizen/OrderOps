begin;
set local statement_timeout='45s';
do $$ begin
  if current_setting('statistics.test_token',true) is distinct from (select token from statistics_test_environment.identity where singleton) then raise exception 'ISOLATED_TOKEN_REQUIRED'; end if;
end $$;
create function pg_temp.assert_true(ok boolean,message text) returns void language plpgsql as $$ begin if ok is distinct from true then raise exception 'ASSERT: %',message; end if; end $$;
select pg_temp.assert_true(private.statistics_allocate_products(0.03,'[{"id":"a","gross":"0.02"},{"id":"b","gross":"0.02"}]')->0->>'net'='0.02','deterministic residual cents');
select pg_temp.assert_true(private.statistics_allocate_products(27,'[{"id":"a","gross":"10"},{"id":"b","gross":"20"}]')='[{"id":"a","net":"9.00"},{"id":"b","net":"18.00"}]'::jsonb,'identified discount only');
select pg_temp.assert_true(private.statistics_local_cutoff('2026-03-08','02:30:00','America/New_York') is null,'DST gap');
select pg_temp.assert_true(private.statistics_local_cutoff('2026-11-01','01:30:00','America/New_York') is null,'DST repeat');
select pg_temp.assert_true(private.statistics_metrics('[]',1)->'sales'->>'value' is null,'unknown coverage is not zero');
select pg_temp.assert_true(private.statistics_metrics('[]',0)->'sales'->>'value'='0.00','verified empty is zero');
do $$ declare bad jsonb; failed boolean; begin
  foreach bad in array array['null'::jsonb,'[{"id":"a"}]','[{"id":"a","gross":"Infinity"}]','[{"id":"a","gross":"-1"}]','[{"id":"a","gross":"1"},{"id":"a","gross":"2"}]'] loop
    failed:=false;begin perform private.statistics_allocate_products(1,bad);exception when others then failed:=true;end;
    perform pg_temp.assert_true(failed,'invalid allocation rejected');
  end loop;
end $$;
create temporary table statistics_role_cases as select p.id,p.role,p.business_id from public.profiles p join public.businesses b on b.id=p.business_id where b.slug in ('statistics-synthetic-a','statistics-synthetic-b');
-- Nonempty rows in all five protected structures for BOTH tenants: avoid vacuous RLS tests.
do $$ declare b uuid;o uuid;s uuid;begin
  for b in select distinct business_id from statistics_role_cases loop
    s:=gen_random_uuid();o:=gen_random_uuid();
    insert into public.store_sessions(id,business_id,opened_at) values(s,b,clock_timestamp()-interval '1 hour');
    insert into public.orders(id,business_id,customer_name,phone,delivery_date,delivery_method,total_price,composition_status) values(o,b,'SYNTHETIC RLS','0000000000',current_date,'pickup',23,'itemized');
    insert into public.order_items(order_id,product_name,quantity,unit_price) values(o,'Synthetic unknown identity',1,23);
    insert into public.order_financials(order_id,business_id,agreed_total) values(o,b,23);
    update public.orders set status='completed' where id=o;
  end loop;
end $$;
set constraints statistics_v1_order_revision,statistics_v1_item_revision,statistics_v1_financial_revision,statistics_v1_session_revision immediate;
grant select on statistics_role_cases to authenticated;
set local role authenticated;
do $$ declare p record; response jsonb; denied boolean; target uuid; begin
  for p in select * from statistics_role_cases loop
    perform set_config('request.jwt.claims',jsonb_build_object('sub',p.id,'role','authenticated')::text,true);
    select business_id into target from statistics_role_cases where business_id<>p.business_id limit 1;
    perform pg_temp.assert_true(not private.statistics_can_read(target),'cross-business helper denied');
    denied:=false;
    begin response:=public.statistics_v1_summary('today');exception when insufficient_privilege then denied:=true;end;
    if p.role in ('owner','manager','admin') then
      perform pg_temp.assert_true(not denied and response->>'businessId'=p.business_id::text,'authorized original role');
    else perform pg_temp.assert_true(denied,'operator/viewer/super_admin denied');end if;
    perform pg_temp.assert_true(not exists(select 1 from public.order_statistics_completions where business_id<>p.business_id),'cross-tenant RLS');
    perform pg_temp.assert_true(not exists(select 1 from public.order_statistics_completion_items where business_id<>p.business_id),'cross-tenant child RLS');
    perform pg_temp.assert_true(not exists(select 1 from public.order_item_statistics_snapshots where business_id<>p.business_id),'cross-tenant identity RLS');
    perform pg_temp.assert_true(not exists(select 1 from public.store_session_statistics_snapshots where business_id<>p.business_id),'cross-tenant session RLS');
    perform pg_temp.assert_true(not exists(select 1 from public.business_statistics_state where business_id<>p.business_id),'cross-tenant state RLS');
    if p.role not in ('owner','manager','admin') then
      perform pg_temp.assert_true(not exists(select 1 from public.order_statistics_completions),'denied role sees no own facts');
    end if;
    denied:=false;
    begin insert into public.business_statistics_state(business_id) values(p.business_id);exception when insufficient_privilege then denied:=true;end;
    perform pg_temp.assert_true(denied,'application cannot write snapshots');
  end loop;
end $$;
reset role;
select pg_temp.assert_true(not has_function_privilege('anon','public.statistics_v1_summary(text,date,date,text,integer,jsonb)','EXECUTE'),'anon denied');
select pg_temp.assert_true(not has_function_privilege('service_role','public.statistics_v1_summary(text,date,date,text,integer,jsonb)','EXECUTE'),'no service auto bypass');
select pg_temp.assert_true(not has_function_privilege('authenticated','private.statistics_order_changed()','EXECUTE'),'private writer not callable');
rollback;
