-- Synthetic setup transaction supplied by the fixed isolated runner. Always rolled back.
do $$ declare actor uuid;business uuid;begin
 if (select attnotnull from pg_attribute where attrelid='public.profiles'::regclass and attname='role') is distinct from true then raise exception 'ROLE_NOT_NULL_BASELINE_REQUIRED';end if;
 if exists(select 1 from pg_class where oid in ('public.profiles'::regclass,'public.orders'::regclass,'public.order_items'::regclass,'public.order_financials'::regclass,'public.order_statistics_completions'::regclass,'public.order_statistics_completion_items'::regclass,'public.order_item_statistics_snapshots'::regclass,'public.store_sessions'::regclass,'public.store_session_statistics_snapshots'::regclass,'public.business_settings'::regclass,'public.products'::regclass) and not relrowsecurity) then raise exception 'RLS_DISABLED';end if;
 select p.id,p.business_id into actor,business from public.profiles p join public.businesses b on b.id=p.business_id where b.slug='statistics-synthetic-a' and p.role='operator';
 if actor is null then raise exception 'SYNTHETIC_OPERATOR_REQUIRED';end if;
 begin update public.profiles set role='unknown' where id=actor;raise exception 'UNKNOWN_ROLE_CONSTRAINT_NOT_ENFORCED';exception when check_violation then null;end;
 begin update public.profiles set role=null where id=actor;raise exception 'NULL_ROLE_CONSTRAINT_NOT_ENFORCED';exception when not_null_violation then null;end;
 select id into actor from public.profiles where role='super_admin' and id=any(current_setting('statistics.f2a.synthetic_actor_ids')::uuid[]) limit 1;
 if actor is null then raise exception 'SYNTHETIC_SUPER_ADMIN_REQUIRED';end if;
 update public.profiles set business_id=null where id=actor;
 -- Capture synthetic actors only. Null-business super_admin IDs are explicit from credentials via setup.
end $$;
select set_config('statistics.f2b.actors',(select jsonb_agg(jsonb_build_object('id',p.id,'role',p.role,'business',p.business_id))::text
 from public.profiles p where p.id=any(current_setting('statistics.f2a.synthetic_actor_ids')::uuid[])),true);
set local role authenticated;
do $$ declare a jsonb;r jsonb;name text;code text;n integer:=0;other uuid;begin
 if jsonb_array_length(current_setting('statistics.f2b.actors')::jsonb)<>12 then raise exception 'TWELVE_ACTORS_REQUIRED';end if;
 for a in select value from jsonb_array_elements(current_setting('statistics.f2b.actors')::jsonb) loop
  select (value->>'business')::uuid into other from jsonb_array_elements(current_setting('statistics.f2b.actors')::jsonb) where value->>'business'<>a->>'business' limit 1;
  -- Manipulated metadata has no authority: actual profile role/tenant are used.
  perform set_config('request.jwt.claims',jsonb_build_object('sub',a->>'id','role','authenticated','user_metadata',jsonb_build_object('role','owner','business_id',other))::text,true);
  foreach name in array array['statistics_v1_read_core_candidate','statistics_v1_summary_base_candidate','statistics_v1_summary_candidate'] loop
   code:=null;r:=null;
   begin execute format('select private.%I($1)',name) into r using 'today';exception when others then code:=sqlstate;end;
   if a->>'role' in ('owner','manager','admin') and a->>'business' is not null then
    if code is not null then raise exception 'AUTHORIZED_HELPER_FAILED % % %',a->>'role',name,code;end if;
    if name='statistics_v1_read_core_candidate' then
     if r#>>'{legacy,businessId}' is distinct from a->>'business' or exists(select 1 from jsonb_array_elements(r->'effectiveFacts') f where f->>'business_id' is distinct from a->>'business') then raise exception 'CROSS_TENANT_CORE';end if;
    elsif r->>'businessId' is distinct from a->>'business' then raise exception 'CROSS_TENANT_WRAPPER';end if;
   elsif code is distinct from '42501' then raise exception 'DENIED_HELPER_ACCEPTED % % %',a->>'role',name,code;end if;
   n:=n+1;
  end loop;
  -- All RLS analytical reads must exclude the other business even under forged metadata.
  if exists(select 1 from public.statistics_v1_effective_facts where business_id is distinct from (a->>'business')::uuid)
    or exists(select 1 from public.order_statistics_completions where business_id is distinct from (a->>'business')::uuid)
    or exists(select 1 from public.order_item_statistics_snapshots where business_id is distinct from (a->>'business')::uuid)
    or exists(select 1 from public.order_statistics_completion_items where business_id is distinct from (a->>'business')::uuid)
    or exists(select 1 from public.store_session_statistics_snapshots where business_id is distinct from (a->>'business')::uuid)
    or exists(select 1 from public.business_statistics_state where business_id is distinct from (a->>'business')::uuid) then raise exception 'ANALYTICAL_RLS_LEAK';end if;
 end loop;
 foreach name in array array['statistics_v1_read_core_candidate','statistics_v1_summary_base_candidate','statistics_v1_summary_candidate'] loop
  perform set_config('request.jwt.claims','{}',true);code:=null;
  begin execute format('select private.%I($1)',name) using 'today';exception when others then code:=sqlstate;end;
  if code is distinct from '42501' then raise exception 'NO_SESSION_HELPER_ACCEPTED';end if;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',gen_random_uuid(),'role','unknown')::text,true);code:=null;
  begin execute format('select private.%I($1)',name) using 'today';exception when others then code:=sqlstate;end;
  if code is distinct from '42501' then raise exception 'MISSING_PROFILE_OR_UNKNOWN_CLAIMS_ACCEPTED';end if;
  if has_function_privilege('anon',format('private.%I(text,date,date,text,integer,jsonb)',name),'execute') or has_function_privilege('service_role',format('private.%I(text,date,date,text,integer,jsonb)',name),'execute') then raise exception 'ACL_WIDENED';end if;
 end loop;
 raise notice 'PASS security: % direct actor/helper combinations, forged metadata, tenant scope, RLS, missing session/profile and ACL',n;
end $$;
reset role;
