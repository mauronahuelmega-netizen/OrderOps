create function private.statistics_v1_read_core_c_candidate(
  p_period text,p_start_date date default null,p_end_date date default null,
  p_product_sort text default 'units',p_limit integer default 5,p_cursor jsonb default null
) returns jsonb language plpgsql stable security invoker
set search_path=pg_catalog,public,private as $$
declare v_business uuid; v_role text; v_timezone text; v_now timestamptz:=statement_timestamp(); v_reference date; v_civil date;
  v_start date; v_end date; v_ps date; v_pe date; v_days integer; v_partial boolean; v_reason text; v_granularity text;
  v_historical bigint; v_revision text; v_instrumented timestamptz; v_offset integer:=0; v_previous_cutoff timestamptz;
  v_compare boolean; v_segments jsonb; v_current jsonb; v_previous jsonb; v_products jsonb; v_categories jsonb; v_buckets jsonb;
  v_current_metrics jsonb; v_previous_metrics jsonb; v_product_count bigint; v_outside bigint; v_unresolved bigint; v_pending numeric;
  v_effective jsonb; v_result jsonb;
  v_rules jsonb; v_bucket_factor integer; v_request_key text; v_statement_cutoff timestamptz:=statement_timestamp();
begin
  select business_id,role into v_business,v_role from public.profiles where id=auth.uid();
  if auth.uid() is null or v_business is null or v_role is null or v_role not in ('owner','manager','admin') then
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
  if v_timezone is null then return jsonb_build_object('legacy',jsonb_build_object('contractVersion','statistics.v1','status','configuration_required','businessId',v_business,'reason','missing_timezone'),'effectiveFacts','[]'::jsonb); end if;
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


  -- One authorized relational cohort and at most one live digest per eligible non-conflicted completion.
  with eligible as materialized (
    select c.*,f.agreed_total current_agreement
    from public.order_statistics_completions c
    join public.orders o on o.id=c.order_id and o.business_id=c.business_id and o.status='completed'
    left join public.order_financials f on f.order_id=c.order_id and f.business_id=c.business_id
    where c.active and c.business_id=v_business and private.statistics_can_read(c.business_id)
      and c.commercial_date is not null and c.timezone is not null and not c.date_conflict and c.completed_at<=v_now
      and (c.commercial_date between v_start and v_end or
        (v_compare and c.commercial_date between v_ps and v_pe and
          (not v_partial or case when c.date_kind='outside_session' then c.commercial_date<v_pe or c.completed_at<=v_previous_cutoff
            else exists(select 1 from jsonb_array_elements(v_segments) seg where (seg->>'previousSessionId')::uuid=c.session_key and c.completed_at<=(seg->>'previousUntil')::timestamptz) end)))
  ), digests as materialized (
    select id,case when not composition_conflict then
      private.statistics_source_digest(private.statistics_source_items(order_id,business_id)) end current_digest
    from eligible
  ), effective as materialized (
    select c.*,
  c.commercial_date is not null and c.timezone is not null and not c.date_conflict date_reliable,
  case when not c.composition_conflict and c.composition_digest=d.current_digest then c.main_units end effective_units,
  case when not c.monetary_conflict and not c.composition_conflict and c.agreed_total is not distinct from c.current_agreement
    and c.breakdown_source='copy_total_price' and c.composition_digest=d.current_digest then c.agreed_total end effective_sales,
  array_remove(array[
    case when c.agreed_total is null then 'missing_agreement' end,
    case when c.breakdown_source='unresolved' then 'unresolved_breakdown' end,
    case when c.monetary_conflict or c.agreed_total is distinct from c.current_agreement then 'agreement_changed_after_completion' end,
    case when c.composition_conflict or c.composition_digest<>d.current_digest then 'source_conflict' end,
    case when c.main_units is null then 'missing_composition' end
  ],null) reasons
    from eligible c join digests d on d.id=c.id
  ) select coalesce(jsonb_agg(to_jsonb(e)),'[]'::jsonb) into v_effective from effective e;

  -- One top-level RPC statement gives a consistent snapshot. Date predicates precede aggregation.
  with current_facts as materialized (
    select * from jsonb_populate_recordset(null::public.statistics_v1_effective_facts,v_effective) where business_id=v_business and commercial_date between v_start and v_end and date_reliable and completed_at<=v_now),
  previous_facts as materialized (
    select f.* from jsonb_populate_recordset(null::public.statistics_v1_effective_facts,v_effective) f where v_compare and f.business_id=v_business and f.commercial_date between v_ps and v_pe and f.date_reliable and f.completed_at<=v_now
      and (not v_partial or case when f.date_kind='outside_session' then f.commercial_date<v_pe or f.completed_at<=v_previous_cutoff
        else exists(select 1 from jsonb_array_elements(v_segments) seg where (seg->>'previousSessionId')::uuid=f.session_key and f.completed_at<=(seg->>'previousUntil')::timestamptz) end)),
  -- Window-scoped historical lines; invoker SELECT retains the base-table RLS barrier.
  authorized_completion_items as materialized (
    select i.* from public.order_statistics_completion_items i
    where i.business_id=v_business and exists (
      select 1 from current_facts f where f.id=i.completion_id
      union all
      select 1 from previous_facts f where f.id=i.completion_id
    )
  ),
  product_lines as (select i.*,f.effective_sales,f.effective_units,f.completed_at from current_facts f join authorized_completion_items i on i.completion_id=f.id),
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
    select i.product_identity from previous_facts f join authorized_completion_items i on i.completion_id=f.id where i.product_identity is not null)
  select
    coalesce((select jsonb_agg(jsonb_build_object('sales',effective_sales::text,'mainUnits',effective_units::text,'reasons',reasons)) from current_facts),'[]'::jsonb),
    coalesce((select jsonb_agg(jsonb_build_object('sales',effective_sales::text,'mainUnits',effective_units::text,'reasons',reasons)) from previous_facts),'[]'::jsonb),
    coalesce((select jsonb_agg(jsonb_build_object('identity',product_identity,'label',label,'mainUnits',main_units,'netAmount',round(net,2)::text,'quality',case when partial then case when net is null then 'unavailable' else 'partial' end else 'exact' end) order by position) from ranked where position>v_offset and position<=v_offset+p_limit),'[]'::jsonb),
    (select count(*) from ranked),
    coalesce((select jsonb_agg(jsonb_build_object('identity',category_identity,'label',label,'amount',round(amount,2)::text,'percentage',case when not exists(select 1 from current_facts where effective_sales is null) and v_historical=0 and (select sum(amount) from categories)>0 then round(amount*100/(select sum(amount) from categories),2)::text end) order by amount desc,label) from categories),'[]'::jsonb),
    (select count(*) from current_facts where date_kind='outside_session'),
    (select count(*) from current_facts where effective_sales is null),
    (select sum(current_agreement) from current_facts where effective_sales is null),
    coalesce((select jsonb_agg(jsonb_build_object('identity',p.product_identity,'currentMainUnits',case when v_historical>0 or exists(select 1 from current_facts where effective_units is null) then null else coalesce((select sum(i.quantity) from current_facts f join authorized_completion_items i on i.completion_id=f.id where i.product_identity=p.product_identity and i.item_kind='product' and f.effective_units is not null),0) end,'previousMainUnits',
      case when not v_compare or exists(select 1 from previous_facts where effective_units is null) then null else coalesce((select sum(i.quantity) from previous_facts f join authorized_completion_items i on i.completion_id=f.id where i.product_identity=p.product_identity and i.item_kind='product' and f.effective_units is not null),0) end)) from all_products p),'[]'::jsonb)
    into v_current,v_previous,v_products,v_product_count,v_categories,v_outside,v_unresolved,v_pending,v_rules;
  v_current_metrics:=private.statistics_metrics(v_current,v_historical);
  v_previous_metrics:=case when v_compare then private.statistics_metrics(v_previous,0) end;

  -- Gap-filled buckets use null, rather than invented zero, when historical coverage is unknown.
  if v_days=1 then
    with facts as materialized(select * from jsonb_populate_recordset(null::public.statistics_v1_effective_facts,v_effective) where business_id=v_business and commercial_date=v_start and date_reliable and completed_at<=v_now),
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
    facts as materialized(select * from jsonb_populate_recordset(null::public.statistics_v1_effective_facts,v_effective) where business_id=v_business and commercial_date between v_start and v_end and date_reliable and completed_at<=v_now)
    select jsonb_agg(jsonb_build_object('label',b.lo::text||' / '||b.hi::text,'metrics',private.statistics_metrics(coalesce((select jsonb_agg(jsonb_build_object('sales',f.effective_sales::text,'mainUnits',f.effective_units::text,'reasons',f.reasons)) from facts f where f.commercial_date between b.lo and b.hi),'[]'::jsonb),v_historical)) order by b.lo) into v_buckets from bins b;
  else
    v_bucket_factor:=case when v_days<=31 then 1 when v_days<=180 then 7 else greatest(1,ceil(v_days::numeric/199)::integer) end;
    with bins as(select v_start+n lo,least(v_end,v_start+n+v_bucket_factor-1) hi from generate_series(0,v_days-1,v_bucket_factor) n),
    facts as materialized(select * from jsonb_populate_recordset(null::public.statistics_v1_effective_facts,v_effective) where business_id=v_business and commercial_date between v_start and v_end and date_reliable and completed_at<=v_now)
    select jsonb_agg(jsonb_build_object('label',b.lo::text||case when b.hi<>b.lo then ' / '||b.hi::text else '' end,'metrics',private.statistics_metrics(coalesce((select jsonb_agg(jsonb_build_object('sales',f.effective_sales::text,'mainUnits',f.effective_units::text,'reasons',f.reasons)) from facts f where f.commercial_date between b.lo and b.hi),'[]'::jsonb),v_historical)) order by b.lo) into v_buckets from bins b;
  end if;
  v_result:=jsonb_build_object('contractVersion','statistics.v1','status','ready','businessId',v_business,'currency','ARS','timezone',v_timezone,'revision',v_revision,
    'period',jsonb_build_object('preset',p_period,'startDate',v_start,'endDate',v_end,'referenceDate',v_reference,'asOf',v_now,'timezone',v_timezone,'partial',v_partial,'granularity',v_granularity,'comparable',case when v_ps is not null then jsonb_build_object('startDate',v_ps,'endDate',v_pe) end,'comparableReason',v_reason),
    'coverage',jsonb_build_object('historicalWithoutDate',v_historical,'outsideSession',v_outside,'instrumentedAt',v_instrumented),
    'metrics',v_current_metrics,'previousMetrics',v_previous_metrics,'comparison',jsonb_build_object('available',v_compare,'reason',v_reason,'segments',v_segments),
    'buckets',coalesce(v_buckets,'[]'::jsonb),'products',jsonb_build_object('items',v_products,'nextCursor',case when v_offset+p_limit<v_product_count then jsonb_build_object('offset',v_offset+p_limit,'revision',v_revision,'requestKey',v_request_key,'asOf',v_now) end),
    'categories',v_categories,'unattributed',jsonb_build_object('pendingAgreedTotal',round(v_pending,2)::text,'unresolvedOrders',v_unresolved),
    'ruleEvidence',jsonb_build_object('products',v_rules));
  return jsonb_build_object('legacy',v_result,'effectiveFacts',v_effective);
