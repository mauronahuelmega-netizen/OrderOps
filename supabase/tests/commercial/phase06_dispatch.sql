-- PHASE-06 inbox dispatch. Rolls back. Does not open a network connection.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '96969696-9696-4969-8969-969696969601',
  'authenticated', 'authenticated', 'dispatch-commercial@local.test', 'local-only', now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
);
insert into commercial.platform_accounts (id, user_id, kind) values
  ('96969696-9696-4969-8969-969696969611', '96969696-9696-4969-8969-969696969601', 'internal');
insert into commercial.notification_preferences (account_id, opt_out_noncritical) values
  ('96969696-9696-4969-8969-969696969611', true);

insert into commercial.outbox_events (
  id, event_name, payload, occurred_at, status, attempts, available_at, correlation_id
) values (
  '96969696-9696-4969-8969-969696969621',
  'demo.submitted',
  '{"recipient_account_id":"96969696-9696-4969-8969-969696969611"}'::jsonb,
  now(), 'pending', 0, now(), '96969696-9696-4969-8969-969696969621'
);

do $$
declare
  v_count int;
  v_status text;
begin
  perform commercial.record_inbox(
    '96969696-9696-4969-8969-969696969621',
    '96969696-9696-4969-8969-969696969611',
    'Nueva solicitud de demo',
    'Hay una solicitud nueva en el panel comercial.'
  );
  select count(*) into v_count from commercial.notifications
  where outbox_event_id = '96969696-9696-4969-8969-969696969621';
  if v_count <> 0 then
    raise exception 'opt-out stored a noncritical inbox row';
  end if;

  update commercial.outbox_events
  set event_name = 'payment.recorded'
  where id = '96969696-9696-4969-8969-969696969621';
  perform commercial.record_inbox(
    '96969696-9696-4969-8969-969696969621',
    '96969696-9696-4969-8969-969696969611',
    'Pago simulado registrado',
    'Un pago simulado quedó registrado.'
  );
  perform commercial.record_inbox(
    '96969696-9696-4969-8969-969696969621',
    '96969696-9696-4969-8969-969696969611',
    'Pago simulado registrado',
    'Un pago simulado quedó registrado.'
  );
  select count(*) into v_count from commercial.notifications
  where outbox_event_id = '96969696-9696-4969-8969-969696969621';
  if v_count <> 1 then
    raise exception 'inbox duplicated %', v_count;
  end if;

  update commercial.outbox_events set attempts = 8 where id = '96969696-9696-4969-8969-969696969621';
  perform commercial.release_outbox('96969696-9696-4969-8969-969696969621', 'retry');
  select status into v_status from commercial.outbox_events
  where id = '96969696-9696-4969-8969-969696969621';
  if v_status is distinct from 'dead' then
    raise exception 'eighth attempt stayed %', v_status;
  end if;
end;
$$;

rollback;
