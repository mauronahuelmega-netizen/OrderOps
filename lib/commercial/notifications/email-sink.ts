export type EmailSinkDecision =
  | { ok: true; mode: "off" }
  | { ok: true; mode: "inbucket"; origin: string }
  | { ok: false; reason: string };

const FOREIGN_INBUCKET_PORTS = new Set(["54324", "56324", "56424"]);

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
  const qaPort = env.COMMERCIAL_QA_INBUCKET_PORT?.trim() ?? "";
  const configuredUrl = env.COMMERCIAL_INBUCKET_URL?.trim() ?? "";
  if (host !== "127.0.0.1" || !/^[0-9]+$/.test(port) || port !== qaPort) {
    return { ok: false, reason: "non_loopback_sink" };
  }
  if (FOREIGN_INBUCKET_PORTS.has(port)) {
    return { ok: false, reason: "foreign_project_sink" };
  }
  const origin = `http://127.0.0.1:${port}`;
  if (configuredUrl.length > 0 && configuredUrl !== origin) {
    return { ok: false, reason: "non_loopback_sink" };
  }
  return { ok: true, mode: "inbucket", origin };
}

export function isQaInbucketOrigin(origin: string, port: string): boolean {
  return origin === `http://127.0.0.1:${port}` && !FOREIGN_INBUCKET_PORTS.has(port);
}

export async function deliverToInbucket(input: {
  origin: string;
  port: string;
  recipient: string;
  subject: string;
  body: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isQaInbucketOrigin(input.origin, input.port)) {
    return { ok: false, error: "foreign_project_sink" };
  }
  if (!input.recipient.endsWith("@127.0.0.1")) {
    return { ok: false, error: "external_recipient" };
  }
  try {
    const response = await fetch(`${input.origin}/api/v1/send`, {
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
