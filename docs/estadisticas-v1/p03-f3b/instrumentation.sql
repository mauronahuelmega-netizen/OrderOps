-- PREPARED ONLY. Future isolated RR fixture transaction and authenticated actor required.
-- Counters must be differenced per execution; never reset shared/global statistics.
set local statement_timeout='15s';
set local track_functions='all';
select 'D1_COUNTERS_BEFORE';
select schemaname,funcname,calls,total_time,self_time from pg_stat_xact_user_functions order by schemaname,funcname;
set local role authenticated;
explain (analyze,buffers,settings,format json) select public.statistics_v1_summary('today');
reset role;
select 'D1_COUNTERS_AFTER_ORIGINAL';
select schemaname,funcname,calls,total_time,self_time from pg_stat_xact_user_functions order by schemaname,funcname;
set local role authenticated;
explain (analyze,buffers,settings,format json) select private.statistics_v1_summary_candidate('today');
reset role;
select 'D1_COUNTERS_AFTER_AB';
select schemaname,funcname,calls,total_time,self_time from pg_stat_xact_user_functions order by schemaname,funcname;
set local role authenticated;
explain (analyze,buffers,settings,format json) select private.statistics_v1_summary_d1_candidate('today');
reset role;
select 'D1_COUNTERS_AFTER_D1';
select schemaname,funcname,calls,total_time,self_time from pg_stat_xact_user_functions order by schemaname,funcname;
set local track_functions='none';
-- No persistent configuration, no global pg_stat_reset, no COMMIT; runner ROLLBACK.
