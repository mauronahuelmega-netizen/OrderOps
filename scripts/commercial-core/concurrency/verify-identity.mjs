/**
 * Checks the recorded disposable container, and optionally the database marker.
 * Do not run until a human authorizes concurrency execution.
 */
import { DATABASE_NAME, inspectContainer, psqlText, readState } from "./lib.mjs";

function fail(message) {
  console.error(message);
  process.exit(1);
}

const phaseFlag = process.argv.find((arg) => arg.startsWith("--phase="));
const phase = phaseFlag ? phaseFlag.slice("--phase=".length) : "";
if (phase !== "container" && phase !== "database") fail("missing --phase=container or --phase=database");

const state = readState();
if (!state) fail("missing harness state");
const live = inspectContainer(state.containerName, {
  networkName: state.networkName,
  dbPassword: state.dbPassword,
});
if (state.databaseName !== DATABASE_NAME || live.networkName !== state.networkName) {
  fail("recorded identity does not match the container");
}
if (phase === "container") {
  if (state.status !== "created" && state.status !== "installing" && state.status !== "ready") {
    fail(`unexpected status ${state.status}`);
  }
  console.log(`container identity ok ${live.name} without published ports`);
  process.exit(0);
}

if (state.status !== "ready") fail("database identity requires status ready");
const result = psqlText(
  state,
  "select current_database() || '|' || token || '|' || container_name || '|' || (select count(*)::text from pg_hba_file_rules where type = 'host' and auth_method = 'trust') from concurrency_harness.identity where id = 1 and disposable;",
  { timeoutMs: 10000 },
);
if (result.status !== 0) fail(result.stderr || "identity query failed");
const [databaseName, token, containerName, trustHosts] = result.stdout.trim().split("|");
if (
  databaseName !== DATABASE_NAME
  || token !== state.token
  || containerName !== state.containerName
  || trustHosts !== "0"
) {
  fail("database marker rejected");
}
console.log("database identity ok");
