-- Runner-owned RR fixture, approved isolated identity only; no persistent changes.
reset role;
savepoint d1_configuration;
update public.business_settings set finance_enabled=false,timezone=null
 where business_id=(select id from public.businesses where slug='statistics-synthetic-a');
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('statistics.f2b.actor'),'role','authenticated')::text,true);
do $$ declare a jsonb;b jsonb;z jsonb;begin
 select public.statistics_v1_summary('today'),private.statistics_v1_summary_candidate('today'),private.statistics_v1_summary_d1_candidate('today') into a,b,z;
 if a is distinct from b or b is distinct from z or z->>'status' is distinct from 'configuration_required' then raise exception 'D1_CONFIGURATION_BRANCH_DIVERGENCE';end if;
end $$;
reset role;
rollback to savepoint d1_configuration;
release savepoint d1_configuration;
set local role authenticated;
do $$ declare args text;oa text;ba text;da text;om text;bm text;dm text;today date;begin
 select (statement_timestamp() at time zone timezone)::date into today from public.business_settings where business_id=(select business_id from public.profiles where id=auth.uid());
 foreach args in array array[
  quote_literal('custom')||','||quote_literal((today+1)::text)||','||quote_literal((today+1)::text),
  quote_literal('custom')||','||quote_literal(today::text)||','||quote_literal((today-1)::text),
  quote_literal('today')||',null,null,'||quote_literal('units')||',21',
  quote_literal('today')||',null,null,'||quote_literal('units')||',5,'||quote_literal(jsonb_build_object('asOf',statement_timestamp()+interval '1 day')::text)||'::jsonb',
  quote_literal('today')||',null,null,'||quote_literal('units')||',5,'||quote_literal('{"asOf":"infinity"}')||'::jsonb',
  quote_literal('today')||',null,null,'||quote_literal('units')||',5,'||quote_literal(jsonb_build_object('asOf',statement_timestamp(),'revision','stale','requestKey','forged','offset',0)::text)||'::jsonb'
 ] loop
  oa:=null;ba:=null;da:=null;om:=null;bm:=null;dm:=null;
  begin execute 'select public.statistics_v1_summary('||args||')';exception when others then oa:=sqlstate;om:=sqlerrm;end;
  begin execute 'select private.statistics_v1_summary_candidate('||args||')';exception when others then ba:=sqlstate;bm:=sqlerrm;end;
  begin execute 'select private.statistics_v1_summary_d1_candidate('||args||')';exception when others then da:=sqlstate;dm:=sqlerrm;end;
  if oa is null or ba is distinct from oa or da is distinct from oa or bm is distinct from om or dm is distinct from om then raise exception 'D1_EDGE_ERROR_PRECEDENCE_DIVERGENCE';end if;
 end loop;
end $$;
reset role;
