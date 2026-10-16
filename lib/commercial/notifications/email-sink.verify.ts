/**
 * Dispatcher sink gate. No network except the explicit loopback check inside deliverToInbucket.
 * Run: npx tsx lib/commercial/notifications/email-sink.verify.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { dispatchClaimedEvents } from "@/lib/commercial/notifications/dispatch";
import { resolveEmailSink } from "@/lib/commercial/notifications/email-sink";

assert.deepEqual(resolveEmailSink({}), { ok: true, mode: "off" });
assert.equal(resolveEmailSink({ COMMERCIAL_EMAIL_SINK: "resend" }).ok, false);
assert.equal(
  resolveEmailSink({
    COMMERCIAL_EMAIL_SINK: "inbucket",
    COMMERCIAL_INBUCKET_HOST: "smtp.gmail.com",
    COMMERCIAL_INBUCKET_PORT: "587"
  }).ok,
  false
);
assert.equal(
  resolveEmailSink({
    COMMERCIAL_EMAIL_SINK: "inbucket",
    COMMERCIAL_INBUCKET_HOST: "127.0.0.1",
    COMMERCIAL_INBUCKET_PORT: "54325"
  }).ok,
  false
);
assert.deepEqual(
  resolveEmailSink({
    COMMERCIAL_EMAIL_SINK: "inbucket",
    COMMERCIAL_INBUCKET_HOST: "127.0.0.1",
    COMMERCIAL_INBUCKET_PORT: "54324"
  }),
  { ok: true, mode: "inbucket", origin: "http://127.0.0.1:54324" }
);

const script = readFileSync("scripts/commercial-core/dispatch-outbox.mjs", "utf8");
assert.match(script, /smtp\.gmail\.com/);
assert.match(script, /non_loopback_sink/);
assert.equal(script.includes("supabase_db_OrderOps"), false);

async function main(): Promise<void> {
  let inboxWrites = 0;
  const result = await dispatchClaimedEvents({
    env: {},
    events: [
      {
        id: "55555555-5555-4555-8555-555555555555",
        event_name: "payment.recorded",
        payload: { recipient_account_id: "66666666-6666-4666-8666-666666666666" },
        attempts: 1
      }
    ],
    store: {
      async claim() {
        return [];
      },
      async recordInbox() {
        inboxWrites += 1;
      },
      async recordEmail() {
        throw new Error("email_without_sink");
      },
      async release() {
        return undefined;
      }
    }
  });
  assert.equal(result.delivered, 1);
  assert.equal(inboxWrites, 1);
  console.log("email-sink.verify: ok");
}

void main();
