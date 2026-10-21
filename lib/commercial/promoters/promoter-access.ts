import { LOGIN_PATH } from "@/lib/auth/login-path";
import { authorizeNextForAreas, sanitizeInternalNext } from "@/lib/auth/safe-next";

/** @deprecated Use LOGIN_PATH — kept as alias for legacy promoter redirects. */
export const PROMOTER_LOGIN_PATH = LOGIN_PATH;
export const PROMOTER_HOME_PATH = "/promoter";

export function safePromoterNext(value: string | null | undefined): string {
  const path = sanitizeInternalNext(value);
  if (!path) return PROMOTER_HOME_PATH;
  const authorized = authorizeNextForAreas(path, [
    { id: "promoter", label: "Panel de Promotores", href: PROMOTER_HOME_PATH }
  ]);
  return authorized ?? PROMOTER_HOME_PATH;
}

export type PromoterAccessDecision = "login" | "allow" | "forbidden";
export type PromoterLoginFailure = "invalid_credentials" | "auth_unavailable";

export function classifyAuthFailure(error: { status?: number; message?: string }): PromoterLoginFailure {
  const status = error.status;
  const message = error.message ?? "";
  if (status === 400 || status === 401 || status === 422) return "invalid_credentials";
  if (status == null || status === 0 || status >= 500) return "auth_unavailable";
  if (/fetch failed|failed to fetch|network|econnreset|econnrefused/i.test(message)) return "auth_unavailable";
  return "invalid_credentials";
}

export function decidePromoterAccess(input: {
  hasUser: boolean;
  sessionOk: boolean | null;
}): PromoterAccessDecision {
  if (!input.hasUser) return "login";
  if (input.sessionOk === true) return "allow";
  return "forbidden";
}
