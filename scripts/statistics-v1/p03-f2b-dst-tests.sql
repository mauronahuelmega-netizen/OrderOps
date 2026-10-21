reset role;
update public.business_settings set timezone='Australia/Lord_Howe' where business_id=(select id from public.businesses where slug='statistics-synthetic-a');
insert into public.store_sessions(id,business_id,opened_at,closed_at,status)
select md5('F2B:DST:'||kind||':'||side)::uuid,b.id,(d+lo) at time zone 'Australia/Lord_Howe',(d+hi) at time zone 'Australia/Lord_Howe','closed'
from public.businesses b cross join (values
 ('gap','current',date '2026-10-04',time '01:30',time '03:30'),('gap','previous',date '2026-10-03',time '01:30',time '03:30'),
 ('fold','current',date '2026-04-05',time '01:15',time '02:15'),('fold','previous',date '2026-04-04',time '01:15',time '02:15')) s(kind,side,d,lo,hi)
where b.slug='statistics-synthetic-a';
-- Gap dataset, explicitly synthetic captured rows placed at fixture instants, no production history inferred.
with x as(select n,case when n<=5 then 'current' else 'previous' end side,(n-1)%5 pos from generate_series(1,10)n)
update public.order_statistics_completions c set session_id=s.id,session_key=s.id,session_opened_at=s.opened_at,timezone='Australia/Lord_Howe',commercial_date=(s.opened_at at time zone 'Australia/Lord_Howe')::date,
 completed_at=case x.pos when 0 then s.opened_at when 1 then s.opened_at+interval '1 hour'-interval '1 microsecond' when 2 then s.opened_at+interval '1 hour' when 3 then s.opened_at+interval '1 hour'+interval '1 microsecond' else s.closed_at end,date_kind='verified_session',date_conflict=false
from x join public.store_sessions s on s.id=md5('F2B:DST:gap:'||x.side)::uuid where c.active and c.order_id=md5('P03F1:synthetic:'||x.n)::uuid;
set local role authenticated;
do $$ declare a jsonb;b jsonb;begin
 select public.statistics_v1_summary('custom','2026-10-04','2026-10-04'),private.statistics_v1_summary_candidate('custom','2026-10-04','2026-10-04') into a,b;
 if a is distinct from b then raise notice 'ORIGINAL_JSON=%',a;raise notice 'CANDIDATE_JSON=%',b;raise exception 'DST_GAP_DIVERGENCE';end if;
end $$;
reset role;
with x as(select n,case when n<=5 then 'current' else 'previous' end side,(n-1)%5 pos from generate_series(1,10)n)
update public.order_statistics_completions c set session_id=s.id,session_key=s.id,session_opened_at=s.opened_at,timezone='Australia/Lord_Howe',commercial_date=(s.opened_at at time zone 'Australia/Lord_Howe')::date,
 completed_at=case x.pos when 0 then s.opened_at when 1 then s.opened_at+interval '30 minutes'-interval '1 microsecond' when 2 then s.opened_at+interval '30 minutes' when 3 then s.opened_at+interval '30 minutes'+interval '1 microsecond' else s.closed_at end,date_kind='verified_session',date_conflict=false
from x join public.store_sessions s on s.id=md5('F2B:DST:fold:'||x.side)::uuid where c.active and c.order_id=md5('P03F1:synthetic:'||x.n)::uuid;
set local role authenticated;
do $$ declare a jsonb;b jsonb;begin
 select public.statistics_v1_summary('custom','2026-04-05','2026-04-05'),private.statistics_v1_summary_candidate('custom','2026-04-05','2026-04-05') into a,b;
 if a is distinct from b then raise notice 'ORIGINAL_JSON=%',a;raise notice 'CANDIDATE_JSON=%',b;raise exception 'DST_FOLD_DIVERGENCE';end if;
end $$;
reset role;
