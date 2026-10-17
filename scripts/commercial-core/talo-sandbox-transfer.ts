import { existsSync, readFileSync } from "node:fs";

import { simulateTaloSandboxActivation } from "@/lib/commercial/payments/talo-sandbox-transfer";

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
  const report = await simulateTaloSandboxActivation(env);
  console.log(`COMMERCIAL_V1_T06B_TALO_TRANSFER: ${report.status}`);
  if (report.status !== "PASS") {
    console.log(`reason: ${report.reason}`);
    if ("httpStatus" in report && report.httpStatus !== undefined) {
      console.log(`http_status: ${report.httpStatus}`);
    }
    return;
  }
  console.log(`created_transfer: ${report.createdTransfer}`);
  console.log(`amount_ars: ${report.amount}`);
  console.log(`currency: ${report.currency}`);
  console.log(`transaction_status: ${report.transactionStatus}`);
  console.log(`authenticated_read: ${report.authenticatedRead}`);
  console.log(`cvu_persisted: ${report.cvuPersisted}`);
  console.log(`webhook_configured: ${report.webhookConfigured}`);
}

void main();
