\set ON_ERROR_STOP off
\set VERBOSITY verbose
BEGIN ISOLATION LEVEL REPEATABLE READ;
-- PROPOSED ONLY. No installation, existing function replacement, capture change or optimized candidate dependency.
set local statement_timeout='15s';
set local lock_timeout='3s';

create function private.statistics_products_metric(p_value numeric,p_known bigint,p_unknown bigint,p_historical bigint,p_missing bigint default 0)
returns jsonb language sql immutable security invoker set search_path=pg_catalog as $$
 select jsonb_build_object('value',case when p_known>0 then p_value::text when p_unknown=0 and p_historical=0 and p_missing=0 then '0' end,
 'quality',case when p_known=0 and (p_unknown>0 or p_historical>0 or p_missing>0) then 'unavailable'
   when p_known=0 then 'empty' when p_unknown>0 or p_historical>0 or p_missing>0 then 'partial' else 'exact' end,
 'knownCount',p_known,'unknownCount',p_unknown,'missingCapturedOrders',p_missing,
 'reasons',array_remove(array[case when p_unknown>0 then 'unverified_lines' end,case when p_historical>0 then 'historical_without_date' end,case when p_missing>0 then 'uncaptured_orders' end],null));
$$;

create function private.statistics_v1_products_reader(
 p_period text,p_start_date date default null,p_end_date date default null,
 p_product_sort text default 'units',p_limit integer default 5,p_cursor jsonb default null
) returns jsonb language plpgsql stable security invoker set search_path=pg_catalog,public,private as $$
declare
 v_business uuid;v_role text;v_timezone text;v_now timestamptz:=statement_timestamp();v_reference date;v_civil date;
 v_start date;v_end date;v_revision text;v_key text;v_offset integer:=0;v_historical bigint;v_result jsonb;
begin
 select business_id,role into v_business,v_role from public.profiles where id=auth.uid();
 if auth.uid() is null or v_business is null or v_role is null or v_role not in ('owner','manager','admin') then
  raise exception 'STATISTICS_ACCESS_DENIED' using errcode='42501';end if;
 if p_period is null or p_period not in ('today','yesterday','this_week','this_month','previous_month','last_7_days','last_30_days','custom')
 or p_product_sort is null or p_product_sort not in ('units','amount') or p_limit is null or p_limit<1 or p_limit>20 then
  raise exception 'STATISTICS_INVALID_REQUEST' using errcode='22023';end if;
 if p_cursor is not null then
  if jsonb_typeof(p_cursor)<>'object' or p_cursor->>'asOf' is null or length(p_cursor->>'asOf')>50 then
   raise exception 'STATISTICS_INVALID_CURSOR' using errcode='22023';end if;
  begin v_now:=(p_cursor->>'asOf')::timestamptz;exception when others then
   raise exception 'STATISTICS_INVALID_CURSOR' using errcode='22023';end;
  if not isfinite(v_now) or v_now>statement_timestamp() or extract(year from v_now at time zone 'UTC') not between 1 and 9999 then
   raise exception 'STATISTICS_INVALID_CURSOR' using errcode='22023';end if;
 end if;
 select timezone into v_timezone from public.business_settings where business_id=v_business;
 if v_timezone is null then return jsonb_build_object('version','statistics.products.v1','status','configuration_required','businessId',v_business,'reason','missing_timezone');end if;
 v_civil:=(v_now at time zone v_timezone)::date;
 select snap.commercial_date into v_reference from public.store_sessions s join public.store_session_statistics_snapshots snap
 on snap.session_id=s.id and snap.business_id=s.business_id where s.business_id=v_business and s.status='open'
 and s.closed_at is null and snap.source_quality='exact' and s.opened_at=snap.opened_at and s.opened_at<=v_now;
 v_reference:=coalesce(v_reference,v_civil);v_start:=v_reference;v_end:=v_reference;
 case p_period
  when 'yesterday' then v_start:=v_reference-1;v_end:=v_start;
  when 'this_week' then v_start:=v_reference-(extract(isodow from v_reference)::integer-1);
  when 'this_month' then v_start:=date_trunc('month',v_reference)::date;
  when 'previous_month' then v_end:=date_trunc('month',v_reference)::date-1;v_start:=date_trunc('month',v_end)::date;
  when 'last_7_days' then v_start:=v_reference-6;
  when 'last_30_days' then v_start:=v_reference-29;
  when 'custom' then
   if p_start_date is null or p_end_date is null or not isfinite(p_start_date) or not isfinite(p_end_date)
   or extract(year from p_start_date) not between 1 and 9999 or extract(year from p_end_date) not between 1 and 9999
   or p_end_date<p_start_date or p_end_date>greatest(v_reference,v_civil) then
    raise exception 'STATISTICS_INVALID_RANGE' using errcode='22023';end if;
   v_start:=p_start_date;v_end:=p_end_date;
  else null;
 end case;
 select revision::text into v_revision from public.business_statistics_state where business_id=v_business;
 v_revision:=coalesce(v_revision,'0');
 v_key:=md5(v_business::text||p_period||v_start::text||v_end::text||p_product_sort||v_revision||v_timezone||v_now::text);
 if p_cursor is not null then
  if p_cursor->>'requestKey' is distinct from v_key or p_cursor->>'revision' is distinct from v_revision
  or p_cursor->>'offset' is null or p_cursor->>'offset' !~ '^[0-9]{1,9}$' then
   raise exception 'STATISTICS_STALE_CURSOR' using errcode='22023';end if;
  v_offset:=(p_cursor->>'offset')::integer;
 end if;
 -- Global coverage intentionally not restricted to the requested period or asOf.
 select count(*) into v_historical from public.orders o where o.business_id=v_business and o.status='completed'
 and not exists(select 1 from public.order_statistics_completions c where c.order_id=o.id and c.active
 and c.commercial_date is not null and c.timezone is not null and not c.date_conflict);

 with facts as materialized (
  select f.* from public.statistics_v1_effective_facts f where f.business_id=v_business and f.date_reliable
  and f.commercial_date between v_start and v_end and f.completed_at<=v_now
 ), lines as materialized (
  select i.*,f.completed_at,
   case when i.item_kind='product' and f.effective_units is not null then i.quantity end units_value,
   case when f.effective_sales is not null then i.net_amount end income_value,
   case when i.category_identity is not null and i.category_name is not null then i.category_identity end category_key_identity,
   case when i.category_identity is not null and i.category_name is not null then 'verified'
    when i.category_identity is null and proof.source_kind in ('line_insert','identity_replacement') and proof.product_identity is not null
      and proof.product_identity is not distinct from i.product_identity and proof.category_identity is null
      and proof.category_name is null and proof.product_name=i.product_name then 'uncategorized_verified'
    else 'attribution_unknown' end category_kind
  from facts f join public.order_statistics_completion_items i on i.completion_id=f.id and i.business_id=v_business
  left join lateral (
   select s.* from public.order_item_statistics_snapshots s where s.source_item_id=i.line_key and s.order_id=f.order_id
   and s.business_id=v_business and s.captured_at<=f.completed_at order by s.generation desc limit 1
  ) proof on true
 ), missing_counts as materialized (
  select count(*) missing from facts f where not exists(select 1 from lines l where l.completion_id=f.id)
 ), grouped as materialized (
  select product_identity,
   (array_agg(product_name order by completed_at desc,completion_id,line_key))[1] label,
   sum(units_value) units,sum(income_value) income,
   count(*) filter(where item_kind='product' and units_value is not null) uk,
   count(*) filter(where item_kind='product' and units_value is null) uu,
   count(*) filter(where income_value is not null) rk,count(*) filter(where income_value is null) ru
  from lines where product_identity is not null group by product_identity
 ), totals as materialized (
  select private.statistics_products_metric(sum(units_value),count(*) filter(where item_kind='product' and units_value is not null),count(*) filter(where item_kind='product' and units_value is null),v_historical,(select missing from missing_counts)) units,
   private.statistics_products_metric(round(sum(income_value),2),count(*) filter(where income_value is not null),count(*) filter(where income_value is null),v_historical,(select missing from missing_counts)) revenue,
   sum(units_value) units_denominator,sum(income_value) revenue_denominator, (select missing from missing_counts) missing
  from lines
 ), ranked as materialized (
  select g.*,row_number() over(order by case when p_product_sort='units' then g.units else g.income end desc,g.product_identity::text collate "C") position
  from grouped g where case when p_product_sort='units' then g.units>0 else g.income>0 end
 ), categories as materialized (
  select category_kind,category_key_identity category_identity,
   case when category_kind='verified' then coalesce((array_agg(category_name order by completed_at desc,completion_id,line_key))[1],'Categoría histórica')
     when category_kind='uncategorized_verified' then 'Sin categoría' else 'Sin atribución fiable' end label,
   private.statistics_products_metric(sum(units_value),count(*) filter(where item_kind='product' and units_value is not null),count(*) filter(where item_kind='product' and units_value is null),v_historical,(select missing from missing_counts)) units,
   private.statistics_products_metric(round(sum(income_value),2),count(*) filter(where income_value is not null),count(*) filter(where income_value is null),v_historical,(select missing from missing_counts)) revenue,
   sum(units_value) units_value,sum(income_value) income_value
  from lines group by category_kind,category_key_identity
 ) select jsonb_build_object(
  'version','statistics.products.v1','status','ready','businessId',v_business,'currency','ARS','revision',v_revision,
  'period',jsonb_build_object('preset',p_period,'startDate',v_start,'endDate',v_end,'referenceDate',v_reference,'timezone',v_timezone,'asOf',v_now,'partial',v_end>=v_reference),
  'totals',jsonb_build_object('units',t.units,'revenue',t.revenue),
  'denominators',jsonb_build_object('scope','verified_lines_in_period','units',t.units_denominator::text,'revenue',round(t.revenue_denominator,2)::text,
   'unitComplete',v_historical=0 and not exists(select 1 from lines where item_kind='product' and units_value is null) and (select missing from missing_counts)=0,
   'revenueComplete',v_historical=0 and not exists(select 1 from lines where income_value is null) and (select missing from missing_counts)=0),
  'coverage',jsonb_build_object('eligibleOrders',(select count(*) from facts),'capturedLines',(select count(*) from lines),
   'ordersWithoutCapturedLines',(select missing from missing_counts),
   'historicalWithoutDate',v_historical,'historicalScope','global_unassigned','outsideSession',(select count(*) from facts where date_kind='outside_session'),
   'unknownProductLines',(select count(*) from lines where product_identity is null),'unknownCategoryLines',(select count(*) from lines where category_kind='attribution_unknown'),
   'unresolvedOrders',(select count(*) from facts where effective_sales is null),'pendingAgreedTotal',(select round(sum(current_agreement),2)::text from facts where effective_sales is null)),
  'unidentified',jsonb_build_object('units',(select private.statistics_products_metric(sum(units_value),count(*) filter(where item_kind='product' and units_value is not null),count(*) filter(where item_kind='product' and units_value is null),v_historical,(select missing from missing_counts)) from lines where product_identity is null),
    'revenue',(select private.statistics_products_metric(round(sum(income_value),2),count(*) filter(where income_value is not null),count(*) filter(where income_value is null),v_historical,(select missing from missing_counts)) from lines where product_identity is null)),
  'ranking',jsonb_build_object('sort',p_product_sort,'totalProducts',(select count(*) from ranked),'items',coalesce((select jsonb_agg(jsonb_build_object(
   'key','product:'||r.product_identity::text,'identity',r.product_identity,'label',r.label,'position',r.position,'catalogStatus','historical',
   'units',private.statistics_products_metric(r.units,r.uk,r.uu,v_historical,(select missing from missing_counts)),'revenue',private.statistics_products_metric(round(r.income,2),r.rk,r.ru,v_historical,(select missing from missing_counts)),
   'unitShare',case when t.units_denominator>0 then round(coalesce(r.units,case when r.uu=0 and v_historical=0 and (select missing from missing_counts)=0 then 0 end)*100/t.units_denominator,2)::text end,
   'revenueShare',case when t.revenue_denominator>0 then round(coalesce(r.income,case when r.ru=0 and v_historical=0 and (select missing from missing_counts)=0 then 0 end)*100/t.revenue_denominator,2)::text end,
   'categories',coalesce((select jsonb_agg(jsonb_build_object('kind',x.category_kind,'identity',x.category_identity) order by x.category_kind,x.category_identity) from (select distinct l.category_kind,l.category_key_identity category_identity from lines l where l.product_identity=r.product_identity) x),'[]'::jsonb)
  ) order by r.position) from ranked r where r.position>v_offset and r.position<=v_offset+p_limit),'[]'::jsonb),
  'nextCursor',case when v_offset+p_limit<(select count(*) from ranked) then jsonb_build_object('offset',v_offset+p_limit,'revision',v_revision,'requestKey',v_key,'asOf',v_now) end),
  'categories',coalesce((select jsonb_agg(jsonb_build_object('key',case when c.category_kind='verified' then 'category:'||c.category_identity::text else 'special:'||c.category_kind end,
   'kind',c.category_kind,'identity',c.category_identity,'label',c.label,'units',c.units,'revenue',c.revenue,
   'unitShare',case when t.units_denominator>0 then round((c.units->>'value')::numeric*100/t.units_denominator,2)::text end,
   'revenueShare',case when t.revenue_denominator>0 then round((c.revenue->>'value')::numeric*100/t.revenue_denominator,2)::text end) order by c.category_kind,c.category_identity) from categories c),'[]'::jsonb)
 ) into v_result from totals t;
 return v_result;
