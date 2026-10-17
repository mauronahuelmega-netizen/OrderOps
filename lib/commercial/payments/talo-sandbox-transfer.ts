import { existsSync, writeFileSync } from "node:fs";

import { TALO_SANDBOX_API_ORIGIN } from "@/lib/commercial/payments/sandbox-env";
import { taloQaCustomer } from "@/lib/commercial/payments/talo-persistent-cvu";

const requiredNames = ["TALO_CLIENT_ID", "TALO_CLIENT_SECRET", "TALO_USER_ID"] as const;
const activationAmount = 290000;
const markerPath = ".env.talo-sandbox-transfer.local";

type EnvSource = Readonly<Record<string, string | undefined>>;

export type TaloTransferReport =
  | { status: "BLOCKED"; reason: string; httpStatus?: number }
  | { status: "PARTIAL"; reason: string; httpStatus?: number }
  | {
      status: "PASS";
      createdTransfer: boolean;
      amount: number;
      currency: "ARS";
      transactionStatus: string;
      authenticatedRead: true;
      cvuPersisted: true;
      webhookConfigured: boolean;
    };

type BankIdentity = { cvu: string; alias: string };
type ListedTransfer = {
  id: string;
  alternateId: string | null;
  amount: number | null;
  gross: number | null;
  status: string | null;
  customerId: string | null;
};

