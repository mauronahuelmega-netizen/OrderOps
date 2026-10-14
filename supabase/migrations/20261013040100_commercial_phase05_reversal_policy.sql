-- P05-T05 follow-up. A nominal collection may be reversed without losing its eligible base.
-- The original check required status = posted. That file stays unchanged.

alter table commercial.platform_collections drop constraint platform_collections_policy_chk;
alter table commercial.platform_collections add constraint platform_collections_policy_chk check (
  (
    policy_status = 'nominal'
    and status in ('posted', 'reversed')
    and eligible_base_cents = gross_cents
  )
  or (
    policy_status = 'blocked_pending_policy'
    and eligible_base_cents is null
  )
);
