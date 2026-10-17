import { existsSync, readFileSync } from "node:fs";

import { ensureTaloSandboxQaCustomer } from "@/lib/commercial/payments/talo-persistent-cvu";

function loadEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) {
    return {};
  }
  const values: Record<string, string> = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }
    const separator = trimmed.indexOf("=");
    const name = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[name] = value;
  }
  return values;
}

const fileEnv = loadEnvFile(".env.local");
const env = {
  TALO_CLIENT_ID: process.env.TALO_CLIENT_ID ?? fileEnv.TALO_CLIENT_ID,
  TALO_CLIENT_SECRET: process.env.TALO_CLIENT_SECRET ?? fileEnv.TALO_CLIENT_SECRET,
  TALO_USER_ID: process.env.TALO_USER_ID ?? fileEnv.TALO_USER_ID
};

async function main(): Promise<void> {
  const report = await ensureTaloSandboxQaCustomer(env);
  console.log(`COMMERCIAL_V1_T06A_TALO_PERSISTENT_CVU: ${report.status}`);
  if (report.status === "BLOCKED" && report.reason === "missing_credentials") {
    console.log(`missing: ${report.missing.join(" ")}`);
    return;
  }
  if (report.status === "BLOCKED" || report.status === "PARTIAL") {
    console.log(`reason: ${report.reason}`);
    if (report.status === "PARTIAL") {
      console.log(`http_status: ${report.httpStatus ?? "none"}`);
    }
    return;
  }
  console.log(`created: ${report.created}`);
  console.log(`cvu_present: ${report.cvuPresent}`);
  console.log(`alias_present: ${report.aliasPresent}`);
  console.log(`reread_matches: ${report.rereadMatches}`);
  console.log(`single_customer: ${report.singleCustomer}`);
  console.log(`direct_get: ${report.directGet}`);
}

void main();
