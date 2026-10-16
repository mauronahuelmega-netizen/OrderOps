export type EmailSinkDecision =
  | { ok: true; mode: "off" }
  | { ok: true; mode: "inbucket"; origin: "http://127.0.0.1:54324" }
  | { ok: false; reason: string };

const LOOPBACK_ORIGIN = "http://127.0.0.1:54324";

export function resolveEmailSink(env: Record<string, string | undefined>): EmailSinkDecision {
  const sink = env.COMMERCIAL_EMAIL_SINK?.trim() ?? "";
  if (sink.length === 0) {
    return { ok: true, mode: "off" };
  }
  if (sink !== "inbucket") {
    return { ok: false, reason: "unsupported_sink" };
  }

  const host = env.COMMERCIAL_INBUCKET_HOST?.trim() ?? "";
  const port = env.COMMERCIAL_INBUCKET_PORT?.trim() ?? "";
  const configuredUrl = env.COMMERCIAL_INBUCKET_URL?.trim() ?? "";
  if (host !== "127.0.0.1" || port !== "54324") {
    return { ok: false, reason: "non_loopback_sink" };
  }
  if (configuredUrl.length > 0 && configuredUrl !== LOOPBACK_ORIGIN) {
    return { ok: false, reason: "non_loopback_sink" };
  }
  return { ok: true, mode: "inbucket", origin: LOOPBACK_ORIGIN };
}

export async function deliverToInbucket(input: {
  origin: "http://127.0.0.1:54324";
  recipient: string;
  subject: string;
  body: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.origin !== LOOPBACK_ORIGIN) {
    return { ok: false, error: "non_loopback_sink" };
  }
  try {
    const response = await fetch(`${LOOPBACK_ORIGIN}/api/v1/send`, {
      method: "POST",
      redirect: "error",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        From: { Email: "commercial-core@127.0.0.1" },
        To: [{ Email: input.recipient }],
        Subject: input.subject,
        Text: input.body
      })
    });
    if (!response.ok) {
      return { ok: false, error: `inbucket_http_${response.status}` };
    }
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "inbucket_unreachable";
    return { ok: false, error: message.slice(0, 180) };
  }
}
