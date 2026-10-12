-- PREPARED FOR REVIEW: invoker reads, strict original roles, no application writers.
create policy statistics_state_read on public.business_statistics_state for select to authenticated using(private.statistics_can_read(business_id));
create policy statistics_session_read on public.store_session_statistics_snapshots for select to authenticated using(private.statistics_can_read(business_id));
create policy statistics_identity_read on public.order_item_statistics_snapshots for select to authenticated using(private.statistics_can_read(business_id));
create policy statistics_completion_read on public.order_statistics_completions for select to authenticated using(private.statistics_can_read(business_id));
create policy statistics_completion_item_read on public.order_statistics_completion_items for select to authenticated using(private.statistics_can_read(business_id));
grant select on public.business_statistics_state,public.store_session_statistics_snapshots,public.order_item_statistics_snapshots,public.order_statistics_completions,public.order_statistics_completion_items to authenticated;
grant execute on function private.statistics_source_items(uuid,uuid),private.statistics_source_digest(jsonb) to authenticated;

create function private.statistics_metric(p_value text,p_known bigint,p_unknown bigint,p_reasons text[]) returns jsonb language sql immutable
set search_path=pg_catalog as $$
  select jsonb_build_object('value',p_value,'knownCount',p_known,'unknownCount',p_unknown,
    'quality',case when p_unknown>0 then case when p_known>0 then 'partial' else 'unavailable' end when p_known=0 then 'empty' else 'exact' end,
    'reasons',to_jsonb(p_reasons));
$$;
revoke all on function private.statistics_metric(text,bigint,bigint,text[]) from public,anon,authenticated,service_role;
grant execute on function private.statistics_metric(text,bigint,bigint,text[]) to authenticated;

create function private.statistics_metrics(p_rows jsonb,p_historical bigint) returns jsonb language sql immutable
set search_path=pg_catalog,private as $$
  with agg as (select count(*) n,count(x->>'sales') ns,count(x->>'mainUnits') nu,
    sum((x->>'sales')::numeric) sales,sum((x->>'mainUnits')::bigint) units from jsonb_array_elements(p_rows) x),
  reasons as (select case when p_historical>0 then array['missing_completion']::text[] else '{}'::text[] end dr,
    coalesce((select array_agg(distinct r) from jsonb_array_elements(p_rows) x cross join lateral jsonb_array_elements_text(x->'reasons') r),'{}'::text[]) all_reasons)
  select jsonb_build_object(
    'completedOrders',private.statistics_metric(case when n>0 or p_historical=0 then n::text end,n,p_historical,dr),
    'sales',private.statistics_metric(case when ns>0 then round(sales,2)::text when n=0 and p_historical=0 then '0.00' end,ns,n-ns+p_historical,all_reasons||dr),
    'mainUnits',private.statistics_metric(case when nu>0 then units::text when n=0 and p_historical=0 then '0' end,nu,n-nu+p_historical,all_reasons||dr),
    'averageTicket',private.statistics_metric(case when n>0 and ns=n and p_historical=0 then round(sales/n,2)::text end,ns,n-ns+p_historical,all_reasons||dr)
      ||jsonb_build_object('quality',case when n=0 and p_historical=0 then 'empty' when n>0 and ns=n and p_historical=0 then 'exact' else 'unavailable' end))
  from agg cross join reasons;
$$;
revoke all on function private.statistics_metrics(jsonb,bigint) from public,anon,authenticated,service_role;
grant execute on function private.statistics_metrics(jsonb,bigint) to authenticated;

-- Match the pure timezone helper: derive candidate offsets around the civil instant;
-- reject gaps AND repeated times instead of accepting PostgreSQL's implicit choice.
create function private.statistics_local_cutoff(p_date date,p_time time,p_timezone text) returns timestamptz language sql stable
set search_path=pg_catalog as $$
  with wanted as (select p_date+p_time wall), samples as (
    select wall,t from wanted cross join lateral generate_series((wall at time zone 'UTC')-interval '36 hours',(wall at time zone 'UTC')+interval '36 hours',interval '6 hours') t),
  candidates as (select distinct (wall at time zone 'UTC')-((t at time zone p_timezone)-(t at time zone 'UTC')) candidate,wall from samples),
  valid as (select candidate from candidates where candidate at time zone p_timezone=wall)
  select case when count(*)=1 then min(candidate) end from valid;