end;
$$;

create function public.statistics_v1_products(p_period text,p_start_date date default null,p_end_date date default null,
 p_product_sort text default 'units',p_limit integer default 5,p_cursor jsonb default null)
returns jsonb language sql stable security invoker set search_path=pg_catalog,private as $$
 select private.statistics_v1_products_reader(p_period,p_start_date,p_end_date,p_product_sort,p_limit,p_cursor);
$$;
revoke all on function private.statistics_products_metric(numeric,bigint,bigint,bigint,bigint) from public,anon,authenticated,service_role;
revoke all on function private.statistics_v1_products_reader(text,date,date,text,integer,jsonb) from public,anon,authenticated,service_role;
revoke all on function public.statistics_v1_products(text,date,date,text,integer,jsonb) from public,anon,authenticated,service_role;
grant execute on function private.statistics_products_metric(numeric,bigint,bigint,bigint,bigint) to authenticated;
grant execute on function private.statistics_v1_products_reader(text,date,date,text,integer,jsonb) to authenticated;
grant execute on function public.statistics_v1_products(text,date,date,text,integer,jsonb) to authenticated;

reset role;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
if (select count(*) from pg_proc where oid in ('private.statistics_products_metric(numeric,bigint,bigint,bigint,bigint)'::regprocedure,'private.statistics_v1_products_reader(text,date,date,text,integer,jsonb)'::regprocedure,'public.statistics_v1_products(text,date,date,text,integer,jsonb)'::regprocedure) and not prosecdef and proowner=(select oid from pg_roles where rolname='postgres'))<>3 then raise exception 'CATALOG_INVOKER_OWNER';end if;
if (select pronargdefaults from pg_proc where oid='public.statistics_v1_products(text,date,date,text,integer,jsonb)'::regprocedure)<>5 then raise exception 'DEFAULTS';end if;
if has_function_privilege('anon','public.statistics_v1_products(text,date,date,text,integer,jsonb)','execute') or has_function_privilege('service_role','public.statistics_v1_products(text,date,date,text,integer,jsonb)','execute') or not has_function_privilege('authenticated','public.statistics_v1_products(text,date,date,text,integer,jsonb)','execute') then raise exception 'ACL';end if;
r:= (select jsonb_agg(jsonb_build_object('signature',oid::regprocedure::text,'defaults',pg_get_expr(proargdefaults,0),'config',proconfig,'owner',pg_get_userbyid(proowner),'acl',proacl::text,'invoker',not prosecdef)) from pg_proc where proname in ('statistics_products_metric','statistics_v1_products_reader','statistics_v1_products'));
raise notice '%',jsonb_build_object('test','catalog.signatures_invoker_defaults_acl','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','catalog.signatures_invoker_defaults_acl','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"a9eea14b-6c1c-4631-9a0e-4c6c62efe501","role":"authenticated","user_metadata":{"role":"owner","business_id":"ea72a875-7511-4c1d-9d2c-c3f899b94bea"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
begin r:=public.statistics_v1_products('today'); exception when others then get stacked diagnostics code=returned_sqlstate,msg=message_text;end;
if true then if code is not null or r->>'businessId'<>'108722c0-a80f-4d5b-98ee-6c99f44cdb23' then raise exception 'AUTHORIZED_FAILED % %',code,msg;end if;else if code is distinct from '42501' then raise exception 'DENIAL_FAILED %',code;end if;end if;
raise notice '%',jsonb_build_object('test','role.owner.a.public.statistics_v1_products','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','role.owner.a.public.statistics_v1_products','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"a9eea14b-6c1c-4631-9a0e-4c6c62efe501","role":"authenticated","user_metadata":{"role":"owner","business_id":"ea72a875-7511-4c1d-9d2c-c3f899b94bea"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
begin r:=private.statistics_v1_products_reader('today'); exception when others then get stacked diagnostics code=returned_sqlstate,msg=message_text;end;
if true then if code is not null or r->>'businessId'<>'108722c0-a80f-4d5b-98ee-6c99f44cdb23' then raise exception 'AUTHORIZED_FAILED % %',code,msg;end if;else if code is distinct from '42501' then raise exception 'DENIAL_FAILED %',code;end if;end if;
raise notice '%',jsonb_build_object('test','role.owner.a.private.statistics_v1_products_reader','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','role.owner.a.private.statistics_v1_products_reader','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"6d1a696a-d974-4ad6-809d-a5715f90d816","role":"authenticated","user_metadata":{"role":"owner","business_id":"ea72a875-7511-4c1d-9d2c-c3f899b94bea"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
begin r:=public.statistics_v1_products('today'); exception when others then get stacked diagnostics code=returned_sqlstate,msg=message_text;end;
if true then if code is not null or r->>'businessId'<>'108722c0-a80f-4d5b-98ee-6c99f44cdb23' then raise exception 'AUTHORIZED_FAILED % %',code,msg;end if;else if code is distinct from '42501' then raise exception 'DENIAL_FAILED %',code;end if;end if;
raise notice '%',jsonb_build_object('test','role.manager.a.public.statistics_v1_products','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','role.manager.a.public.statistics_v1_products','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"6d1a696a-d974-4ad6-809d-a5715f90d816","role":"authenticated","user_metadata":{"role":"owner","business_id":"ea72a875-7511-4c1d-9d2c-c3f899b94bea"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
begin r:=private.statistics_v1_products_reader('today'); exception when others then get stacked diagnostics code=returned_sqlstate,msg=message_text;end;
if true then if code is not null or r->>'businessId'<>'108722c0-a80f-4d5b-98ee-6c99f44cdb23' then raise exception 'AUTHORIZED_FAILED % %',code,msg;end if;else if code is distinct from '42501' then raise exception 'DENIAL_FAILED %',code;end if;end if;
raise notice '%',jsonb_build_object('test','role.manager.a.private.statistics_v1_products_reader','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','role.manager.a.private.statistics_v1_products_reader','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"4f81b68b-fc92-4865-88a8-bd59372b45f8","role":"authenticated","user_metadata":{"role":"owner","business_id":"ea72a875-7511-4c1d-9d2c-c3f899b94bea"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
begin r:=public.statistics_v1_products('today'); exception when others then get stacked diagnostics code=returned_sqlstate,msg=message_text;end;
if true then if code is not null or r->>'businessId'<>'108722c0-a80f-4d5b-98ee-6c99f44cdb23' then raise exception 'AUTHORIZED_FAILED % %',code,msg;end if;else if code is distinct from '42501' then raise exception 'DENIAL_FAILED %',code;end if;end if;
raise notice '%',jsonb_build_object('test','role.admin.a.public.statistics_v1_products','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','role.admin.a.public.statistics_v1_products','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"4f81b68b-fc92-4865-88a8-bd59372b45f8","role":"authenticated","user_metadata":{"role":"owner","business_id":"ea72a875-7511-4c1d-9d2c-c3f899b94bea"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
begin r:=private.statistics_v1_products_reader('today'); exception when others then get stacked diagnostics code=returned_sqlstate,msg=message_text;end;
if true then if code is not null or r->>'businessId'<>'108722c0-a80f-4d5b-98ee-6c99f44cdb23' then raise exception 'AUTHORIZED_FAILED % %',code,msg;end if;else if code is distinct from '42501' then raise exception 'DENIAL_FAILED %',code;end if;end if;
raise notice '%',jsonb_build_object('test','role.admin.a.private.statistics_v1_products_reader','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','role.admin.a.private.statistics_v1_products_reader','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"2969d3a4-4fcf-46b9-8724-ef965e364fb4","role":"authenticated","user_metadata":{"role":"owner","business_id":"ea72a875-7511-4c1d-9d2c-c3f899b94bea"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
begin r:=public.statistics_v1_products('today'); exception when others then get stacked diagnostics code=returned_sqlstate,msg=message_text;end;
if false then if code is not null or r->>'businessId'<>'108722c0-a80f-4d5b-98ee-6c99f44cdb23' then raise exception 'AUTHORIZED_FAILED % %',code,msg;end if;else if code is distinct from '42501' then raise exception 'DENIAL_FAILED %',code;end if;end if;
raise notice '%',jsonb_build_object('test','role.operator.a.public.statistics_v1_products','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','role.operator.a.public.statistics_v1_products','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"2969d3a4-4fcf-46b9-8724-ef965e364fb4","role":"authenticated","user_metadata":{"role":"owner","business_id":"ea72a875-7511-4c1d-9d2c-c3f899b94bea"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
begin r:=private.statistics_v1_products_reader('today'); exception when others then get stacked diagnostics code=returned_sqlstate,msg=message_text;end;
if false then if code is not null or r->>'businessId'<>'108722c0-a80f-4d5b-98ee-6c99f44cdb23' then raise exception 'AUTHORIZED_FAILED % %',code,msg;end if;else if code is distinct from '42501' then raise exception 'DENIAL_FAILED %',code;end if;end if;
raise notice '%',jsonb_build_object('test','role.operator.a.private.statistics_v1_products_reader','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','role.operator.a.private.statistics_v1_products_reader','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"bc03a29d-699f-48c7-bf53-21624019cdc6","role":"authenticated","user_metadata":{"role":"owner","business_id":"ea72a875-7511-4c1d-9d2c-c3f899b94bea"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
begin r:=public.statistics_v1_products('today'); exception when others then get stacked diagnostics code=returned_sqlstate,msg=message_text;end;
if false then if code is not null or r->>'businessId'<>'108722c0-a80f-4d5b-98ee-6c99f44cdb23' then raise exception 'AUTHORIZED_FAILED % %',code,msg;end if;else if code is distinct from '42501' then raise exception 'DENIAL_FAILED %',code;end if;end if;
raise notice '%',jsonb_build_object('test','role.viewer.a.public.statistics_v1_products','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','role.viewer.a.public.statistics_v1_products','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"bc03a29d-699f-48c7-bf53-21624019cdc6","role":"authenticated","user_metadata":{"role":"owner","business_id":"ea72a875-7511-4c1d-9d2c-c3f899b94bea"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
begin r:=private.statistics_v1_products_reader('today'); exception when others then get stacked diagnostics code=returned_sqlstate,msg=message_text;end;
if false then if code is not null or r->>'businessId'<>'108722c0-a80f-4d5b-98ee-6c99f44cdb23' then raise exception 'AUTHORIZED_FAILED % %',code,msg;end if;else if code is distinct from '42501' then raise exception 'DENIAL_FAILED %',code;end if;end if;
raise notice '%',jsonb_build_object('test','role.viewer.a.private.statistics_v1_products_reader','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','role.viewer.a.private.statistics_v1_products_reader','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"1235168b-bcab-4053-93d3-0cd44e53ade0","role":"authenticated","user_metadata":{"role":"owner","business_id":"ea72a875-7511-4c1d-9d2c-c3f899b94bea"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
begin r:=public.statistics_v1_products('today'); exception when others then get stacked diagnostics code=returned_sqlstate,msg=message_text;end;
if false then if code is not null or r->>'businessId'<>'108722c0-a80f-4d5b-98ee-6c99f44cdb23' then raise exception 'AUTHORIZED_FAILED % %',code,msg;end if;else if code is distinct from '42501' then raise exception 'DENIAL_FAILED %',code;end if;end if;
raise notice '%',jsonb_build_object('test','role.super_admin.a.public.statistics_v1_products','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','role.super_admin.a.public.statistics_v1_products','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"1235168b-bcab-4053-93d3-0cd44e53ade0","role":"authenticated","user_metadata":{"role":"owner","business_id":"ea72a875-7511-4c1d-9d2c-c3f899b94bea"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
begin r:=private.statistics_v1_products_reader('today'); exception when others then get stacked diagnostics code=returned_sqlstate,msg=message_text;end;
if false then if code is not null or r->>'businessId'<>'108722c0-a80f-4d5b-98ee-6c99f44cdb23' then raise exception 'AUTHORIZED_FAILED % %',code,msg;end if;else if code is distinct from '42501' then raise exception 'DENIAL_FAILED %',code;end if;end if;
raise notice '%',jsonb_build_object('test','role.super_admin.a.private.statistics_v1_products_reader','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','role.super_admin.a.private.statistics_v1_products_reader','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"bb729a71-be76-4ff7-a7f6-0edd33361097","role":"authenticated","user_metadata":{"role":"owner","business_id":"108722c0-a80f-4d5b-98ee-6c99f44cdb23"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
begin r:=public.statistics_v1_products('today'); exception when others then get stacked diagnostics code=returned_sqlstate,msg=message_text;end;
if true then if code is not null or r->>'businessId'<>'ea72a875-7511-4c1d-9d2c-c3f899b94bea' then raise exception 'AUTHORIZED_FAILED % %',code,msg;end if;else if code is distinct from '42501' then raise exception 'DENIAL_FAILED %',code;end if;end if;
raise notice '%',jsonb_build_object('test','role.owner.b.public.statistics_v1_products','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','role.owner.b.public.statistics_v1_products','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"bb729a71-be76-4ff7-a7f6-0edd33361097","role":"authenticated","user_metadata":{"role":"owner","business_id":"108722c0-a80f-4d5b-98ee-6c99f44cdb23"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
begin r:=private.statistics_v1_products_reader('today'); exception when others then get stacked diagnostics code=returned_sqlstate,msg=message_text;end;
if true then if code is not null or r->>'businessId'<>'ea72a875-7511-4c1d-9d2c-c3f899b94bea' then raise exception 'AUTHORIZED_FAILED % %',code,msg;end if;else if code is distinct from '42501' then raise exception 'DENIAL_FAILED %',code;end if;end if;
raise notice '%',jsonb_build_object('test','role.owner.b.private.statistics_v1_products_reader','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','role.owner.b.private.statistics_v1_products_reader','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"1ef472c5-3f84-4118-b486-ff2796f1992c","role":"authenticated","user_metadata":{"role":"owner","business_id":"108722c0-a80f-4d5b-98ee-6c99f44cdb23"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
begin r:=public.statistics_v1_products('today'); exception when others then get stacked diagnostics code=returned_sqlstate,msg=message_text;end;
if true then if code is not null or r->>'businessId'<>'ea72a875-7511-4c1d-9d2c-c3f899b94bea' then raise exception 'AUTHORIZED_FAILED % %',code,msg;end if;else if code is distinct from '42501' then raise exception 'DENIAL_FAILED %',code;end if;end if;
raise notice '%',jsonb_build_object('test','role.manager.b.public.statistics_v1_products','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','role.manager.b.public.statistics_v1_products','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"1ef472c5-3f84-4118-b486-ff2796f1992c","role":"authenticated","user_metadata":{"role":"owner","business_id":"108722c0-a80f-4d5b-98ee-6c99f44cdb23"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
begin r:=private.statistics_v1_products_reader('today'); exception when others then get stacked diagnostics code=returned_sqlstate,msg=message_text;end;
if true then if code is not null or r->>'businessId'<>'ea72a875-7511-4c1d-9d2c-c3f899b94bea' then raise exception 'AUTHORIZED_FAILED % %',code,msg;end if;else if code is distinct from '42501' then raise exception 'DENIAL_FAILED %',code;end if;end if;
raise notice '%',jsonb_build_object('test','role.manager.b.private.statistics_v1_products_reader','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','role.manager.b.private.statistics_v1_products_reader','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"a63714a3-afc5-490c-b114-8abc68d45621","role":"authenticated","user_metadata":{"role":"owner","business_id":"108722c0-a80f-4d5b-98ee-6c99f44cdb23"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
begin r:=public.statistics_v1_products('today'); exception when others then get stacked diagnostics code=returned_sqlstate,msg=message_text;end;
if true then if code is not null or r->>'businessId'<>'ea72a875-7511-4c1d-9d2c-c3f899b94bea' then raise exception 'AUTHORIZED_FAILED % %',code,msg;end if;else if code is distinct from '42501' then raise exception 'DENIAL_FAILED %',code;end if;end if;
raise notice '%',jsonb_build_object('test','role.admin.b.public.statistics_v1_products','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','role.admin.b.public.statistics_v1_products','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"a63714a3-afc5-490c-b114-8abc68d45621","role":"authenticated","user_metadata":{"role":"owner","business_id":"108722c0-a80f-4d5b-98ee-6c99f44cdb23"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
begin r:=private.statistics_v1_products_reader('today'); exception when others then get stacked diagnostics code=returned_sqlstate,msg=message_text;end;
if true then if code is not null or r->>'businessId'<>'ea72a875-7511-4c1d-9d2c-c3f899b94bea' then raise exception 'AUTHORIZED_FAILED % %',code,msg;end if;else if code is distinct from '42501' then raise exception 'DENIAL_FAILED %',code;end if;end if;
raise notice '%',jsonb_build_object('test','role.admin.b.private.statistics_v1_products_reader','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','role.admin.b.private.statistics_v1_products_reader','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"f316cdb5-07a3-4cb1-bf4e-5433d73ec511","role":"authenticated","user_metadata":{"role":"owner","business_id":"108722c0-a80f-4d5b-98ee-6c99f44cdb23"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
begin r:=public.statistics_v1_products('today'); exception when others then get stacked diagnostics code=returned_sqlstate,msg=message_text;end;
if false then if code is not null or r->>'businessId'<>'ea72a875-7511-4c1d-9d2c-c3f899b94bea' then raise exception 'AUTHORIZED_FAILED % %',code,msg;end if;else if code is distinct from '42501' then raise exception 'DENIAL_FAILED %',code;end if;end if;
raise notice '%',jsonb_build_object('test','role.operator.b.public.statistics_v1_products','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','role.operator.b.public.statistics_v1_products','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"f316cdb5-07a3-4cb1-bf4e-5433d73ec511","role":"authenticated","user_metadata":{"role":"owner","business_id":"108722c0-a80f-4d5b-98ee-6c99f44cdb23"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
begin r:=private.statistics_v1_products_reader('today'); exception when others then get stacked diagnostics code=returned_sqlstate,msg=message_text;end;
if false then if code is not null or r->>'businessId'<>'ea72a875-7511-4c1d-9d2c-c3f899b94bea' then raise exception 'AUTHORIZED_FAILED % %',code,msg;end if;else if code is distinct from '42501' then raise exception 'DENIAL_FAILED %',code;end if;end if;
raise notice '%',jsonb_build_object('test','role.operator.b.private.statistics_v1_products_reader','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','role.operator.b.private.statistics_v1_products_reader','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"ecfc0c1d-069b-43ec-80e7-569bbb78dbaf","role":"authenticated","user_metadata":{"role":"owner","business_id":"108722c0-a80f-4d5b-98ee-6c99f44cdb23"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
begin r:=public.statistics_v1_products('today'); exception when others then get stacked diagnostics code=returned_sqlstate,msg=message_text;end;
if false then if code is not null or r->>'businessId'<>'ea72a875-7511-4c1d-9d2c-c3f899b94bea' then raise exception 'AUTHORIZED_FAILED % %',code,msg;end if;else if code is distinct from '42501' then raise exception 'DENIAL_FAILED %',code;end if;end if;
raise notice '%',jsonb_build_object('test','role.viewer.b.public.statistics_v1_products','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','role.viewer.b.public.statistics_v1_products','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"ecfc0c1d-069b-43ec-80e7-569bbb78dbaf","role":"authenticated","user_metadata":{"role":"owner","business_id":"108722c0-a80f-4d5b-98ee-6c99f44cdb23"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
begin r:=private.statistics_v1_products_reader('today'); exception when others then get stacked diagnostics code=returned_sqlstate,msg=message_text;end;
if false then if code is not null or r->>'businessId'<>'ea72a875-7511-4c1d-9d2c-c3f899b94bea' then raise exception 'AUTHORIZED_FAILED % %',code,msg;end if;else if code is distinct from '42501' then raise exception 'DENIAL_FAILED %',code;end if;end if;
raise notice '%',jsonb_build_object('test','role.viewer.b.private.statistics_v1_products_reader','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','role.viewer.b.private.statistics_v1_products_reader','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"3693c4d3-c66c-4bd6-9faa-0e777c8e0279","role":"authenticated","user_metadata":{"role":"owner","business_id":"108722c0-a80f-4d5b-98ee-6c99f44cdb23"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
begin r:=public.statistics_v1_products('today'); exception when others then get stacked diagnostics code=returned_sqlstate,msg=message_text;end;
if false then if code is not null or r->>'businessId'<>'ea72a875-7511-4c1d-9d2c-c3f899b94bea' then raise exception 'AUTHORIZED_FAILED % %',code,msg;end if;else if code is distinct from '42501' then raise exception 'DENIAL_FAILED %',code;end if;end if;
raise notice '%',jsonb_build_object('test','role.super_admin.b.public.statistics_v1_products','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','role.super_admin.b.public.statistics_v1_products','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"3693c4d3-c66c-4bd6-9faa-0e777c8e0279","role":"authenticated","user_metadata":{"role":"owner","business_id":"108722c0-a80f-4d5b-98ee-6c99f44cdb23"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
begin r:=private.statistics_v1_products_reader('today'); exception when others then get stacked diagnostics code=returned_sqlstate,msg=message_text;end;
if false then if code is not null or r->>'businessId'<>'ea72a875-7511-4c1d-9d2c-c3f899b94bea' then raise exception 'AUTHORIZED_FAILED % %',code,msg;end if;else if code is distinct from '42501' then raise exception 'DENIAL_FAILED %',code;end if;end if;
raise notice '%',jsonb_build_object('test','role.super_admin.b.private.statistics_v1_products_reader','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','role.super_admin.b.private.statistics_v1_products_reader','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"a9eea14b-6c1c-4631-9a0e-4c6c62efe501","role":"authenticated","user_metadata":{"role":"owner","business_id":"ea72a875-7511-4c1d-9d2c-c3f899b94bea"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
perform set_config('request.jwt.claims','{}',true);begin r:=public.statistics_v1_products('today');exception when others then code:=sqlstate;end;if code is distinct from '42501' then raise exception 'DENIAL_FAILED';end if;
raise notice '%',jsonb_build_object('test','deny.no_session.public.statistics_v1_products','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','deny.no_session.public.statistics_v1_products','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"a9eea14b-6c1c-4631-9a0e-4c6c62efe501","role":"authenticated","user_metadata":{"role":"owner","business_id":"ea72a875-7511-4c1d-9d2c-c3f899b94bea"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
perform set_config('request.jwt.claims','{}',true);begin r:=private.statistics_v1_products_reader('today');exception when others then code:=sqlstate;end;if code is distinct from '42501' then raise exception 'DENIAL_FAILED';end if;
raise notice '%',jsonb_build_object('test','deny.no_session.private.statistics_v1_products_reader','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','deny.no_session.private.statistics_v1_products_reader','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"a9eea14b-6c1c-4631-9a0e-4c6c62efe501","role":"authenticated","user_metadata":{"role":"owner","business_id":"ea72a875-7511-4c1d-9d2c-c3f899b94bea"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
perform set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000009999","role":"authenticated"}',true);begin r:=public.statistics_v1_products('today');exception when others then code:=sqlstate;end;if code is distinct from '42501' then raise exception 'DENIAL_FAILED';end if;
raise notice '%',jsonb_build_object('test','deny.missing_profile.public.statistics_v1_products','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','deny.missing_profile.public.statistics_v1_products','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"a9eea14b-6c1c-4631-9a0e-4c6c62efe501","role":"authenticated","user_metadata":{"role":"owner","business_id":"ea72a875-7511-4c1d-9d2c-c3f899b94bea"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
perform set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000009999","role":"authenticated"}',true);begin r:=private.statistics_v1_products_reader('today');exception when others then code:=sqlstate;end;if code is distinct from '42501' then raise exception 'DENIAL_FAILED';end if;
raise notice '%',jsonb_build_object('test','deny.missing_profile.private.statistics_v1_products_reader','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','deny.missing_profile.private.statistics_v1_products_reader','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
begin update public.profiles set role=null where id='a9eea14b-6c1c-4631-9a0e-4c6c62efe501';raise exception 'NULL_ROLE_ACCEPTED';exception when not_null_violation then null;end;
begin update public.profiles set role='unknown' where id='a9eea14b-6c1c-4631-9a0e-4c6c62efe501';raise exception 'UNKNOWN_ROLE_ACCEPTED';exception when check_violation then null;end;
raise notice '%',jsonb_build_object('test','constraints.null_unknown_roles','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','constraints.null_unknown_roles','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
update public.profiles set business_id=null where id='1235168b-bcab-4053-93d3-0cd44e53ade0';select set_config('request.jwt.claims','{"sub":"1235168b-bcab-4053-93d3-0cd44e53ade0","role":"authenticated","user_metadata":{"role":"owner","business_id":"ea72a875-7511-4c1d-9d2c-c3f899b94bea"}}',true);set local role authenticated;
begin r:=public.statistics_v1_products('today');exception when others then code:=sqlstate;end;reset role;if code is distinct from '42501' then raise exception 'NO_BUSINESS_ACCEPTED';end if;
raise notice '%',jsonb_build_object('test','deny.absent_business','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','deny.absent_business','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"a9eea14b-6c1c-4631-9a0e-4c6c62efe501","role":"authenticated","user_metadata":{"role":"owner","business_id":"ea72a875-7511-4c1d-9d2c-c3f899b94bea"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
r:=private.statistics_products_metric(null,0,1,0,0);if r->>'value' is not null or r->>'quality'<>'unavailable' then raise exception 'UNKNOWN_BECAME_ZERO';end if;
raise notice '%',jsonb_build_object('test','pure_helper.no_data','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','pure_helper.no_data','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"a9eea14b-6c1c-4631-9a0e-4c6c62efe501","role":"authenticated","user_metadata":{"role":"owner","business_id":"ea72a875-7511-4c1d-9d2c-c3f899b94bea"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
r:=public.statistics_v1_products('today');if r#>>'{totals,units,value}'<>'0' or r#>>'{totals,revenue,value}'<>'0' then raise exception 'EMPTY_CONTRACT';end if;
raise notice '%',jsonb_build_object('test','compile.empty_response','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','compile.empty_response','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

-- All fixture writes use two existing synthetic businesses. No constraint/RLS/schema changes.
select set_config('request.jwt.claims','{"sub":"a9eea14b-6c1c-4631-9a0e-4c6c62efe501","role":"authenticated","user_metadata":{"role":"owner","business_id":"ea72a875-7511-4c1d-9d2c-c3f899b94bea"}}',true);
insert into public.categories(id,business_id,name) values(md5('P04T01B:cat:a')::uuid,'108722c0-a80f-4d5b-98ee-6c99f44cdb23','Synthetic historical A'),(md5('P04T01B:cat:b')::uuid,'ea72a875-7511-4c1d-9d2c-c3f899b94bea','Synthetic historical B');
insert into public.products(id,business_id,category_id,name,price) select md5('P04T01B:product:'||n)::uuid,'108722c0-a80f-4d5b-98ee-6c99f44cdb23',md5('P04T01B:cat:a')::uuid,'Synthetic homonym',10 from generate_series(1,7) n;
insert into public.products(id,business_id,category_id,name,price) values(md5('P04T01B:product:b')::uuid,'ea72a875-7511-4c1d-9d2c-c3f899b94bea',md5('P04T01B:cat:b')::uuid,'Foreign synthetic',99);
insert into public.orders(id,business_id,customer_name,phone,delivery_date,delivery_method,total_price,composition_status,order_code) select md5('P04T01B:order:'||n)::uuid,'108722c0-a80f-4d5b-98ee-6c99f44cdb23','Synthetic T01B','0000000000',current_date,'pickup',case when n=1 then 30 else 10 end,'itemized','Z'||substr('23456789',1+(n/8)%8,1)||substr('23456789',1+n%8,1)||'234' from generate_series(1,7)n;
insert into public.order_items(id,order_id,product_id,product_name,quantity,unit_price) select md5('P04T01B:line:'||n)::uuid,md5('P04T01B:order:'||n)::uuid,md5('P04T01B:product:'||n)::uuid,'Synthetic homonym',case when n=1 then 2 else 1 end,10 from generate_series(1,7)n;
insert into public.order_items(id,order_id,product_id,product_name,quantity,unit_price,item_kind,parent_order_item_id) values(md5('P04T01B:upsell')::uuid,md5('P04T01B:order:1')::uuid,md5('P04T01B:product:7')::uuid,'Synthetic upsell',1,10,'upsell',md5('P04T01B:line:1')::uuid);
insert into public.order_financials(order_id,business_id,agreed_total) select id,business_id,total_price from public.orders where id in(select md5('P04T01B:order:'||n)::uuid from generate_series(1,7)n);
insert into public.finance_audit_events(business_id,actor_id,event_type,entity_type,entity_id,payload) select business_id,'a9eea14b-6c1c-4631-9a0e-4c6c62efe501','order_financials_initialized','order_financials',id,jsonb_build_object('mode','copy_total_price','agreed_total',total_price) from public.orders where id in(select md5('P04T01B:order:'||n)::uuid from generate_series(1,7)n);
update public.orders set status='completed' where id in(select md5('P04T01B:order:'||n)::uuid from generate_series(1,7)n);
select set_config('request.jwt.claims','{"sub":"bb729a71-be76-4ff7-a7f6-0edd33361097","role":"authenticated","user_metadata":{"role":"owner","business_id":"108722c0-a80f-4d5b-98ee-6c99f44cdb23"}}',true);
insert into public.orders(id,business_id,customer_name,phone,delivery_date,delivery_method,total_price,composition_status,order_code) values(md5('P04T01B:order:b')::uuid,'ea72a875-7511-4c1d-9d2c-c3f899b94bea','Other synthetic','0000000000',current_date,'pickup',99,'itemized','ZB2345');
insert into public.order_items(order_id,product_id,product_name,quantity,unit_price) values(md5('P04T01B:order:b')::uuid,md5('P04T01B:product:b')::uuid,'Foreign synthetic',1,99);
insert into public.order_financials(order_id,business_id,agreed_total) values(md5('P04T01B:order:b')::uuid,'ea72a875-7511-4c1d-9d2c-c3f899b94bea',99);
insert into public.finance_audit_events(business_id,actor_id,event_type,entity_type,entity_id,payload) values('ea72a875-7511-4c1d-9d2c-c3f899b94bea','bb729a71-be76-4ff7-a7f6-0edd33361097','order_financials_initialized','order_financials',md5('P04T01B:order:b')::uuid,'{"mode":"copy_total_price","agreed_total":99}');
update public.orders set status='completed' where id=md5('P04T01B:order:b')::uuid;
set constraints all immediate;

reset role;select set_config('request.jwt.claims','{"sub":"a9eea14b-6c1c-4631-9a0e-4c6c62efe501","role":"authenticated","user_metadata":{"role":"owner","business_id":"ea72a875-7511-4c1d-9d2c-c3f899b94bea"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
r:=public.statistics_v1_products('today',null,null);q:=public.statistics_v1_summary('today',null,null);
if r->>'businessId'<>'108722c0-a80f-4d5b-98ee-6c99f44cdb23' then raise exception 'TENANT';end if;
raise notice '%',jsonb_build_object('test','period.today','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','period.today','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"a9eea14b-6c1c-4631-9a0e-4c6c62efe501","role":"authenticated","user_metadata":{"role":"owner","business_id":"ea72a875-7511-4c1d-9d2c-c3f899b94bea"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
r:=public.statistics_v1_products('yesterday',null,null);q:=public.statistics_v1_summary('yesterday',null,null);
if r->>'businessId'<>'108722c0-a80f-4d5b-98ee-6c99f44cdb23' then raise exception 'TENANT';end if;
raise notice '%',jsonb_build_object('test','period.yesterday','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','period.yesterday','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"a9eea14b-6c1c-4631-9a0e-4c6c62efe501","role":"authenticated","user_metadata":{"role":"owner","business_id":"ea72a875-7511-4c1d-9d2c-c3f899b94bea"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
r:=public.statistics_v1_products('this_week',null,null);q:=public.statistics_v1_summary('this_week',null,null);
if r->>'businessId'<>'108722c0-a80f-4d5b-98ee-6c99f44cdb23' then raise exception 'TENANT';end if;
raise notice '%',jsonb_build_object('test','period.this_week','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','period.this_week','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"a9eea14b-6c1c-4631-9a0e-4c6c62efe501","role":"authenticated","user_metadata":{"role":"owner","business_id":"ea72a875-7511-4c1d-9d2c-c3f899b94bea"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
r:=public.statistics_v1_products('this_month',null,null);q:=public.statistics_v1_summary('this_month',null,null);
if r->>'businessId'<>'108722c0-a80f-4d5b-98ee-6c99f44cdb23' then raise exception 'TENANT';end if;
raise notice '%',jsonb_build_object('test','period.this_month','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','period.this_month','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"a9eea14b-6c1c-4631-9a0e-4c6c62efe501","role":"authenticated","user_metadata":{"role":"owner","business_id":"ea72a875-7511-4c1d-9d2c-c3f899b94bea"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
r:=public.statistics_v1_products('previous_month',null,null);q:=public.statistics_v1_summary('previous_month',null,null);
if r->>'businessId'<>'108722c0-a80f-4d5b-98ee-6c99f44cdb23' then raise exception 'TENANT';end if;
raise notice '%',jsonb_build_object('test','period.previous_month','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','period.previous_month','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"a9eea14b-6c1c-4631-9a0e-4c6c62efe501","role":"authenticated","user_metadata":{"role":"owner","business_id":"ea72a875-7511-4c1d-9d2c-c3f899b94bea"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
r:=public.statistics_v1_products('last_7_days',null,null);q:=public.statistics_v1_summary('last_7_days',null,null);
if r->>'businessId'<>'108722c0-a80f-4d5b-98ee-6c99f44cdb23' then raise exception 'TENANT';end if;
raise notice '%',jsonb_build_object('test','period.last_7_days','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','period.last_7_days','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"a9eea14b-6c1c-4631-9a0e-4c6c62efe501","role":"authenticated","user_metadata":{"role":"owner","business_id":"ea72a875-7511-4c1d-9d2c-c3f899b94bea"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
r:=public.statistics_v1_products('last_30_days',null,null);q:=public.statistics_v1_summary('last_30_days',null,null);
if r->>'businessId'<>'108722c0-a80f-4d5b-98ee-6c99f44cdb23' then raise exception 'TENANT';end if;
raise notice '%',jsonb_build_object('test','period.last_30_days','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','period.last_30_days','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"a9eea14b-6c1c-4631-9a0e-4c6c62efe501","role":"authenticated","user_metadata":{"role":"owner","business_id":"ea72a875-7511-4c1d-9d2c-c3f899b94bea"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
r:=public.statistics_v1_products('custom',current_date-1,current_date);q:=public.statistics_v1_summary('custom',current_date-1,current_date);
if r->>'businessId'<>'108722c0-a80f-4d5b-98ee-6c99f44cdb23' then raise exception 'TENANT';end if;
raise notice '%',jsonb_build_object('test','period.custom','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','period.custom','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"a9eea14b-6c1c-4631-9a0e-4c6c62efe501","role":"authenticated","user_metadata":{"role":"owner","business_id":"ea72a875-7511-4c1d-9d2c-c3f899b94bea"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
r:=public.statistics_v1_products('today',null,null,'units',20);if r#>>'{totals,units,value}'<>'8' or (r#>>'{totals,revenue,value}')::numeric<>90 or r#>>'{ranking,totalProducts}'<>'7' then raise exception 'EXACT_CONSERVATION %',r;end if;
raise notice '%',jsonb_build_object('test','exact.money_units_homonyms','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','exact.money_units_homonyms','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"bb729a71-be76-4ff7-a7f6-0edd33361097","role":"authenticated","user_metadata":{"role":"owner","business_id":"108722c0-a80f-4d5b-98ee-6c99f44cdb23"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
r:=public.statistics_v1_products('today');if (r#>>'{totals,revenue,value}')::numeric<>99 or r#>>'{totals,units,value}'<>'1' then raise exception 'TENANT_B';end if;
raise notice '%',jsonb_build_object('test','tenant.b','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','tenant.b','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"a9eea14b-6c1c-4631-9a0e-4c6c62efe501","role":"authenticated","user_metadata":{"role":"owner","business_id":"ea72a875-7511-4c1d-9d2c-c3f899b94bea"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
foreach name in array array['orders','order_items','order_financials','store_sessions','store_session_statistics_snapshots','business_statistics_state','order_item_statistics_snapshots','order_statistics_completions','order_statistics_completion_items','business_settings','products','categories'] loop
 if name='order_items' then execute 'select count(*) from public.order_items i join public.orders o on o.id=i.order_id where o.business_id<>$1' into n using '108722c0-a80f-4d5b-98ee-6c99f44cdb23'::uuid;
 else execute format('select count(*) from public.%I where business_id<>$1',name) into n using '108722c0-a80f-4d5b-98ee-6c99f44cdb23'::uuid;end if;if n<>0 then raise exception 'RLS_CROSS_TENANT %',name;end if;end loop;
raise notice '%',jsonb_build_object('test','rls.cross_tenant_sources','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','rls.cross_tenant_sources','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"a9eea14b-6c1c-4631-9a0e-4c6c62efe501","role":"authenticated","user_metadata":{"role":"owner","business_id":"ea72a875-7511-4c1d-9d2c-c3f899b94bea"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
r:=public.statistics_v1_products('today',null,null,'units',5);q:=public.statistics_v1_products('today',null,null,'units',5,r#>'{ranking,nextCursor}');if jsonb_array_length(q#>'{ranking,items}')<>2 or q#>>'{ranking,items,0,position}'<>'6' then raise exception 'PAGINATION';end if;
raise notice '%',jsonb_build_object('test','pagination.cursor_ties','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','pagination.cursor_ties','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"a9eea14b-6c1c-4631-9a0e-4c6c62efe501","role":"authenticated","user_metadata":{"role":"owner","business_id":"ea72a875-7511-4c1d-9d2c-c3f899b94bea"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
q:=public.statistics_v1_products('today',null,null,'units',5);perform set_config('request.jwt.claims','{"sub":"bb729a71-be76-4ff7-a7f6-0edd33361097","role":"authenticated"}',true);begin r:=public.statistics_v1_products('today',null,null,'units',5,q#>'{ranking,nextCursor}');exception when others then code:=sqlstate;end;if code is distinct from '22023' then raise exception 'FOREIGN_CURSOR';end if;
raise notice '%',jsonb_build_object('test','cursor.foreign','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','cursor.foreign','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"a9eea14b-6c1c-4631-9a0e-4c6c62efe501","role":"authenticated","user_metadata":{"role":"owner","business_id":"ea72a875-7511-4c1d-9d2c-c3f899b94bea"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
begin r:=public.statistics_v1_products('today',null,null,'units',5,'{"asOf":"not a date"}'::jsonb);exception when others then code:=sqlstate;end;if code is distinct from '22023' then raise exception 'INVALID_CURSOR';end if;
raise notice '%',jsonb_build_object('test','cursor.invalid','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','cursor.invalid','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;select set_config('request.jwt.claims','{"sub":"a9eea14b-6c1c-4631-9a0e-4c6c62efe501","role":"authenticated","user_metadata":{"role":"owner","business_id":"ea72a875-7511-4c1d-9d2c-c3f899b94bea"}}',true);set local role authenticated;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
r:=public.statistics_v1_products('today',null,null,'units',5);set local timezone='Pacific/Auckland';set local datestyle='ISO, DMY';begin q:=public.statistics_v1_products('today',null,null,'units',5,r#>'{ranking,nextCursor}');exception when others then get stacked diagnostics code=returned_sqlstate,msg=message_text;end;set local timezone='UTC';set local datestyle='ISO, MDY';if code is not null then raise exception 'SQL05_CURSOR_SETTINGS: % %',code,msg;end if;
raise notice '%',jsonb_build_object('test','risk.SQL05.session_settings','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','risk.SQL05.session_settings','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
update public.order_financials set agreed_total=31 where order_id=md5('P04T01B:order:1')::uuid;set local role authenticated;r:=public.statistics_v1_products('today');reset role;if r#>>'{totals,revenue,quality}'<>'partial' or (r#>>'{totals,revenue,value}')::numeric<>60 then raise exception 'PARTIAL_RECONCILIATION';end if;update public.order_financials set agreed_total=30 where order_id=md5('P04T01B:order:1')::uuid;
raise notice '%',jsonb_build_object('test','financial.partial_adjustment','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','financial.partial_adjustment','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
update public.order_financials set agreed_total='NaN'::numeric where order_id=md5('P04T01B:order:2')::uuid;set local role authenticated;r:=public.statistics_v1_products('today');reset role;if r#>>'{coverage,pendingAgreedTotal}'='NaN' then raise exception 'SQL07_NONFINITE_PENDING_TOTAL';end if;
raise notice '%',jsonb_build_object('test','risk.SQL07.nonfinite_source','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','risk.SQL07.nonfinite_source','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
update public.orders set status='in_progress' where id=md5('P04T01B:order:3')::uuid;set local role authenticated;r:=public.statistics_v1_products('today');reset role;if r#>>'{coverage,eligibleOrders}'<>'6' then raise exception 'REOPEN';end if;update public.orders set status='cancelled' where id=md5('P04T01B:order:3')::uuid;update public.orders set status='completed' where id=md5('P04T01B:order:3')::uuid;set local role authenticated;r:=public.statistics_v1_products('today');reset role;if r#>>'{coverage,eligibleOrders}'<>'7' then raise exception 'RECOMPLETE';end if;if (select count(*) from public.order_statistics_completions where order_id=md5('P04T01B:order:3')::uuid and active)<>1 then raise exception 'DUPLICATED_CYCLE';end if;
raise notice '%',jsonb_build_object('test','states.reopen_cancel_recomplete','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','states.reopen_cancel_recomplete','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
update public.products set name='Renamed current catalog' where id=md5('P04T01B:product:4')::uuid;delete from public.products where id=md5('P04T01B:product:5')::uuid;set local role authenticated;r:=public.statistics_v1_products('today',null,null,'units',20);reset role;if not exists(select 1 from jsonb_array_elements(r#>'{ranking,items}') x where x->>'identity'=md5('P04T01B:product:5')::uuid::text and x->>'label'='Synthetic homonym') or exists(select 1 from jsonb_array_elements(r#>'{ranking,items}') x where x->>'label'='Renamed current catalog') then raise exception 'HISTORICAL_IDENTITY';end if;
raise notice '%',jsonb_build_object('test','history.rename_delete','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','history.rename_delete','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
delete from public.order_statistics_completion_items where completion_id in(select id from public.order_statistics_completions where order_id=md5('P04T01B:order:6')::uuid);set local role authenticated;r:=public.statistics_v1_products('today');reset role;if r#>>'{coverage,ordersWithoutCapturedLines}'<>'1' or r#>>'{totals,units,quality}'<>'partial' then raise exception 'MISSING_CAPTURE';end if;
raise notice '%',jsonb_build_object('test','history.no_captured_lines','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','history.no_captured_lines','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
insert into public.orders(id,business_id,customer_name,phone,delivery_date,delivery_method,total_price,status,order_code) values(md5('P04T01B:historical')::uuid,'108722c0-a80f-4d5b-98ee-6c99f44cdb23','Synthetic historical without proof','0000000000',current_date,'pickup',40,'completed','ZH2345');set local role authenticated;r:=public.statistics_v1_products('today');reset role;if r#>>'{coverage,historicalWithoutDate}'<>'1' or r#>>'{totals,revenue,quality}'<>'partial' or r#>>'{coverage,eligibleOrders}'<>'7' then raise exception 'HISTORICAL_COVERAGE';end if;
raise notice '%',jsonb_build_object('test','history.no_reliable_date','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','history.no_reliable_date','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
-- Explicit synthetic analytical evidence, not a claim that the current NOT NULL catalog can capture absent categories.
update public.order_item_statistics_snapshots set category_identity=null,category_name=null where source_item_id=md5('P04T01B:line:4')::uuid;
update public.order_statistics_completion_items set category_identity=null,category_name=null where line_key=md5('P04T01B:line:4')::uuid;
update public.order_statistics_completion_items set category_identity=null,category_name=null where line_key=md5('P04T01B:line:5')::uuid;
set local role authenticated;r:=public.statistics_v1_products('today');reset role;if not exists(select 1 from jsonb_array_elements(r->'categories') x where x->>'kind'='uncategorized_verified') or not exists(select 1 from jsonb_array_elements(r->'categories') x where x->>'kind'='attribution_unknown') then raise exception 'ABSENT_VS_UNKNOWN';end if;
raise notice '%',jsonb_build_object('test','history.no_category_vs_unknown','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','history.no_category_vs_unknown','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
update public.order_statistics_completion_items set category_identity=null,category_name=null where line_key=md5('P04T01B:upsell')::uuid;set local role authenticated;r:=public.statistics_v1_products('today');reset role;if not exists(select 1 from jsonb_array_elements(r->'categories') x where x->>'kind'='attribution_unknown' and x#>>'{units,value}'='0' and (x->>'unitShare')::numeric=0 and (x#>>'{revenue,value}')::numeric=10) then raise exception 'EMPTY_UPSELL_UNITS_SHARE';end if;
raise notice '%',jsonb_build_object('test','upsell.only_category_zero_units','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','upsell.only_category_zero_units','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
insert into public.store_sessions(id,business_id,opened_at,status) values(md5('P04T01B:night')::uuid,'108722c0-a80f-4d5b-98ee-6c99f44cdb23',((clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')::date-1+time '20:00') at time zone 'America/Argentina/Buenos_Aires','open');update public.orders set status='in_progress' where id=md5('P04T01B:order:1')::uuid;update public.orders set status='completed' where id=md5('P04T01B:order:1')::uuid;set local role authenticated;r:=public.statistics_v1_products('today');reset role;if r#>>'{totals,units,value}'<>'2' or r#>>'{period,referenceDate}'<>((clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')::date-1)::text then raise exception 'NIGHT_COMMERCIAL_DAY';end if;
raise notice '%',jsonb_build_object('test','time.night_session','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','time.night_session','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
set local role authenticated;r:=public.statistics_v1_products('today',null,null,'units',5);reset role;
update public.order_statistics_completions set completed_at=(r#>>'{period,asOf}')::timestamptz+interval '1 microsecond' where order_id=md5('P04T01B:order:7')::uuid and active;
set local role authenticated;q:=public.statistics_v1_products('today',null,null,'units',5,(r#>'{ranking,nextCursor}')||'{"offset":0}'::jsonb);reset role;if q#>>'{coverage,eligibleOrders}'<>'6' then raise exception 'ASOF_PLUS_MICROSECOND';end if;
update public.order_statistics_completions set completed_at=(r#>>'{period,asOf}')::timestamptz where order_id=md5('P04T01B:order:7')::uuid and active;
set local role authenticated;q:=public.statistics_v1_products('today',null,null,'units',5,(r#>'{ranking,nextCursor}')||'{"offset":0}'::jsonb);reset role;if q#>>'{coverage,eligibleOrders}'<>'7' then raise exception 'ASOF_EXACT_BOUNDARY';end if;r:=q;
raise notice '%',jsonb_build_object('test','time.microseconds_asof','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','time.microseconds_asof','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
update public.order_statistics_completions set completed_at='2026-03-08 07:00:00.000001+00',commercial_date='2026-03-08',timezone='America/New_York' where order_id=md5('P04T01B:order:6')::uuid and active;
set local role authenticated;r:=public.statistics_v1_products('custom','2026-03-08','2026-03-08');if r#>>'{coverage,eligibleOrders}'<>'1' then raise exception 'DST_STORED_DATE';end if;if private.statistics_local_cutoff('2026-03-08','02:30','America/New_York') is not null or private.statistics_local_cutoff('2026-11-01','01:30','America/New_York') is not null then raise exception 'DST_GAP_FOLD';end if;reset role;
raise notice '%',jsonb_build_object('test','time.dst_stored_commercial_date','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','time.dst_stored_commercial_date','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

reset role;
do $test$ declare r jsonb;q jsonb;code text;msg text;detail text;ctx text;name text;n bigint;begin
 begin
set local role authenticated;r:=public.statistics_v1_products('today',null,null,'units',5);reset role;update public.orders set status='in_progress' where id=md5('P04T01B:order:7')::uuid;set constraints all immediate;set local role authenticated;begin q:=public.statistics_v1_products('today',null,null,'units',5,r#>'{ranking,nextCursor}');exception when others then code:=sqlstate;end;reset role;if code is distinct from '22023' then raise exception 'STALE_REVISION_ACCEPTED';end if;
raise notice '%',jsonb_build_object('test','cursor.revision_invalidation','status','PASS','data',r,'summary',q,'observedSqlstate',code)::text;
raise exception 'TEST_SUCCESS_SUBTRANSACTION_ROLLBACK' using errcode='Z0001';
exception when sqlstate 'Z0001' then null;when others then get stacked diagnostics code=returned_sqlstate,msg=message_text,detail=pg_exception_detail,ctx=pg_exception_context;raise notice '%',jsonb_build_object('test','cursor.revision_invalidation','status','FAIL','sqlstate',code,'message',msg,'detail',detail,'context',ctx,'data',r,'summary',q)::text;end;end $test$;
reset role;

RESET ROLE;
ROLLBACK;
SELECT json_build_object('rollbackReached',true,'productsAbsent',to_regprocedure('public.statistics_v1_products(text,date,date,text,integer,jsonb)') is null);
