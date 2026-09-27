-- Phase 3A: enum value must commit before constraints may reference it.

alter type public.finance_operation_type
  add value if not exists 'metadata_edit';
