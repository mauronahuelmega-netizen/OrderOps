-- T09. Rolls back. Synthetic Mobbex intents and events do not confirm a payment.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1901', 'authenticated', 'authenticated', 'phase09-finance@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1903', 'authenticated', 'authenticated', 'phase09-support@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1904', 'authenticated', 'authenticated', 'phase09-promoter@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());
insert into commercial.platform_accounts (id, user_id, kind) values
  ('1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1911', '1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1901', 'internal'),
  ('1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1913', '1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1903', 'internal'),
  ('1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1914', '1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1904', 'promoter');
insert into commercial.internal_role_assignments (account_id, role) values
  ('1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1911', 'finance'),
  ('1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1913', 'support');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1921', '1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1914', 'p09m000019', 'Promotor Intentos', 'active');
insert into public.businesses (id, name, slug, whatsapp_number) values
  ('1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1931', 'Negocio Intentos A', 'negocio-intentos-a', '5491100001931'),
  ('1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1932', 'Negocio Intentos B', 'negocio-intentos-b', '5491100001932');

do $$
declare
  v_result jsonb;
  v_again jsonb;
  v_checkout uuid;
  v_subscription uuid;
  v_ambiguous uuid;
  v_other uuid;
  v_status text;
  v_intents bigint;
  v_events bigint;
  v_links bigint;
  v_receipts bigint;
  v_collections bigint;
  v_commissions bigint;
  v_slots bigint;
  v_satisfied bigint;
