-- PREPARED ONLY. Execute only after explicit P03-F.2B authorization and isolation gate.
-- Requires a caller-owned synthetic fixture transaction: no BEGIN/COMMIT, preserves that snapshot.
set local lock_timeout='3s';
set local statement_timeout='15s';
do $$ begin
 if current_setting('statistics.test_token',true) is distinct from
   (select token from statistics_test_environment.identity where singleton) then raise exception 'ISOLATED_TOKEN_REQUIRED';end if;
 if to_regprocedure('private.statistics_v1_summary_candidate(text,date,date,text,integer,jsonb)') is null then raise exception 'CANDIDATE_NOT_INSTALLED';end if;
 if not exists(select 1 from public.orders o join public.businesses b on b.id=o.business_id where b.slug='statistics-synthetic-a') then raise exception 'NONEMPTY_SYNTHETIC_FIXTURE_REQUIRED';end if;
 if current_setting('statistics.f2a.synthetic_actor_ids',true) is null then raise exception 'EXPLICIT_SYNTHETIC_ACTORS_REQUIRED';end if;
end $$;
-- Collect synthetic principals while the fixture connection owns its setup role.
select set_config('statistics.f2a.actors',(
 select jsonb_agg(jsonb_build_object('id',p.id,'role',p.role,'business',p.business_id))::text
 from public.profiles p left join public.businesses b on b.id=p.business_id
 where p.id=any(current_setting('statistics.f2a.synthetic_actor_ids')::uuid[])
   and (b.slug in ('statistics-synthetic-a','statistics-synthetic-b') or (p.role='super_admin' and p.business_id is null))
),true);
do $$ begin
 if jsonb_array_length(current_setting('statistics.f2a.actors')::jsonb)<>12
   or exists(select 1 from unnest(array['owner','manager','admin','operator','viewer','super_admin']) r
     where (select count(*) from jsonb_array_elements(current_setting('statistics.f2a.actors')::jsonb) a where a->>'role'=r)<>2)
 then raise exception 'TWELVE_SYNTHETIC_PRINCIPALS_SIX_ROLES_REQUIRED';end if;
end $$;
set local role authenticated;
do $$
declare actor jsonb;period text;sort text;a jsonb;b jsonb;c jsonb;d jsonb;
  sd date;ed date;cur jsonb;original_code text;candidate_code text;n integer:=0;
begin
 for actor in select value from jsonb_array_elements(current_setting('statistics.f2a.actors')::jsonb) loop
  perform set_config('request.jwt.claims',jsonb_build_object('sub',actor->>'id','role','authenticated')::text,true);
  if actor->>'role' in ('owner','manager','admin') then
   foreach period in array array['today','yesterday','this_week','this_month','previous_month','last_7_days','last_30_days','custom'] loop
    foreach sort in array array['units','amount'] loop
     sd:=case when period='custom' then current_date-30 end;ed:=case when period='custom' then current_date-1 end;
     -- One SELECT: same STABLE snapshot and statement timestamp; no field normalization.
     select public.statistics_v1_summary(period,sd,ed,sort,1,null),private.statistics_v1_summary_candidate(period,sd,ed,sort,1,null),
       private.statistics_v1_summary_base(period,sd,ed,sort,1,null),private.statistics_v1_summary_base_candidate(period,sd,ed,sort,1,null)
       into a,b,c,d;
     if a is distinct from b or c is distinct from d or a-'series' is distinct from c then raise exception 'F2A_JSON_DIFFERENCE role=%, period=%, sort=%',actor->>'role',period,sort;end if;
     if a->>'businessId' is distinct from actor->>'business' then raise exception 'TENANT_MISMATCH';end if;
     cur:=a#>'{products,nextCursor}';
     if cur is not null then
      select public.statistics_v1_summary(period,sd,ed,sort,1,cur),private.statistics_v1_summary_candidate(period,sd,ed,sort,1,cur) into a,b;
      if a is distinct from b then raise exception 'CURSOR_JSON_DIFFERENCE';end if;
     end if;
     n:=n+1;
    end loop;
   end loop;
  else
   original_code:=null;candidate_code:=null;
   begin perform public.statistics_v1_summary('today');exception when others then original_code:=sqlstate;end;
   begin perform private.statistics_v1_summary_candidate('today');exception when others then candidate_code:=sqlstate;end;
   if original_code is distinct from '42501' or candidate_code is distinct from '42501' then raise exception 'ACCESS_DIFFERENCE';end if;
   begin perform private.statistics_v1_read_core_candidate('today');raise exception 'CORE_ACCEPTED_DENIED_ROLE';exception when insufficient_privilege then null;end;
   begin perform private.statistics_v1_summary_base_candidate('today');raise exception 'BASE_ACCEPTED_DENIED_ROLE';exception when insufficient_privilege then null;end;
  end if;
 end loop;
 -- Missing profile: no row is inserted or deleted.
 perform set_config('request.jwt.claims',jsonb_build_object('sub',gen_random_uuid(),'role','authenticated')::text,true);
 begin perform private.statistics_v1_summary_candidate('today');raise exception 'MISSING_PROFILE_ACCEPTED';exception when insufficient_privilege then null;end;
 if n=0 then raise exception 'NO_AUTHORIZED_CASES_EXECUTED';end if;
 raise notice 'PASS differential cases %; exact JSON, cursor and direct helper authorization',n;
end;
$$;
reset role;
-- Caller MUST rollback its fixture transaction and verify cleanup. This file never commits fixtures.
