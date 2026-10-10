/**
 * Creates one disposable Postgres 17 container on a private internal network.
 * Do not run until a human authorizes concurrency execution.
 * This script does not pull images.
 */
import { unlinkSync } from "node:fs";
import {
  DATABASE_NAME,
  IMAGE,
  IdentityReviewError,
  docker,
  inspectContainer,
  newContainerName,
  newDbPassword,
  newNetworkName,
  newToken,
  readState,
  redact,
  removeLabeledContainer,
  removeLabeledNetwork,
  statePath,
  writeState,
} from "./lib.mjs";

function fail(message) {
  console.error(redact(message));
  process.exit(1);
}

function review(error) {
  console.error(redact(error.message));
  console.error("human review required; unverified resources were left in place");
  process.exit(3);
}

function discardCreatedResources(containerName, networkName) {
  try {
    removeLabeledContainer(containerName);
  } catch (error) {
    if (error instanceof IdentityReviewError) {
      try {
        removeLabeledNetwork(networkName);
      } catch {
        // Keep the recorded state when either resource cannot be identified.
      }
      review(error);
    }
    throw error;
  }
  try {
    removeLabeledNetwork(networkName);
  } catch (error) {
    if (error instanceof IdentityReviewError) review(error);
    throw error;
  }
  unlinkSync(statePath());
}

if (process.argv.some((arg) => arg.startsWith("--port"))) {
  fail("published ports are not accepted; omit --port");
}
if (readState()) fail("state file already exists; destroy the recorded container before creating another");

const containerName = newContainerName();
const networkName = newNetworkName();
const token = newToken();
const dbPassword = newDbPassword();
const createdAt = new Date().toISOString();
writeState({
  status: "creating",
  containerName,
  networkName,
  databaseName: DATABASE_NAME,
  token,
  dbPassword,
  createdAt,
});

const network = docker([
  "network",
  "create",
  "--driver",
  "bridge",
  "--internal",
  "--label",
  "orderops.concurrency.disposable=true",
  networkName,
]);
if (network.status !== 0) {
  discardCreatedResources(containerName, networkName);
  fail(network.stderr || "docker network create failed");
}

const created = docker([
  "run",
  "-d",
  "--name",
  containerName,
  "--network",
  networkName,
  "--label",
  "orderops.concurrency.disposable=true",
  "-e",
  `POSTGRES_DB=${DATABASE_NAME}`,
  "-e",
  `POSTGRES_PASSWORD=${dbPassword}`,
  "--tmpfs",
  "/var/lib/postgresql/data:rw",
  IMAGE,
]);

if (created.status !== 0) {
  discardCreatedResources(containerName, networkName);
  fail(created.stderr || "docker run failed");
}

let ready = false;
for (let attempt = 0; attempt < 30; attempt += 1) {
  const probe = docker(["exec", containerName, "pg_isready", "-U", "postgres", "-d", DATABASE_NAME]);
  if (probe.status === 0) {
    ready = true;
    break;
  }
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
}

let live;
try {
  live = inspectContainer(containerName, { networkName, dbPassword });
} catch (error) {
  if (error instanceof IdentityReviewError) review(error);
  console.error(redact(error instanceof Error ? error.message : "container identity was rejected"));
  discardCreatedResources(containerName, networkName);
  process.exit(1);
}

if (!ready || !live.running) {
  discardCreatedResources(containerName, networkName);
  fail("container did not become ready on the recorded loopback port");
}

const hba = docker([
  "exec",
  containerName,
  "sh",
  "-c",
  'printf "%s\\n" "local all postgres trust" "host all all all scram-sha-256" > "$PGDATA/pg_hba.conf" && psql -U postgres -d orderops_concurrency -v ON_ERROR_STOP=1 -c "select pg_reload_conf();"',
]);
if (hba.status !== 0) {
  discardCreatedResources(containerName, networkName);
  fail(hba.stderr || "could not restrict TCP authentication to scram-sha-256");
}

writeState({
  status: "created",
  containerName,
  networkName,
  databaseName: DATABASE_NAME,
  token,
  dbPassword,
  createdAt,
});

console.log(`created ${containerName} without published ports`);
