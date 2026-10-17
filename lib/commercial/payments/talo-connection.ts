import { TaloClient, TaloError } from "talo-pay";

import { TALO_SANDBOX_API_ORIGIN } from "@/lib/commercial/payments/sandbox-env";

const requiredNames = ["TALO_CLIENT_ID", "TALO_CLIENT_SECRET", "TALO_USER_ID"] as const;

type EnvSource = Readonly<Record<string, string | undefined>>;

export type TaloConnectionReport =
  | { status: "BLOCKED"; missing: string[]; authenticated: false; aliasPrefix: "NOT_VERIFIED" }
  | { status: "PASS"; authenticated: true; aliasPrefix: "set" | "unset" }
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

export async function connectTaloSandbox(env: EnvSource): Promise<TaloConnectionReport> {
  const readiness = readTaloSdkConnection(env);
  if (readiness.status === "BLOCKED") {
    return readiness;
  }

  const userId = env.TALO_USER_ID?.trim() ?? "";
  const client = new TaloClient({
    clientId: env.TALO_CLIENT_ID?.trim() ?? "",
    clientSecret: env.TALO_CLIENT_SECRET?.trim() ?? "",
    userId,
    environment: "sandbox"
  });

  try {
    const account = await client.partners.getAccount(userId);
    return {
      status: "PASS",
      authenticated: true,
      aliasPrefix: aliasPrefixState(account.alias_prefix)
    };
  } catch (error) {
    const httpStatus = error instanceof TaloError ? error.statusCode ?? null : null;
    return {
      status: "NOT_VERIFIED",
      authenticated: false,
      httpStatus,
      aliasPrefix: "NOT_VERIFIED"
    };
  }
}

export const taloSandboxOrigin = TALO_SANDBOX_API_ORIGIN;
