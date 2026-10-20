-- Talo First L2. Durable webhook inbox. A notice only schedules an authenticated read:
-- it never confirms, imputes, grants access or accrues. Unknown customers are not persisted.

create table commercial.provider_webhook_inbox (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references commercial.provider_customer_links (id),
  provider text not null check (provider = 'talo'),
  environment text not null check (environment in ('sandbox', 'production')),
  external_customer_id text not null,
  external_transaction_id text not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'retry', 'processed', 'dead')),
  attempts int not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz not null default pg_catalog.now(),
  locked_at timestamptz,
  last_error text,
  receipt_id uuid references commercial.provider_receipts (id),
  signature_present boolean not null default false,
  notice_count int not null default 1 check (notice_count >= 1),
  first_received_at timestamptz not null default pg_catalog.now(),
  last_received_at timestamptz not null default pg_catalog.now(),
  processed_at timestamptz,
  constraint provider_webhook_inbox_transaction_chk check (length(btrim(external_transaction_id)) between 1 and 128),
  constraint provider_webhook_inbox_customer_chk check (length(btrim(external_customer_id)) between 1 and 128),
  constraint provider_webhook_inbox_error_chk check (last_error is null or length(last_error) <= 200),
  constraint provider_webhook_inbox_processed_chk check ((status = 'processed') = (processed_at is not null)),
  constraint provider_webhook_inbox_lock_chk check ((status = 'processing') = (locked_at is not null))
);

create unique index provider_webhook_inbox_external_uidx
  on commercial.provider_webhook_inbox (provider, environment, external_customer_id, external_transaction_id);

create index provider_webhook_inbox_due_idx
  on commercial.provider_webhook_inbox (next_attempt_at)
  where status in ('pending', 'retry', 'processing');

alter table commercial.provider_webhook_inbox enable row level security;
alter table commercial.provider_webhook_inbox force row level security;
revoke all on table commercial.provider_webhook_inbox from public, anon, authenticated;
grant select on table commercial.provider_webhook_inbox to authenticated;

create policy provider_webhook_inbox_select on commercial.provider_webhook_inbox
  for select to authenticated
  using (commercial.has_permission('collection.write'));

create or replace function public.system_enqueue_provider_webhook(
  p_provider text,
  p_environment text,
  p_external_customer_id text,
  p_external_transaction_id text,
  p_signature_present boolean
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_link commercial.provider_customer_links%rowtype;
  v_id uuid;
  v_status text;
  v_inserted boolean;
begin
  if p_provider is distinct from 'talo'
    or p_environment is null or p_environment not in ('sandbox', 'production')
    or p_external_customer_id is null or length(btrim(p_external_customer_id)) not between 1 and 128
    or p_external_transaction_id is null or length(btrim(p_external_transaction_id)) not between 1 and 128 then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  select * into v_link
  from commercial.provider_customer_links
  where provider = p_provider and environment = p_environment and external_customer_id = p_external_customer_id;
  if v_link.id is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'customer_unknown');
  end if;

  insert into commercial.provider_webhook_inbox (
    link_id, provider, environment, external_customer_id, external_transaction_id, signature_present
  ) values (
    v_link.id, p_provider, p_environment, p_external_customer_id, p_external_transaction_id, coalesce(p_signature_present, false)
  )
  on conflict (provider, environment, external_customer_id, external_transaction_id) do update
  set notice_count = commercial.provider_webhook_inbox.notice_count + 1,
      last_received_at = pg_catalog.now(),
      signature_present = commercial.provider_webhook_inbox.signature_present or excluded.signature_present
  returning id, status, (xmax = 0) into v_id, v_status, v_inserted;

  return jsonb_build_object('ok', true, 'inbox_id', v_id, 'duplicate', not v_inserted, 'status', v_status);
end;
$$;

-- Claims due rows; rows stuck in processing for more than five minutes are recovered.
create or replace function public.system_claim_provider_webhooks(p_limit int)
returns table (
  inbox_id uuid,
  environment text,
  external_customer_id text,
  external_transaction_id text,
  won_business_id uuid,
  attempts int
)
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
begin
  return query
  with due as (
    select inbox.id
    from commercial.provider_webhook_inbox inbox
    where (inbox.status in ('pending', 'retry') and inbox.next_attempt_at <= pg_catalog.now())
       or (inbox.status = 'processing' and inbox.locked_at < pg_catalog.now() - interval '5 minutes')
    order by inbox.next_attempt_at
    limit greatest(1, least(coalesce(p_limit, 10), 50))
    for update skip locked
  ), claimed as (
    update commercial.provider_webhook_inbox inbox
    set status = 'processing',
        locked_at = pg_catalog.now(),
        attempts = inbox.attempts + 1
    from due
    where inbox.id = due.id
    returning inbox.*
  )
  select claimed.id, claimed.environment, claimed.external_customer_id, claimed.external_transaction_id,
         link.won_business_id, claimed.attempts
  from claimed
  join commercial.provider_customer_links link on link.id = claimed.link_id;
end;
$$;

-- Releases a claimed row for a later attempt, or parks it as dead after twelve attempts.
create or replace function public.system_defer_provider_webhook(p_inbox_id uuid, p_error text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_row commercial.provider_webhook_inbox%rowtype;
begin
  select * into v_row from commercial.provider_webhook_inbox where id = p_inbox_id for update;
  if v_row.id is null or v_row.status <> 'processing' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'not_claimed');
  end if;
  update commercial.provider_webhook_inbox
  set status = case when v_row.attempts >= 12 then 'dead' else 'retry' end,
      locked_at = null,
      last_error = left(coalesce(nullif(btrim(p_error), ''), 'unspecified'), 200),
      next_attempt_at = pg_catalog.now() + least(interval '1 minute' * power(2, least(v_row.attempts, 6)), interval '60 minutes')
  where id = v_row.id
  returning * into v_row;
  return jsonb_build_object('ok', true, 'status', v_row.status, 'next_attempt_at', v_row.next_attempt_at);
end;
$$;

create or replace function public.system_provider_customer_link(p_business_id uuid, p_provider text, p_environment text)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public, commercial
as $$
  select coalesce(
    (
      select jsonb_build_object('ok', true, 'found', true, 'link_id', id, 'external_customer_id', external_customer_id, 'cvu', cvu, 'alias', alias)
      from commercial.provider_customer_links
      where won_business_id = p_business_id and provider = p_provider and environment = p_environment
    ),
    jsonb_build_object('ok', true, 'found', false)
  )
$$;

revoke all on function public.system_enqueue_provider_webhook(text, text, text, text, boolean) from public, anon, authenticated;
revoke all on function public.system_claim_provider_webhooks(int) from public, anon, authenticated;
revoke all on function public.system_defer_provider_webhook(uuid, text) from public, anon, authenticated;
revoke all on function public.system_provider_customer_link(uuid, text, text) from public, anon, authenticated;
grant execute on function public.system_enqueue_provider_webhook(text, text, text, text, boolean) to service_role;
grant execute on function public.system_claim_provider_webhooks(int) to service_role;
grant execute on function public.system_defer_provider_webhook(uuid, text) to service_role;
grant execute on function public.system_provider_customer_link(uuid, text, text) to service_role;
