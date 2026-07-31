/**
 * Server-safe extraction of Error / PostgREST / Supabase error fields.
 * Never include keys, tokens, headers, or PII beyond caller-supplied context.
 */

export type SafeErrorDetails = {
  name?: string;
  message: string;
  code?: string;
  details?: string;
  hint?: string;
};

export function getSafeErrorDetails(error: unknown): SafeErrorDetails {
  if (error instanceof Error) {
    const withExtras = error as Error & {
      code?: unknown;
      details?: unknown;
      hint?: unknown;
    };

    return {
      name: error.name,
      message: error.message || "Unknown error",
      code: typeof withExtras.code === "string" ? withExtras.code : undefined,
      details:
        typeof withExtras.details === "string" ? withExtras.details : undefined,
      hint: typeof withExtras.hint === "string" ? withExtras.hint : undefined
    };
  }

  if (typeof error === "string") {
    return { message: error || "Unknown error" };
  }

  if (typeof error === "object" && error !== null) {
    const value = error as Record<string, unknown>;

    return {
      name: typeof value.name === "string" ? value.name : undefined,
      message:
        typeof value.message === "string" && value.message.trim()
          ? value.message
          : "Unknown error",
      code: typeof value.code === "string" ? value.code : undefined,
      details: typeof value.details === "string" ? value.details : undefined,
      hint: typeof value.hint === "string" ? value.hint : undefined
    };
  }

  return { message: "Unknown error" };
}

/**
 * Throw a user-facing Error while logging PostgREST/Supabase fields to the server console.
 */
export function throwLoggedCorpusError(
  userMessage: string,
  cause: unknown,
  context: Record<string, string | undefined> = {}
): never {
  const details = getSafeErrorDetails(cause);

  console.error(
    "[product-customization] Corpus query failed",
    JSON.stringify({
      ...context,
      userMessage,
      ...details
    })
  );

  throw new Error(
    `${userMessage} [${details.code ?? "no_code"}] ${details.message}`
  );
}