$$;
revoke all on function private.statistics_local_cutoff(date,time,text) from public,anon,authenticated,service_role;
grant execute on function private.statistics_local_cutoff(date,time,text) to authenticated;

-- A projection, not a sixth source of truth. Invoker/barrier preserve all base RLS.
create view public.statistics_v1_effective_facts with(security_invoker=true,security_barrier=true) as
select c.*,f.agreed_total current_agreement,
  c.commercial_date is not null and c.timezone is not null and not c.date_conflict date_reliable,
  case when not c.composition_conflict and c.composition_digest=private.statistics_source_digest(private.statistics_source_items(c.order_id,c.business_id)) then c.main_units end effective_units,
  case when not c.monetary_conflict and not c.composition_conflict and c.agreed_total is not distinct from f.agreed_total
    and c.breakdown_source='copy_total_price' and c.composition_digest=private.statistics_source_digest(private.statistics_source_items(c.order_id,c.business_id)) then c.agreed_total end effective_sales,
  array_remove(array[
    case when c.agreed_total is null then 'missing_agreement' end,
    case when c.breakdown_source='unresolved' then 'unresolved_breakdown' end,
    case when c.monetary_conflict or c.agreed_total is distinct from f.agreed_total then 'agreement_changed_after_completion' end,
    case when c.composition_conflict or c.composition_digest<>private.statistics_source_digest(private.statistics_source_items(c.order_id,c.business_id)) then 'source_conflict' end,
    case when c.main_units is null then 'missing_composition' end
  ],null) reasons
from public.order_statistics_completions c join public.orders o on o.id=c.order_id and o.business_id=c.business_id and o.status='completed'
left join public.order_financials f on f.order_id=c.order_id and f.business_id=c.business_id
where c.active and private.statistics_can_read(c.business_id);
revoke all on public.statistics_v1_effective_facts from public,anon,authenticated,service_role;
grant select on public.statistics_v1_effective_facts to authenticated;

create function public.statistics_v1_summary(
  p_period text,p_start_date date default null,p_end_date date default null,
  p_product_sort text default 'units',p_limit integer default 5,p_cursor jsonb default null
) returns jsonb language plpgsql stable security invoker
set search_path=pg_catalog,public,private as $$
declare v_business uuid; v_role text; v_timezone text; v_now timestamptz:=statement_timestamp(); v_reference date; v_civil date;
  v_start date; v_end date; v_ps date; v_pe date; v_days integer; v_partial boolean; v_reason text; v_granularity text;
  v_historical bigint; v_revision text; v_instrumented timestamptz; v_offset integer:=0; v_previous_cutoff timestamptz;
  v_compare boolean; v_segments jsonb; v_current jsonb; v_previous jsonb; v_products jsonb; v_categories jsonb; v_buckets jsonb;
  v_current_metrics jsonb; v_previous_metrics jsonb; v_product_count bigint; v_outside bigint; v_unresolved bigint; v_pending numeric;
  v_rules jsonb; v_bucket_factor integer; v_request_key text; v_statement_cutoff timestamptz:=statement_timestamp();
