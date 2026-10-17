export const MOBBEX_API_ORIGIN = "https://api.mobbex.com";
export const TALO_SANDBOX_API_ORIGIN = "https://sandbox-api.talo.com.ar";

export const paymentSandboxEnvNames = [
  "MOBBEX_API_KEY",
  "MOBBEX_ACCESS_TOKEN",
  "MOBBEX_TEST_MODE",
  "TALO_SANDBOX_API_URL",
  "TALO_USER_ID",
  "TALO_CLIENT_ID",
  "TALO_CLIENT_SECRET",
  "COMMERCIAL_PAYMENT_WEBHOOK_BASE_URL"
] as const;

export type PaymentSandboxEnvName = (typeof paymentSandboxEnvNames)[number];

export type SandboxReadiness =
  | { provider: "mobbex" | "talo" | "webhooks"; status: "ready" }
  | { provider: "mobbex" | "talo" | "webhooks"; status: "BLOCKED_BY_CREDENTIALS"; missing: string[] }
  | { provider: "mobbex" | "talo" | "webhooks"; status: "rejected"; reason: string };

type EnvSource = Readonly<Record<string, string | undefined>>;

function filled(env: EnvSource, name: PaymentSandboxEnvName): boolean {
  const value = env[name];
  return typeof value === "string" && value.trim().length > 0;
}

function missing(env: EnvSource, names: readonly PaymentSandboxEnvName[]): string[] {
  return names.filter((name) => !filled(env, name));
}

export function readMobbexSandbox(env: EnvSource): SandboxReadiness {
  const absent = missing(env, ["MOBBEX_API_KEY", "MOBBEX_ACCESS_TOKEN", "MOBBEX_TEST_MODE"]);
  if (absent.length > 0) {
    return { provider: "mobbex", status: "BLOCKED_BY_CREDENTIALS", missing: absent };
  }
  if (env.MOBBEX_TEST_MODE?.trim() !== "true") {
    return { provider: "mobbex", status: "rejected", reason: "test_mode_required" };
  }
  return { provider: "mobbex", status: "ready" };
}

export function readTaloSandbox(env: EnvSource): SandboxReadiness {
  const absent = missing(env, [
    "TALO_SANDBOX_API_URL",
    "TALO_USER_ID",
    "TALO_CLIENT_ID",
    "TALO_CLIENT_SECRET"
  ]);
  if (absent.length > 0) {
    return { provider: "talo", status: "BLOCKED_BY_CREDENTIALS", missing: absent };
  }
  let url: URL;
  try {
    url = new URL(env.TALO_SANDBOX_API_URL ?? "");
  } catch {
    return { provider: "talo", status: "rejected", reason: "invalid_sandbox_url" };
  }
  if (url.origin !== TALO_SANDBOX_API_ORIGIN) {
    return { provider: "talo", status: "rejected", reason: "sandbox_origin_required" };
  }
  return { provider: "talo", status: "ready" };
}

export function readPaymentWebhookBase(env: EnvSource): SandboxReadiness {
  const absent = missing(env, ["COMMERCIAL_PAYMENT_WEBHOOK_BASE_URL"]);
  if (absent.length > 0) {
    return { provider: "webhooks", status: "BLOCKED_BY_CREDENTIALS", missing: absent };
  }
  let url: URL;
  try {
    url = new URL(env.COMMERCIAL_PAYMENT_WEBHOOK_BASE_URL ?? "");
  } catch {
    return { provider: "webhooks", status: "rejected", reason: "invalid_webhook_url" };
  }
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
    return { provider: "webhooks", status: "rejected", reason: "https_origin_required" };
  }
  return { provider: "webhooks", status: "ready" };
}
