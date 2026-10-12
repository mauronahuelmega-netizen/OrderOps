-- Phase 3A: expose correction RPCs only to authenticated callers.

revoke all on function public.edit_finance_transaction_metadata(
  uuid, uuid, text, uuid, text, uuid, public.finance_category_area, timestamptz
) from public, anon, authenticated;

revoke all on function public.void_finance_operation(
  uuid, uuid, text, uuid, text
) from public, anon, authenticated;

revoke all on function public.create_finance_correction(
  uuid, uuid, text, uuid, jsonb, uuid, public.finance_category_area,
  text, timestamptz, boolean, boolean
) from public, anon, authenticated;

grant execute on function public.edit_finance_transaction_metadata(
  uuid, uuid, text, uuid, text, uuid, public.finance_category_area, timestamptz
) to authenticated;

grant execute on function public.void_finance_operation(
  uuid, uuid, text, uuid, text
) to authenticated;

grant execute on function public.create_finance_correction(
  uuid, uuid, text, uuid, jsonb, uuid, public.finance_category_area,
  text, timestamptz, boolean, boolean
) to authenticated;
