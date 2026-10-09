-- Manual rollback for PHASE-03. Not executed by the agent.
-- Run only when PHASE-04 is absent.

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
drop function if exists public.transition_promoter_status(uuid, text);
drop function if exists public.register_promoter(text, text, text);
drop function if exists commercial.transition_promoter_status(uuid, text);
drop function if exists commercial.register_promoter(text, text, text);
drop function if exists commercial.promoter_can_operate(text);
drop function if exists commercial.current_promoter_id();
drop table if exists commercial.promoters;
