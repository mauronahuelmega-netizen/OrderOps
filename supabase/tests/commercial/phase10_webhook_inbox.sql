-- Talo First L2. Rolls back. Durable inbox: dedup, unknown customers, claim, retry, dead, grants.
begin;

insert into public.businesses (id, name, slug, whatsapp_number) values
  ('10101010-1010-4101-8101-101010102031', 'Negocio Inbox A', 'negocio-inbox-a', '5491100102031');
insert into commercial.provider_customer_links (won_business_id, provider, environment, external_customer_id, cvu, alias)
values ('10101010-1010-4101-8101-101010102031', 'talo', 'sandbox', 'p10-inbox-a', '0000000000000000102031', 'p10.inbox.a');

do $$
declare
  v jsonb;
  v_first uuid;
  v_count int;
  v_denied boolean;
  v_row commercial.provider_webhook_inbox%rowtype;
  v_i int;
begin
  -- Malformed and unknown notices are not persisted.
  v := public.system_enqueue_provider_webhook('talo', 'sandbox', '', 'tx-1', false);
  if v->>'commercial_error_code' is distinct from 'validation' then raise exception 'empty customer %', v; end if;
  v := public.system_enqueue_provider_webhook('mobbex', 'sandbox', 'p10-inbox-a', 'tx-1', false);
  if v->>'commercial_error_code' is distinct from 'validation' then raise exception 'provider %', v; end if;
  v := public.system_enqueue_provider_webhook('talo', 'sandbox', 'unknown-customer', 'tx-1', false);
  if v->>'commercial_error_code' is distinct from 'customer_unknown' then raise exception 'unknown %', v; end if;
  v := public.system_enqueue_provider_webhook('talo', 'production', 'p10-inbox-a', 'tx-1', false);
  if v->>'commercial_error_code' is distinct from 'customer_unknown' then raise exception 'env isolation %', v; end if;
  if exists (select 1 from commercial.provider_webhook_inbox where external_customer_id = 'unknown-customer') then
    raise exception 'unknown customer persisted';
  end if;

  -- Repeated and out-of-order notices collapse into one row per transaction.
  v := public.system_enqueue_provider_webhook('talo', 'sandbox', 'p10-inbox-a', 'tx-2', false);
  v := public.system_enqueue_provider_webhook('talo', 'sandbox', 'p10-inbox-a', 'tx-1', false);
  if (v->>'duplicate')::boolean then raise exception 'first notice flagged duplicate'; end if;
  v_first := (v->>'inbox_id')::uuid;
  v := public.system_enqueue_provider_webhook('talo', 'sandbox', 'p10-inbox-a', 'tx-1', true);
  if not (v->>'duplicate')::boolean or (v->>'inbox_id')::uuid <> v_first then raise exception 'duplicate notice %', v; end if;
  select * into v_row from commercial.provider_webhook_inbox where id = v_first;
  if v_row.notice_count <> 2 or not v_row.signature_present then raise exception 'dedup counters %', row_to_json(v_row); end if;
  select count(*) into v_count from commercial.provider_webhook_inbox where external_customer_id = 'p10-inbox-a';
  if v_count <> 2 then raise exception 'inbox rows %', v_count; end if;

  -- Claim, defer with backoff, dead after twelve attempts.
  select count(*) into v_count from public.system_claim_provider_webhooks(10) c where c.external_customer_id = 'p10-inbox-a';
  if v_count <> 2 then raise exception 'claimed %', v_count; end if;
  select count(*) into v_count from public.system_claim_provider_webhooks(10) c where c.external_customer_id = 'p10-inbox-a';
  if v_count <> 0 then raise exception 'claimed twice %', v_count; end if;
  v := public.system_defer_provider_webhook(v_first, 'temporary_confirmation_failure');
  if v->>'status' is distinct from 'retry' then raise exception 'defer %', v; end if;
  if (v->>'next_attempt_at')::timestamptz <= now() then raise exception 'no backoff'; end if;
  v := public.system_defer_provider_webhook(v_first, 'again');
  if v->>'commercial_error_code' is distinct from 'not_claimed' then raise exception 'defer unclaimed %', v; end if;
  update commercial.provider_webhook_inbox set attempts = 12, status = 'processing', locked_at = now() where id = v_first;
  v := public.system_defer_provider_webhook(v_first, 'still failing');
  if v->>'status' is distinct from 'dead' then raise exception 'dead %', v; end if;

  -- Stale processing rows are recovered.
  update commercial.provider_webhook_inbox set locked_at = now() - interval '10 minutes'
  where external_customer_id = 'p10-inbox-a' and external_transaction_id = 'tx-2';
  select count(*) into v_count from public.system_claim_provider_webhooks(10) c where c.external_transaction_id = 'tx-2';
  if v_count <> 1 then raise exception 'stale not recovered'; end if;

  -- Grants: only service_role.
  foreach v_i in array array[1, 2] loop
    v_denied := false;
    begin
      execute case when v_i = 1 then 'set local role authenticated' else 'set local role anon' end;
      perform public.system_enqueue_provider_webhook('talo', 'sandbox', 'p10-inbox-a', 'tx-9', false);
    exception when insufficient_privilege then v_denied := true;
    end;
    execute 'reset role';
    if not v_denied then raise exception 'role % enqueued', v_i; end if;
    v_denied := false;
    begin
      execute case when v_i = 1 then 'set local role authenticated' else 'set local role anon' end;
      perform * from public.system_claim_provider_webhooks(1);
    exception when insufficient_privilege then v_denied := true;
    end;
    execute 'reset role';
    if not v_denied then raise exception 'role % claimed', v_i; end if;
  end loop;
  execute 'set local role service_role';
  v := public.system_enqueue_provider_webhook('talo', 'sandbox', 'p10-inbox-a', 'tx-9', false);
  execute 'reset role';
  if (v->>'ok')::boolean is not true then raise exception 'service_role enqueue %', v; end if;

  raise notice 'phase10_webhook_inbox: PASS';
end;
$$;

rollback;
