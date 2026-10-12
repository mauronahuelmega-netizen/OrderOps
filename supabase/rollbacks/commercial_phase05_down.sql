-- Local rollback for P05-T01 collections only.
-- Do not run if a later PHASE-05 migration is applied.
-- This file is not executed by P05-T01.

drop function if exists public.record_collection(uuid, text, text, bigint, text);
drop function if exists public.open_obligation(uuid, text, text);
drop function if exists commercial.record_collection(uuid, text, text, bigint, text);
drop function if exists commercial.open_obligation(uuid, text, text);
drop table if exists commercial.platform_collections;
drop table if exists commercial.platform_obligations;