begin
  select business_id,role into v_business,v_role from public.profiles where id=auth.uid();
  if auth.uid() is null or v_business is null or v_role not in ('owner','manager','admin') then
    raise exception 'STATISTICS_ACCESS_DENIED' using errcode='42501';
  end if;
  if p_period is null or p_period not in ('today','yesterday','this_week','this_month','previous_month','last_7_days','last_30_days','custom')
    or p_product_sort is null or p_product_sort not in ('units','amount') or p_limit is null or p_limit<1 or p_limit>20 then
    raise exception 'STATISTICS_INVALID_REQUEST' using errcode='22023';
  end if;
  if p_cursor is not null then
    if jsonb_typeof(p_cursor)<>'object' or p_cursor->>'asOf' is null or length(p_cursor->>'asOf')>50 then raise exception 'STATISTICS_INVALID_CURSOR' using errcode='22023';end if;
    v_now:=(p_cursor->>'asOf')::timestamptz;
    if not isfinite(v_now) or v_now>v_statement_cutoff then raise exception 'STATISTICS_INVALID_CURSOR' using errcode='22023';end if;
  end if;
  select timezone into v_timezone from public.business_settings where business_id=v_business;
  if v_timezone is null then return jsonb_build_object('contractVersion','statistics.v1','status','configuration_required','businessId',v_business,'reason','missing_timezone'); end if;
  v_civil:=(v_now at time zone v_timezone)::date;
  select snap.commercial_date into v_reference from public.store_sessions s join public.store_session_statistics_snapshots snap on snap.session_id=s.id and snap.business_id=s.business_id
    where s.business_id=v_business and s.status='open' and s.closed_at is null and snap.source_quality='exact' and s.opened_at=snap.opened_at and s.opened_at<=v_now;
  v_reference:=coalesce(v_reference,v_civil); v_start:=v_reference; v_end:=v_reference;
  case p_period
    when 'yesterday' then v_start:=v_reference-1; v_end:=v_start;
    when 'this_week' then v_start:=v_reference-(extract(isodow from v_reference)::integer-1);
    when 'this_month' then v_start:=date_trunc('month',v_reference)::date;
    when 'previous_month' then v_end:=date_trunc('month',v_reference)::date-1; v_start:=date_trunc('month',v_end)::date;
    when 'last_7_days' then v_start:=v_reference-6;
    when 'last_30_days' then v_start:=v_reference-29;
    when 'custom' then
      if p_start_date is null or p_end_date is null or not isfinite(p_start_date) or not isfinite(p_end_date)
        or extract(year from p_start_date) not between 1 and 9999 or extract(year from p_end_date) not between 1 and 9999
        or p_end_date<p_start_date or p_end_date>greatest(v_reference,v_civil) then raise exception 'STATISTICS_INVALID_RANGE' using errcode='22023'; end if;
      v_start:=p_start_date; v_end:=p_end_date;
    else null;
  end case;
  v_days:=v_end-v_start+1; v_partial:=v_end>=v_reference;
  v_ps:=v_start-v_days; v_pe:=v_end-v_days;
  if p_period='this_week' then v_ps:=v_start-7; v_pe:=v_end-7; end if;
  if p_period='this_month' then
    v_ps:=(date_trunc('month',v_start)-interval '1 month')::date; v_pe:=v_ps+(v_end-v_start);
    if date_trunc('month',v_pe)<>date_trunc('month',v_ps) then v_ps:=null; v_pe:=null; v_reason:='previous_month_too_short'; end if;
  end if;
  if v_ps is not null and extract(year from v_ps)<1 then v_ps:=null;v_pe:=null;v_reason:='previous_interval_out_of_range';end if;
  v_granularity:=case when v_days=1 then 'hour' when v_days<=31 then 'day' when v_days<=180 then 'week' else 'month' end;
  select revision::text,instrumented_at into v_revision,v_instrumented from public.business_statistics_state where business_id=v_business;
  v_revision:=coalesce(v_revision,'0');
  v_request_key:=md5(v_business::text||p_period||v_start::text||v_end::text||p_product_sort||v_revision||v_timezone||v_now::text);
  if p_cursor is not null then
    if p_cursor->>'requestKey' is distinct from v_request_key or p_cursor->>'revision' is distinct from v_revision or p_cursor->>'offset' is null or p_cursor->>'offset' !~ '^[0-9]{1,9}$' then
      raise exception 'STATISTICS_STALE_CURSOR' using errcode='22023'; end if;
    v_offset:=(p_cursor->>'offset')::integer;
  end if;
  select count(*) into v_historical from public.orders o where o.business_id=v_business and o.status='completed'
    and not exists(select 1 from public.order_statistics_completions c where c.order_id=o.id and c.active and c.commercial_date is not null and c.timezone is not null and not c.date_conflict);
  v_compare:=v_ps is not null and v_historical=0;
  v_segments:='[]'::jsonb;
  if v_compare then
    if exists(select 1 from public.store_sessions s left join public.store_session_statistics_snapshots snap on snap.session_id=s.id
      where s.business_id=v_business and (snap.session_id is null or snap.source_quality<>'exact')
      and ((s.opened_at at time zone v_timezone)::date between v_ps and v_end)) then v_compare:=false;v_reason:='unverified_session';end if;
  end if;
  if v_compare and not v_partial and exists(select 1 from public.store_session_statistics_snapshots snap join public.store_sessions s on s.id=snap.session_id
    where snap.business_id=v_business and (snap.commercial_date between v_start and v_end or snap.commercial_date between v_ps and v_pe) and s.closed_at is null) then v_compare:=false;v_reason:='open_historical_session'; end if;
  if v_compare and v_partial then
    with sessions as (
      select snap.*,s.closed_at,row_number() over(partition by snap.commercial_date order by snap.opened_at,snap.session_id) ordinal
      from public.store_session_statistics_snapshots snap join public.store_sessions s on s.id=snap.session_id
      where snap.business_id=v_business and snap.source_quality='exact' and snap.opened_at<=v_now),
    a as(select * from sessions where commercial_date between v_start and v_end),
    b as(select * from sessions where commercial_date between v_ps and v_pe),
    pairs as(select a.session_id aid,b.session_id bid,a.opened_at ao,b.opened_at bo,a.closed_at ac,b.closed_at bc
      from a full join b on b.commercial_date=a.commercial_date+(v_ps-v_start) and b.ordinal=a.ordinal),
    cuts as(select *,case when ac is not null then bc else bo+(v_now-ao) end pu from pairs)
    select coalesce(bool_and(aid is not null and bid is not null and bc is not null and pu<=bc and pu<=v_now and (ac is null or ac>=ao)),true),
      coalesce(jsonb_agg(jsonb_build_object('currentSessionId',aid,'previousSessionId',bid,'currentUntil',coalesce(ac,v_now),'previousUntil',pu)),'[]'::jsonb)
      into v_compare,v_segments from cuts;
    if not v_compare then v_reason:='incomplete_comparable';v_segments:='[]'::jsonb; end if;
    v_previous_cutoff:=private.statistics_local_cutoff(v_pe,(v_now at time zone v_timezone)::time,v_timezone);
    if v_previous_cutoff is null then v_compare:=false;v_reason:='ambiguous_or_nonexistent_previous_cutoff';end if;
  end if;
  if v_historical>0 then v_reason:='missing_completion'; end if;
  if not v_compare then v_segments:='[]'::jsonb;end if;

  -- One top-level RPC statement gives a consistent snapshot. Date predicates precede aggregation.
  with current_facts as materialized (
    select * from public.statistics_v1_effective_facts where business_id=v_business and commercial_date between v_start and v_end and date_reliable and completed_at<=v_now),
  previous_facts as materialized (
    select f.* from public.statistics_v1_effective_facts f where v_compare and f.business_id=v_business and f.commercial_date between v_ps and v_pe and f.date_reliable and f.completed_at<=v_now
      and (not v_partial or case when f.date_kind='outside_session' then f.commercial_date<v_pe or f.completed_at<=v_previous_cutoff
        else exists(select 1 from jsonb_array_elements(v_segments) seg where (seg->>'previousSessionId')::uuid=f.session_key and f.completed_at<=(seg->>'previousUntil')::timestamptz) end)),
  product_lines as (select i.*,f.effective_sales,f.effective_units,f.completed_at from current_facts f join public.order_statistics_completion_items i on i.completion_id=f.id),
  products as (
    select coalesce(product_identity::text,'line:'||line_key::text) group_key,product_identity,
      (array_agg(product_name order by completed_at desc,completion_id,line_key))[1] label,
      case when bool_or(item_kind='product' and effective_units is null) or v_historical>0 then null else sum(case when item_kind='product' and effective_units is not null then quantity else 0 end)::bigint end main_units,
      bool_or(item_kind='product' and effective_units is not null) has_main,
      sum(case when effective_sales is not null then net_amount end) net,
      bool_or(effective_sales is null) partial from product_lines group by group_key,product_identity),
  ranked as (select *,row_number() over(order by case when p_product_sort='units' then main_units else net end desc nulls last,group_key collate "C") position from products where p_product_sort='amount' or has_main),
  categories as (
    select category_identity,coalesce((array_agg(category_name order by completed_at desc,completion_id))[1],'Sin categoría histórica') label,sum(net_amount) amount
    from product_lines where effective_sales is not null group by category_identity),
  all_products as(select product_identity from products where product_identity is not null union
    select i.product_identity from previous_facts f join public.order_statistics_completion_items i on i.completion_id=f.id where i.product_identity is not null)
  select
    coalesce((select jsonb_agg(jsonb_build_object('sales',effective_sales::text,'mainUnits',effective_units::text,'reasons',reasons)) from current_facts),'[]'::jsonb),
    coalesce((select jsonb_agg(jsonb_build_object('sales',effective_sales::text,'mainUnits',effective_units::text,'reasons',reasons)) from previous_facts),'[]'::jsonb),
    coalesce((select jsonb_agg(jsonb_build_object('identity',product_identity,'label',label,'mainUnits',main_units,'netAmount',round(net,2)::text,'quality',case when partial then case when net is null then 'unavailable' else 'partial' end else 'exact' end) order by position) from ranked where position>v_offset and position<=v_offset+p_limit),'[]'::jsonb),
    (select count(*) from ranked),
    coalesce((select jsonb_agg(jsonb_build_object('identity',category_identity,'label',label,'amount',round(amount,2)::text,'percentage',case when not exists(select 1 from current_facts where effective_sales is null) and v_historical=0 and (select sum(amount) from categories)>0 then round(amount*100/(select sum(amount) from categories),2)::text end) order by amount desc,label) from categories),'[]'::jsonb),
    (select count(*) from current_facts where date_kind='outside_session'),
    (select count(*) from current_facts where effective_sales is null),
    (select sum(current_agreement) from current_facts where effective_sales is null),
    coalesce((select jsonb_agg(jsonb_build_object('identity',p.product_identity,'currentMainUnits',case when v_historical>0 or exists(select 1 from current_facts where effective_units is null) then null else coalesce((select sum(i.quantity) from current_facts f join public.order_statistics_completion_items i on i.completion_id=f.id where i.product_identity=p.product_identity and i.item_kind='product' and f.effective_units is not null),0) end,'previousMainUnits',
      case when not v_compare or exists(select 1 from previous_facts where effective_units is null) then null else coalesce((select sum(i.quantity) from previous_facts f join public.order_statistics_completion_items i on i.completion_id=f.id where i.product_identity=p.product_identity and i.item_kind='product' and f.effective_units is not null),0) end)) from all_products p),'[]'::jsonb)
    into v_current,v_previous,v_products,v_product_count,v_categories,v_outside,v_unresolved,v_pending,v_rules;
  v_current_metrics:=private.statistics_metrics(v_current,v_historical);
  v_previous_metrics:=case when v_compare then private.statistics_metrics(v_previous,0) end;

  -- Gap-filled buckets use null, rather than invented zero, when historical coverage is unknown.
  if v_days=1 then
    with facts as materialized(select * from public.statistics_v1_effective_facts where business_id=v_business and commercial_date=v_start and date_reliable and completed_at<=v_now),
    bounds as(select
      least(private.statistics_local_cutoff(v_start,'00:00:00',v_timezone),coalesce(min(completed_at),v_now)) lo,
      greatest(least(v_now,private.statistics_local_cutoff(v_start+1,'00:00:00',v_timezone)),coalesce(max(completed_at),'-infinity'::timestamptz),
        coalesce((select max(coalesce(s.closed_at,v_now)) from public.store_session_statistics_snapshots snap join public.store_sessions s on s.id=snap.session_id where snap.business_id=v_business and snap.commercial_date=v_start and snap.source_quality='exact'),'-infinity'::timestamptz)) hi from facts),
    sizing as(select date_trunc('hour',lo) lo,date_trunc('hour',hi)+interval '1 hour' hi,greatest(1,ceil((extract(epoch from hi-lo)/3600+1)/199)::integer) step from bounds),
    bins as(select t lo,t+make_interval(hours=>step) hi from sizing cross join lateral generate_series(lo,hi-interval '1 microsecond',make_interval(hours=>step)) t)
    select coalesce(jsonb_agg(jsonb_build_object('label',to_char(b.lo at time zone v_timezone,'YYYY-MM-DD HH24:MI')||' · '||b.lo::text,'metrics',private.statistics_metrics(coalesce((select jsonb_agg(jsonb_build_object('sales',f.effective_sales::text,'mainUnits',f.effective_units::text,'reasons',f.reasons)) from facts f where f.completed_at>=b.lo and f.completed_at<b.hi),'[]'::jsonb),v_historical)) order by b.lo),'[]'::jsonb) into v_buckets from bins b;
  elsif v_days>180 then
    v_bucket_factor:=greatest(1,ceil(((extract(year from v_end)-extract(year from v_start))*12+extract(month from v_end)-extract(month from v_start)+1)/199)::integer);
    with bins as(select greatest(v_start,t::date) lo,least(v_end,(t+make_interval(months=>v_bucket_factor))::date-1) hi from
      generate_series(date_trunc('month',v_start::timestamp),date_trunc('month',v_end::timestamp),make_interval(months=>v_bucket_factor)) t),
    facts as materialized(select * from public.statistics_v1_effective_facts where business_id=v_business and commercial_date between v_start and v_end and date_reliable and completed_at<=v_now)
    select jsonb_agg(jsonb_build_object('label',b.lo::text||' / '||b.hi::text,'metrics',private.statistics_metrics(coalesce((select jsonb_agg(jsonb_build_object('sales',f.effective_sales::text,'mainUnits',f.effective_units::text,'reasons',f.reasons)) from facts f where f.commercial_date between b.lo and b.hi),'[]'::jsonb),v_historical)) order by b.lo) into v_buckets from bins b;
  else
    v_bucket_factor:=case when v_days<=31 then 1 when v_days<=180 then 7 else greatest(1,ceil(v_days::numeric/199)::integer) end;
    with bins as(select v_start+n lo,least(v_end,v_start+n+v_bucket_factor-1) hi from generate_series(0,v_days-1,v_bucket_factor) n),
    facts as materialized(select * from public.statistics_v1_effective_facts where business_id=v_business and commercial_date between v_start and v_end and date_reliable and completed_at<=v_now)
    select jsonb_agg(jsonb_build_object('label',b.lo::text||case when b.hi<>b.lo then ' / '||b.hi::text else '' end,'metrics',private.statistics_metrics(coalesce((select jsonb_agg(jsonb_build_object('sales',f.effective_sales::text,'mainUnits',f.effective_units::text,'reasons',f.reasons)) from facts f where f.commercial_date between b.lo and b.hi),'[]'::jsonb),v_historical)) order by b.lo) into v_buckets from bins b;
  end if;
  return jsonb_build_object('contractVersion','statistics.v1','status','ready','businessId',v_business,'currency','ARS','timezone',v_timezone,'revision',v_revision,
    'period',jsonb_build_object('preset',p_period,'startDate',v_start,'endDate',v_end,'referenceDate',v_reference,'asOf',v_now,'timezone',v_timezone,'partial',v_partial,'granularity',v_granularity,'comparable',case when v_ps is not null then jsonb_build_object('startDate',v_ps,'endDate',v_pe) end,'comparableReason',v_reason),
    'coverage',jsonb_build_object('historicalWithoutDate',v_historical,'outsideSession',v_outside,'instrumentedAt',v_instrumented),
    'metrics',v_current_metrics,'previousMetrics',v_previous_metrics,'comparison',jsonb_build_object('available',v_compare,'reason',v_reason,'segments',v_segments),
    'buckets',coalesce(v_buckets,'[]'::jsonb),'products',jsonb_build_object('items',v_products,'nextCursor',case when v_offset+p_limit<v_product_count then jsonb_build_object('offset',v_offset+p_limit,'revision',v_revision,'requestKey',v_request_key,'asOf',v_now) end),
    'categories',v_categories,'unattributed',jsonb_build_object('pendingAgreedTotal',round(v_pending,2)::text,'unresolvedOrders',v_unresolved),
    'ruleEvidence',jsonb_build_object('products',v_rules));
end;
$$;
revoke all on function public.statistics_v1_summary(text,date,date,text,integer,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.statistics_v1_summary(text,date,date,text,integer,jsonb) to authenticated;
