export const PROMOTER_LOGIN_PATH = "/promoter/login";
export const PROMOTER_HOME_PATH = "/promoter";

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
