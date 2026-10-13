-- Documentary rollback for PHASE-05 objects applied so far.
-- Do not run if a later PHASE-05 migration exists beyond the drops below.
-- This file is not executed.

drop function if exists public.accrue_commissions_for_collection(uuid);
drop function if exists commercial.accrue_commissions_for_collection(uuid);
drop table if exists commercial.promoter_commissions;

drop function if exists public.record_collection(uuid, text, text, bigint, text);
drop function if exists public.open_obligation(uuid, text, text);
drop function if exists commercial.record_collection(uuid, text, text, bigint, text);
drop function if exists commercial.open_obligation(uuid, text, text);
drop table if exists commercial.platform_collections;
drop table if exists commercial.platform_obligations;
