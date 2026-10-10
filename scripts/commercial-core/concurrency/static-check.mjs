/**
 * Static checks only. This script does not call Docker or PostgreSQL.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertContainerName,
  assertDisposableContainerRecord,
  assertInternalNetwork,
  assertNetworkName,
  assertNoPublishedPorts,
  assertNotRemoteTarget,
  CONNINFO,
  parseSessionResults,
  redact,
} from "./lib.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..", "..");
const harness = join(root, "supabase", "concurrency-harness");
const failures = [];

function expectThrow(label, fn) {
  try {
    fn();
    failures.push(`${label} did not reject`);
  } catch {
    // expected
  }
}

expectThrow("majo name", () => assertContainerName("orderops_concurrency_discard_majo1234"));
expectThrow("orderops stack name", () => assertContainerName("supabase_db_OrderOps"));
expectThrow("short name", () => assertContainerName("orderops_concurrency_discard_ab"));
assertContainerName("orderops_concurrency_discard_ab12cd34");

function unpublishedContainer(overrides = {}) {
  return {
    Name: "/orderops_concurrency_discard_ab12cd34",
    State: { Status: "running" },
    Config: {
      Image: "postgres:17",
      Labels: { "orderops.concurrency.disposable": "true" },
      ExposedPorts: { "5432/tcp": {} },
      ...(overrides.config ?? {}),
    },
    HostConfig: { PortBindings: overrides.portBindings ?? {} },
    NetworkSettings: {
      Ports: overrides.ports ?? { "5432/tcp": null },
      Networks: overrides.networks ?? { orderops_concurrency_discard_net_ab12cd34: {} },
    },
  };
}

const accepted = assertDisposableContainerRecord(unpublishedContainer());
if (accepted.name !== "orderops_concurrency_discard_ab12cd34") {
  failures.push("unpublished container identity was not accepted");
}
assertNoPublishedPorts(unpublishedContainer({ ports: { "5432/tcp": [] } }));

function expectReject(label, fn, pattern) {
  try {
    fn();
    failures.push(`${label} did not reject`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!pattern.test(message) || message.includes("POSTGRES_PASSWORD") || /\b[a-f0-9]{64}\b/i.test(message)) {
      failures.push(`${label} rejected without the expected safe detail`);
    }
  }
}

function published(hostIp, hostPort = "55432", proto = "5432/tcp") {
  return unpublishedContainer({
    portBindings: { [proto]: [{ HostIp: hostIp, HostPort: hostPort }] },
    ports: { [proto]: [{ HostIp: hostIp, HostPort: hostPort }] },
  });
}

expectReject("ipv4 publish", () => assertNoPublishedPorts(published("127.0.0.1")), /127\.0\.0\.1:55432/);
expectReject("ipv6 loopback publish", () => assertNoPublishedPorts(published("::1")), /::1:55432/);
expectReject("wildcard ipv4", () => assertNoPublishedPorts(published("0.0.0.0")), /0\.0\.0\.0:55432/);
expectReject("wildcard ipv6", () => assertNoPublishedPorts(published("::")), /:::55432/);
expectReject("other port", () => assertNoPublishedPorts(published("127.0.0.1", "8080", "80/tcp")), /80\/tcp/);
expectReject("shared network", () => assertDisposableContainerRecord(unpublishedContainer({ networks: { bridge: {} } })), /network name/);
expectReject("missing label", () => assertDisposableContainerRecord(unpublishedContainer({ config: { Labels: {} } })), /disposable label/);
expectReject("wrong image", () => assertDisposableContainerRecord(unpublishedContainer({ config: { Image: "public.ecr.aws/supabase/postgres:17" } })), /postgres:17/);
assertInternalNetwork({
  Name: "orderops_concurrency_discard_net_ab12cd34",
  Internal: true,
  Driver: "bridge",
  Labels: { "orderops.concurrency.disposable": "true" },
});
expectReject(
  "external network",
  () => assertInternalNetwork({
    Name: "orderops_concurrency_discard_net_ab12cd34",
    Internal: false,
    Driver: "bridge",
    Labels: { "orderops.concurrency.disposable": "true" },
  }),
  /not internal/,
);

expectThrow("remote host", () => assertNotRemoteTarget("host=db.example.supabase.co"));
expectThrow("public host", () => assertNotRemoteTarget("host=10.0.0.8"));
assertNotRemoteTarget(CONNINFO);

assertNetworkName("orderops_concurrency_discard_net_ab12cd34");
expectThrow("bridge network", () => assertNetworkName("bridge"));
const token = "a".repeat(64);
if (redact(`secret ${token} POSTGRES_PASSWORD=${token}`).includes(token)) {
  failures.push("redaction left a token or database password");
}
const parsed = parseSessionResults('NOTICE: HARNESS_RESULTS {"slot_a":"{\\"duplicate\\": false}","slot_b":"{\\"duplicate\\": true}"}');
if (!parsed || !parsed.a.includes("duplicate") || !parsed.b.includes("duplicate")) {
  failures.push("session result parser did not keep both slots");
}

const listed = JSON.parse(readFileSync(join(here, "migrations.json"), "utf8"));
const onDisk = readdirSync(join(root, "supabase", "migrations"))
  .filter((name) => name.includes("commercial"))
  .sort();
if (JSON.stringify(listed) !== JSON.stringify(onDisk)) {
  failures.push("migrations.json does not match the commercial migration files");
}

const harnessSql = readFileSync(join(harness, "harness.sql"), "utf8");
const sendAt = harnessSql.indexOf("dblink_send_query");
const commitAt = harnessSql.indexOf("dblink_exec(p_conn_a, 'commit')");
if (sendAt < 0 || commitAt < 0 || sendAt > commitAt) {
  failures.push("both queries must be sent before either session commits");
}
const connections = harnessSql.split(CONNINFO).length - 1;
if (connections !== 2) failures.push(`expected 2 local connection literals, found ${connections}`);
if (harnessSql.includes("host=")) failures.push("harness connection must not set host");

for (const name of ["aud-p03-01.sql", "aud-p03-02.sql", "blk-crm-02.sql"]) {
  const sql = readFileSync(join(harness, "scenarios", name), "utf8");
  if (!sql.includes("concurrency_harness.race_pair(")) failures.push(`${name} does not use two sessions`);
  if (sql.includes("host=") || sql.includes("dblink_connect")) failures.push(`${name} opens its own connection`);
}

const destroy = readFileSync(join(here, "destroy-environment.mjs"), "utf8");
if (!destroy.includes("--confirm-name=")) failures.push("destroy is missing the exact-name confirmation");
if (destroy.includes("volume prune") || destroy.includes("docker system prune")) {
  failures.push("destroy is broader than the named container");
}

const install = readFileSync(join(here, "install.mjs"), "utf8");
if (install.includes("insert into supabase_migrations")) failures.push("install writes schema_migrations");
if (!install.includes("enable-dblink.sql")) failures.push("install does not gate dblink");

const prelude = readFileSync(join(harness, "prelude.sql"), "utf8");
for (const required of ["auth.uid", "auth.users", "public.profiles", "public.businesses", "storage.buckets", "create role anon"]) {
  if (!prelude.includes(required)) failures.push(`prelude missing ${required}`);
}
if (prelude.includes("create extension")) failures.push("prelude must not install dblink");

function dollarQuoteBodies(source) {
  const bodies = [];
  const pattern = /\$([A-Za-z_][A-Za-z0-9_]*)\$([\s\S]*?)\$\1\$|\$\$([\s\S]*?)\$\$/g;
  for (const match of source.matchAll(pattern)) bodies.push(match[2] ?? match[3] ?? "");
  return bodies;
}

function containsPsqlVariable(body) {
  const pattern = /(?<!:):(?!:)(?:'([A-Za-z_][A-Za-z0-9_]*)'|"([A-Za-z_][A-Za-z0-9_]*)"|([A-Za-z_][A-Za-z0-9_]*))/g;
  for (const match of body.matchAll(pattern)) {
    if (match[3]) {
      const before = body[match.index - 1];
      const after = body.slice(match.index + match[0].length, match.index + match[0].length + 2);
      if (before === "[" && after === ":]") continue;
    }
    return true;
  }
  return false;
}

const quotedVariable = "do $arm$\nbegin\n  perform set_config('concurrency.token', :'harness_token', false);\nend\n$arm$;";
if (!dollarQuoteBodies(quotedVariable).some(containsPsqlVariable)) {
  failures.push("dollar-quote regression did not detect a psql variable");
}
const castOnly = "do $$\nbegin\n  perform 'x'::uuid;\nend\n$$;";
if (dollarQuoteBodies(castOnly).some(containsPsqlVariable)) {
  failures.push("a PostgreSQL cast was treated as a psql variable");
}
const posixClass = "do $$\nbegin\n  perform result ~ '[[:space:]]*:[[:space:]]*false';\nend\n$$;";
if (dollarQuoteBodies(posixClass).some(containsPsqlVariable)) {
  failures.push("a POSIX character class was treated as a psql variable");
}

function assertBooleanTokenInit(label, source, expectedCount) {
  const statements = [...source.matchAll(/set_config\s*\(\s*'concurrency\.token'[\s\S]*?;/g)];
  if (statements.length !== expectedCount) {
    failures.push(`${label} initializes the session token ${statements.length} times`);
  }
  for (const statement of statements) {
    if (!/\)\s+is not null as token_initialized\s*;/i.test(statement[0])) {
      failures.push(`${label} token init can return the token`);
    }
  }
  if (dollarQuoteBodies(source).some(containsPsqlVariable)) {
    failures.push(`${label} interpolates a psql variable inside a dollar quote`);
  }
}

const runner = readFileSync(join(here, "run-scenarios.mjs"), "utf8");
assertBooleanTokenInit("run-scenarios.mjs", runner, 1);
if (!runner.includes("${armToken}select concurrency_harness.cleanup_")) {
  failures.push("backup cleanup does not set the session token before cleanup");
}
if (runner.includes("${state.token}") || runner.includes("${state.dbPassword}")) {
  failures.push("runner interpolates secrets into SQL");
}
if (!runner.includes("cleanupError") || !runner.includes("assertionError") || !runner.includes("sessions")) {
  failures.push("result log is missing scenario diagnostics");
}

const creator = readFileSync(join(here, "create-environment.mjs"), "utf8");
if (!creator.includes('"--internal"')) failures.push("container creation is missing the private network");
if (creator.includes('"-p"') || creator.includes("assertPortAvailable(")) {
  failures.push("container creation still publishes a host port");
}
for (const scriptName of ["verify-identity.mjs", "install.mjs", "run-scenarios.mjs", "verify-cleanup.mjs", "destroy-environment.mjs", "lib.mjs"]) {
  const source = readFileSync(join(here, scriptName), "utf8");
  if (source.includes('"-p"') || source.includes("55432") || source.includes("PGHOST")) {
    failures.push(`${scriptName} depends on a published host port`);
  }
}
if (creator.includes("POSTGRES_HOST_AUTH_METHOD")) failures.push("TCP trust authentication is still configured");
if (!creator.includes("removeLabeledContainer(")) failures.push("failed create does not use the labeled removal guard");
if (creator.includes("docker pull") || creator.includes('"pull"')) failures.push("create script downloads images");

const library = readFileSync(join(here, "lib.mjs"), "utf8");
if (!library.includes('info?.Config?.Image !== IMAGE') || !library.includes('"image", "inspect"')) {
  failures.push("inspect does not compare the container with local postgres:17");
}
if (library.includes("docker pull")) failures.push("library downloads images");

for (const name of ["aud-p03-01.sql", "aud-p03-02.sql", "blk-crm-02.sql"]) {
  const sql = readFileSync(join(harness, "scenarios", name), "utf8");
  if (!sql.includes("HARNESS_RESULTS")) failures.push(`${name} does not report both session results`);
  assertBooleanTokenInit(name, sql, 2);
  const firstInit = sql.indexOf("token_initialized");
  const secondInit = sql.indexOf("token_initialized", firstInit + 1);
  const cleanupAt = sql.indexOf("concurrency_harness.cleanup_");
  const assertAt = sql.indexOf("concurrency_harness.assert_session()");
  if (!(firstInit >= 0 && firstInit < cleanupAt && secondInit > cleanupAt && secondInit < assertAt)) {
    failures.push(`${name} does not initialize the token before cleanup and assert_session`);
  }
}

const verifyCleanup = readFileSync(join(harness, "verify-cleanup.sql"), "utf8");
assertBooleanTokenInit("verify-cleanup.sql", verifyCleanup, 1);
if (!(verifyCleanup.indexOf("token_initialized") < verifyCleanup.indexOf("assert_session()"))) {
  failures.push("verify-cleanup.sql does not initialize the token before assert_session");
}

const actorAccount = "cc222222-2222-4222-8222-222222222211";
const actorUser = "cc222222-2222-4222-8222-222222222201";
const otherActor = "cc222222-2222-4222-8222-222222222212";
const opportunityId = "cc222222-2222-4222-8222-222222222241";
const allowedActors = new Set([actorAccount, otherActor]);
const actorUsers = {
  [actorAccount]: actorUser,
  [otherActor]: "cc222222-2222-4222-8222-222222222202",
};

function mutatesAuditEvents(sql) {
  return /delete\s+from\s+commercial\.audit_events/i.test(sql)
    || /update\s+commercial\.audit_events/i.test(sql)
    || /truncate\s+(table\s+)?commercial\.audit_events/i.test(sql);
}

function cleanupBodies(sql) {
  return [...sql.matchAll(/create or replace function concurrency_harness\.cleanup_[a-z0-9_]+\(\)[\s\S]*?\$\$;/g)]
    .map((match) => match[0]);
}

function eventMatchesContract(event) {
  return event.action === "attribution.confirmed"
    && event.actorKind === "internal"
    && event.entityTable === "opportunity_attributions"
    && event.opportunityId === opportunityId
    && event.promoterId === "cc222222-2222-4222-8222-222222222221"
    && allowedActors.has(event.actorAccountId);
}

function residueVerdict({ events, accounts, users, operational }) {
  if (operational > 0) return "operational";
  for (const event of events) {
    if (!eventMatchesContract(event)) return "unexpected-audit";
  }
  const actors = new Set(events.map((event) => event.actorAccountId));
  for (const account of accounts) {
    if (!actors.has(account.id) || account.userId !== actorUsers[account.id]) return "unreferenced-account";
  }
  for (const actor of actors) {
    if (!accounts.some((account) => account.id === actor)) return "missing-actor";
  }
  const allowedUsers = new Set([...actors].map((actor) => actorUsers[actor]));
  for (const user of users) {
    if (!allowedUsers.has(user)) return "unreferenced-user";
  }
  for (const user of allowedUsers) {
    if (!users.includes(user)) return "missing-user";
  }
  return "ok";
}

if (!mutatesAuditEvents("delete from commercial.audit_events where id = 'x';")) {
  failures.push("audit mutation regression missed a delete");
}
if (mutatesAuditEvents(harnessSql) || mutatesAuditEvents(verifyCleanup)) {
  failures.push("harness mutates commercial.audit_events");
}
const cleanup02 = cleanupBodies(harnessSql).find((body) => body.includes("cleanup_aud_p03_02"));
if (!cleanup02 || !/delete from commercial\.platform_accounts[\s\S]*not exists[\s\S]*actor_account_id/i.test(cleanup02)) {
  failures.push("AUD-P03-02 cleanup can delete a referenced actor account");
}
if (!cleanup02 || !/delete from auth\.users[\s\S]*not exists[\s\S]*user_id/i.test(cleanup02)) {
  failures.push("AUD-P03-02 cleanup can delete the user of a retained actor");
}
for (const body of cleanupBodies(harnessSql)) {
  if (/exception\s+when/i.test(body)) failures.push("cleanup swallows or reroutes an error");
}
if (!runner.includes("const passed = scenarioOk && cleanupOk") || !runner.includes("if (!passed) process.exit")) {
  failures.push("runner can ignore a cleanup failure");
}
if (!runner.includes("cleanup_aud_p03_02()")) failures.push("backup cleanup does not call the corrected function");
for (const required of [
  "attribution.confirmed",
  opportunityId,
  actorAccount,
  actorUser,
  "retained_audit_events=",
  "operational concurrency fixtures still present",
  "unexpected audit residue",
  "unreferenced fixture accounts",
  "unreferenced fixture users",
  "assert_session()",
]) {
  if (!verifyCleanup.includes(required)) failures.push(`verify-cleanup.sql missing ${required}`);
}
function selectsMissingDisputePartyId(sql) {
  return /select\s+id\s+from\s+commercial\.dispute_parties/i.test(sql);
}
if (!selectsMissingDisputePartyId("select id from commercial.dispute_parties where promoter_id::text like 'cc%'")) {
  failures.push("dispute party column regression did not recognize the invalid id reference");
}
if (selectsMissingDisputePartyId(verifyCleanup)) {
  failures.push("verify-cleanup.sql selects a missing dispute_parties.id column");
}
if (!verifyCleanup.includes("select dispute_id from commercial.dispute_parties")) {
  failures.push("verify-cleanup.sql does not count dispute parties by dispute_id");
}
const permissive = "select id from auth.users where id::text like 'cc%';";
if (permissive.includes("attribution.confirmed") || permissive.includes(opportunityId)) {
  failures.push("prefix-only residue sample was treated as an origin check");
}
const retainedWinner = residueVerdict({
  events: [{
    action: "attribution.confirmed",
    actorKind: "internal",
    entityTable: "opportunity_attributions",
    opportunityId,
    promoterId: "cc222222-2222-4222-8222-222222222221",
    actorAccountId: otherActor,
  }],
  accounts: [{ id: otherActor, userId: actorUsers[otherActor] }],
  users: [actorUsers[otherActor]],
  operational: 0,
});
if (retainedWinner !== "ok") failures.push("retained winner was rejected");
if (residueVerdict({
  events: [],
  accounts: [{ id: actorAccount, userId: actorUser }],
  users: [actorUser],
  operational: 0,
}) !== "unreferenced-account") {
  failures.push("an unreferenced actor account was accepted");
}
if (residueVerdict({
  events: [],
  accounts: [],
  users: [],
  operational: 1,
}) !== "operational") {
  failures.push("an operational fixture was accepted");
}
if (residueVerdict({
  events: [{
    action: "attribution.confirmed",
    actorKind: "internal",
    entityTable: "opportunity_attributions",
    opportunityId: "cc333333-3333-4333-8333-333333333341",
    promoterId: "cc222222-2222-4222-8222-222222222221",
    actorAccountId: actorAccount,
  }],
  accounts: [{ id: actorAccount, userId: actorUser }],
  users: [actorUser],
  operational: 0,
}) !== "unexpected-audit") {
  failures.push("an audit event from another scenario was accepted");
}

for (const fileName of readdirSync(harness, { recursive: true })) {
  if (!String(fileName).endsWith(".sql")) continue;
  const sql = readFileSync(join(harness, String(fileName)), "utf8");
  if (dollarQuoteBodies(sql).some(containsPsqlVariable)) {
    failures.push(`${fileName} interpolates a psql variable inside a dollar quote`);
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(failure);
  process.exit(1);
}

console.log("static concurrency harness checks passed");
