-- DML exclusively on the ten runner-owned synthetic UUIDs; each reader pair uses authenticated.
reset role;
update public.orders set status='preparing' where id=md5('P03F1:synthetic:1')::uuid;
set local role authenticated;
do $$ declare a jsonb;b jsonb;begin
 select public.statistics_v1_summary('last_30_days'),private.statistics_v1_summary_candidate('last_30_days') into a,b;
 if a is distinct from b then raise notice 'ORIGINAL_JSON=%',a;raise notice 'CANDIDATE_JSON=%',b;raise exception 'REOPEN_DIVERGENCE';end if;
end $$;
reset role;
set local role authenticated;
do $$ declare actor jsonb;a jsonb;b jsonb;begin
 for actor in select value from jsonb_array_elements(current_setting('statistics.f2b.owners')::jsonb) loop
  perform set_config('request.jwt.claims',jsonb_build_object('sub',actor#>>'{}','role','authenticated')::text,true);
  select public.statistics_v1_summary('last_30_days'),private.statistics_v1_summary_candidate('last_30_days') into a,b;
  if a is distinct from b then raise notice 'ORIGINAL_JSON=%',a;raise notice 'CANDIDATE_JSON=%',b;raise exception 'TWO_BUSINESS_STATE_DIVERGENCE';end if;
 end loop;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('statistics.f2b.actor'),'role','authenticated')::text,true);
end $$;
reset role;
update public.order_financials set agreed_total=9.99 where order_id=md5('P03F1:synthetic:2')::uuid;
update public.order_items set quantity=2 where order_id=md5('P03F1:synthetic:3')::uuid and item_kind='product';
update public.orders set status='cancelled' where id=md5('P03F1:synthetic:4')::uuid;
set local role authenticated;
do $$ declare a jsonb;b jsonb;begin
 select public.statistics_v1_summary('last_30_days'),private.statistics_v1_summary_candidate('last_30_days') into a,b;
 if a is distinct from b then raise notice 'ORIGINAL_JSON=%',a;raise notice 'CANDIDATE_JSON=%',b;raise exception 'FINANCE_COMPOSITION_CANCEL_DIVERGENCE';end if;
end $$;
reset role;
update public.orders set status='completed' where id=md5('P03F1:synthetic:1')::uuid;
delete from public.order_financials where order_id=md5('P03F1:synthetic:5')::uuid;
update public.orders set status='preparing' where id=md5('P03F1:synthetic:5')::uuid;
update public.orders set status='completed' where id=md5('P03F1:synthetic:5')::uuid;
set local role authenticated;
do $$ declare a jsonb;b jsonb;begin
 select public.statistics_v1_summary('last_30_days'),private.statistics_v1_summary_candidate('last_30_days') into a,b;
 if a is distinct from b then raise notice 'ORIGINAL_JSON=%',a;raise notice 'CANDIDATE_JSON=%',b;raise exception 'RECOMPLETE_NULL_AGREEMENT_DIVERGENCE';end if;
end $$;
reset role;
-- Explicit historical-without-reliable-completion synthetic record; INSERT status is not captured finalization.
insert into public.orders(id,business_id,customer_name,phone,delivery_date,delivery_method,total_price,composition_status,order_code,status)
select md5('F2B:no-date')::uuid,id,'SYNTHETIC F2B NO COMPLETION','0000000000',current_date,'pickup',10,'itemized','F2B222','completed' from public.businesses where slug='statistics-synthetic-a';
set local role authenticated;
do $$ declare a jsonb;b jsonb;begin
 select public.statistics_v1_summary('last_30_days'),private.statistics_v1_summary_candidate('last_30_days') into a,b;
 if a is distinct from b then raise notice 'ORIGINAL_JSON=%',a;raise notice 'CANDIDATE_JSON=%',b;raise exception 'HISTORICAL_COVERAGE_DIVERGENCE';end if;
 if a#>>'{coverage,historicalWithoutDate}' is distinct from '1' then raise exception 'HISTORICAL_FIXTURE_INVALID';end if;
end $$;
reset role;
set local role authenticated;
do $$ declare actor text;a jsonb;b jsonb;begin
 for actor in select value from jsonb_array_elements_text(current_setting('statistics.f2b.owners')::jsonb) loop
  perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
  select public.statistics_v1_summary('last_30_days'),private.statistics_v1_summary_candidate('last_30_days') into a,b;
  if a is distinct from b then raise notice 'ORIGINAL_JSON=%',a;raise notice 'CANDIDATE_JSON=%',b;raise exception 'FINAL_TWO_BUSINESS_FINANCE_DIVERGENCE';end if;
 end loop;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('statistics.f2b.actor'),'role','authenticated')::text,true);
end $$;
reset role;
