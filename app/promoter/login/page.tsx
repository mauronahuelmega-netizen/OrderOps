import { redirect } from "next/navigation";
import { loginPathWith, type LoginErrorCode, isLoginErrorCode } from "@/lib/auth/login-path";
import { sanitizeInternalNext } from "@/lib/auth/safe-next";

type PromoterLoginPageProps = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

/** Legacy entry: permanently redirects to universal /login. */
export default async function PromoterLoginPage({ searchParams }: PromoterLoginPageProps) {
  const params = await searchParams;
  const error: LoginErrorCode | undefined = isLoginErrorCode(params.error)
    ? params.error
    : undefined;
  const next = sanitizeInternalNext(params.next);
  redirect(loginPathWith({ error, next }));
}
