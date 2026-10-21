-- Synthetic temporal factory only, not historical backfill: explicit invented test instants.
-- Captures are generated normally, then ONLY owned analytical fields are placed at those instants.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
do $$ begin if current_setting('statistics.test_token',true) is distinct from
  (select token from statistics_test_environment.identity where singleton) then raise exception 'ISOLATED_TOKEN_REQUIRED';end if;end $$;
create function pg_temp.assert_true(ok boolean,message text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'ASSERT: %',message;end if;end $$;
create temporary table paired_context as select b.id business_id,p.id actor,
  (statement_timestamp() at time zone s.timezone)::date as day,s.timezone tz
  from public.businesses b join public.profiles p on p.business_id=b.id and p.role='owner'
  join public.business_settings s on s.business_id=b.id where b.slug='statistics-synthetic-a';
do $$ begin perform set_config('request.jwt.claims',(select jsonb_build_object('sub',actor,'role','authenticated')::text from paired_context),true);end $$;
create temporary table paired_sessions as select gen_random_uuid() id,side,
  ((c.day-shift)+time '22:00:00') at time zone c.tz lo,
  ((c.day-shift+1)+time '01:00:00') at time zone c.tz hi
  from paired_context c cross join (values ('current',1),('previous',2)) z(side,shift);
insert into public.store_sessions(id,business_id,opened_at,closed_at,status)
select s.id,c.business_id,s.lo,s.hi,'closed' from paired_sessions s cross join paired_context c;
create temporary table paired_orders as select gen_random_uuid() id,s.id sid,s.side,s.lo,
  s.lo+o.dt as at,n+case when s.side='previous' then 5 else 0 end code
  from paired_sessions s cross join (values
    (1,interval '0'),(2,interval '1 hour'-interval '1 microsecond'),
    (3,interval '1 hour'),(4,interval '1 hour'+interval '1 microsecond'),(5,interval '3 hours')) o(n,dt);
insert into public.orders(id,business_id,customer_name,phone,delivery_date,delivery_method,total_price,composition_status,order_code)
select o.id,c.business_id,'SYNTHETIC P03-B PAIRED','0000000000',current_date,'pickup',10,'itemized',
  'P3C22'||substr('23456789ABCDEFGHJKMNPQRSTUVWXYZ',o.code,1) from paired_orders o cross join paired_context c;
insert into public.order_items(order_id,product_name,quantity,unit_price) select id,'Synthetic paired main',1,10 from paired_orders;
insert into public.order_financials(order_id,business_id,agreed_total) select o.id,c.business_id,10 from paired_orders o cross join paired_context c;
insert into public.finance_audit_events(business_id,actor_id,event_type,entity_type,entity_id,payload)
select c.business_id,c.actor,'order_financials_initialized','order_financials',o.id,'{"mode":"copy_total_price","agreed_total":10}'::jsonb from paired_orders o cross join paired_context c;
update public.orders set status='completed' where id in(select id from paired_orders);
update public.order_statistics_completions f set completed_at=o.at,session_id=o.sid,session_key=o.sid,
  session_opened_at=o.lo,timezone=c.tz,commercial_date=(o.lo at time zone c.tz)::date,
  date_kind='verified_session',date_conflict=false
  from paired_orders o cross join paired_context c where f.order_id=o.id and f.active;
set constraints statistics_v1_order_revision,statistics_v1_item_revision,statistics_v1_financial_revision,statistics_v1_session_revision immediate;
grant select on paired_context to authenticated;
set local role authenticated;
do $$ declare a jsonb;b jsonb;d date;counts numeric[];begin
  select day-1 into d from paired_context;
  select private.statistics_v1_summary_base('custom',d,d),public.statistics_v1_summary('custom',d,d) into a,b;
  perform pg_temp.assert_true(b-'series'=a,'paired nonempty same-snapshot JSON equality');
  perform pg_temp.assert_true(b#>>'{series,resolution}'='hour' and jsonb_array_length(b#>'{series,points}')=3,'three physical nocturnal intervals');
  perform pg_temp.assert_true((b#>>'{series,totalAlignment,available}')::boolean,'paired exposures aligned');
  select array_agg((p#>>'{current,metrics,completedOrders,value}')::numeric order by (p#>>'{mapping,startSeconds}')::numeric) into counts from jsonb_array_elements(b#>'{series,points}') p;
  perform pg_temp.assert_true(counts=array[2,2,1]::numeric[],'opening/internal +-1us/closing membership');
  perform pg_temp.assert_true((select sum((p#>>'{previous,metrics,completedOrders,value}')::numeric)=5 and bool_and((p#>>'{comparisons,sales,available}')::boolean) from jsonb_array_elements(b#>'{series,points}') p),'prior conservation and valid per-point comparisons');
end $$;
reset role;
savepoint partial_case;
update public.store_sessions set status='open',closed_at=null where id=(select id from paired_sessions where side='current');
set local role authenticated;
do $$ declare a jsonb;b jsonb;d date;cut timestamptz;rev text;biz uuid;tz text;cursor jsonb;begin
  select c.day-1,c.business_id,c.tz,s.revision::text into d,biz,tz,rev from paired_context c join public.business_statistics_state s on s.business_id=c.business_id;
  select opened_at+interval '1 hour' into cut from public.store_sessions where id=(select session_id from public.store_session_statistics_snapshots where business_id=biz and commercial_date=d);
  -- Explicit synthetic freeze cursor uses the unchanged documented legacy key, not a new API contract.
  cursor:=jsonb_build_object('asOf',cut,'revision',rev,'offset',0,'requestKey',md5(biz::text||'custom'||d::text||d::text||'units'||rev||tz||cut::text));
  select private.statistics_v1_summary_base('custom',d,d,'units',5,cursor),public.statistics_v1_summary('custom',d,d,'units',5,cursor) into a,b;
  perform pg_temp.assert_true(b-'series'=a,'partial nonempty same-snapshot legacy equality');
  perform pg_temp.assert_true((b#>>'{period,partial}')::boolean and (b#>>'{series,totalAlignment,available}')::boolean,'verified partial correspondence');
  perform pg_temp.assert_true(jsonb_array_length(b#>'{series,points}')=1 and b#>>'{metrics,completedOrders,value}'='3' and b#>>'{previousMetrics,completedOrders,value}'='3','exact asOf includes equality, excludes +1us on both sides');
end $$;
reset role;
rollback to partial_case;
release partial_case;
-- Extend only the synthetic prior session to exercise unmatched tails without inventing current intervals.
update public.store_sessions set closed_at=closed_at+interval '1 hour' where id=(select id from paired_sessions where side='previous');
set local role authenticated;
do $$ declare b jsonb;d date;begin
  select day-1 into d from paired_context;b:=public.statistics_v1_summary('custom',d,d);
  perform pg_temp.assert_true(jsonb_array_length(b#>'{series,points}')=4,'unequal duration union');
  perform pg_temp.assert_true(exists(select 1 from jsonb_array_elements(b#>'{series,points}') p where p->'current'='null'::jsonb and p#>>'{alignment,reason}'='missing_counterpart'),'explicit absent side at tail');
  perform pg_temp.assert_true((select sum((p#>>'{current,metrics,completedOrders,value}')::numeric)=5 and sum((p#>>'{previous,metrics,completedOrders,value}')::numeric)=5 from jsonb_array_elements(b#>'{series,points}') p),'no omitted facts after unequal exposure');
end $$;
reset role;
-- Real RPC sizing boundary: many positive 1us exposures, no fake hourly extent.
insert into public.store_sessions(id,business_id,opened_at,closed_at,status)
select gen_random_uuid(),c.business_id,((c.day-shift)+time '10:00:00') at time zone c.tz+n*interval '2 microseconds',
  ((c.day-shift)+time '10:00:00') at time zone c.tz+n*interval '2 microseconds'+interval '1 microsecond','closed'
  from paired_context c cross join (values (4),(5)) z(shift) cross join generate_series(1,199) n;
set local role authenticated;
do $$ declare b jsonb;d date;begin
  select day-4 into d from paired_context;b:=public.statistics_v1_summary('custom',d,d);
  perform pg_temp.assert_true(b#>>'{series,resolution}'='hour' and jsonb_array_length(b#>'{series,points}')=199,'199 short paired sessions are bounded');
end $$;
reset role;
insert into public.store_sessions(id,business_id,opened_at,closed_at,status)
select gen_random_uuid(),c.business_id,((c.day-shift)+time '10:00:00') at time zone c.tz+interval '400 microseconds',
  ((c.day-shift)+time '10:00:00') at time zone c.tz+interval '401 microseconds','closed'
  from paired_context c cross join (values (4),(5)) z(shift);
set local role authenticated;
do $$ declare b jsonb;d date;begin
  select day-4 into d from paired_context;b:=public.statistics_v1_summary('custom',d,d);
  perform pg_temp.assert_true(b#>>'{series,resolution}'='day' and b#>>'{series,resolutionReason}'='point_limit' and jsonb_array_length(b#>'{series,points}')=1,'200 paired sessions fall back before generation');
end $$;
reset role;
select pg_temp.assert_true(private.statistics_local_cutoff('2026-10-04','02:15:00','Australia/Lord_Howe') is null,'30 minute DST gap');
select pg_temp.assert_true(private.statistics_local_cutoff('2026-04-05','01:45:00','Australia/Lord_Howe') is null,'30 minute DST fold');
select pg_temp.assert_true(private.statistics_local_cutoff('2026-10-13','00:00:00','Asia/Kathmandu')='2026-10-12T18:15:00Z'::timestamptz,'45 minute timezone offset');
rollback;
