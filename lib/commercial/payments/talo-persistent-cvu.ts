import { TALO_SANDBOX_API_ORIGIN } from "@/lib/commercial/payments/sandbox-env";

const requiredNames = ["TALO_CLIENT_ID", "TALO_CLIENT_SECRET", "TALO_USER_ID"] as const;

export const taloQaCustomer = {
  customerId: "orderops-qa-burger-house",
  name: "Burger House QA",
  aliasSuffix: "burgerqa"
} as const;

type EnvSource = Readonly<Record<string, string | undefined>>;

export type TaloPersistentCvuReport =
  | { status: "BLOCKED"; reason: "missing_credentials"; missing: string[] }
  | { status: "BLOCKED"; reason: "alias_prefix_missing" }
  | { status: "BLOCKED"; reason: "sandbox_origin_rejected" }
  | {
      status: "PASS";
      created: boolean;
      cvuPresent: true;
      aliasPresent: true;
      rereadMatches: true;
      singleCustomer: true;
      directGet: "matched" | "not_found";
    }
  | { status: "PARTIAL"; reason: string; httpStatus: number | null };

type BankIdentity = { cvu: string; alias: string };

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
  if (!body || typeof body !== "object") {
    return null;
  }
  const record = body as { token?: unknown; data?: { token?: unknown } };
  if (typeof record.data?.token === "string" && record.data.token.length > 0) {
    return record.data.token;
  }
  if (typeof record.token === "string" && record.token.length > 0) {
    return record.token;
  }
  return null;
}

function prefixMissing(body: unknown): boolean {
  return JSON.stringify(body ?? "").includes("user.alias.prefix.not.set");
}

function bankIdentity(body: unknown): BankIdentity | null {
  if (!body || typeof body !== "object") {
    return null;
  }
  const data = "data" in body ? body.data : body;
  if (!data || typeof data !== "object" || !("bank_info" in data)) {
    return null;
  }
  const bank = data.bank_info;
  if (!bank || typeof bank !== "object" || !("cvu" in bank) || !("alias" in bank)) {
    return null;
  }
  if (typeof bank.cvu !== "string" || bank.cvu.trim().length === 0) {
    return null;
  }
  if (typeof bank.alias !== "string" || bank.alias.trim().length === 0) {
    return null;
  }
  return { cvu: bank.cvu, alias: bank.alias };
}

function listedCustomer(body: unknown, customerId: string): BankIdentity | null {
  if (!body || typeof body !== "object" || !("data" in body)) {
    return null;
  }
  const data = body.data;
  if (!data || typeof data !== "object" || !("customers" in data) || !Array.isArray(data.customers)) {
    return null;
  }
  const matches = data.customers.filter(
    (customer) =>
      customer &&
      typeof customer === "object" &&
      "customer_id" in customer &&
      customer.customer_id === customerId
  );
  if (matches.length !== 1) {
    return null;
  }
  return bankIdentity({ data: matches[0] });
}

function listedCount(body: unknown, customerId: string): number {
  if (!body || typeof body !== "object" || !("data" in body)) {
    return 0;
  }
  const data = body.data;
  if (!data || typeof data !== "object" || !("customers" in data) || !Array.isArray(data.customers)) {
    return 0;
  }
  return data.customers.filter(
    (customer) =>
      customer &&
      typeof customer === "object" &&
      "customer_id" in customer &&
      customer.customer_id === customerId
  ).length;
}

export function sameBankIdentity(left: BankIdentity, right: BankIdentity): boolean {
  return left.cvu === right.cvu && left.alias === right.alias;
}

export async function ensureTaloSandboxQaCustomer(env: EnvSource): Promise<TaloPersistentCvuReport> {
  if (TALO_SANDBOX_API_ORIGIN !== "https://sandbox-api.talo.com.ar") {
    return { status: "BLOCKED", reason: "sandbox_origin_rejected" };
  }
  const missing = requiredNames.filter((name) => !filled(env, name));
  if (missing.length > 0) {
    return { status: "BLOCKED", reason: "missing_credentials", missing };
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
    return { status: "PARTIAL", reason: "token_rejected", httpStatus: tokenResponse.status };
  }

  const headers = {
    authorization: `Bearer ${token}`,
    accept: "application/json",
    "content-type": "application/json"
  };
  const customerPath = `${TALO_SANDBOX_API_ORIGIN}/customers/${encodeURIComponent(taloQaCustomer.customerId)}`;
  const listPath = `${TALO_SANDBOX_API_ORIGIN}/customers/?user_id=${encodeURIComponent(userId)}`;

  const beforeList = await fetch(listPath, { headers });
  const beforeListBody = await readJson(beforeList);
  if (listedCount(beforeListBody, taloQaCustomer.customerId) > 1) {
    return { status: "PARTIAL", reason: "duplicate_customer", httpStatus: beforeList.status };
  }
  const beforeGet = await fetch(customerPath, { headers });
  const beforeGetBody = await readJson(beforeGet);
  const existing = bankIdentity(beforeGetBody) ?? listedCustomer(beforeListBody, taloQaCustomer.customerId);
  let created = false;
  let issued = existing;

  if (!existing) {
    const createResponse = await fetch(`${TALO_SANDBOX_API_ORIGIN}/customers/`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        user_id: userId,
        alias: taloQaCustomer.aliasSuffix,
        customer_id: taloQaCustomer.customerId,
        name: taloQaCustomer.name
      })
    });
    const createBody = await readJson(createResponse);
    if (prefixMissing(createBody)) {
      return { status: "BLOCKED", reason: "alias_prefix_missing" };
    }
    issued = bankIdentity(createBody);
    if (!createResponse.ok || !issued) {
      return { status: "PARTIAL", reason: "create_rejected", httpStatus: createResponse.status };
    }
    created = true;
  }

  const rereadResponse = await fetch(customerPath, { headers });
  const direct = bankIdentity(await readJson(rereadResponse));
  const afterListResponse = await fetch(listPath, { headers });
  const afterListBody = await readJson(afterListResponse);
  const listed = listedCustomer(afterListBody, taloQaCustomer.customerId);
  const count = listedCount(afterListBody, taloQaCustomer.customerId);
  const reread = direct ?? listed;
  if (!issued || !reread || !sameBankIdentity(issued, reread) || count !== 1) {
    return { status: "PARTIAL", reason: "cvu_not_stable", httpStatus: rereadResponse.status };
  }
  if (direct && listed && !sameBankIdentity(direct, listed)) {
    return { status: "PARTIAL", reason: "cvu_not_stable", httpStatus: rereadResponse.status };
  }

  return {
    status: "PASS",
    created,
    cvuPresent: true,
    aliasPresent: true,
    rereadMatches: true,
    singleCustomer: true,
    directGet: direct ? "matched" : "not_found"
  };
}
