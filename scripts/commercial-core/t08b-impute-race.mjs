import { spawn } from "node:child_process";

const container = process.argv[2] ?? "";
if (container !== "supabase_db_orderops-phase06-qa") {
  console.error("fixture_refuses_target");
  process.exit(1);
}

const finance = "18181818-1818-4181-8181-181818181971";
const superadmin = "18181818-1818-4181-8181-181818181972";
const promoterUser = "18181818-1818-4181-8181-181818181974";
const financeAccount = "18181818-1818-4181-8181-181818181981";
const superAccount = "18181818-1818-4181-8181-181818181982";
const promoterAccount = "18181818-1818-4181-8181-181818181984";
const promoter = "18181818-1818-4181-8181-181818181991";
const business = "18181818-1818-4181-8181-181818181931";
const lead = "18181818-1818-4181-8181-181818181941";
const opportunity = "18181818-1818-4181-8181-181818181951";
const attribution = "18181818-1818-4181-8181-181818181961";

function marker(text, name) {
  const match = text.match(new RegExp(`${name}=([0-9a-f-]{36})`, "i"));
  return match?.[1] ?? "";
}

function redact(text) {
  return String(text ?? "").replace(/\d{16,}/g, "[redacted]");
}

function jsonLine(result) {
  const line = result.out.split(/\r?\n/).map((item) => item.trim()).filter((item) => item.startsWith("{")).at(-1) ?? "";
  return JSON.parse(line);
}

function overlaps(left, right) {
  return left.started < right.ended && right.started < left.ended;
}

function capture(args) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn("docker", args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    child.stdout.on("data", (chunk) => {
      out += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      err += chunk.toString();
    });
    child.on("close", (code) => resolve({ code, out: out.trim(), err: err.trim(), started, ended: Date.now() }));
  });
}

function session(sql) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(
      "docker",
      ["exec", "-i", container, "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-tA"],
      { stdio: ["pipe", "pipe", "pipe"] }
    );
    let out = "";
    let err = "";
    child.stdout.on("data", (chunk) => {
      out += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      err += chunk.toString();
    });
    child.on("close", (code) => resolve({ code, out: out.trim(), err: err.trim(), started, ended: Date.now() }));
    child.stdin.end(sql);
  });
}

const published = await capture(["port", container, "5432"]);
const ports = published.out.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
if (published.code !== 0 || ports.length === 0 || ports.some((line) => !line.endsWith(":56722"))) {
  console.error(redact(JSON.stringify({ target: "refused", ports })));
  process.exit(1);
}

const setup = await session(`
begin;
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '${finance}', 'authenticated', 'authenticated', 'phase08b-race-finance@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '${superadmin}', 'authenticated', 'authenticated', 'phase08b-race-super@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '${promoterUser}', 'authenticated', 'authenticated', 'phase08b-race-promoter@local.test', 'local-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());
insert into commercial.platform_accounts (id, user_id, kind) values
  ('${financeAccount}', '${finance}', 'internal'),
  ('${superAccount}', '${superadmin}', 'internal'),
  ('${promoterAccount}', '${promoterUser}', 'promoter');
insert into commercial.internal_role_assignments (account_id, role) values
  ('${financeAccount}', 'finance'),
  ('${superAccount}', 'superadmin');
insert into commercial.promoters (id, account_id, public_code, legal_name, status) values
  ('${promoter}', '${promoterAccount}', 'p08b000r19', 'Promotor Carrera', 'active');
insert into public.businesses (id, name, slug, whatsapp_number) values
  ('${business}', 'Negocio Carrera', 'negocio-carrera-t08b', '5491100001971');
insert into commercial.commercial_businesses (id, display_name, normalized_name, initial_channel) values
  ('${lead}', 'Lead Carrera', 'lead carrera t08b', 'promoter');
insert into commercial.commercial_opportunities (id, commercial_business_id, stage, owner_account_id) values
  ('${opportunity}', '${lead}', 'demo_done', '${promoterAccount}');
insert into commercial.opportunity_attributions (id, opportunity_id, promoter_id, status, method, reason) values
  ('${attribution}', '${opportunity}', '${promoter}', 'confirmed', 'manual', 'fixture');
select set_config('request.jwt.claim.sub', '${superadmin}', true);
select 'TERMS=' || (commercial.win_opportunity('${opportunity}', '${business}', null)->>'conversion_terms_id');
commit;
`);

