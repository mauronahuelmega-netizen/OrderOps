/**
 * Guards for the disposable concurrency harness.
 * Invoking the other scripts can create containers and write SQL.
 * This module only checks names, ports, and local state.
 */
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

export const NAME_PREFIX = "orderops_concurrency_discard_";
export const NETWORK_PREFIX = "orderops_concurrency_discard_net_";
export const DATABASE_NAME = "orderops_concurrency";
export const CONNINFO = "dbname=orderops_concurrency user=postgres";
export const IMAGE = "postgres:17";
export const LOG_LIMIT = 4000;

const NAME_PATTERN = /^orderops_concurrency_discard_[a-z0-9]{8}$/;
const NETWORK_PATTERN = /^orderops_concurrency_discard_net_[a-f0-9]{8}$/;
const FORBIDDEN_NAME = /majo|supabase_db_orderops|orderops_db/i;

export class IdentityReviewError extends Error {
  constructor(message) {
    super(message);
    this.name = "IdentityReviewError";
  }
}

export function assertContainerName(name) {
  if (typeof name !== "string" || !NAME_PATTERN.test(name)) {
    throw new Error(`container name must match ${NAME_PREFIX}<8 lowercase alphanumerics>`);
  }
  if (FORBIDDEN_NAME.test(name)) {
    throw new Error("refusing OrderOps or Majo container name");
  }
  return name;
}

export function assertNetworkName(name) {
  if (typeof name !== "string" || !NETWORK_PATTERN.test(name)) {
    throw new Error(`network name must match ${NETWORK_PREFIX}<8 hex characters>`);
  }
  if (FORBIDDEN_NAME.test(name)) {
    throw new Error("refusing OrderOps or Majo network name");
  }
  return name;
}

function bindingRows(value) {
  if (value == null) return [];
  if (!Array.isArray(value)) return [];
  return value;
}

function publishedBindings(map) {
  const rows = [];
  for (const [proto, value] of Object.entries(map ?? {})) {
    for (const row of bindingRows(value)) {
      rows.push(`${proto}=${row?.HostIp || "(empty)"}:${row?.HostPort || "(empty)"}`);
    }
  }
  return rows;
}

