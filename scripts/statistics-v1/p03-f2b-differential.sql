-- Single-statement pairs, minimal captured fixture from the runner. No JSON normalization.
select set_config('statistics.f2b.actor',(select p.id::text from public.profiles p join public.businesses b on b.id=p.business_id where b.slug='statistics-synthetic-a' and p.role='owner'),true);
select set_config('statistics.f2b.owners',(select jsonb_agg(p.id)::text from public.profiles p join public.businesses b on b.id=p.business_id where b.slug in ('statistics-synthetic-a','statistics-synthetic-b') and p.role='owner'),true);
set local role authenticated;
do $$ declare a jsonb;b jsonb;c jsonb;d jsonb;period text;sort text;sd date;ed date;n integer:=0;cur jsonb;original_code text;candidate_code text;begin
 perform set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('statistics.f2b.actor'),'role','authenticated')::text,true);
 foreach period in array array['today','yesterday','this_week','this_month','previous_month','last_7_days','last_30_days','custom'] loop
  foreach sort in array array['units','amount'] loop
   sd:=case when period='custom' then current_date-30 end;ed:=case when period='custom' then current_date end;
   select public.statistics_v1_summary(period,sd,ed,sort,1,null),private.statistics_v1_summary_candidate(period,sd,ed,sort,1,null),
    private.statistics_v1_summary_base(period,sd,ed,sort,1,null),private.statistics_v1_summary_base_candidate(period,sd,ed,sort,1,null) into a,b,c,d;
   if a is distinct from b or c is distinct from d or a-'series' is distinct from c then
    raise notice 'DIFF_CONTEXT period=% sort=%',period,sort;
    raise notice 'ORIGINAL_JSON=%',a;
    raise notice 'CANDIDATE_JSON=%',b;
    raise notice 'ORIGINAL_BASE_JSON=%',c;
    raise notice 'CANDIDATE_BASE_JSON=%',d;
    raise exception 'F2B_COMPLETE_JSON_DIVERGENCE';
   end if;
   cur:=a#>'{products,nextCursor}';
   if cur is not null and cur<>'null'::jsonb then
    select public.statistics_v1_summary(period,sd,ed,sort,1,cur),private.statistics_v1_summary_candidate(period,sd,ed,sort,1,cur) into a,b;
    if a is distinct from b then raise notice 'ORIGINAL_JSON=%',a;raise notice 'CANDIDATE_JSON=%',b;raise exception 'CURSOR_DIVERGENCE';end if;
   end if;
   n:=n+1;
  end loop;
 end loop;
 original_code:=null;candidate_code:=null;
 begin perform public.statistics_v1_summary('today',null,null,'units',5,'null'::jsonb);exception when others then original_code:=sqlstate;end;
 begin perform private.statistics_v1_summary_candidate('today',null,null,'units',5,'null'::jsonb);exception when others then candidate_code:=sqlstate;end;
 if original_code is distinct from '22023' or candidate_code is distinct from original_code then raise exception 'INVALID_CURSOR_ERROR_DIVERGENCE';end if;
 raise notice 'PASS % original/candidate same-snapshot full JSON comparisons',n;
end $$;
reset role;
-- Additional admitted error inputs: compare SQLSTATE, never reinterpret errors as equal data.
set local role authenticated;
do $$ declare args text;oa text;ca text;begin
 foreach args in array array[quote_literal('invalid_period'),quote_literal('today')||',null,null,'||quote_literal('invalid_sort'),quote_literal('today')||',null,null,'||quote_literal('units')||',0',quote_literal('today')||',null,null,'||quote_literal('units')||',5,'||quote_literal('{"asOf":"invalid-time"}')||'::jsonb'] loop
  oa:=null;ca:=null;
  begin execute 'select public.statistics_v1_summary('||args||')';exception when others then oa:=sqlstate;end;
  begin execute 'select private.statistics_v1_summary_candidate('||args||')';exception when others then ca:=sqlstate;end;
  if oa is null or ca is distinct from oa then raise exception 'SQLSTATE_DIVERGENCE';end if;
 end loop;
end $$;
reset role;
-- A partial verified exposure. Only the explicitly seeded temporal fixture has this session.
update public.store_sessions set status='open',closed_at=null where id=md5('F2B:night:current')::uuid;
set local role authenticated;
do $$ declare a jsonb;b jsonb;d date;cut timestamptz;biz uuid;tz text;rev text;cur jsonb;begin
 if exists(select 1 from public.store_sessions where id=md5('F2B:night:current')::uuid) then
  select s.business_id,(s.opened_at at time zone snap.timezone)::date,s.opened_at+interval '1 hour',snap.timezone,bs.revision::text into biz,d,cut,tz,rev
   from public.store_sessions s join public.store_session_statistics_snapshots snap on snap.session_id=s.id join public.business_statistics_state bs on bs.business_id=s.business_id where s.id=md5('F2B:night:current')::uuid;
  cur:=jsonb_build_object('asOf',cut,'revision',rev,'offset',0,'requestKey',md5(biz::text||'custom'||d::text||d::text||'units'||rev||tz||cut::text));
  select public.statistics_v1_summary('custom',d,d,'units',5,cur),private.statistics_v1_summary_candidate('custom',d,d,'units',5,cur) into a,b;
  if a is distinct from b then raise notice 'ORIGINAL_JSON=%',a;raise notice 'CANDIDATE_JSON=%',b;raise exception 'PARTIAL_MICROSECOND_DIVERGENCE';end if;
  if a#>>'{metrics,completedOrders,value}' is distinct from '3' or a#>>'{previousMetrics,completedOrders,value}' is distinct from '3' then raise exception 'PARTIAL_BOUNDARY_FIXTURE_INVALID';end if;
 end if;
end $$;
reset role;
-- Shared timezone primitives: retained original helpers, with candidate responses tested above.
do $$ begin
 if private.statistics_local_cutoff('2026-10-04','02:15','Australia/Lord_Howe') is not null or private.statistics_local_cutoff('2026-04-05','01:45','Australia/Lord_Howe') is not null then raise exception 'DST_GAP_FOLD';end if;
 if private.statistics_local_cutoff('2026-10-13','00:00','Asia/Kathmandu') is distinct from '2026-10-12T18:15:00Z'::timestamptz then raise exception 'TIMEZONE_OFFSET';end if;
end $$;
