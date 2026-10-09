-- Manual rollback for PHASE-03 (promoters → panel → separation guard).
-- NOT executed by the agent. Run only when PHASE-04 objects are absent.
--
-- Limitations (documented, not hidden):
-- 1. Does not drop storage.buckets row `commercial-documents` (may hold objects;
--    deleting the bucket is an ops decision outside this script).
-- 2. Does not remove audit_events / outbox_events rows written during PHASE-03
--    (append-only history from PHASE-01).
-- 3. Migration file `20261009020527_commercial_phase03_separation.sql` is empty
--    in the applied history; the body lives in `20261009020618`. This script
--    reverses the objects from the body migration, not a no-op file.
-- 4. If PHASE-04 (commissions / settlements / onboarding grants) was applied,
--    stop and reverse PHASE-04 first — this script does not cover those tables.
--
-- Order: dependents first (panel wrappers → disputes → attributions → claims →
-- verification → promoters). Shared PHASE-01/02 objects are intentionally kept.

-- P03-T07 panel public wrappers and commercial functions
drop function if exists public.promoter_upsert_task(uuid, uuid, text, text, timestamptz);
drop function if exists public.promoter_transition_opportunity(uuid, text, text);
drop function if exists public.promoter_add_note(uuid, text);
drop function if exists public.register_promoter_business(text, text, text);
drop function if exists public.promoter_overview();
drop function if exists public.promoter_session();
drop function if exists commercial.promoter_upsert_task(uuid, uuid, text, text, timestamptz);
drop function if exists commercial.promoter_transition_opportunity(uuid, text, text);
drop function if exists commercial.promoter_add_note(uuid, text);
drop function if exists commercial.register_promoter_business(text, text, text);
drop function if exists commercial.promoter_overview();
drop function if exists commercial.promoter_session();

-- P03-T06 separation
drop function if exists public.separate_promoter(uuid, uuid, text, uuid);
drop function if exists commercial.separate_promoter(uuid, uuid, text, uuid);
drop table if exists commercial.opportunity_protections;
drop table if exists commercial.promoter_separations;

-- P03-T05 disputes
drop function if exists public.read_dispute(uuid);
drop function if exists public.decide_dispute(uuid, text, text, text, boolean);
drop function if exists public.open_dispute(uuid, uuid[], text);
drop function if exists commercial.read_dispute(uuid);
drop function if exists commercial.decide_dispute(uuid, text, text, text, boolean);
drop function if exists commercial.open_dispute(uuid, uuid[], text);
drop table if exists commercial.dispute_events;
drop table if exists commercial.dispute_parties;
drop table if exists commercial.attribution_disputes;

-- P03-T04 attribution (submit_demo_request body is PHASE-02 + referral hook;
-- do not drop public.submit_demo_request here — that belongs to PHASE-02 rollback)
drop function if exists public.confirm_attribution(uuid, uuid, uuid, text);
drop function if exists commercial.confirm_attribution(uuid, uuid, uuid, text);
drop function if exists commercial.try_automatic_referral(uuid, text, uuid);
drop function if exists commercial.promoter_has_substantive_activity(uuid, uuid);
drop table if exists commercial.opportunity_attributions;

-- P03-T03 claims
drop function if exists public.expire_due_claims();
drop function if exists public.extend_claim(uuid, uuid, text);
drop function if exists public.create_claim(uuid, uuid);
drop function if exists commercial.expire_due_claims();
drop function if exists commercial.extend_claim(uuid, uuid, text);
drop function if exists commercial.create_claim(uuid, uuid);
drop table if exists commercial.claim_extensions;
drop table if exists commercial.attribution_claims;

-- P03-T02 verification / bank
drop function if exists public.read_own_bank();
drop function if exists public.replace_bank_account(uuid, text, text, text);
drop function if exists public.activate_promoter(uuid);
drop function if exists public.review_verification(uuid, text, text);
drop function if exists public.submit_promoter_evidence(uuid, text, text);
drop function if exists commercial.read_own_bank();
drop function if exists commercial.replace_bank_account(uuid, text, text, text);
drop function if exists commercial.activate_promoter(uuid);
drop function if exists commercial.review_verification(uuid, text, text);
drop function if exists commercial.submit_promoter_evidence(uuid, text, text);
drop table if exists commercial.promoter_bank_accounts;
drop table if exists commercial.promoter_verifications;
drop table if exists commercial.promoter_contracts;

-- P03-T01 promoters (+ T07 guard replaces transition; drop both wrappers)
drop function if exists public.transition_promoter_status(uuid, text);
drop function if exists public.register_promoter(text, text, text);
drop function if exists commercial.transition_promoter_status(uuid, text);
drop function if exists commercial.register_promoter(text, text, text);
drop function if exists commercial.promoter_can_operate(text);
drop function if exists commercial.current_promoter_id();
drop table if exists commercial.promoters;

-- Do not drop commercial.reject_promoter_business_member / ENG-11 trigger:
-- those objects belong to PHASE-01 foundations.
