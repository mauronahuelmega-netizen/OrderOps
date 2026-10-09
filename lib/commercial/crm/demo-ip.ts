import { createHash } from "node:crypto";

export const TRUSTED_DEMO_IP_HEADER = "x-vercel-forwarded-for";

const IPV4 = /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;

export type DemoHeaderLookup = (name: string) => string | null;

export function resolveTrustedDemoIp(input: {
  vercelEnv: string | undefined;
  getHeader: DemoHeaderLookup;
}): { ok: true; ip: string } | { ok: false } {
  if (input.vercelEnv !== "1") return { ok: false };
  const raw = input.getHeader(TRUSTED_DEMO_IP_HEADER);
  if (raw === null) return { ok: false };
  const value = raw.trim();
  if (!isSinglePublicIp(value)) return { ok: false };
  return { ok: true, ip: value };
}

export function hashDemoIp(ip: string, salt: string | undefined): string | null {
  if (!salt || salt.trim().length === 0) return null;
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export function prepareDemoRateLimitHash(input: {
  vercelEnv: string | undefined;
  salt: string | undefined;
  getHeader: DemoHeaderLookup;
}): string | null {
  const resolved = resolveTrustedDemoIp(input);
  if (!resolved.ok) return null;
  return hashDemoIp(resolved.ip, input.salt);
}

function isSinglePublicIp(value: string): boolean {
  if (value.length === 0 || value.includes(",") || /\s/.test(value)) return false;
  if (IPV4.test(value)) return true;
  if (!value.includes(":") || value.includes(".")) return false;
  if (value.includes("[") || value.includes("]") || value.includes("%")) return false;
  const parts = value.split(":");
  if (parts.length < 3 || parts.length > 8) return false;
  return parts.every((part) => part.length <= 4 && /^[0-9a-f]*$/i.test(part));
}
