-- Phase 2A: explicit execution boundary for public ledger RPCs and reads.

revoke all on function public.create_income(
  uuid, uuid, text, jsonb, uuid, public.finance_category_area, text, timestamptz
) from public, anon;
revoke all on function public.create_expense(
  uuid, uuid, text, jsonb, uuid, public.finance_category_area, text, timestamptz, boolean, boolean
) from public, anon;
revoke all on function public.create_transfer(
  uuid, uuid, text, jsonb, text, timestamptz
) from public, anon;
revoke all on function public.finance_fund_balance(uuid) from public, anon;
revoke all on function public.finance_account_balance(uuid) from public, anon;

grant execute on function public.create_income(
  uuid, uuid, text, jsonb, uuid, public.finance_category_area, text, timestamptz
) to authenticated;
grant execute on function public.create_expense(
  uuid, uuid, text, jsonb, uuid, public.finance_category_area, text, timestamptz, boolean, boolean
) to authenticated;
grant execute on function public.create_transfer(
  uuid, uuid, text, jsonb, text, timestamptz
) to authenticated;
grant execute on function public.finance_fund_balance(uuid) to authenticated;
grant execute on function public.finance_account_balance(uuid) to authenticated;