end;
$$;

create function private.statistics_v1_summary_c_candidate(
  p_period text,p_start_date date default null,p_end_date date default null,
  p_product_sort text default 'units',p_limit integer default 5,p_cursor jsonb default null
) returns jsonb language plpgsql stable security invoker
set search_path=pg_catalog,public,private as $$
declare
  v_bundle jsonb; v_base jsonb; v_business uuid; v_role text; v_tz text; v_now timestamptz;
  v_start date; v_end date; v_ps date; v_pe date; v_shift integer; v_days integer;
  v_compare boolean; v_partial boolean; v_historical bigint; v_previous_cut timestamptz;
  v_facts jsonb; v_sessions jsonb; v_pairs jsonb; v_mode text; v_step integer;
  v_resolution text; v_resolution_reason text; v_points jsonb; v_total_alignment boolean;
  v_total_reason text; v_total_deltas jsonb; v_cn bigint; v_pn bigint; v_mc bigint; v_mp bigint;
  v_clo timestamptz; v_chi timestamptz; v_plo timestamptz; v_phi timestamptz;
  v_lanes integer; v_seconds numeric; v_current_check jsonb; v_previous_check jsonb;
  v_metric text; v_bad bigint;
begin
  -- Effective authorization is repeated here, rather than trusting a response JSON.
  select business_id,role into v_business,v_role from public.profiles where id=auth.uid();
  if auth.uid() is null or v_business is null or v_role is null or v_role not in ('owner','manager','admin') then
    raise exception 'STATISTICS_ACCESS_DENIED' using errcode='42501';
  end if;
  v_bundle:=private.statistics_v1_read_core_c_candidate(p_period,p_start_date,p_end_date,p_product_sort,p_limit,p_cursor);
  v_base:=v_bundle->'legacy';
  if v_base->>'status'<>'ready' then return v_base; end if;
  if (v_base->>'businessId')::uuid<>v_business then raise exception 'STATISTICS_TENANT_MISMATCH' using errcode='42501'; end if;
  v_tz:=v_base->>'timezone'; v_now:=(v_base#>>'{period,asOf}')::timestamptz;
  v_start:=(v_base#>>'{period,startDate}')::date; v_end:=(v_base#>>'{period,endDate}')::date;
  v_ps:=(v_base#>>'{period,comparable,startDate}')::date; v_pe:=(v_base#>>'{period,comparable,endDate}')::date;
  v_shift:=v_ps-v_start; v_days:=v_end-v_start+1;
  v_compare:=(v_base#>>'{comparison,available}')::boolean;
  v_partial:=(v_base#>>'{period,partial}')::boolean;
  v_historical:=(v_base#>>'{coverage,historicalWithoutDate}')::bigint;
  if v_compare and v_partial then
    v_previous_cut:=private.statistics_local_cutoff(v_pe,(v_now at time zone v_tz)::time,v_tz);
  end if;

  -- One extra scan of effective facts, independent of the number of points.
  with effective as materialized (
    select f.* from jsonb_populate_recordset(null::public.statistics_v1_effective_facts,v_bundle->'effectiveFacts') f
    where f.business_id=v_business and f.date_reliable and f.completed_at<=v_now
      and (f.commercial_date between v_start and v_end or (v_compare and f.commercial_date between v_ps and v_pe))
  ), selected as (
    select 'current' side,f.* from effective f where f.commercial_date between v_start and v_end
    union all
    select 'previous' side,f.* from effective f where v_compare and f.commercial_date between v_ps and v_pe
      and (not v_partial or case when f.date_kind='outside_session' then f.commercial_date<v_pe or f.completed_at<=v_previous_cut
        else exists(select 1 from jsonb_array_elements(v_base#>'{comparison,segments}') seg
          where (seg->>'previousSessionId')::uuid=f.session_key and f.completed_at<=(seg->>'previousUntil')::timestamptz) end)
  )
  select coalesce(jsonb_agg(jsonb_build_object('side',side,'id',id,'date',commercial_date,
    'at',completed_at,'session',session_key,'kind',date_kind,'timezone',timezone,
    'sales',effective_sales::text,'mainUnits',effective_units::text,'reasons',reasons) order by side,commercial_date,completed_at,id),'[]'::jsonb)
    into v_facts from selected;
  select count(*) filter(where x->>'side'='current'),count(*) filter(where x->>'side'='previous')
    into v_cn,v_pn from jsonb_array_elements(v_facts) x;

  with sessions as (
    select snap.session_id id,snap.commercial_date d,snap.opened_at lo,snap.timezone tz,
      least(coalesce(s.closed_at,v_now),v_now) hi,s.closed_at is not null closed,
      snap.source_quality='exact' and s.business_id=v_business and s.opened_at=snap.opened_at
        and snap.timezone is not null and s.opened_at<=v_now
        and private.statistics_v1_series_instant(snap.opened_at) is not null
        and private.statistics_v1_series_instant(least(coalesce(s.closed_at,v_now),v_now)) is not null
        and (s.closed_at is null or (s.closed_at>=s.opened_at and s.closed_at<=v_now
          and snap.observed_closed_at is not distinct from s.closed_at)) valid,
      row_number() over(partition by snap.commercial_date order by snap.opened_at,snap.session_id) ordinal
    from public.store_session_statistics_snapshots snap
    left join public.store_sessions s on s.id=snap.session_id and s.business_id=snap.business_id
    where snap.business_id=v_business and snap.opened_at<=v_now
      and (snap.commercial_date between v_start and v_end or (v_compare and snap.commercial_date between v_ps and v_pe))
  ) select coalesce(jsonb_agg(to_jsonb(sessions) order by d,ordinal),'[]'::jsonb) into v_sessions from sessions;

  with s as (select * from jsonb_to_recordset(v_sessions) as z(id uuid,d date,lo timestamptz,hi timestamptz,tz text,closed boolean,valid boolean,ordinal bigint)),
  a as (select * from s where d between v_start and v_end),
  b as (select * from s where v_compare and d between v_ps and v_pe),
  pairs as (
    select a.id aid,b.id bid,a.d ad,b.d bd,a.lo alo,b.lo blo,a.hi ahi,
      case when v_partial then
        (select (seg->>'previousUntil')::timestamptz from jsonb_array_elements(v_base#>'{comparison,segments}') seg where (seg->>'previousSessionId')::uuid=b.id)
        else b.hi end bhi,
      a.tz atz,b.tz btz,a.valid av,b.valid bv,a.closed ac,b.closed bc,coalesce(a.ordinal,b.ordinal) ordinal
    from a full join b on b.d=a.d+v_shift and b.ordinal=a.ordinal
  ) select coalesce(jsonb_agg(to_jsonb(pairs) order by coalesce(ad,bd-v_shift),ordinal),'[]'::jsonb) into v_pairs from pairs;

  v_mode:='calendar'; v_resolution:=v_base#>>'{period,granularity}';
  if v_days=1 then
    v_resolution:='day'; v_resolution_reason:='unverifiable_hour_exposure';
    select count(*),coalesce(sum(greatest(coalesce(extract(epoch from ahi-alo),0),coalesce(extract(epoch from bhi-blo),0))),0)
      into v_lanes,v_seconds from jsonb_to_recordset(v_pairs) as z(alo timestamptz,ahi timestamptz,blo timestamptz,bhi timestamptz);
    if v_lanes>0 and v_lanes<200 and not exists(
      select 1 from jsonb_array_elements(v_facts) f where f->>'kind'<>'verified_session' or not exists(
        select 1 from jsonb_array_elements(v_sessions) s where s->>'id'=f->>'session' and (s->>'valid')::boolean
          and (f->>'at')::timestamptz between (s->>'lo')::timestamptz and (s->>'hi')::timestamptz))
      and not exists(select 1 from jsonb_array_elements(v_pairs) p where
        (p->>'aid' is not null and (not coalesce((p->>'av')::boolean,false) or (p->>'ahi')::timestamptz<=(p->>'alo')::timestamptz))
        or (p->>'bid' is not null and (not coalesce((p->>'bv')::boolean,false) or (p->>'bhi')::timestamptz<=(p->>'blo')::timestamptz))) then
      v_mode:='session'; v_resolution:='hour'; v_resolution_reason:=null;
      -- Integer microseconds: exact ceiling without numeric division rounding.
      -- The maximum-duration cap gives one bin per lane when it is the lesser term.
      select least(div(max(greatest(coalesce(extract(epoch from ahi-alo),0),coalesce(extract(epoch from bhi-blo),0)))*1000000+3599999999,3600000000),
        greatest(1,div(v_seconds*1000000+(200-v_lanes)*3600000000-1,(200-v_lanes)*3600000000)))::integer into v_step
        from jsonb_to_recordset(v_pairs) as z(alo timestamptz,ahi timestamptz,blo timestamptz,bhi timestamptz);
      if v_step>1 then v_resolution_reason:='point_limit'; end if;
    elsif v_lanes=0 and not exists(select 1 from jsonb_array_elements(v_facts) f where f->>'kind'<>'outside_session' or f->>'timezone'<>v_tz) then
      v_clo:=private.statistics_local_cutoff(v_start,'00:00:00',v_tz);
      v_chi:=least(v_now,private.statistics_local_cutoff(v_start+1,'00:00:00',v_tz));
      if v_compare then
        v_plo:=private.statistics_local_cutoff(v_ps,'00:00:00',v_tz);
        v_phi:=case when v_partial then v_previous_cut else private.statistics_local_cutoff(v_ps+1,'00:00:00',v_tz) end;
      end if;
      if private.statistics_v1_series_instant(v_clo) is not null and private.statistics_v1_series_instant(v_chi) is not null and v_chi>v_clo
        and (not v_compare or (private.statistics_v1_series_instant(v_plo) is not null and private.statistics_v1_series_instant(v_phi) is not null and v_phi>v_plo))
        and ceil(extract(epoch from v_chi-v_clo)/3600)+coalesce(ceil(extract(epoch from v_phi-v_plo)/3600),0)<=200 then
        v_mode:='outside';v_resolution:='hour';v_resolution_reason:=null;v_step:=1;
      end if;
    end if;
  end if;

  if v_mode='calendar' and v_days=1 and v_lanes>=200 then v_resolution_reason:='point_limit'; end if;

  -- Plan, membership and aggregation are relational. Facts are not queried per bucket.
  with recursive
  facts as materialized(select * from jsonb_to_recordset(v_facts) as z(side text,id uuid,date date,at timestamptz,session uuid,kind text,timezone text,sales text,"mainUnits" text,reasons jsonb)),
  pairs as materialized(select * from jsonb_to_recordset(v_pairs) as z(aid uuid,bid uuid,ad date,bd date,alo timestamptz,ahi timestamptz,blo timestamptz,bhi timestamptz,atz text,btz text,av boolean,bv boolean,ac boolean,bc boolean,ordinal bigint)),
  calendar_size as (
    select case when v_days<=31 then 1 when v_days<=180 then 7 else greatest(1,ceil(((extract(year from v_end)-extract(year from v_start))*12+extract(month from v_end)-extract(month from v_start)+1)/199)::integer) end factor
  ), calendar_bins as (
    select v_start+n lo,least(v_end,v_start+n+factor-1) hi from calendar_size cross join lateral generate_series(0,case when v_mode='calendar' and v_days<=180 then v_days-1 else -1 end,factor) n where v_mode='calendar' and v_days<=180
    union all
    select greatest(v_start,t::date),least(v_end,(t+make_interval(months=>factor))::date-1)
      from calendar_size cross join lateral generate_series(case when v_mode='calendar' and v_days>180 then date_trunc('month',v_start::timestamp) end,date_trunc('month',v_end::timestamp),make_interval(months=>factor)) t
      where v_mode='calendar' and v_days>180
  ), calendar_bounds as (
    select lo,hi,case when v_compare then lo+v_shift end pl,case when v_compare then hi+v_shift end ph,
      private.statistics_local_cutoff(lo,'00:00:00',v_tz) clo,
      least(v_now,private.statistics_local_cutoff(hi+1,'00:00:00',v_tz)) chi,
      case when v_compare then private.statistics_local_cutoff(lo+v_shift,'00:00:00',v_tz) end plo,
      case when v_compare then case when v_partial and hi=v_end then v_previous_cut
        else private.statistics_local_cutoff(hi+v_shift+1,'00:00:00',v_tz) end end phi
    from calendar_bins
  ), calendar_plan as (
    select 'date:'||lo::text descriptor,'commercial_date'::text basis,
      jsonb_build_object('kind','date_offset','days',coalesce(v_shift,0),'sessions',coalesce((select jsonb_agg(jsonb_build_object('currentSessionId',p.aid,'previousSessionId',p.bid,'ordinal',p.ordinal) order by p.ad,p.ordinal) from pairs p where p.ad between lo and hi and p.aid is not null and p.bid is not null),'[]'::jsonb)) mapping,
      lo cdlo,hi cdhi,pl pdlo,ph pdhi,null::uuid csid,null::uuid psid,
      clo,chi,plo,phi,(chi=v_now) ci,(v_partial and hi=v_end) pi,
      true ca,v_compare pa,
      case when not v_compare then 'root_comparison_unavailable'
        when clo is null or chi is null or plo is null or phi is null then 'ambiguous_wall_time'
        when private.statistics_v1_series_instant(clo) is null or private.statistics_v1_series_instant(chi) is null
          or private.statistics_v1_series_instant(plo) is null or private.statistics_v1_series_instant(phi) is null then 'interval_out_of_range'
        when chi<clo or phi<plo or chi-clo<>phi-plo or (chi=v_now) is distinct from (v_partial and hi=v_end) then 'duration_mismatch'
        when exists(select 1 from facts f where (f.date between lo and hi or f.date between pl and ph)
          and f.kind='outside_session' and f.timezone<>v_tz) then 'timezone_changed'
        when exists(select 1 from facts f where (f.date between lo and hi or f.date between pl and ph)
          and f.kind='verified_session' and not exists(select 1 from jsonb_array_elements(v_sessions) s
            where s->>'id'=f.session::text and coalesce((s->>'valid')::boolean,false)
              and f.at between (s->>'lo')::timestamptz and (s->>'hi')::timestamptz)) then 'unverified_session'
        when exists(select 1 from pairs p where (p.ad between lo and hi or p.bd between pl and ph)
          and (p.aid is null or p.bid is null or not coalesce(p.av and p.bv and p.bc,false))) then 'missing_counterpart'
        when exists(select 1 from pairs p where p.ad between lo and hi and p.atz is distinct from p.btz) then 'timezone_changed'
        when exists(select 1 from pairs p where p.ad between lo and hi and (p.ahi-p.alo is distinct from p.bhi-p.blo)) then 'duration_mismatch'
        else null end reason
    from calendar_bounds
  ), session_bins as (
    select p.*,n::numeric*3600*v_step elapsed_lo,(n+1)::numeric*3600*v_step elapsed_hi
      from pairs p cross join lateral generate_series(0,case when v_mode='session' then greatest(1,div(greatest(coalesce(extract(epoch from p.ahi-p.alo),0),coalesce(extract(epoch from p.bhi-p.blo),0))*1000000+3600000000::numeric*v_step-1,3600000000::numeric*v_step)::integer)-1 else -1 end) n
      where v_mode='session'
  ), session_bounds as (
    select *,aid is not null and elapsed_lo<extract(epoch from ahi-alo) ca,
      bid is not null and elapsed_lo<extract(epoch from bhi-blo) pa,
      alo+elapsed_lo*interval '1 second' clo,least(ahi,alo+elapsed_hi*interval '1 second') chi,
      blo+elapsed_lo*interval '1 second' plo,least(bhi,blo+elapsed_hi*interval '1 second') phi
    from session_bins
  ), session_plan as (
    select 'session:'||coalesce(ad,bd-v_shift)::text||':'||ordinal::text||':'||elapsed_lo::text descriptor,'session_elapsed'::text basis,
      jsonb_build_object('kind','session_elapsed','ordinal',ordinal,'startSeconds',elapsed_lo::text,'endSeconds',elapsed_hi::text) mapping,
      ad cdlo,ad cdhi,bd pdlo,bd pdhi,aid csid,bid psid,clo,chi,plo,phi,chi=ahi ci,phi=bhi pi,ca,pa,
      case when not v_compare then 'root_comparison_unavailable' when not ca or not pa then 'missing_counterpart'
        when atz is distinct from btz then 'timezone_changed' when chi-clo<>phi-plo or (chi=ahi) is distinct from (phi=bhi) then 'duration_mismatch' else null end reason
    from session_bounds
  ), outside_bins as (
    select 'current' side,t lo,least(t+interval '1 hour',v_chi) hi,v_chi terminal from generate_series(v_clo,v_chi-interval '1 microsecond',interval '1 hour') t where v_mode='outside'
    union all
    select 'previous',t,least(t+interval '1 hour',v_phi),v_phi from generate_series(v_plo,v_phi-interval '1 microsecond',interval '1 hour') t where v_mode='outside' and v_compare
  ), outside_keys as (
    select *,to_char(lo at time zone v_tz,'HH24:MI:SS.US')||'/'||to_char(hi at time zone v_tz,'HH24:MI:SS.US') wall_key,
      private.statistics_local_cutoff((lo at time zone v_tz)::date,(lo at time zone v_tz)::time,v_tz)=lo
        and private.statistics_local_cutoff((hi at time zone v_tz)::date,(hi at time zone v_tz)::time,v_tz)=hi unique_wall
    from outside_bins
  ), outside_pairs as (
    select a.lo clo,a.hi chi,b.lo plo,b.hi phi,a.terminal ct,b.terminal pt,
      a.unique_wall au,b.unique_wall bu,coalesce(a.wall_key,b.wall_key) wall_key
      from (select * from outside_keys where side='current') a full join (select * from outside_keys where side='previous') b
        on a.wall_key=b.wall_key and a.unique_wall and b.unique_wall
  ), outside_plan as (
    select 'outside:'||wall_key||':'||to_char(coalesce(clo,plo) at time zone 'UTC','YYYY-MM-DD HH24:MI:SS.US') descriptor,'outside_session_wall'::text basis,
      jsonb_build_object('kind','wall_clock','wallStart',to_char(coalesce(clo,plo) at time zone v_tz,'HH24:MI:SS.US'),
        'wallEnd',to_char(coalesce(chi,phi) at time zone v_tz,'HH24:MI:SS.US'),'timezone',v_tz) mapping,
      v_start cdlo,v_start cdhi,v_ps pdlo,v_ps pdhi,null::uuid csid,null::uuid psid,clo,chi,plo,phi,
      chi=ct and ct=v_now ci,phi=pt and v_partial pi,clo is not null ca,plo is not null pa,
      case when not v_compare then 'root_comparison_unavailable' when (clo is not null and not coalesce(au,false)) or (plo is not null and not coalesce(bu,false)) then 'ambiguous_wall_time'
        when clo is null or plo is null then 'missing_counterpart' when chi-clo<>phi-plo or (chi=ct and ct=v_now) is distinct from (phi=pt and v_partial) then 'duration_mismatch' else null end reason
    from outside_pairs
  ), plan as materialized(
    select * from calendar_plan union all select * from session_plan union all select * from outside_plan
  ), membership as materialized (
    select p.descriptor,f.* from plan p join facts f on
      case when f.side='current' then p.ca and (
        case when p.basis='commercial_date' then f.date between p.cdlo and p.cdhi
          else f.date=p.cdlo and (case when p.basis='session_elapsed' then f.session=p.csid and f.kind='verified_session' else f.kind='outside_session' end)
            and f.at>=p.clo and (f.at<p.chi or (p.ci and f.at=p.chi)) end)
        else p.pa and (case when p.basis='commercial_date' then f.date between p.pdlo and p.pdhi
          else f.date=p.pdlo and (case when p.basis='session_elapsed' then f.session=p.psid and f.kind='verified_session' else f.kind='outside_session' end)
            and f.at>=p.plo and (f.at<p.phi or (p.pi and f.at=p.phi)) end) end
  ), groups as materialized (
    select descriptor,side,jsonb_agg(jsonb_build_object('sales',sales,'mainUnits',"mainUnits",'reasons',reasons) order by date,at,id) rows
      from membership group by descriptor,side
  ), point_metrics as materialized (
    select p.*,case when ca then private.statistics_metrics(coalesce(c.rows,'[]'::jsonb),v_historical) end cm,
      case when pa then private.statistics_metrics(coalesce(b.rows,'[]'::jsonb),0) end pm
    from plan p left join groups c on c.descriptor=p.descriptor and c.side='current'
      left join groups b on b.descriptor=p.descriptor and b.side='previous'
  ), intervals as (
    select m.*,case when ca then
      case when basis='commercial_date' then
        coalesce((select jsonb_agg(slice order by slice->>'start',slice->>'sessionId',slice->>'timezone',slice->>'commercialDate') from (
          select jsonb_build_object('sessionId',s.id,'timezone',s.tz,'commercialDate',s.d,'start',private.statistics_v1_series_instant(s.lo),'end',private.statistics_v1_series_instant(s.hi),'endInclusive',true) slice
            from jsonb_to_recordset(v_sessions) s(id uuid,d date,lo timestamptz,hi timestamptz,tz text,valid boolean)
            where s.d between cdlo and cdhi and s.valid and s.hi>=s.lo
          union all select jsonb_build_object('sessionId',null,'timezone',z.tz,'commercialDate',cdlo,'endCommercialDate',cdhi,'start',private.statistics_v1_series_instant(z.lo),'end',private.statistics_v1_series_instant(z.hi),'endInclusive',z.hi=v_now) from (
            select tz,private.statistics_local_cutoff(cdlo,'00:00:00',tz) lo,least(v_now,private.statistics_local_cutoff(cdhi+1,'00:00:00',tz)) hi
              from (select distinct timezone tz from facts where side='current' and kind='outside_session' and date between cdlo and cdhi
                union all select v_tz where not exists(select 1 from facts where side='current' and kind='outside_session' and date between cdlo and cdhi)) zones
          ) z where private.statistics_v1_series_instant(z.lo) is not null and private.statistics_v1_series_instant(z.hi) is not null and z.hi>=z.lo
        ) z),'[]'::jsonb)
        else jsonb_build_array(jsonb_build_object('sessionId',csid,'timezone',coalesce((select s->>'tz' from jsonb_array_elements(v_sessions) s where s->>'id'=csid::text),v_tz),'commercialDate',cdlo,'start',private.statistics_v1_series_instant(clo),'end',private.statistics_v1_series_instant(chi),'endInclusive',ci)) end end cslices,
      case when pa then case when basis='commercial_date' then
        coalesce((select jsonb_agg(slice order by slice->>'start',slice->>'sessionId',slice->>'timezone',slice->>'commercialDate') from (
          select jsonb_build_object('sessionId',p.bid,'timezone',p.btz,'commercialDate',p.bd,'start',private.statistics_v1_series_instant(p.blo),'end',private.statistics_v1_series_instant(p.bhi),'endInclusive',true) slice from pairs p
            where p.bd between pdlo and pdhi and p.bv and p.bhi>=p.blo
          union all select jsonb_build_object('sessionId',null,'timezone',z.tz,'commercialDate',pdlo,'endCommercialDate',pdhi,'start',private.statistics_v1_series_instant(z.lo),'end',private.statistics_v1_series_instant(z.hi),'endInclusive',pi and z.hi=v_previous_cut) from (
            select tz,private.statistics_local_cutoff(pdlo,'00:00:00',tz) lo,
              case when v_partial and pdhi=v_pe then least(v_previous_cut,private.statistics_local_cutoff(pdhi+1,'00:00:00',tz)) else private.statistics_local_cutoff(pdhi+1,'00:00:00',tz) end hi
              from (select distinct timezone tz from facts where side='previous' and kind='outside_session' and date between pdlo and pdhi
                union all select v_tz where not exists(select 1 from facts where side='previous' and kind='outside_session' and date between pdlo and pdhi)) zones
          ) z where private.statistics_v1_series_instant(z.lo) is not null and private.statistics_v1_series_instant(z.hi) is not null and z.hi>=z.lo
        ) z),'[]'::jsonb)
        else jsonb_build_array(jsonb_build_object('sessionId',psid,'timezone',coalesce((select s->>'tz' from jsonb_array_elements(v_sessions) s where s->>'id'=psid::text),v_tz),'commercialDate',pdlo,'start',private.statistics_v1_series_instant(plo),'end',private.statistics_v1_series_instant(phi),'endInclusive',pi)) end end pslices
    from point_metrics m
  ), points as (
    select descriptor,jsonb_build_object(
      'key',md5(jsonb_build_array('statistics.series.v1',v_business,v_start,v_end,basis,descriptor,mapping,cslices->0->>'timezone',pslices->0->>'timezone')::text),
      'label',coalesce(cdlo,pdlo-v_shift)::text||case when basis='commercial_date' and cdhi<>cdlo then ' / '||cdhi::text else '' end,
      'basis',basis,'mapping',mapping,
      'current',case when ca then jsonb_build_object('interval',jsonb_build_object('key',md5(jsonb_build_array('current',v_business,descriptor,cdlo,cdhi,csid,to_char(clo at time zone 'UTC','YYYY-MM-DD HH24:MI:SS.US'),to_char(chi at time zone 'UTC','YYYY-MM-DD HH24:MI:SS.US'))::text),
        'startDate',cdlo,'endDate',cdhi,'slices',cslices,'observation',case when (basis='commercial_date' and v_partial and cdhi=v_end) or (basis<>'commercial_date' and chi=v_now and (csid is null or not coalesce((select (s->>'closed')::boolean from jsonb_array_elements(v_sessions) s where s->>'id'=csid::text),true))) then 'partial' else 'closed' end),'metrics',cm) end,
      'previous',case when pa then jsonb_build_object('interval',jsonb_build_object('key',md5(jsonb_build_array('previous',v_business,descriptor,pdlo,pdhi,psid,to_char(plo at time zone 'UTC','YYYY-MM-DD HH24:MI:SS.US'),to_char(phi at time zone 'UTC','YYYY-MM-DD HH24:MI:SS.US'))::text),
        'startDate',pdlo,'endDate',pdhi,'slices',pslices,'observation',case when (basis='commercial_date' and v_partial and pdhi=v_pe) or (basis<>'commercial_date' and pi and v_partial and (case when psid is not null then phi<(select (s->>'hi')::timestamptz from jsonb_array_elements(v_sessions) s where s->>'id'=psid::text) else phi<private.statistics_local_cutoff(pdhi+1,'00:00:00',v_tz) end)) then 'partial' else 'closed' end),'metrics',pm) end,
      'alignment',jsonb_build_object('available',reason is null,'reason',reason),
      'comparisons',(select jsonb_object_agg(k,private.statistics_v1_series_delta(cm->k,pm->k,reason is null,reason)) from unnest(array['sales','completedOrders','averageTicket','mainUnits']) k)
    ) point,reason,coalesce(cdlo,pdlo-v_shift) sort_date,coalesce(clo,plo) sort_time
    from intervals
  ) select coalesce(jsonb_agg(point order by sort_date,sort_time nulls first,descriptor),'[]'::jsonb),
      coalesce(bool_and(reason is null),false) and v_compare,
      (array_agg(reason order by sort_date,sort_time nulls first,descriptor) filter(where reason is not null))[1],
      (select count(*) from membership where side='current'),(select count(*) from membership where side='previous'),
      private.statistics_metrics(coalesce((select jsonb_agg(jsonb_build_object('sales',sales,'mainUnits',"mainUnits",'reasons',reasons)) from facts where side='current'),'[]'::jsonb),v_historical),
      case when v_compare then private.statistics_metrics(coalesce((select jsonb_agg(jsonb_build_object('sales',sales,'mainUnits',"mainUnits",'reasons',reasons)) from facts where side='previous'),'[]'::jsonb),0) end,
    (select count(*) from facts f left join (select side,id,count(*) n from membership group by side,id) m using(side,id) where m.n is distinct from 1::bigint)
    into v_points,v_total_alignment,v_total_reason,v_mc,v_mp,v_current_check,v_previous_check,v_bad from points;

  if jsonb_array_length(v_points)>200 or v_mc<>v_cn or v_mp<>v_pn or v_bad<>0 or exists(
    select 1 from jsonb_array_elements(v_points) p group by p->>'key' having count(*)<>1) then
    raise exception 'STATISTICS_SERIES_PARTITION_INVALID' using errcode='22023';
  end if;
  -- Fail closed if a future base predicate/quality change stops cohort equivalence.
  foreach v_metric in array array['sales','completedOrders','averageTicket','mainUnits'] loop
    if (v_current_check->v_metric)-'reasons' is distinct from (v_base->'metrics'->v_metric)-'reasons'
      or (v_compare and (v_previous_check->v_metric)-'reasons' is distinct from (v_base->'previousMetrics'->v_metric)-'reasons') then
      raise exception 'STATISTICS_SERIES_LEGACY_COHORT_MISMATCH' using errcode='22023';
    end if;
  end loop;
  select jsonb_object_agg(k,private.statistics_v1_series_delta(v_base->'metrics'->k,v_base->'previousMetrics'->k,v_total_alignment,v_total_reason))
    into v_total_deltas from unnest(array['sales','completedOrders','averageTicket','mainUnits']) k;
  return v_base||jsonb_build_object('series',jsonb_build_object(
    'version','statistics.series.v1','snapshot',jsonb_build_object('revision',v_base->>'revision','asOf',v_base#>>'{period,asOf}'),
    'resolution',v_resolution,'resolutionReason',v_resolution_reason,
    'previousRange',case when v_compare then v_base#>'{period,comparable}' end,
    'coverage',jsonb_build_object('historicalWithoutDate',v_historical,'scope','global_unassigned'),
    'totalAlignment',jsonb_build_object('available',v_total_alignment,'reason',v_total_reason),
    'totalComparisons',v_total_deltas,'points',v_points));
end;
$$;
