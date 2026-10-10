/**
 * Installs the disposable prelude, the commercial migrations, and dblink.
 * Does not write supabase_migrations.schema_migrations.
 * Do not run until a human authorizes concurrency execution.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { inspectContainer, psqlFile, psqlText, readState, writeState } from "./lib.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const harness = join(root, "supabase", "concurrency-harness");
const migrations = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "migrations.json"), "utf8"));

function fail(message) {
  console.error(message);
  process.exit(1);
}

function must(result, label) {
  if (result.status !== 0) fail(`${label} failed\n${result.stderr}\n${result.stdout}`);
}

const state = readState();
if (!state) fail("missing harness state");
if (state.status !== "created") fail(`install requires status created, found ${state.status}`);
inspectContainer(state.containerName, {
  networkName: state.networkName,
  dbPassword: state.dbPassword,
});

const existing = psqlText(state, "select to_regnamespace('commercial') is not null;", {
  requireReady: false,
  timeoutMs: 10000,
});
must(existing, "schema probe");
if (existing.stdout.trim() === "t") fail("commercial schema already exists; destroy this container instead of resuming");

writeState({ ...state, status: "installing" });
const installing = readState();

must(psqlFile(installing, join(harness, "prelude.sql"), { requireReady: false, singleTransaction: false, timeoutMs: 60000 }), "prelude");

for (const fileName of migrations) {
  if (!/^[0-9]{14}_commercial_[a-z0-9_]+\.sql$/.test(fileName)) fail(`refusing migration name ${fileName}`);
  const filePath = join(root, "supabase", "migrations", fileName);
  must(
    psqlFile(installing, filePath, { requireReady: false, singleTransaction: true, timeoutMs: 120000 }),
    fileName,
  );
  const recorded = psqlText(
    installing,
    `insert into concurrency_harness.applied_files (name) values ('${fileName}');`,
    { requireReady: false, timeoutMs: 10000 },
  );
  must(recorded, `record ${fileName}`);
}

must(psqlFile(installing, join(harness, "enable-dblink.sql"), { requireReady: false, singleTransaction: true, timeoutMs: 30000 }), "dblink");
must(psqlFile(installing, join(harness, "harness.sql"), { requireReady: false, singleTransaction: true, timeoutMs: 30000 }), "harness");
must(psqlFile(installing, join(harness, "mark-identity.sql"), { requireReady: false, singleTransaction: true, timeoutMs: 10000 }), "identity");

writeState({ ...installing, status: "ready" });
console.log(`installed ${migrations.length} commercial migrations`);