if (setup.code !== 0) {
  console.log(JSON.stringify({ setup: "fail", err: setup.err }));
  process.exit(1);
}
const terms = marker(setup.out, "TERMS");
const opened = await session(`
begin;
select set_config('request.jwt.claim.sub', '${finance}', true);
select 'OBLIGATION=' || (public.open_obligation('${terms}', 'setup', null)->>'obligation_id');
commit;
`);
if (opened.code !== 0) {
  console.log(JSON.stringify({ open: "fail", err: opened.err }));
  process.exit(1);
}
const obligation = marker(opened.out, "OBLIGATION");
const prepared = await session(`
begin;
select set_config('request.jwt.claim.sub', '${finance}', true);
select commercial.link_provider_customer('${business}', 'talo', 'sandbox', 'race-customer', '0000000000000000001971', 'alias.race')->>'ok';
select 'RECEIPT=' || (commercial.confirm_provider_receipt('${business}', 'talo', 'sandbox', 'race-customer', 'tx-race', 'PROCESSED', 'ARS', 29000000, 28649100, 'list', 'detail', now())->>'receipt_id');
commit;
`);
if (prepared.code !== 0) {
  console.log(JSON.stringify({ prepare: "fail", err: prepared.err }));
  process.exit(1);
}
const receipt = marker(prepared.out, "RECEIPT");
if (!terms || !obligation || !receipt) {
  console.log(JSON.stringify({ marker: "missing", terms, obligation, receipt, prepared: prepared.out }));
  process.exit(1);
}
const attested = await session(`
begin;
select set_config('request.jwt.claim.sub', '${finance}', true);
select commercial.attest_provider_receipt('${receipt}', '${obligation}', 'consulte el movimiento en el proveedor', 'autorizo talo para esta obligacion')->>'ok';
commit;
`);
if (attested.code !== 0) {
  console.log(JSON.stringify({ attest: "fail", err: attested.err, receipt, obligation, terms }));
  process.exit(1);
}

const problems = [];
function expect(condition, diagnostic) {
  if (!condition) problems.push(diagnostic);
}

const imputeSql = `
begin;
select set_config('request.jwt.claim.sub', '${finance}', true);
select commercial.impute_provider_receipt(id)
from commercial.provider_receipts
where external_customer_id = 'race-customer' and external_transaction_id = 'tx-race';
commit;
`;
const [left, right] = await Promise.all([session(imputeSql), session(imputeSql)]);
let leftBody = null;
let rightBody = null;
try {
  leftBody = jsonLine(left);
  rightBody = jsonLine(right);
} catch {
  problems.push({ step: "impute_parse", left_code: left.code, right_code: right.code });
}
expect(left.code === 0 && right.code === 0, { step: "impute_sessions", left_code: left.code, right_code: right.code });
expect(overlaps(left, right), { step: "impute_overlap", left: [left.started, left.ended], right: [right.started, right.ended] });
if (leftBody && rightBody) {
  const flags = [leftBody.idempotent, rightBody.idempotent];
  expect(flags.filter((flag) => flag === false).length === 1 && flags.filter((flag) => flag === true).length === 1, {
    step: "impute_idempotency", flags
  });
  expect(leftBody.receipt_id === receipt && rightBody.receipt_id === receipt, { step: "impute_receipt" });
  expect(leftBody.status === "imputed" && rightBody.status === "imputed", { step: "impute_status", left: leftBody.status, right: rightBody.status });
  expect(leftBody.collection_id === rightBody.collection_id && Boolean(leftBody.collection_id), { step: "impute_collection" });
  expect(leftBody.economic_recognition === true && rightBody.economic_recognition === true, { step: "impute_recognition" });
}

