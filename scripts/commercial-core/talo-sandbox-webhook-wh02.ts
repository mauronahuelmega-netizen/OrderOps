import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { TALO_SANDBOX_WEBHOOK_PATH, taloSandboxWebhookCustomerId } from "@/lib/commercial/payments/talo-sandbox-webhook-route";
import { TALO_SANDBOX_API_ORIGIN } from "@/lib/commercial/payments/sandbox-env";

const customerId = taloSandboxWebhookCustomerId;
const customerName = "Burger Webhook QA";
const aliasSuffix = "whqa";
const amount = 55000;
const markerPath = ".env.talo-wh02.local";
const preservedCustomerId = "orderops-qa-burger-house";

type Summary = Record<string, string | number | boolean | null>;

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
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[name] = value;
  }
  return values;
}

function recordOf(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function numberFrom(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && /^\d+(\.\d{1,2})?$/.test(value)) {
    return Number(value);
  }
  return null;
}

function customersFrom(body: unknown): Record<string, unknown>[] {
  const customers = recordOf(recordOf(body)?.data)?.customers;
  if (!Array.isArray(customers)) {
    return [];
  }
  const records: Record<string, unknown>[] = [];
  for (const item of customers) {
    const record = recordOf(item);
    if (record) {
      records.push(record);
    }
  }
  return records;
}

