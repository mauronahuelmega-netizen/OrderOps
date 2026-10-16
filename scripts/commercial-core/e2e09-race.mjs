import { spawn } from "node:child_process";

const container = process.argv[2] ?? "";
if (container !== "supabase_db_orderops-phase06-qa") {
  console.error("fixture_refuses_target");
  process.exit(1);
}

const stamp = String(Date.now()).slice(-8);
const phone = `11${stamp}`;
const trade = `Panaderia Carrera ${stamp}`;

function session(sql) {
  return new Promise((resolve) => {
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
    child.on("close", (code) => resolve({ code, out: out.trim(), err: err.trim() }));
    child.stdin.end(sql);
  });
}

function submit(key, hash) {
  return session(`
select commercial.submit_demo_request(
  'Contacto Carrera', '${trade}', '${phone}', 'panaderia', null, null, null, null, '${key}', '${hash}'
);
`);
}

const started = Date.now();
const locker = session(`
begin;
select pg_advisory_lock(hashtext('commercial.phone'), hashtext(commercial.normalize_ar_phone('${phone}')));
select pg_sleep(6);
select pg_advisory_unlock(hashtext('commercial.phone'), hashtext(commercial.normalize_ar_phone('${phone}')));
commit;
`);
await new Promise((resolve) => setTimeout(resolve, 800));
const first = submit(`e2e09-race-${stamp}-c`, `e2e09-hash-${stamp}-c`);
const second = submit(`e2e09-race-${stamp}-d`, `e2e09-hash-${stamp}-d`);
let observed = { out: "0", code: 0 };
const watchUntil = Date.now() + 4000;
while (Date.now() < watchUntil) {
  observed = await session(`
select count(*)
from pg_stat_activity
where pid <> pg_backend_pid()
  and wait_event_type = 'Lock'
  and query like '%${trade}%';
`);
  if (observed.out === "2") break;
  await new Promise((resolve) => setTimeout(resolve, 200));
}
const [lockResult, left, right] = await Promise.all([locker, first, second]);
const replay = await session(`
select commercial.submit_demo_request(
  'Otro cuerpo', '${trade}', '${phone}', 'panaderia', null, null, null, null, 'e2e09-race-${stamp}-c', 'e2e09-hash-${stamp}-c'
)->>'duplicate';
select count(*) from commercial.commercial_businesses
where normalized_phone = commercial.normalize_ar_phone('${phone}')
  and normalized_name = commercial.normalize_name('${trade}');
select count(*) from commercial.commercial_interactions interaction
join commercial.commercial_businesses business on business.id = interaction.commercial_business_id
where business.normalized_phone = commercial.normalize_ar_phone('${phone}')
  and business.normalized_name = commercial.normalize_name('${trade}');
`);
console.log(JSON.stringify({
  overlap_waiting: observed.out,
  elapsed_ms: Date.now() - started,
  lock_code: lockResult.code,
  left_code: left.code,
  right_code: right.code,
  left: left.out,
  right: right.out,
  left_err: left.err,
  right_err: right.err,
  replay: replay.out,
  replay_code: replay.code
}, null, 2));
const lines = replay.out.split("\n").filter(Boolean);
if (observed.out !== "2" || left.code !== 0 || right.code !== 0 || lines[0] !== "true" || lines[1] !== "1" || lines[2] !== "2") {
  process.exit(1);
}