const check = await session(`
select jsonb_build_object(
  'posted', (select count(*) from commercial.platform_collections where obligation_id = '${obligation}' and status = 'posted'),
  'posted_id', (select id from commercial.platform_collections where obligation_id = '${obligation}' and status = 'posted'),
  'receipt_status', (select status from commercial.provider_receipts where id = '${receipt}'),
  'collection_id', (select collection_id from commercial.provider_receipts where id = '${receipt}'),
  'obligation', (select status from commercial.platform_obligations where id = '${obligation}'),
  'commissions', (select count(*) from commercial.promoter_commissions where conversion_terms_id = '${terms}'),
  'slots', (select count(*) from commercial.founder_slots where conversion_terms_id = '${terms}')
);
`);
let economy = null;
try {
  economy = jsonLine(check);
} catch {
  problems.push({ step: "economy_parse", code: check.code });
}
expect(check.code === 0 && economy?.posted === 1, { step: "posted_count", posted: economy?.posted ?? null });
expect(economy?.receipt_status === "imputed", { step: "receipt_imputed", status: economy?.receipt_status ?? null });
expect(economy?.obligation === "satisfied", { step: "obligation_satisfied", status: economy?.obligation ?? null });
expect(economy?.collection_id === economy?.posted_id && economy?.collection_id === leftBody?.collection_id, { step: "collection_identity" });
expect(economy?.commissions === 0 && economy?.slots === 0, { step: "no_commission_or_slot", commissions: economy?.commissions ?? null, slots: economy?.slots ?? null });

const later = await session(`
begin;
select set_config('request.jwt.claim.sub', '${finance}', true);
select 'LATER=' || (commercial.confirm_provider_receipt('${business}', 'talo', 'sandbox', 'race-customer', 'tx-race-later', 'PROCESSED', 'ARS', 29000000, 28649100, 'list', 'detail', now())->>'receipt_id');
commit;
`);
const laterReceipt = marker(later.out, "LATER");
expect(later.code === 0 && Boolean(laterReceipt), { step: "later_receipt" });
const laterAttest = await session(`
begin;
select set_config('request.jwt.claim.sub', '${finance}', true);
select commercial.attest_provider_receipt('${laterReceipt}', '${obligation}', 'consulte el movimiento en el proveedor', 'autorizo talo para esta obligacion');
commit;
`);
let attestBody = null;
try {
  attestBody = jsonLine(laterAttest);
} catch {
  problems.push({ step: "later_attest_parse", code: laterAttest.code });
}
expect(laterAttest.code === 0 && attestBody?.ok === true, { step: "later_attest" });

const [reversed, second] = await Promise.all([
  session(`begin; select set_config('request.jwt.claim.sub', '${finance}', true); select commercial.reverse_collection(collection_id, 'reversa concurrente') from commercial.provider_receipts where external_customer_id = 'race-customer' and external_transaction_id = 'tx-race'; commit;`),
  session(`begin; select set_config('request.jwt.claim.sub', '${finance}', true); select commercial.impute_provider_receipt(id) from commercial.provider_receipts where external_customer_id = 'race-customer' and external_transaction_id = 'tx-race-later'; commit;`)
]);
let reverseBody = null;
let secondBody = null;
try {
  reverseBody = jsonLine(reversed);
  secondBody = jsonLine(second);
} catch {
  problems.push({ step: "reverse_parse", reverse_code: reversed.code, second_code: second.code });
}
expect(reversed.code === 0 && second.code === 0, { step: "reverse_sessions", reverse_code: reversed.code, second_code: second.code });
expect(overlaps(reversed, second), { step: "reverse_overlap", reverse: [reversed.started, reversed.ended], second: [second.started, second.ended] });
expect(reverseBody?.ok === true, { step: "reverse_ok" });
expect(secondBody?.status === "reconciliation_required" && secondBody?.review_reason === "obligation_not_open" && secondBody?.economic_recognition === false, {
  step: "second_credit", status: secondBody?.status ?? null, reason: secondBody?.review_reason ?? null
});

const after = await session(`
select jsonb_build_object(
  'obligation', (select status from commercial.platform_obligations where id = '${obligation}'),
  'posted', (select count(*) from commercial.platform_collections where obligation_id = '${obligation}' and status = 'posted'),
  'collection', (select status from commercial.platform_collections where id = '${economy?.collection_id ?? "00000000-0000-0000-0000-000000000000"}'),
  'receipt', (select status from commercial.provider_receipts where id = '${receipt}'),
  'later', (select status from commercial.provider_receipts where id = '${laterReceipt || "00000000-0000-0000-0000-000000000000"}'),
  'commissions', (select count(*) from commercial.promoter_commissions where conversion_terms_id = '${terms}'),
  'slots', (select count(*) from commercial.founder_slots where conversion_terms_id = '${terms}')
);
`);
let settled = null;
try {
  settled = jsonLine(after);
} catch {
  problems.push({ step: "settled_parse", code: after.code });
}
expect(after.code === 0 && settled?.obligation === "satisfied" && settled?.posted === 0 && settled?.collection === "reversed", {
  step: "after_reverse", obligation: settled?.obligation ?? null, posted: settled?.posted ?? null, collection: settled?.collection ?? null
});
expect(settled?.receipt === "imputed" && settled?.later === "reconciliation_required", {
  step: "after_receipts", receipt: settled?.receipt ?? null, later: settled?.later ?? null
});
expect(settled?.commissions === 0 && settled?.slots === 0, { step: "after_commission_slot" });

