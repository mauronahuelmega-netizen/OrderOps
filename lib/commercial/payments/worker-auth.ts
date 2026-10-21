import { createHash, timingSafeEqual } from "node:crypto";

export const COMMERCIAL_WORKER_SECRET_MIN_LENGTH = 32;

// Returns false when the secret is unset or short, so an unconfigured worker is never callable.
export function isAuthorizedWorkerRequest(request: Request, secret: string | undefined): boolean {
  if (!secret || secret.length < COMMERCIAL_WORKER_SECRET_MIN_LENGTH) {
    return false;
  }
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) {
    return false;
  }
  const given = createHash("sha256").update(header.slice("Bearer ".length)).digest();
  const expected = createHash("sha256").update(secret).digest();
  return timingSafeEqual(given, expected);
}
