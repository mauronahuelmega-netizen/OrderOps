import { TALO_SANDBOX_API_ORIGIN } from "@/lib/commercial/payments/sandbox-env";

type EnvSource = Readonly<Record<string, string | undefined>>;

export type TaloEnvironment = "sandbox" | "production";

export type TaloRuntime =
  | {
      status: "ready";
      environment: "sandbox";
      origin: string;
      userId: string;
      clientId: string;
      clientSecret: string;
      webhookUrl: string | null;
    }
  | { status: "disabled" }
  | { status: "blocked"; reason: string; missing?: string[] };

export const TALO_WEBHOOK_PATH = "/api/commercial/talo/webhook";

const credentialNames = ["TALO_USER_ID", "TALO_CLIENT_ID", "TALO_CLIENT_SECRET"] as const;

// Production is not authorized for V1 local/QA work: any request for it is blocked here.
export function readTaloRuntime(env: EnvSource): TaloRuntime {
  if (env.COMMERCIAL_TALO_ENABLED !== "true") {
    return { status: "disabled" };
  }
  const environment = env.COMMERCIAL_TALO_ENVIRONMENT?.trim() ?? "";
  if (environment === "production") {
    return { status: "blocked", reason: "production_not_authorized" };
  }
  if (environment !== "sandbox") {
    return { status: "blocked", reason: "environment_required" };
  }
  const configuredOrigin = env.TALO_SANDBOX_API_URL?.trim();
  if (configuredOrigin) {
    try {
      if (new URL(configuredOrigin).origin !== TALO_SANDBOX_API_ORIGIN) {
        return { status: "blocked", reason: "sandbox_origin_required" };
      }
    } catch {
      return { status: "blocked", reason: "sandbox_origin_required" };
    }
  }
  const missing = credentialNames.filter((name) => !(env[name]?.trim()));
  if (missing.length > 0) {
    return { status: "blocked", reason: "missing_credentials", missing };
  }
  return {
    status: "ready",
    environment: "sandbox",
    origin: TALO_SANDBOX_API_ORIGIN,
    userId: env.TALO_USER_ID?.trim() ?? "",
    clientId: env.TALO_CLIENT_ID?.trim() ?? "",
    clientSecret: env.TALO_CLIENT_SECRET?.trim() ?? "",
    webhookUrl: stableWebhookUrl(env.COMMERCIAL_PAYMENT_WEBHOOK_BASE_URL)
  };
}

// Only a bare HTTPS origin qualifies; temporary tunnels must not be configured on customers.
export function stableWebhookUrl(base: string | undefined): string | null {
  if (!base?.trim()) {
    return null;
  }
  try {
    const url = new URL(base.trim());
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || (url.pathname !== "/" && url.pathname !== "")) {
      return null;
    }
    return `${url.origin}${TALO_WEBHOOK_PATH}`;
  } catch {
    return null;
  }
}
