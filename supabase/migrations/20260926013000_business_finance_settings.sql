-- Per-business finance pointers. Composite foreign keys enforce tenant ownership.

create table public.business_finance_settings (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  protection_account_id uuid,
  default_operating_fund_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_finance_settings_protection_account_fkey
    foreign key (protection_account_id, business_id)
    references public.finance_accounts(id, business_id),
  constraint business_finance_settings_default_fund_fkey
    foreign key (default_operating_fund_id, business_id)
    references public.finance_funds(id, business_id),
  constraint business_finance_settings_default_requires_protection_chk
    check (default_operating_fund_id is null or protection_account_id is not null)
);

create trigger handle_business_finance_settings_updated_at
  before update on public.business_finance_settings
  for each row execute function extensions.moddatetime('updated_at');

create or replace function private.validate_business_finance_settings()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_fund public.finance_funds%rowtype;
begin
  if new.default_operating_fund_id is null then
    return new;
  end if;

  select * into v_fund
  from public.finance_funds
  where id = new.default_operating_fund_id
    and business_id = new.business_id;

  if not found
     or v_fund.account_id <> new.protection_account_id
     or v_fund.fund_type <> 'business_operating'
     or not v_fund.active then
    raise exception 'default operating fund must be active, business_operating, and belong to the protection account'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_business_finance_settings() from public;

create constraint trigger business_finance_settings_validate_default_fund
  after insert or update of business_id, protection_account_id, default_operating_fund_id
  on public.business_finance_settings
  deferrable initially deferred
  for each row execute function private.validate_business_finance_settings();

create or replace function private.validate_committed_finance_fund()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_protection_account_id uuid;
begin
  if new.fund_type <> 'committed' or not new.active then
    return new;
  end if;

  select protection_account_id into v_protection_account_id
  from public.business_finance_settings
  where business_id = new.business_id;

  if v_protection_account_id is null or new.account_id <> v_protection_account_id then
    raise exception 'active committed fund must belong to the configured protection account'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_committed_finance_fund() from public;

create constraint trigger finance_funds_validate_committed
  after insert or update of business_id, account_id, fund_type, order_id, active
  on public.finance_funds
  deferrable initially deferred
  for each row execute function private.validate_committed_finance_fund();
