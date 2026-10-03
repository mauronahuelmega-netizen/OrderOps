-- M1.A: operation vocabulary. Structural use follows after this enum transaction commits.

alter type public.finance_operation_type add value if not exists 'order_refund';
alter type public.finance_operation_type add value if not exists 'order_retention';
alter type public.finance_operation_type add value if not exists 'order_financial_cancel';
alter type public.finance_operation_type add value if not exists 'order_payment_reversal';
