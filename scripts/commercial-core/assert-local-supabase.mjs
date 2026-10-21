#!/usr/bin/env node
/**
 * Read-only gate for Commercial Core migrations.
 * Exits 0 only when the OrderOps Supabase API is http://127.0.0.1:54321
 * and the database URL is 127.0.0.1:54322.
 * Does not migrate, reset, or print secrets.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const EXPECTED_API_HOST = "127.0.0.1";
const EXPECTED_API_PORT = "54321";
const EXPECTED_DB_HOST = "127.0.0.1";
const EXPECTED_DB_PORT = "54322";

const LOCAL_FIXTURE = {
  API_URL: "http://127.0.0.1:54321",
  DB_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
};

const REMOTE_FIXTURE = {
  API_URL: "https://db.xxx.supabase.co",
  DB_URL: "postgresql://postgres.xxx:secret@db.xxx.supabase.co:5432/postgres",
};

function pick(status, names) {
  for (const name of names) {
    const value = status?.[name];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return null;
}

function endpoint(rawUrl, label) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return { error: `${label} is not a URL` };
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const port = url.port || (url.protocol === "https:" ? "443" : url.protocol === "http:" ? "80" : "");
  return { host, port };
}

function isRemoteHost(host) {
  const normalized = host.toLowerCase();
  return normalized === "supabase.co" || normalized.endsWith(".supabase.co");
}

/**
 * @param {{ status: Record<string, unknown>, publicUrl?: string | null }} input
 * publicUrl undefined: .env.local absent. null: variable absent or empty.
 */
export function evaluateLocalTarget({ status, publicUrl }) {
  const errors = [];
  const apiRaw = pick(status, ["API_URL", "api_url"]);
  const dbRaw = pick(status, ["DB_URL", "db_url"]);
  if (!apiRaw) errors.push("status JSON has no API_URL");
  if (!dbRaw) errors.push("status JSON has no DB_URL");

  const api = apiRaw ? endpoint(apiRaw, "API_URL") : { error: "API_URL missing" };
  const db = dbRaw ? endpoint(dbRaw, "DB_URL") : { error: "DB_URL missing" };
  if (api.error) errors.push(api.error);
  if (db.error) errors.push(db.error);

  if (!api.error) {
    if (isRemoteHost(api.host)) errors.push("API host is remote supabase.co");
    if (api.host !== EXPECTED_API_HOST) errors.push(`API host must be ${EXPECTED_API_HOST}`);
    if (api.port !== EXPECTED_API_PORT) errors.push(`API port must be ${EXPECTED_API_PORT}`);
  }
  if (!db.error) {
    if (isRemoteHost(db.host)) errors.push("DB host is remote supabase.co");
    if (db.host !== EXPECTED_DB_HOST) errors.push(`DB host must be ${EXPECTED_DB_HOST}`);
    if (db.port !== EXPECTED_DB_PORT) errors.push(`DB port must be ${EXPECTED_DB_PORT}`);
  }

  let envFile = "absent";
  if (publicUrl === null) {
    envFile = "present_without_public_url";
  } else if (typeof publicUrl === "string") {
    envFile = "present";
    const pub = endpoint(publicUrl, "NEXT_PUBLIC_SUPABASE_URL");
    if (pub.error) errors.push(pub.error);
    else {
      if (isRemoteHost(pub.host)) errors.push("NEXT_PUBLIC_SUPABASE_URL host is remote supabase.co");
      if (pub.host !== EXPECTED_API_HOST || pub.port !== EXPECTED_API_PORT) {
        errors.push(`NEXT_PUBLIC_SUPABASE_URL must be ${EXPECTED_API_HOST}:${EXPECTED_API_PORT}`);
      }
    }
  }

  return {
    ok: errors.length === 0,
    apiHost: api.host ?? null,
    apiPort: api.port ?? null,
    dbHost: db.host ?? null,
    dbPort: db.port ?? null,
    envFile,
    errors,
  };
}

export function parseStatusStdout(stdout) {
  const text = String(stdout ?? "").trim();
  if (!text) throw new Error("supabase status returned empty output");
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("supabase status did not return JSON");
    return JSON.parse(text.slice(start, end + 1));
  }
}

function readPublicSupabaseUrl(cwd) {
  const path = resolve(cwd, ".env.local");
  if (!existsSync(path)) return { publicUrl: undefined };
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    if (trimmed.slice(0, eq).trim() !== "NEXT_PUBLIC_SUPABASE_URL") continue;
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    return { publicUrl: value.length > 0 ? value : null };
  }
  return { publicUrl: null };
}

function printResult(result) {
  console.log(`api_host=${result.apiHost ?? "unknown"}`);
  console.log(`api_port=${result.apiPort ?? "unknown"}`);
  console.log(`db_host=${result.dbHost ?? "unknown"}`);
  console.log(`db_port=${result.dbPort ?? "unknown"}`);
  console.log(`env_file=${result.envFile}`);
  console.log(`gate=${result.ok ? "pass" : "fail"}`);
  for (const error of result.errors) console.error(`gate_error=${error}`);
}

function runStatus(cwd) {
  const attempts = [
    ["supabase", ["status", "-o", "json"]],
    ["npx", ["--yes", "supabase", "status", "-o", "json"]],
  ];
  let last = null;
  for (const [command, args] of attempts) {
    const result = spawnSync(command, args, { cwd, encoding: "utf8", shell: false });
    last = result;
    if (result.status === 0 && result.stdout && result.stdout.includes("{")) return result.stdout;
  }
  const message = last?.error?.code === "ENOENT" ? "supabase CLI was not found" : "supabase status failed";
  throw new Error(message);
}

function main() {
  const fixture = process.argv[2] === "--fixture" ? process.argv[3] : null;
  if (fixture === "remote") {
    const result = evaluateLocalTarget({ status: REMOTE_FIXTURE, publicUrl: undefined });
    printResult(result);
    process.exit(result.ok ? 0 : 1);
  }
  if (fixture === "local") {
    const result = evaluateLocalTarget({ status: LOCAL_FIXTURE, publicUrl: undefined });
    printResult(result);
    process.exit(result.ok ? 0 : 1);
  }
  if (fixture) {
    console.error("gate_error=unknown fixture");
    process.exit(1);
  }

  let stdout;
  try {
    stdout = runStatus(process.cwd());
  } catch (error) {
    console.log("api_host=unknown");
    console.log("api_port=unknown");
    console.log("db_host=unknown");
    console.log("db_port=unknown");
    console.log("env_file=not_checked");
    console.log("gate=fail");
    console.error(`gate_error=${error instanceof Error ? error.message : "status failed"}`);
    process.exit(1);
  }

  let status;
  try {
    status = parseStatusStdout(stdout);
  } catch (error) {
    console.log("gate=fail");
    console.error(`gate_error=${error instanceof Error ? error.message : "status JSON unreadable"}`);
    process.exit(1);
  }

  const { publicUrl } = readPublicSupabaseUrl(process.cwd());
  const result = evaluateLocalTarget({ status, publicUrl });
  printResult(result);
  process.exit(result.ok ? 0 : 1);
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isDirectRun) main();