function filled(env: EnvSource, name: (typeof requiredNames)[number]): boolean {
  const value = env[name];
  return typeof value === "string" && value.trim().length > 0;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function tokenFrom(body: unknown): string | null {
  if (!body || typeof body !== "object" || !("data" in body)) {
    return null;
  }
  const data = body.data;
  if (!data || typeof data !== "object" || !("token" in data) || typeof data.token !== "string") {
    return null;
  }
  return data.token.length > 0 ? data.token : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function numberFrom(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0 && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function bankFromCustomer(customer: Record<string, unknown>): BankIdentity | null {
  const bank = asRecord(customer.bank_info);
  if (!bank || typeof bank.cvu !== "string" || typeof bank.alias !== "string") {
    return null;
  }
  if (bank.cvu.trim().length === 0 || bank.alias.trim().length === 0) {
    return null;
  }
  return { cvu: bank.cvu, alias: bank.alias };
}

function customerFromList(body: unknown): Record<string, unknown> | null {
  const data = asRecord(asRecord(body)?.data);
  const customers = data?.customers;
  if (!Array.isArray(customers)) {
    return null;
  }
  const matches = customers.filter((customer) => asRecord(customer)?.customer_id === taloQaCustomer.customerId);
  return matches.length === 1 ? asRecord(matches[0]) : null;
}

function transfersFrom(body: unknown): ListedTransfer[] {
  const data = asRecord(asRecord(body)?.data);
  const transactions = data?.transactions;
  if (!Array.isArray(transactions)) {
    return [];
  }
  return transactions.flatMap((item) => {
    const record = asRecord(item);
    if (!record) {
      return [];
    }
    const id = typeof record.id === "string" ? record.id : "";
    const alternateId = typeof record.transaction_id === "string" ? record.transaction_id : null;
    if (!id && !alternateId) {
      return [];
    }
    return [{
      id: id || alternateId || "",
      alternateId: id && alternateId && alternateId !== id ? alternateId : null,
      amount: numberFrom(record.amount),
      gross: numberFrom(record.gross_amount),
      status: typeof record.transaction_status === "string" ? record.transaction_status : typeof record.status === "string" ? record.status : null,
      customerId: typeof record.customer_id === "string" ? record.customer_id : null
    }];
  });
}

function belongsToCustomer(transfer: ListedTransfer, bank: BankIdentity, bodyItemAddress: string | null): boolean {
  return transfer.customerId === taloQaCustomer.customerId || bodyItemAddress === bank.cvu;
}

function isActivationAmount(transfer: ListedTransfer): boolean {
  return transfer.gross === activationAmount || transfer.amount === activationAmount;
}

export function activationAmountArs(): number {
  return activationAmount;
}

export async function simulateTaloSandboxActivation(env: EnvSource): Promise<TaloTransferReport> {
  if (TALO_SANDBOX_API_ORIGIN !== "https://sandbox-api.talo.com.ar") {
    return { status: "BLOCKED", reason: "sandbox_origin_rejected" };
  }
  const missing = requiredNames.filter((name) => !filled(env, name));
  if (missing.length > 0) {
    return { status: "BLOCKED", reason: "missing_credentials" };
  }

  const userId = env.TALO_USER_ID?.trim() ?? "";
  const tokenResponse = await fetch(`${TALO_SANDBOX_API_ORIGIN}/users/${encodeURIComponent(userId)}/tokens`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: env.TALO_CLIENT_ID?.trim() ?? "",
      client_secret: env.TALO_CLIENT_SECRET?.trim() ?? ""
    })
  });
  const token = tokenFrom(await readJson(tokenResponse));
  if (!tokenResponse.ok || !token) {
    return { status: "BLOCKED", reason: "token_rejected" };
  }
  const headers = { authorization: `Bearer ${token}`, accept: "application/json" };
  const writeHeaders = { ...headers, "content-type": "application/json" };
  const listUrl = `${TALO_SANDBOX_API_ORIGIN}/customers/?user_id=${encodeURIComponent(userId)}`;
  const firstCustomer = customerFromList(await readJson(await fetch(listUrl, { headers })));
  const secondCustomer = customerFromList(await readJson(await fetch(listUrl, { headers })));
  const firstBank = firstCustomer ? bankFromCustomer(firstCustomer) : null;
  const secondBank = secondCustomer ? bankFromCustomer(secondCustomer) : null;
  if (!firstCustomer || !firstBank || !secondBank || firstBank.cvu !== secondBank.cvu || firstBank.alias !== secondBank.alias) {
    return { status: "BLOCKED", reason: "customer_not_stable" };
  }
  if (firstCustomer.name !== taloQaCustomer.name) {
    return { status: "BLOCKED", reason: "customer_name_mismatch" };
  }
  const balance = numberFrom(firstCustomer.balance);
  const webhookConfigured = typeof firstCustomer.webhook_url === "string" && firstCustomer.webhook_url.trim().length > 0;

  const transactionsResponse = await fetch(
    `${TALO_SANDBOX_API_ORIGIN}/transactions/?user_id=${encodeURIComponent(userId)}&limit=100`,
    { headers }
  );
  const transactionsBody = await readJson(transactionsResponse);
  if (!transactionsResponse.ok) {
    return { status: "BLOCKED", reason: "transaction_history_unavailable", httpStatus: transactionsResponse.status };
  }
  const data = asRecord(asRecord(transactionsBody)?.data);
  const rawTransactions = Array.isArray(data?.transactions) ? data.transactions : [];
  const owned = rawTransactions.flatMap((item) => {
    const record = asRecord(item);
    const parsed = transfersFrom({ data: { transactions: [item] } })[0];
    if (!record || !parsed) {
      return [];
    }
    const address = typeof record.address === "string" ? record.address : null;
    return belongsToCustomer(parsed, firstBank, address) ? [parsed] : [];
  });
  if (owned.length > 1 || (owned.length === 1 && !isActivationAmount(owned[0]))) {
    return { status: "BLOCKED", reason: "prior_movement_needs_confirmation" };
  }
  if (owned.length === 0 && balance !== null && balance !== 0) {
    return { status: "BLOCKED", reason: "prior_movement_needs_confirmation" };
  }

  let createdTransfer = false;
  let known = owned[0];
  let transactionId = known?.id ?? "";
  if (!transactionId) {
    if (existsSync(markerPath)) {
      return { status: "BLOCKED", reason: "marker_without_visible_transaction" };
    }
    const faucetResponse = await fetch(`${TALO_SANDBOX_API_ORIGIN}/cvu/${encodeURIComponent(firstBank.cvu)}/faucet`, {
      method: "POST",
      headers: writeHeaders,
      body: JSON.stringify({ amount: activationAmount })
    });
    const faucetBody = await readJson(faucetResponse);
    if (!faucetResponse.ok) {
      return { status: "PARTIAL", reason: "faucet_rejected" };
    }
    createdTransfer = true;
    const faucetRecord = asRecord(faucetBody);
    const faucetData = asRecord(faucetRecord?.data);
    const candidate = faucetData?.id ?? faucetData?.transaction_id ?? faucetRecord?.transaction_id ?? faucetRecord?.transactionId;
    transactionId = typeof candidate === "string" ? candidate : "";
    if (!transactionId) {
      const after = await fetch(
        `${TALO_SANDBOX_API_ORIGIN}/transactions/?user_id=${encodeURIComponent(userId)}&limit=100`,
        { headers }
      );
      const afterBody = await readJson(after);
      const afterRaw = Array.isArray(asRecord(asRecord(afterBody)?.data)?.transactions)
        ? (asRecord(asRecord(afterBody)?.data)?.transactions as unknown[])
        : [];
      const created = afterRaw.flatMap((item) => {
        const record = asRecord(item);
        const parsed = transfersFrom({ data: { transactions: [item] } })[0];
        if (!record || !parsed) {
          return [];
        }
        const address = typeof record.address === "string" ? record.address : null;
        return belongsToCustomer(parsed, firstBank, address) ? [parsed] : [];
      });
      if (created.length !== 1) {
        return { status: "BLOCKED", reason: "faucet_sent_but_transaction_not_singular" };
      }
      known = created[0];
      transactionId = created[0].id;
    }
    writeFileSync(markerPath, `${taloQaCustomer.customerId} ${transactionId} ${activationAmount}\n`, { encoding: "utf8" });
  }

  const candidateIds = [transactionId, known?.alternateId].filter((value): value is string => typeof value === "string" && value.length > 0);
  let readResponse: Response | null = null;
  let readBody: unknown = null;
  for (const candidateId of candidateIds) {
    readResponse = await fetch(
      `${TALO_SANDBOX_API_ORIGIN}/customers/${encodeURIComponent(taloQaCustomer.customerId)}/transactions/${encodeURIComponent(candidateId)}`,
      { headers }
    );
    readBody = await readJson(readResponse);
    if (readResponse.ok) {
      break;
    }
  }
  const readData = asRecord(asRecord(readBody)?.data) ?? asRecord(readBody);
  const readAmount = numberFrom(readData?.gross_amount) ?? numberFrom(readData?.amount);
  const readCurrency = readData?.currency;
  const readStatus = typeof readData?.transaction_status === "string"
    ? readData.transaction_status
    : typeof readData?.status === "string"
      ? readData.status
      : "";
  const readCustomer = typeof readData?.customer_id === "string" ? readData.customer_id : null;
  const readDate = typeof readData?.creation_timestamp === "string"
    ? readData.creation_timestamp
    : typeof readData?.payment_date === "string"
      ? readData.payment_date
      : "";
  if (
    !readResponse?.ok ||
    (readAmount !== activationAmount && !(known?.gross === activationAmount && readAmount === known.amount)) ||
    readCurrency !== "ARS" ||
    readStatus.length === 0 ||
    readDate.length === 0 ||
    (readCustomer !== null && readCustomer !== taloQaCustomer.customerId)
  ) {
    return { status: "PARTIAL", reason: "authenticated_read_mismatch", httpStatus: readResponse?.status };
  }

  const afterCustomer = customerFromList(await readJson(await fetch(listUrl, { headers })));
  const afterBank = afterCustomer ? bankFromCustomer(afterCustomer) : null;
  if (!afterBank || afterBank.cvu !== firstBank.cvu || afterBank.alias !== firstBank.alias) {
    return { status: "PARTIAL", reason: "cvu_changed" };
  }

  return {
    status: "PASS",
    createdTransfer,
    amount: activationAmount,
    currency: "ARS",
    transactionStatus: readStatus,
    authenticatedRead: true,
    cvuPersisted: true,
    webhookConfigured
  };
}