export function assertNoPublishedPorts(inspectInfo) {
  const name = String(inspectInfo?.Name ?? "").replace(/^\//, "") || "(unknown)";
  const state = inspectInfo?.State?.Status ?? "(unknown)";
  const network = Object.keys(inspectInfo?.NetworkSettings?.Networks ?? {}).join(",") || "(none)";
  const requested = publishedBindings(inspectInfo?.HostConfig?.PortBindings);
  const effective = publishedBindings(inspectInfo?.NetworkSettings?.Ports);
  if (inspectInfo?.HostConfig?.PublishAllPorts === true || requested.length > 0 || effective.length > 0) {
    throw new Error(
      [
        `container ${name} port publication rejected: published ports are not allowed`,
        `state=${state}`,
        `network=${network}`,
        `requested=${requested.length} [${requested.join(", ") || "(none)"}]`,
        `effective=${effective.length} [${effective.join(", ") || "(none)"}]`,
      ].join("; "),
    );
  }
}

export function assertInternalNetwork(networkInfo) {
  assertNetworkName(networkInfo?.Name);
  if (networkInfo?.Internal !== true) throw new Error("harness network is not internal");
  if (networkInfo?.Driver !== "bridge") throw new Error("harness network driver is not private bridge");
  if (networkInfo?.Labels?.["orderops.concurrency.disposable"] !== "true") {
    throw new Error("harness network is missing the disposable label");
  }
}

export function assertDisposableContainerRecord(inspectInfo) {
  const name = assertContainerName(String(inspectInfo?.Name ?? "").replace(/^\//, ""));
  if (inspectInfo?.Config?.Labels?.["orderops.concurrency.disposable"] !== "true") {
    throw new Error("container is missing the disposable label");
  }
  if (inspectInfo?.Config?.Image !== IMAGE) {
    throw new Error("container image reference is not postgres:17");
  }
  assertNoPublishedPorts(inspectInfo);
  const attached = Object.keys(inspectInfo?.NetworkSettings?.Networks ?? {});
  if (attached.length !== 1) throw new Error("container must be attached to exactly one network");
  const networkName = assertNetworkName(attached[0]);
  return { name, networkName };
}

export function assertNotRemoteTarget(text) {
  const value = String(text ?? "");
  if (/supabase\.co|amazonaws\.com|googleapis\.com|azure\.com/i.test(value)) {
    throw new Error("refusing remote database target");
  }
  if (/\bhost=/i.test(value) && !/host=127\.0\.0\.1\b/.test(value)) {
    throw new Error("refusing non-loopback host");
  }
}

export function newContainerName() {
  return assertContainerName(`${NAME_PREFIX}${randomBytes(4).toString("hex")}`);
}

export function newNetworkName() {
  return assertNetworkName(`${NETWORK_PREFIX}${randomBytes(4).toString("hex")}`);
}

export function newToken() {
  return randomBytes(32).toString("hex");
}

export function newDbPassword() {
  return randomBytes(32).toString("hex");
}

export function clip(text, limit = LOG_LIMIT) {
  const value = String(text ?? "");
  if (value.length <= limit) return value;
  return `${value.slice(0, limit)}…`;
}

export function redact(text) {
  return String(text ?? "")
    .replace(/\b[a-f0-9]{64}\b/gi, "[redacted]")
    .replace(/POSTGRES_PASSWORD=\S+/g, "POSTGRES_PASSWORD=[redacted]")
    .replace(/\bpassword=[^\s]+/gi, "password=[redacted]")
    .replace(/\bpostgres(?:ql)?:\/\/\S+/gi, "[redacted-url]")
    .replace(/\bhost=[^\s]+/gi, "host=[redacted]");
}

export function parseSessionResults(text) {
  const matches = [...String(text ?? "").matchAll(/HARNESS_RESULTS\s+(\{.*\})/g)];
  if (matches.length === 0) return null;
  try {
    const parsed = JSON.parse(matches[matches.length - 1][1]);
    return {
      a: clip(redact(parsed.slot_a ?? ""), 2000),
      b: clip(redact(parsed.slot_b ?? ""), 2000),
    };
  } catch {
    return null;
  }
}

export function secretMaterial(state) {
  return [state?.token, state?.dbPassword].filter((value) => typeof value === "string" && value.length > 0);
}

export function stateDirectory() {
  if (process.env.ORDEROPS_CONCURRENCY_STATE_DIR) {
    return process.env.ORDEROPS_CONCURRENCY_STATE_DIR;
  }
  return join(homedir(), "AppData", "Local", "OrderOps", "concurrency-harness");
}

export function statePath() {
  return join(stateDirectory(), "state.json");
}

export function readState({ requireToken = true } = {}) {
  const path = statePath();
  if (!existsSync(path)) return null;
  const state = JSON.parse(readFileSync(path, "utf8"));
  assertContainerName(state.containerName);
  if (state.databaseName !== DATABASE_NAME) {
    throw new Error("state database name is not orderops_concurrency");
  }
  if (state.networkName != null) assertNetworkName(state.networkName);
  if (requireToken && (typeof state.token !== "string" || !/^[a-f0-9]{64}$/.test(state.token))) {
    throw new Error("state token is missing");
  }
  if (requireToken && (typeof state.dbPassword !== "string" || !/^[a-f0-9]{64}$/.test(state.dbPassword))) {
    throw new Error("state database password is missing");
  }
  if (requireToken && typeof state.networkName !== "string") {
    throw new Error("state network name is missing");
  }
  return state;
}

export function writeState(state) {
  assertContainerName(state.containerName);
  mkdirSync(stateDirectory(), { recursive: true });
  writeFileSync(statePath(), `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

export function docker(args) {
  const result = spawnSync("docker", args, { encoding: "utf8" });
  return { status: result.status ?? 1, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

export function inspectContainer(name, { networkName, dbPassword } = {}) {
  assertContainerName(name);
  const result = docker(["inspect", name]);
  if (result.status !== 0) {
    throw new Error(`docker inspect failed for ${name}`);
  }
  const parsed = JSON.parse(result.stdout);
  const info = parsed[0];
  const actualName = String(info?.Name ?? "").replace(/^\//, "");
  if (actualName !== name) {
    throw new Error("inspect returned a different container name");
  }
  const labels = info?.Config?.Labels ?? {};
  if (labels["orderops.concurrency.disposable"] !== "true") {
    throw new Error("container is missing the disposable label");
  }
  if (info?.Config?.Image !== IMAGE) {
    throw new Error("container image reference is not postgres:17");
  }
  const image = docker(["image", "inspect", IMAGE]);
  if (image.status !== 0) {
    throw new Error("local postgres:17 image is not available; refusing to pull");
  }
  const imageId = JSON.parse(image.stdout)[0]?.Id;
  if (!imageId || info?.Image !== imageId) {
    throw new Error("container image id does not match local postgres:17");
  }
  const record = assertDisposableContainerRecord(info);
  if (record.name !== name) throw new Error("inspect returned a different container name");
  if (networkName != null && record.networkName !== networkName) {
    throw new Error("container network does not match the recorded state");
  }
  const networkResult = docker(["network", "inspect", record.networkName]);
  if (networkResult.status !== 0) throw new Error("cannot inspect harness network");
  assertInternalNetwork(JSON.parse(networkResult.stdout)[0]);
  const actualNetwork = record.networkName;
  const env = info?.Config?.Env ?? [];
  if (!env.includes(`POSTGRES_DB=${DATABASE_NAME}`)) {
    throw new Error("container was not created for orderops_concurrency");
  }
  if (env.some((item) => item.startsWith("POSTGRES_HOST_AUTH_METHOD="))) {
    throw new Error("refusing a host authentication override");
  }
  if (dbPassword != null) {
    const entry = env.find((item) => item.startsWith("POSTGRES_PASSWORD="));
    if (!entry || entry.slice("POSTGRES_PASSWORD=".length) !== dbPassword) {
      throw new Error("container password does not match the recorded state");
    }
  }
  return { name: actualName, running: info?.State?.Running === true, networkName: actualNetwork };
}

function inspectRecordedContainer(state) {
  return inspectContainer(state.containerName, {
    networkName: state.networkName,
    dbPassword: state.dbPassword,
  });
}

export function assertReadyState(state) {
  if (!state || state.status !== "ready") {
    throw new Error("harness is not ready; refusing to continue");
  }
  return inspectRecordedContainer(state);
}

export function psqlFile(state, filePath, { singleTransaction = false, timeoutMs = 120000, requireReady = true } = {}) {
  const live = requireReady ? assertReadyState(state) : inspectRecordedContainer(state);
  const args = [
    "exec",
    "-i",
    live.name,
    "psql",
    "-U",
    "postgres",
    "-d",
    DATABASE_NAME,
    "-v",
    "ON_ERROR_STOP=1",
    "-v",
    `harness_token=${state.token}`,
    "-v",
    `container_name=${state.containerName}`,
  ];
  if (singleTransaction) args.push("--single-transaction");
  args.push("-f", "-");
  const result = spawnSync("docker", args, {
    encoding: "utf8",
    timeout: timeoutMs,
    input: readFileSync(filePath),
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    filePath,
    timedOut: result.error?.code === "ETIMEDOUT",
  };
}

export function psqlText(state, sql, { timeoutMs = 30000, requireReady = true } = {}) {
  const live = requireReady ? assertReadyState(state) : inspectRecordedContainer(state);
  const result = spawnSync(
    "docker",
    [
      "exec",
      "-i",
      live.name,
      "psql",
      "-U",
      "postgres",
      "-d",
      DATABASE_NAME,
      "-v",
      "ON_ERROR_STOP=1",
      "-v",
      `harness_token=${state.token}`,
      "-v",
      `container_name=${state.containerName}`,
      "-t",
      "-A",
      "-f",
      "-",
    ],
    { encoding: "utf8", timeout: timeoutMs, input: sql },
  );
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    timedOut: result.error?.code === "ETIMEDOUT",
  };
}

export function removeLabeledContainer(name) {
  assertContainerName(name);
  const result = docker(["inspect", name]);
  if (result.status !== 0) return "absent";
  let info;
  try {
    info = JSON.parse(result.stdout)[0];
  } catch {
    throw new IdentityReviewError(`cannot parse inspect for ${name}; refusing to remove it`);
  }
  const actualName = String(info?.Name ?? "").replace(/^\//, "");
  if (actualName !== name || info?.Config?.Labels?.["orderops.concurrency.disposable"] !== "true") {
    throw new IdentityReviewError(`refusing to remove ${name}; disposable identity was not verified`);
  }
  const removed = docker(["rm", "-f", name]);
  if (removed.status !== 0) {
    throw new IdentityReviewError(`docker rm failed for ${name}; human review required`);
  }
  return "removed";
}

export function removeLabeledNetwork(name) {
  assertNetworkName(name);
  const result = docker(["network", "inspect", name]);
  if (result.status !== 0) return "absent";
  let info;
  try {
    info = JSON.parse(result.stdout)[0];
  } catch {
    throw new IdentityReviewError(`cannot parse network inspect for ${name}; refusing to remove it`);
  }
  if (info?.Name !== name || info?.Labels?.["orderops.concurrency.disposable"] !== "true") {
    throw new IdentityReviewError(`refusing to remove network ${name}; disposable identity was not verified`);
  }
  const attached = Object.values(info?.Containers ?? {});
  for (const container of attached) {
    if (!NAME_PATTERN.test(container?.Name ?? "")) {
      throw new IdentityReviewError(`network ${name} is attached to a foreign container; human review required`);
    }
  }
  const removed = docker(["network", "rm", name]);
  if (removed.status !== 0) {
    throw new IdentityReviewError(`docker network rm failed for ${name}; human review required`);
  }
  return "removed";
}