function publicWebhookUrl(): URL {
  const raw = process.env.COMMERCIAL_TALO_WEBHOOK_PUBLIC_URL ?? "";
  const url = new URL(raw);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== TALO_SANDBOX_WEBHOOK_PATH) {
    throw new Error("webhook_url_rejected");
  }
  return url;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  const summary: Summary = { economicRecognition: false };
  const queryOnly = process.argv.includes("--query");
  const webhookUrl = queryOnly ? null : publicWebhookUrl();
  const fileEnv = loadEnvFile(".env.local");
  const env = {
    TALO_CLIENT_ID: process.env.TALO_CLIENT_ID ?? fileEnv.TALO_CLIENT_ID ?? "",
    TALO_CLIENT_SECRET: process.env.TALO_CLIENT_SECRET ?? fileEnv.TALO_CLIENT_SECRET ?? "",
    TALO_USER_ID: process.env.TALO_USER_ID ?? fileEnv.TALO_USER_ID ?? ""
  };
  if (!env.TALO_CLIENT_ID || !env.TALO_CLIENT_SECRET || !env.TALO_USER_ID) {
    summary.status = "BLOCKED";
    summary.reason = "missing_credentials";
    console.log(JSON.stringify(summary));
    return;
  }
  const tokenResponse = await fetch(`${TALO_SANDBOX_API_ORIGIN}/users/${encodeURIComponent(env.TALO_USER_ID)}/tokens`, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ client_id: env.TALO_CLIENT_ID, client_secret: env.TALO_CLIENT_SECRET }),
    signal: AbortSignal.timeout(15000)
  });
  const token = recordOf(recordOf(await readJson(tokenResponse))?.data)?.token;
  if (!tokenResponse.ok || typeof token !== "string") {
    summary.status = "BLOCKED";
    summary.reason = "token_rejected";
    summary.httpStatus = tokenResponse.status;
    console.log(JSON.stringify(summary));
    return;
  }
  const headers = { authorization: `Bearer ${token}`, accept: "application/json" };
  const writeHeaders = { ...headers, "content-type": "application/json" };
  const listUrl = `${TALO_SANDBOX_API_ORIGIN}/customers/?user_id=${encodeURIComponent(env.TALO_USER_ID)}`;
  const before = customersFrom(await readJson(await fetch(listUrl, { headers, signal: AbortSignal.timeout(15000) })));
  const preserved = before.filter((customer) => customer.customer_id === preservedCustomerId);
  const existing = before.filter((customer) => customer.customer_id === customerId);
  summary.preserved_customer_count = preserved.length;
  summary.webhook_customer_count = existing.length;
  if (preserved.length !== 1 || existing.length > 1) {
    summary.status = "BLOCKED";
    summary.reason = "customer_list_unexpected";
    console.log(JSON.stringify(summary));
    return;
  }

  let created = false;
  if (queryOnly) {
    summary.query_only = true;
  } else if (existing.length === 1) {
    const configured = existing[0].webhook_url;
    summary.webhook_url_visible = typeof configured === "string";
    summary.webhook_url_matches = webhookUrl !== null && configured === webhookUrl.toString();
    if (!queryOnly && configured !== webhookUrl?.toString()) {
      summary.status = "BLOCKED";
      summary.reason = "existing_webhook_url_not_current";
      console.log(JSON.stringify(summary));
      return;
    }
  } else {
    if (!webhookUrl) {
      throw new Error("webhook_url_rejected");
    }
    const createResponse = await fetch(`${TALO_SANDBOX_API_ORIGIN}/customers/`, {
      method: "POST",
      headers: writeHeaders,
      body: JSON.stringify({
        user_id: env.TALO_USER_ID,
        alias: aliasSuffix,
        customer_id: customerId,
        name: customerName,
        webhook_url: webhookUrl.toString()
      }),
      signal: AbortSignal.timeout(20000)
    });
    const createBody = await readJson(createResponse);
    created = createResponse.ok;
    summary.create_http = createResponse.status;
    if (!createResponse.ok) {
      summary.status = "BLOCKED";
      summary.reason = "customer_create_rejected";
      console.log(JSON.stringify(summary));
      return;
    }
    const createdData = recordOf(recordOf(createBody)?.data);
    summary.create_cvu_present = typeof recordOf(createdData?.bank_info)?.cvu === "string";
    summary.create_alias_present = typeof recordOf(createdData?.bank_info)?.alias === "string";
  }

  const after = customersFrom(await readJson(await fetch(listUrl, { headers, signal: AbortSignal.timeout(15000) })));
  const webhookCustomer = after.filter((customer) => customer.customer_id === customerId);
  const preservedAfter = after.filter((customer) => customer.customer_id === preservedCustomerId);
  const bank = recordOf(webhookCustomer[0]?.bank_info);
  const cvu = typeof bank?.cvu === "string" ? bank.cvu : "";
  const alias = typeof bank?.alias === "string" ? bank.alias : "";
  summary.created = created;
  summary.cvu_present = cvu.length > 0;
  summary.alias_present = alias.length > 0;
  summary.preserved_customer_unchanged = preservedAfter.length === 1;
  if (webhookCustomer.length !== 1 || !cvu || !alias) {
    summary.status = "BLOCKED";
    summary.reason = "customer_not_stable";
    console.log(JSON.stringify(summary));
    return;
  }
  const second = customersFrom(await readJson(await fetch(listUrl, { headers, signal: AbortSignal.timeout(15000) })));
  const secondBank = recordOf(second.find((customer) => customer.customer_id === customerId)?.bank_info);
  summary.identity_stable = secondBank?.cvu === cvu && secondBank?.alias === alias;
  if (!summary.identity_stable) {
    summary.status = "BLOCKED";
    summary.reason = "customer_not_stable";
    console.log(JSON.stringify(summary));
    return;
  }

  const listResponse = await fetch(`${TALO_SANDBOX_API_ORIGIN}/transactions/?user_id=${encodeURIComponent(env.TALO_USER_ID)}&limit=100`, {
    headers,
    signal: AbortSignal.timeout(15000)
  });
  const transactions = recordOf(recordOf(await readJson(listResponse))?.data)?.transactions;
  const owned = Array.isArray(transactions) ? transactions.filter((item) => {
    const record = recordOf(item);
    return record?.customer_id === customerId || record?.address === cvu;
  }) : [];
  summary.prior_transfer_count = owned.length;
  summary.transaction_list_http = listResponse.status;
  if (owned.length === 1) {
    const record = recordOf(owned[0]);
    summary.gross_pesos = numberFrom(record?.gross_amount);
    summary.net_pesos = numberFrom(record?.amount);
    summary.transaction_status = typeof record?.transaction_status === "string" ? record.transaction_status : null;
    summary.processing_difference_pesos = typeof summary.gross_pesos === "number" && typeof summary.net_pesos === "number"
      ? summary.gross_pesos - summary.net_pesos
      : null;
  }
  if (queryOnly || existsSync(markerPath) || owned.length > 0) {
    summary.faucet = "not_sent";
    summary.status = owned.length === 1 ? "TRANSFER_ALREADY_PRESENT" : "BLOCKED";
    summary.reason = existsSync(markerPath) ? "marker_present" : "prior_transfer_present";
    console.log(JSON.stringify(summary));
    return;
  }

  writeFileSync(markerPath, `pending ${customerId} ${amount}\n`, { encoding: "utf8" });
  let faucetResponse: Response;
  try {
    faucetResponse = await fetch(`${TALO_SANDBOX_API_ORIGIN}/cvu/${encodeURIComponent(cvu)}/faucet`, {
      method: "POST",
      headers: writeHeaders,
      body: JSON.stringify({ amount }),
      signal: AbortSignal.timeout(20000)
    });
  } catch {
    summary.faucet = "uncertain";
    summary.status = "PARTIAL";
    summary.reason = "faucet_timeout_not_repeated";
    console.log(JSON.stringify(summary));
    return;
  }
  summary.faucet_http = faucetResponse.status;
  summary.faucet = faucetResponse.ok ? "sent_once" : "rejected";
  if (!faucetResponse.ok) {
    summary.status = "PARTIAL";
    summary.reason = "faucet_rejected";
    console.log(JSON.stringify(summary));
    return;
  }
  const afterFaucet = await fetch(`${TALO_SANDBOX_API_ORIGIN}/transactions/?user_id=${encodeURIComponent(env.TALO_USER_ID)}&limit=100`, {
    headers,
    signal: AbortSignal.timeout(15000)
  });
  const afterTransactions = recordOf(recordOf(await readJson(afterFaucet))?.data)?.transactions;
  const credited = Array.isArray(afterTransactions) ? afterTransactions.flatMap((item) => {
    const record = recordOf(item);
    if (!record || (record.customer_id !== customerId && record.address !== cvu)) {
      return [];
    }
    return [{
      gross: numberFrom(record.gross_amount),
      net: numberFrom(record.amount),
      status: typeof record.transaction_status === "string" ? record.transaction_status : null
    }];
  }) : [];
  summary.credited_count = credited.length;
  if (credited.length === 1) {
    summary.gross_pesos = credited[0].gross;
    summary.net_pesos = credited[0].net;
    summary.processing_difference_pesos = credited[0].gross !== null && credited[0].net !== null ? credited[0].gross - credited[0].net : null;
    summary.transaction_status = credited[0].status;
    writeFileSync(markerPath, `done ${customerId} ${amount}\n`, { encoding: "utf8" });
  }
  summary.status = credited.length === 1 && credited[0].gross === amount ? "FAUCET_OBSERVED" : "PARTIAL";
  console.log(JSON.stringify(summary));
}

void main();
