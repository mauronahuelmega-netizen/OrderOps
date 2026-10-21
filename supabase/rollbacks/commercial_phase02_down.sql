-- Local rollback for Commercial Core PHASE-02.
-- Do not run if a later commercial migration is applied.
-- This file is not executed by P02-T01 through P02-T06.

drop function if exists public.merge_commercial_businesses(uuid, uuid, text);
drop function if exists public.upsert_task(uuid, uuid, text, text, timestamptz, text, text);
drop function if exists public.transition_opportunity(uuid, text, text);
drop function if exists public.opportunity_detail(uuid);
drop function if exists public.list_open_opportunities();
drop function if exists public.commercial_session();
drop function if exists public.submit_demo_request(text, text, text, text, text, text, text, text, text, text);
drop function if exists commercial.merge_commercial_businesses(uuid, uuid, text);
drop function if exists commercial.opportunity_detail(uuid);
drop function if exists commercial.list_open_opportunities();
drop function if exists commercial.can_read_commercial_board();
drop function if exists commercial.commercial_session();
drop function if exists commercial.submit_demo_request(text, text, text, text, text, text, text, text, text, text);
drop function if exists commercial.upsert_task(uuid, uuid, text, text, timestamptz, text, text);
drop function if exists commercial.transition_opportunity(uuid, text, text);
drop function if exists commercial.find_or_prepare_business(text, text, text, text);
drop function if exists commercial.normalize_ar_phone(text);
drop function if exists commercial.normalize_name(text);
drop table if exists commercial.demo_rate_buckets;

drop table if exists commercial.commercial_tasks;
drop table if exists commercial.opportunity_stage_events;
drop table if exists commercial.commercial_interactions;
drop table if exists commercial.demo_submissions;
drop table if exists commercial.commercial_opportunities;
drop table if exists commercial.commercial_contacts;
drop table if exists commercial.commercial_merges;
drop table if exists commercial.commercial_businesses;
