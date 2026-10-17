import { TALO_SANDBOX_API_ORIGIN } from "@/lib/commercial/payments/sandbox-env";

const requiredNames = ["TALO_CLIENT_ID", "TALO_CLIENT_SECRET", "TALO_USER_ID"] as const;

type EnvSource = Readonly<Record<string, string | undefined>>;

export type TaloConnectionReport =
  | { status: "BLOCKED"; missing: string[]; authenticated: false; aliasPrefix: "NOT_VERIFIED" }
  | { status: "PASS"; authenticated: true; aliasPrefix: "set" | "unset" | "NOT_VERIFIED"; customerCount: number }
  | { status: "NOT_VERIFIED"; authenticated: false; httpStatus: number | null; aliasPrefix: "NOT_VERIFIED" };

function filled(env: EnvSource, name: (typeof requiredNames)[number]): boolean {
  const value = env[name];
  return typeof value === "string" && value.trim().length > 0;
}

export function readTaloSdkConnection(env: EnvSource): TaloConnectionReport | { status: "ready" } {
  const missing = requiredNames.filter((name) => !filled(env, name));
  if (missing.length > 0) {
    return { status: "BLOCKED", missing, authenticated: false, aliasPrefix: "NOT_VERIFIED" };
  }
  return { status: "ready" };
}

export function aliasPrefixState(aliasPrefix: string | null | undefined): "set" | "unset" {
  return typeof aliasPrefix === "string" && aliasPrefix.trim().length > 0 ? "set" : "unset";
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

export async function connectTaloSandbox(env: EnvSource): Promise<TaloConnectionReport> {
  const readiness = readTaloSdkConnection(env);
  if (readiness.status === "BLOCKED") {
    return readiness;
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
    return {
      status: "NOT_VERIFIED",
      authenticated: false,
      httpStatus: tokenResponse.status,
      aliasPrefix: "NOT_VERIFIED"
    };
  }

  const customersResponse = await fetch(
    `${TALO_SANDBOX_API_ORIGIN}/customers/?user_id=${encodeURIComponent(userId)}`,
    { headers: { authorization: `Bearer ${token}`, accept: "application/json" } }
  );
  if (!customersResponse.ok) {
    return {
      status: "NOT_VERIFIED",
      authenticated: false,
      httpStatus: customersResponse.status,
      aliasPrefix: "NOT_VERIFIED"
    };
  }
  const customersBody = await readJson(customersResponse);
  const customers =
    customersBody &&
    typeof customersBody === "object" &&
    "data" in customersBody &&
    customersBody.data &&
    typeof customersBody.data === "object" &&
    "customers" in customersBody.data &&
    Array.isArray(customersBody.data.customers)
      ? customersBody.data.customers.length
      : 0;

  const accountResponse = await fetch(
    `${TALO_SANDBOX_API_ORIGIN}/users/${encodeURIComponent(userId)}/account`,
    { headers: { authorization: `Bearer ${token}`, accept: "application/json" } }
  );
  let aliasPrefix: "set" | "unset" | "NOT_VERIFIED" = "NOT_VERIFIED";
  if (accountResponse.ok) {
    const accountBody = await readJson(accountResponse);
    const prefix =
      accountBody &&
      typeof accountBody === "object" &&
      "data" in accountBody &&
      accountBody.data &&
      typeof accountBody.data === "object" &&
      "alias_prefix" in accountBody.data
        ? accountBody.data.alias_prefix
        : undefined;
    aliasPrefix = aliasPrefixState(typeof prefix === "string" ? prefix : undefined);
  }

  return {
    status: "PASS",
    authenticated: true,
    aliasPrefix,
    customerCount: customers
  };
}

export const taloSandboxOrigin = TALO_SANDBOX_API_ORIGIN;
