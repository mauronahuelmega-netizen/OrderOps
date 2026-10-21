/**
 * Pure outbox call shape. No network and no service role.
 * Run: npx tsx lib/commercial/notifications/outbox.verify.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { buildOutboxEnqueueCall } from "@/lib/commercial/notifications/outbox";

const call = buildOutboxEnqueueCall({
  eventName: "phase01.outbox.commit",
  payload: { source: "phase01" },
  correlationId: "22222222-2222-4222-8222-222222222222"
});

assert.equal(call.schema, "commercial");
assert.equal(call.fn, "enqueue");
assert.equal(call.args.p_event_name, "phase01.outbox.commit");
assert.equal(call.args.p_correlation_id, "22222222-2222-4222-8222-222222222222");
assert.equal(JSON.stringify(call).includes("service_role"), false);

const sql = readFileSync("supabase/migrations/20261008233833_commercial_phase01_outbox.sql", "utf8");
assert.match(sql, /function commercial\.enqueue/);
assert.equal(/\bcommit\b/i.test(sql), false);
assert.equal(/\brollback\b/i.test(sql), false);
assert.match(sql, /revoke all on function commercial\.enqueue/);
assert.match(sql, /'pending'/);
assert.match(sql, /attempts/);