const cleanup = await session(`
set session_replication_role = replica;
delete from commercial.audit_events where actor_account_id in ('${financeAccount}', '${superAccount}');
delete from commercial.provider_receipt_evidence where receipt_id in (
  select id from commercial.provider_receipts where external_customer_id = 'race-customer' and environment = 'sandbox' and provider = 'talo'
);
delete from commercial.provider_receipts where external_customer_id = 'race-customer' and environment = 'sandbox' and provider = 'talo';
delete from commercial.provider_customer_links where won_business_id = '${business}' and external_customer_id = 'race-customer';
delete from commercial.platform_collections where obligation_id = '${obligation}';
delete from commercial.platform_obligations where id = '${obligation}' and won_business_id = '${business}';
delete from commercial.founder_service_starts where conversion_terms_id = '${terms}';
delete from commercial.outbox_events where payload->>'won_business_id' = '${business}';
delete from commercial.conversion_terms where id = '${terms}' and won_business_id = '${business}';
set session_replication_role = origin;
delete from commercial.opportunity_stage_events where opportunity_id = '${opportunity}';
delete from commercial.opportunity_attributions where id = '${attribution}';
delete from commercial.commercial_opportunities where id = '${opportunity}';
delete from commercial.commercial_businesses where id = '${lead}';
delete from commercial.promoters where id = '${promoter}';
delete from commercial.internal_role_assignments where account_id in ('${financeAccount}', '${superAccount}');
delete from commercial.platform_accounts where id in ('${financeAccount}', '${superAccount}', '${promoterAccount}');
delete from public.businesses where id = '${business}' and slug = 'negocio-carrera-t08b';
delete from auth.users where id in ('${finance}', '${superadmin}', '${promoterUser}') and email like 'phase08b-race-%@local.test';
`);
const leftover = await session(`
select jsonb_build_object(
  'receipts', (select count(*) from commercial.provider_receipts where external_customer_id = 'race-customer'),
  'evidence', (select count(*) from commercial.provider_receipt_evidence where receipt_id in ('${receipt}', '${laterReceipt || "00000000-0000-0000-0000-000000000000"}')),
  'collections', (select count(*) from commercial.platform_collections where obligation_id = '${obligation}'),
  'obligations', (select count(*) from commercial.platform_obligations where id = '${obligation}'),
  'business', (select count(*) from public.businesses where id = '${business}'),
  'terms', (select count(*) from commercial.conversion_terms where id = '${terms}'),
  'accounts', (select count(*) from commercial.platform_accounts where id in ('${financeAccount}', '${superAccount}', '${promoterAccount}')),
  'users', (select count(*) from auth.users where id in ('${finance}', '${superadmin}', '${promoterUser}'))
);
`);
let residue = null;
try {
  residue = jsonLine(leftover);
} catch {
  problems.push({ step: "cleanup_parse", cleanup_code: cleanup.code, leftover_code: leftover.code });
}
expect(cleanup.code === 0 && leftover.code === 0, { step: "cleanup_code", cleanup_code: cleanup.code, leftover_code: leftover.code });
expect(residue && Object.values(residue).every((count) => count === 0), { step: "cleanup_residue", residue });

const report = {
  overlap: overlaps(left, right),
  reverse_overlap: overlaps(reversed, second),
  idempotent: [leftBody?.idempotent ?? null, rightBody?.idempotent ?? null],
  posted: economy?.posted ?? null,
  collection_id: economy?.collection_id ?? null,
  obligation_before_reverse: economy?.obligation ?? null,
  after: settled,
  residue,
  problems
};
console.log(redact(JSON.stringify(report)));
if (problems.length > 0) process.exit(1);
