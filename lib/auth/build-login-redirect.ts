import "server-only";

import { cookies, headers } from "next/headers";
import { LOGIN_PATH, loginPathWith, type LoginErrorCode } from "@/lib/auth/login-path";
import { sanitizeInternalNext } from "@/lib/auth/safe-next";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Build a /login URL that preserves the originally requested internal path when present.
 */
export async function buildLoginRedirect(options?: {
  error?: LoginErrorCode;
  next?: string | null;
}): Promise<string> {
  const headerList = await headers();
  const fromHeader = sanitizeInternalNext(headerList.get("x-orderops-path"));
  const next = sanitizeInternalNext(options?.next) ?? fromHeader;

  let error = options?.error;
  if (!error) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      const cookieStore = await cookies();
      const hadAuthCookie = cookieStore
        .getAll()
        .some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"));
      if (hadAuthCookie) {
        error = "session";
      }
    }
  }

  if (!error && !next) return LOGIN_PATH;
  return loginPathWith({ error, next });
}