begin
  select count(*) into v_links from commercial.provider_customer_links;
  select count(*) into v_receipts from commercial.provider_receipts;
  select count(*) into v_collections from commercial.platform_collections;
  select count(*) into v_commissions from commercial.promoter_commissions;
  select count(*) into v_slots from commercial.founder_slots;
  select count(*) into v_satisfied from commercial.platform_obligations where status = 'satisfied';

  perform set_config('request.jwt.claim.sub', '1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1904', true);
  v_result := commercial.reserve_provider_payment_intent('1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1931', 'setup_checkout', 'referencia-activacion', 29000000, 'ARS');
  if v_result->>'commercial_error_code' is distinct from 'forbidden' then raise exception 'promoter %', v_result; end if;
  perform set_config('request.jwt.claim.sub', '1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1903', true);
  v_result := commercial.reserve_provider_payment_intent('1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1931', 'setup_checkout', 'referencia-activacion', 29000000, 'ARS');
  if v_result->>'commercial_error_code' is distinct from 'forbidden' then raise exception 'support %', v_result; end if;
  perform set_config('request.jwt.claim.sub', '', true);
  v_result := commercial.reserve_provider_payment_intent('1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1931', 'setup_checkout', 'referencia-activacion', 29000000, 'ARS');
  if v_result->>'commercial_error_code' is distinct from 'unauthenticated' then raise exception 'anon %', v_result; end if;

  perform set_config('request.jwt.claim.sub', '1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1901', true);
  v_result := commercial.reserve_provider_payment_intent('1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1931', 'setup_checkout', 'referencia-activacion', 29000000, 'ARS');
  v_checkout := (v_result->>'intent_id')::uuid;
  if v_result->>'status' is distinct from 'reserved' or (v_result->>'economic_recognition')::boolean then
    raise exception 'reserve %', v_result;
  end if;
  v_again := commercial.reserve_provider_payment_intent('1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1931', 'setup_checkout', 'referencia-activacion', 29000000, 'ARS');
  if (v_again->>'idempotent')::boolean is not true or v_again->>'intent_id' is distinct from v_result->>'intent_id'
    or (select count(*) from commercial.provider_payment_intents where commercial_reference = 'referencia-activacion') <> 1 then
    raise exception 'reserve replay %', v_again;
  end if;

  v_result := commercial.reserve_provider_payment_intent('1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1931', 'subscription', 'referencia-abono', 5500000, 'ARS');
  v_subscription := (v_result->>'intent_id')::uuid;
  v_result := commercial.complete_provider_payment_intent(v_checkout, 'created', 'fixture-checkout-290000', null);
  if v_result->>'status' is distinct from 'created' or (v_result->>'economic_recognition')::boolean then raise exception 'checkout %', v_result; end if;
  v_result := commercial.complete_provider_payment_intent(v_subscription, 'created', null, 'fixture-subscription-55000');
  if v_result->>'status' is distinct from 'created' then raise exception 'subscription %', v_result; end if;
  if (select checkout_id from commercial.provider_payment_intents where id = v_checkout) is distinct from 'fixture-checkout-290000'
    or (select subscription_id from commercial.provider_payment_intents where id = v_checkout) is not null
    or (select subscription_id from commercial.provider_payment_intents where id = v_subscription) is distinct from 'fixture-subscription-55000'
    or (select checkout_id from commercial.provider_payment_intents where id = v_subscription) is not null then
    raise exception 'identifiers crossed';
  end if;

  v_result := commercial.reserve_provider_payment_intent('1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1932', 'setup_checkout', 'referencia-otra', 29000000, 'ARS');
  v_other := (v_result->>'intent_id')::uuid;
  v_result := commercial.complete_provider_payment_intent(v_other, 'created', 'fixture-checkout-290000', null);
  if v_result->>'commercial_error_code' is distinct from 'checkout_conflict'
    or (select status from commercial.provider_payment_intents where id = v_other) <> 'reserved' then
    raise exception 'checkout collision %', v_result;
  end if;
  v_result := commercial.reserve_provider_payment_intent('1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1932', 'subscription', 'referencia-abono-b', 5500000, 'ARS');
  v_again := commercial.complete_provider_payment_intent((v_result->>'intent_id')::uuid, 'created', null, 'fixture-subscription-55000');
  if v_again->>'commercial_error_code' is distinct from 'subscription_conflict' then raise exception 'subscription collision %', v_again; end if;

  v_result := commercial.reserve_provider_payment_intent('1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1931', 'setup_checkout', 'referencia-etiqueta', 29000000, 'ARS');
  v_again := commercial.reserve_provider_payment_intent('1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1931', 'subscription', 'referencia-etiqueta-sub', 5500000, 'ARS');
  if (commercial.complete_provider_payment_intent((v_result->>'intent_id')::uuid, 'created', 'etiqueta-compartida', null)->>'status') is distinct from 'created'
    or (commercial.complete_provider_payment_intent((v_again->>'intent_id')::uuid, 'created', null, 'etiqueta-compartida')->>'status') is distinct from 'created' then
    raise exception 'shared label rejected';
  end if;

  v_result := commercial.reserve_provider_payment_intent('1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1931', 'setup_checkout', 'referencia-ambigua', 29000000, 'ARS');
  v_ambiguous := (v_result->>'intent_id')::uuid;
  v_result := commercial.complete_provider_payment_intent(v_ambiguous, 'ambiguous', null, null);
  v_again := commercial.complete_provider_payment_intent(v_ambiguous, 'ambiguous', null, null);
  if v_result->>'status' is distinct from 'response_ambiguous' or (v_again->>'idempotent')::boolean is not true
    or (select count(*) from commercial.provider_payment_intents where commercial_reference = 'referencia-ambigua') <> 1 then
    raise exception 'ambiguous % %', v_result, v_again;
  end if;
  v_again := commercial.reserve_provider_payment_intent('1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1931', 'setup_checkout', 'referencia-ambigua', 29000000, 'ARS');
  if (v_again->>'idempotent')::boolean is not true or (v_again->>'intent_id')::uuid is distinct from v_ambiguous then
    raise exception 'ambiguous retry reserved another %', v_again;
  end if;
  if (commercial.complete_provider_payment_intent(v_ambiguous, 'created', 'checkout-despues', null)->>'commercial_error_code') is distinct from 'ambiguous_unresolved' then
    raise exception 'ambiguous accepted a second create';
  end if;

  v_result := commercial.reserve_provider_payment_intent('1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1932', 'setup_checkout', 'referencia-activacion', 29000000, 'ARS');
  if (v_result->>'intent_id')::uuid = v_checkout then raise exception 'businesses collapsed'; end if;

  select status into v_status from commercial.provider_payment_intents where id = v_checkout;
  select count(*) into v_intents from commercial.provider_payment_intents;
  v_result := commercial.record_provider_payment_event('1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1931', 'setup_checkout', 'referencia-activacion', 'synthetic:browser_return:return-ok', 'browser_return');
  v_again := commercial.record_provider_payment_event('1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1931', 'setup_checkout', 'referencia-activacion', 'synthetic:browser_return:return-ok', 'browser_return');
  if (v_result->>'matched')::boolean is not true or v_result->>'status' is distinct from 'pending_unverified'
    or (v_result->>'economic_recognition')::boolean or (v_again->>'idempotent')::boolean is not true
    or (select count(*) from commercial.provider_payment_events where event_key = 'synthetic:browser_return:return-ok') <> 1
    or (select status from commercial.provider_payment_intents where id = v_checkout) is distinct from v_status then
    raise exception 'matched event % %', v_result, v_again;
  end if;
  v_result := commercial.record_provider_payment_event('1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1931', 'setup_checkout', 'referencia-activacion', 'synthetic:webhook_body:webhook-other', 'webhook_body');
  if (select count(*) from commercial.provider_payment_events where intent_id = v_checkout) <> 2
    or (select status from commercial.provider_payment_intents where id = v_checkout) is distinct from v_status then
    raise exception 'second event changed the intent';
  end if;

  select count(*) into v_events from commercial.provider_payment_intents;
  v_result := commercial.record_provider_payment_event('1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1931', null, null, 'synthetic:webhook_body:webhook-unknown', 'webhook_body');
  v_again := commercial.record_provider_payment_event('1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1932', null, null, 'synthetic:webhook_body:webhook-unknown', 'webhook_body');
  if (v_result->>'matched')::boolean or v_result->>'intent_id' is not null or (v_again->>'idempotent')::boolean is not true
    or (select count(*) from commercial.provider_payment_events where intent_id is null and event_key = 'synthetic:webhook_body:webhook-unknown') <> 1
    or (select count(*) from commercial.provider_payment_intents) <> v_events then
    raise exception 'unmatched % %', v_result, v_again;
  end if;

  v_result := commercial.record_provider_payment_event('1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1932', 'subscription', 'referencia-activacion', 'synthetic:browser_return:return-other-business', 'browser_return');
  if (v_result->>'matched')::boolean or (select intent_id from commercial.provider_payment_events where event_key = 'synthetic:browser_return:return-other-business') is not null then
    raise exception 'cross business event %', v_result;
  end if;
  if (select won_business_id from commercial.provider_payment_intents where id = v_checkout) is distinct from '1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1931' then
    raise exception 'checkout moved businesses';
  end if;

  v_result := commercial.record_provider_payment_event('1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1931', 'setup_checkout', 'referencia-activacion', 'synthetic:browser_return:return-cancel', 'browser_return');
  if v_result->>'status' is distinct from 'pending_unverified'
    or (select status from commercial.provider_payment_intents where id = v_checkout) is distinct from 'created' then
    raise exception 'cancellation confirmed %', v_result;
  end if;
  v_result := commercial.record_provider_payment_event('1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1931', 'setup_checkout', 'referencia-activacion', 'MAYUS', 'browser_return');
  if v_result->>'commercial_error_code' is distinct from 'validation'
    or exists (select 1 from commercial.provider_payment_events where event_key = 'MAYUS') then
    raise exception 'invalid event %', v_result;
  end if;
  select count(*) into v_intents from commercial.provider_payment_intents;
  v_result := commercial.record_provider_payment_event('1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1931', 'setup_checkout', 'referencia-inexistente', 'synthetic:webhook_body:missing-intent', 'webhook_body');
  if (v_result->>'matched')::boolean or v_result->>'intent_id' is not null
    or (select count(*) from commercial.provider_payment_intents) <> v_intents then
    raise exception 'missing reference created an intent %', v_result;
  end if;

  begin
    insert into commercial.provider_payment_intents (
      won_business_id, provider, environment, purpose, commercial_reference, expected_amount_cents, currency, status
    ) values (
      '1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1931', 'mobbex', 'production', 'setup_checkout', 'referencia-produccion', 29000000, 'ARS', 'reserved'
    );
    raise exception 'production environment was accepted';
  exception
    when check_violation then
      null;
  end;

  if (select count(*) from commercial.provider_customer_links) <> v_links
    or (select count(*) from commercial.provider_receipts) <> v_receipts
    or (select count(*) from commercial.platform_collections) <> v_collections
    or (select count(*) from commercial.promoter_commissions) <> v_commissions
    or (select count(*) from commercial.founder_slots) <> v_slots
    or (select count(*) from commercial.platform_obligations where status = 'satisfied') <> v_satisfied then
    raise exception 'economic tables changed';
  end if;
  if exists (
    select 1 from commercial.provider_payment_events where status is distinct from 'pending_unverified'
  ) or exists (
    select 1 from commercial.provider_payment_intents where status = 'pending_unverified'
  ) then
    raise exception 'a synthetic event confirmed a payment';
  end if;
end $$;

do $$
declare
  v_result jsonb;
begin
  set local role authenticated;
  begin
    perform commercial.reserve_provider_payment_intent(null, null, null, null, null);
    raise exception 'authenticated executed the commercial function';
  exception
    when insufficient_privilege then
      null;
  end;
  perform set_config('request.jwt.claim.sub', '1a1a1a1a-1a1a-41a1-81a1-1a1a1a1a1901', true);
  v_result := public.reserve_provider_payment_intent(null, null, null, null, null);
  if v_result->>'commercial_error_code' is distinct from 'validation' then
    raise exception 'public wrapper %', v_result;
  end if;
end $$;

rollback;
