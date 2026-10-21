create function private.statistics_v1_summary_d1_candidate(
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
  v_bundle:=private.statistics_v1_read_core_candidate(p_period,p_start_date,p_end_date,p_product_sort,p_limit,p_cursor);
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
