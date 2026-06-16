type ActionLogContext = Record<string, unknown>;

export function getActionErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    const message = error.message.trim();
    return message || fallback;
  }

  return fallback;
}

export function logActionFailure(
  scope: string,
  error: unknown,
  context: ActionLogContext = {}
) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  const normalizedError = normalizeActionError(error);

  console.error(`[admin-action] ${scope} failed`, {
    ...context,
    ...normalizedError
  });
}

function normalizeActionError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return {
      message: (error as { message: string }).message
    };
  }

  return {
    message: typeof error === "string" ? error : "Unknown error"
  };
}
