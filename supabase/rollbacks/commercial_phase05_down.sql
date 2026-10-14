-- Documentary rollback for PHASE-05 objects applied so far.
-- Do not run if a later PHASE-05 migration exists beyond the drops below.
-- This file is not executed.

drop function if exists public.post_adjustment(uuid, bigint, text, text);
drop function if exists public.reverse_collection(uuid, text);
drop function if exists commercial.post_adjustment(uuid, bigint, text, text);
drop function if exists commercial.reverse_collection(uuid, text);
drop table if exists commercial.commission_adjustments;

drop function if exists public.reactivate_service(uuid);
drop function if exists public.end_service(uuid, timestamptz, timestamptz);
drop function if exists public.satisfy_subscription_collection(uuid);
drop function if exists commercial.reactivate_service(uuid);
drop function if exists commercial.end_service(uuid, timestamptz, timestamptz);
drop function if exists commercial.satisfy_subscription_collection(uuid);
drop table if exists commercial.service_subscriptions;
drop table if exists commercial.founder_slots;

drop function if exists public.release_setup_commission(uuid, text);
drop function if exists public.refresh_commission_availability();
drop function if exists commercial.release_setup_commission(uuid, text);
drop function if exists commercial.refresh_commission_availability();

drop function if exists public.accrue_commissions_for_collection(uuid);
drop function if exists commercial.accrue_commissions_for_collection(uuid);
drop table if exists commercial.promoter_commissions;

drop function if exists public.record_collection(uuid, text, text, bigint, text);
drop function if exists public.open_obligation(uuid, text, text);
drop function if exists commercial.record_collection(uuid, text, text, bigint, text);
drop function if exists commercial.open_obligation(uuid, text, text);
drop table if exists commercial.platform_collections;
drop table if exists commercial.platform_obligations;
