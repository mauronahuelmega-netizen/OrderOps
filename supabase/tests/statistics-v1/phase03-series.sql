-- PREPARED, NOT EXECUTED. Requires separate P03-B approval and isolation verifier.
-- Synthetic fixtures only. Everything, including temporary functions, rolls back.
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';
do $$ begin
  if current_setting('statistics.test_token',true) is distinct from
    (select token from statistics_test_environment.identity where singleton) then
    raise exception 'ISOLATED_TOKEN_REQUIRED';
  end if;
  if coalesce(current_setting('statistics.p03b_approved',true),'')<>'true' then
    raise exception 'SEPARATE_P03B_APPROVAL_REQUIRED';
  end if;
  if to_regprocedure('private.statistics_v1_series_response(text,date,date,text,integer,jsonb)') is null then
    raise exception 'REVIEWED_SERIES_MIGRATION_REQUIRED';
  end if;
end $$;
create function pg_temp.assert_true(ok boolean,message text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'ASSERT: %',message; end if; end;
$$;
create temporary table p03_roles as
select p.id,p.role,p.business_id from public.profiles p join public.businesses b on b.id=p.business_id
where b.slug in ('statistics-synthetic-a','statistics-synthetic-b');
select pg_temp.assert_true((select count(*)=12 and count(distinct business_id)=2 from p03_roles),'two synthetic tenants and six original roles each');

-- Nonempty captured cohort in both tenants, with upsell once in money and excluded units.
do $$ declare b uuid;actor uuid;s uuid;o uuid;main uuid;begin
  for b in select distinct business_id from p03_roles loop
    select id into actor from p03_roles where business_id=b and role='owner';
    perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
    s:=gen_random_uuid();o:=gen_random_uuid();main:=gen_random_uuid();
    insert into public.store_sessions(id,business_id,opened_at) values(s,b,clock_timestamp()-interval '4 hours');
    insert into public.orders(id,business_id,customer_name,phone,delivery_date,delivery_method,total_price,composition_status,order_code)
      values(o,b,'SYNTHETIC P03-A','0000000000',current_date,'pickup',23,'itemized','P3A222');
    insert into public.order_items(id,order_id,product_name,quantity,unit_price)
      values(main,o,'Synthetic main',2,10);
    insert into public.order_items(order_id,product_name,quantity,unit_price,item_kind,parent_order_item_id)
      values(o,'Synthetic upsell',1,3,'upsell',main);
    insert into public.order_financials(order_id,business_id,agreed_total) values(o,b,23);
    insert into public.finance_audit_events(business_id,actor_id,event_type,entity_type,entity_id,payload)
      values(b,actor,'order_financials_initialized','order_financials',o,'{"mode":"copy_total_price","agreed_total":23}');
    update public.orders set status='completed' where id=o;
    update public.store_sessions set status='closed',closed_at=clock_timestamp() where id=s;
  end loop;
end $$;
set constraints statistics_v1_order_revision,statistics_v1_item_revision,statistics_v1_financial_revision,statistics_v1_session_revision immediate;
grant select on p03_roles to authenticated;
set local role authenticated;
do $$ declare p record;old jsonb;new jsonb;direct jsonb;period text;denied boolean;day date;begin
  for p in select * from p03_roles loop
    perform set_config('request.jwt.claims',jsonb_build_object('sub',p.id,'role','authenticated')::text,true);
    if p.role in ('owner','manager','admin') then
      select (statement_timestamp() at time zone timezone)::date into day from public.business_settings where business_id=p.business_id;
      foreach period in array array['today','yesterday','this_week','this_month','previous_month','last_7_days','last_30_days','custom'] loop
        -- Both expressions use the same SQL snapshot and statement cutoff.
        select private.statistics_v1_summary_base(period,case when period='custom' then day-2 end,case when period='custom' then day end),
               public.statistics_v1_summary(period,case when period='custom' then day-2 end,case when period='custom' then day end)
          into old,new;
        perform pg_temp.assert_true(new-'series'=old,'every legacy field equal');
        perform pg_temp.assert_true(new->>'businessId'=p.business_id::text,'effective tenant from profile');
        perform pg_temp.assert_true(new#>>'{series,version}'='statistics.series.v1','extension capability');
        perform pg_temp.assert_true(new#>>'{series,snapshot,revision}'=new->>'revision','same revision');
        perform pg_temp.assert_true(new#>>'{series,snapshot,asOf}'=new#>>'{period,asOf}','same cutoff');
        perform pg_temp.assert_true(jsonb_array_length(new#>'{series,points}') between 1 and 200,'bounded points');
        perform pg_temp.assert_true(not exists(select 1 from jsonb_array_elements(new#>'{series,points}') point
          group by point->>'key' having count(*)>1),'unique correspondence keys');
        if not (new#>>'{comparison,available}')::boolean then
          perform pg_temp.assert_true(new#>'{series,previousRange}'='null'::jsonb,'previous range remains absent');
          perform pg_temp.assert_true(not exists(select 1 from jsonb_array_elements(new#>'{series,points}') point
            where point->'previous'<>'null'::jsonb or (point#>>'{alignment,available}')::boolean),'no fabricated comparison');
        end if;
      end loop;
      select private.statistics_v1_series_response('last_7_days'),public.statistics_v1_summary('last_7_days') into direct,new;
      perform pg_temp.assert_true(direct=new,'typed helper applies same guarded endpoint semantics');
      perform pg_temp.assert_true((select count(*)>0 from public.statistics_v1_effective_facts where business_id=p.business_id),'nonvacuous RLS');
      perform pg_temp.assert_true(not exists(select 1 from public.statistics_v1_effective_facts where business_id<>p.business_id),'cross-tenant rows denied');
    else
      denied:=false;begin perform public.statistics_v1_summary('today');exception when insufficient_privilege then denied:=true;end;
      perform pg_temp.assert_true(denied,'original role denied at endpoint');
      denied:=false;begin perform private.statistics_v1_series_response('today');exception when insufficient_privilege then denied:=true;end;
      perform pg_temp.assert_true(denied,'direct source helper cannot bypass role guard');
      denied:=false;begin perform private.statistics_v1_summary_base('today');exception when insufficient_privilege then denied:=true;end;
      perform pg_temp.assert_true(denied,'extracted legacy guard');
    end if;
  end loop;
end $$;
reset role;
-- Corrective arithmetic and timestamp predicates: prepared only, never an offline runtime claim.
do $$ declare lanes integer;variant integer;durations numeric[];d numeric;total numeric;maximum numeric;
  step numeric;points numeric;h constant numeric:=3600000000;begin
  for lanes in 1..199 loop
    for variant in 1..3 loop
      select array_agg(case variant when 1 then 1::numeric
        when 2 then i::numeric*h+1 else case when i=1 then 80000000::numeric*h+1 else 1 end end)
        into durations from generate_series(1,lanes) i;
      select sum(x),max(x) into total,maximum from unnest(durations) x;
      step:=least(div(maximum+h-1,h),greatest(1,div(total+(200-lanes)*h-1,(200-lanes)*h)));
      points:=0;
      foreach d in array durations loop points:=points+div(d+h*step-1,h*step);end loop;
      perform pg_temp.assert_true(points between 1 and 199,'exact arithmetic point bound');
    end loop;
  end loop;
  perform pg_temp.assert_true(div(199*h+h-1,h)=199,'199 exact hourly bins');
  perform pg_temp.assert_true(div(199*h+1+h-1,h)=200,'microsecond tail requires extra bin before resizing');
end $$;
with bounds as (select '2026-10-13T22:00:00.000001Z'::timestamptz lo,
  '2026-10-13T23:00:00.000001Z'::timestamptz mid,'2026-10-14T00:00:00.000002Z'::timestamptz hi),
bins as (select lo,mid hi,false inclusive from bounds union all select mid,hi,true from bounds),
events as (select t+o*interval '1 microsecond' as at from bounds
  cross join lateral unnest(array[lo,mid,hi]) t cross join generate_series(-1,1) o),
checks as (select e.at,(select count(*) from bins b where e.at>=b.lo and (e.at<b.hi or b.inclusive and e.at=b.hi)) n,
  case when e.at between bounds.lo and bounds.hi then 1 else 0 end expected from events e cross join bounds)
select pg_temp.assert_true(bool_and(n=expected),'nocturnal opening/internal/terminal/asOf microseconds') from checks;
-- Pure SQL arithmetic tests do not create another monetary source.
select pg_temp.assert_true(private.statistics_v1_series_delta('{"value":"99999999999999.99","quality":"exact"}',
  '{"value":"0.01","quality":"exact"}',true,null)->>'absolute'='99999999999999.98','numeric precision');
select pg_temp.assert_true(private.statistics_v1_series_delta('{"value":"1.00","quality":"exact"}',
  '{"value":"0.00","quality":"empty"}',true,null)->>'percentage' is null,'zero base has no percentage');
select pg_temp.assert_true(private.statistics_v1_series_delta('{"value":null,"quality":"unavailable"}',
  '{"value":"1.00","quality":"exact"}',true,null)->>'absolute' is null,'unknown is not zero');
select pg_temp.assert_true(private.statistics_local_cutoff('2026-03-08','02:30:00','America/New_York') is null,'DST gap');
select pg_temp.assert_true(private.statistics_local_cutoff('2026-11-01','01:30:00','America/New_York') is null,'DST fold');
select pg_temp.assert_true(not has_function_privilege('anon','public.statistics_v1_summary(text,date,date,text,integer,jsonb)','execute'),'anon denied');
select pg_temp.assert_true(not has_function_privilege('service_role','public.statistics_v1_summary(text,date,date,text,integer,jsonb)','execute'),'service-role bypass denied');
rollback;
