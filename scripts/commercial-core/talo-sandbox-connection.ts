import { readFileSync, existsSync } from "node:fs";

import { connectTaloSandbox } from "@/lib/commercial/payments/talo-connection";

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
  const report = await connectTaloSandbox(env);
  const missing = report.status === "BLOCKED" ? report.missing.join(" ") : "";
  console.log(`COMMERCIAL_V1_T06A_TALO_CONNECTION: ${report.status}`);
  console.log(`authenticated: ${report.authenticated}`);
  console.log(`alias_prefix: ${report.aliasPrefix}`);
  if (missing) {
    console.log(`missing: ${missing}`);
  }
  if (report.status === "PASS") {
    console.log(`customer_count: ${report.customerCount}`);
  }
  if (report.status === "NOT_VERIFIED") {
    console.log(`http_status: ${report.httpStatus ?? "none"}`);
  }
}

void main();
