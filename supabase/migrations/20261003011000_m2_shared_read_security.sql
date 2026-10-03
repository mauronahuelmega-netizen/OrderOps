-- M2 shared read contracts are authenticated-only; all tenant checks are internal.

revoke all on function public.current_business_context() from public, anon;
revoke all on function public.finance_reference_data(uuid) from public, anon;
revoke all on function public.finance_dashboard_summary(uuid) from public, anon;
revoke all on function public.finance_transaction_search(uuid,text,integer,integer) from public, anon;
revoke all on function public.finance_transaction_detail(uuid) from public, anon;
revoke all on function public.finance_fund_activity(uuid,integer) from public, anon;
revoke all on function public.business_order_finance_summaries(uuid,integer) from public, anon;
revoke all on function public.finance_reconciliation_list(uuid) from public, anon;
revoke all on function public.finance_reconciliation_candidates(uuid) from public, anon;

grant execute on function public.current_business_context() to authenticated;
grant execute on function public.finance_reference_data(uuid) to authenticated;
grant execute on function public.finance_dashboard_summary(uuid) to authenticated;
grant execute on function public.finance_transaction_search(uuid,text,integer,integer) to authenticated;
grant execute on function public.finance_transaction_detail(uuid) to authenticated;
grant execute on function public.finance_fund_activity(uuid,integer) to authenticated;
grant execute on function public.business_order_finance_summaries(uuid,integer) to authenticated;
grant execute on function public.finance_reconciliation_list(uuid) to authenticated;
grant execute on function public.finance_reconciliation_candidates(uuid) to authenticated;
