-- PROPOSED ONLY. No installation, existing function replacement, capture change or optimized candidate dependency.
begin;
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
commit;
