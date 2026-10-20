// Pipes SQL files into the canonical Commercial Core QA database only.
// Usage: node scripts/commercial-core/qa-psql.mjs <file.sql> [more.sql...]
//        node scripts/commercial-core/qa-psql.mjs --migration supabase/migrations/<version>_<name>.sql
// --migration applies the file and its ledger row in a single transaction.
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { spawn, spawnSync } from "node:child_process";

const CONTAINER = "supabase_db_orderops-phase06-qa";
const PORT = "56722";

const port = spawnSync("docker", ["port", CONTAINER, "5432/tcp"], { encoding: "utf8" });
if (port.status !== 0 || !port.stdout.includes(`:${PORT}`)) {
  console.error(`qa-psql: ${CONTAINER} is not bound to ${PORT}; refusing to run`);
  process.exit(2);
}

const args = process.argv.slice(2);
const migration = args[0] === "--migration";
const files = migration ? args.slice(1) : args;
if (files.length === 0) {
  console.error("qa-psql: no SQL files");
  process.exit(2);
}

function sqlFor(file) {
  const body = readFileSync(file, "utf8");
  if (!migration) return body;
  const match = /^(\d{14})_(.+)\.sql$/.exec(basename(file));
  if (!match) {
    console.error(`qa-psql: ${file} is not a migration file name`);
    process.exit(2);
  }
  return `${body}\ninsert into supabase_migrations.schema_migrations (version, name) values ('${match[1]}', '${match[2]}');\n`;
}

function run(file) {
  return new Promise((resolve) => {
    const psql = ["exec", "-i", CONTAINER, "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-q"];
    if (migration) psql.push("-1");
    const child = spawn("docker", psql, { stdio: ["pipe", "inherit", "inherit"] });
    child.stdin.end(sqlFor(file));
    child.on("close", (code) => resolve(code ?? 1));
  });
}

for (const file of files) {
  const code = await run(file);
  console.log(`qa-psql: ${file} -> ${code === 0 ? "PASS" : `FAIL (${code})`}`);
  if (code !== 0) process.exit(code);
}
