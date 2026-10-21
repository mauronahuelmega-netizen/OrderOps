-- PREPARED ONLY. Never run standalone or against another target.
-- Future runner verifies live identity/hash/catalog, creates synthetic fixtures in
-- BEGIN ISOLATION LEVEL REPEATABLE READ, invokes this test, then ROLLBACK.
do $$ begin
 if current_setting('transaction_isolation')<>'repeatable read' then raise exception 'D1_REPEATABLE_READ_REQUIRED'; end if;
 if current_setting('statistics.test_token',true) is distinct from
  (select token from statistics_test_environment.identity where singleton) then raise exception 'D1_ISOLATED_IDENTITY_REQUIRED'; end if;
end $$;
select set_config('statistics.d1.actors',(select jsonb_agg(jsonb_build_object('id',p.id,'business',p.business_id,'role',p.role))::text
 from public.profiles p join public.businesses b on b.id=p.business_id
 where b.slug in ('statistics-synthetic-a','statistics-synthetic-b') and p.role in ('owner','manager','admin')),true);
set local statement_timeout='15s';
set local lock_timeout='3s';
set local role authenticated;
do $$ declare actor jsonb;period text;sort text;sd date;ed date;cur jsonb;oa jsonb;ab jsonb;d1 jsonb;n integer:=0;args text;os text;cs text;ds text;om text;cm text;dm text;begin
 if jsonb_array_length(current_setting('statistics.d1.actors')::jsonb) is distinct from 6 then raise exception 'D1_SIX_SYNTHETIC_AUTHORIZED_ACTORS_REQUIRED';end if;
 for actor in select * from jsonb_array_elements(current_setting('statistics.d1.actors')::jsonb) loop
  perform set_config('request.jwt.claims',jsonb_build_object('sub',actor->>'id','role','authenticated')::text,true);
  foreach period in array array['today','yesterday','this_week','this_month','previous_month','last_7_days','last_30_days','custom'] loop
   foreach sort in array array['units','amount'] loop
    sd:=case when period='custom' then current_date-30 end;ed:=case when period='custom' then current_date end;
    select public.statistics_v1_summary(period,sd,ed,sort,1,null),private.statistics_v1_summary_candidate(period,sd,ed,sort,1,null),
     private.statistics_v1_summary_d1_candidate(period,sd,ed,sort,1,null) into oa,ab,d1;
    if oa is distinct from ab or ab is distinct from d1 then
     raise notice 'D1_DIFF actor=% period=% sort=% original=% ab=% d1=%',actor,period,sort,oa,ab,d1;
     raise exception 'D1_COMPLETE_JSON_DIVERGENCE';
    end if;
    if d1->>'businessId' is distinct from actor->>'business' then raise exception 'D1_BUSINESS_SCOPE_DIVERGENCE';end if;
    cur:=oa#>'{products,nextCursor}';
    if cur is not null and cur<>'null'::jsonb then
     select public.statistics_v1_summary(period,sd,ed,sort,1,cur),private.statistics_v1_summary_candidate(period,sd,ed,sort,1,cur),
      private.statistics_v1_summary_d1_candidate(period,sd,ed,sort,1,cur) into oa,ab,d1;
     if oa is distinct from ab or ab is distinct from d1 then raise notice 'D1_CURSOR_DIFF original=% ab=% d1=%',oa,ab,d1;raise exception 'D1_CURSOR_DIVERGENCE';end if;
    end if;
    n:=n+1;
   end loop;
  end loop;
  foreach args in array array[quote_literal('invalid_period'),quote_literal('today')||',null,null,'||quote_literal('invalid_sort'),
   quote_literal('today')||',null,null,'||quote_literal('units')||',0',quote_literal('today')||',null,null,'||quote_literal('units')||',5,'||quote_literal('null')||'::jsonb',
   quote_literal('today')||',null,null,'||quote_literal('units')||',5,'||quote_literal('{"asOf":"invalid-time"}')||'::jsonb'] loop
   os:=null;cs:=null;ds:=null;om:=null;cm:=null;dm:=null;
   begin execute 'select public.statistics_v1_summary('||args||')';exception when others then os:=sqlstate;om:=sqlerrm;end;
   begin execute 'select private.statistics_v1_summary_candidate('||args||')';exception when others then cs:=sqlstate;cm:=sqlerrm;end;
   begin execute 'select private.statistics_v1_summary_d1_candidate('||args||')';exception when others then ds:=sqlstate;dm:=sqlerrm;end;
   if os is null or cs is distinct from os or ds is distinct from os or cm is distinct from om or dm is distinct from om then
    raise notice 'D1_ERROR_DIFF args=% codes=%/%/% messages=%/%/%',args,os,cs,ds,om,cm,dm;raise exception 'D1_ERROR_DIVERGENCE';end if;
  end loop;
 end loop;
 raise notice 'D1_PASS % complete three-reader comparisons plus cursor/error cases',n;
end $$;
reset role;
-- Caller MUST ROLLBACK; this file performs no install or commit.
