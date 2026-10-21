import { redirect } from "next/navigation";
import { loginPathWith, type LoginErrorCode, isLoginErrorCode } from "@/lib/auth/login-path";
import { sanitizeInternalNext } from "@/lib/auth/safe-next";

type AdminLoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

/** Legacy entry: permanently redirects to universal /login. */
export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;
  const error: LoginErrorCode | undefined = isLoginErrorCode(params.error)
    ? params.error
    : undefined;
  redirect(
    loginPathWith({
      error,
      next: sanitizeInternalNext(params.next)
    })
  );
}
