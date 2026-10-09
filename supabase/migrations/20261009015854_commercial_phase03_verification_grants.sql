-- SELECT is required for RLS to apply. Writes stay revoked.

grant select on commercial.promoters to authenticated;
grant select on commercial.promoter_contracts to authenticated;
grant select on commercial.promoter_verifications to authenticated;
grant select on commercial.promoter_bank_accounts to authenticated;
