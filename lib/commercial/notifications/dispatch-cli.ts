import { spawnSync } from "node:child_process";

import { dispatchClaimedEvents, type ClaimedOutboxEvent, type DispatchStore } from "@/lib/commercial/notifications/dispatch";
import { resolveEmailSink } from "@/lib/commercial/notifications/email-sink";

const container = process.env.COMMERCIAL_QA_DB_CONTAINER ?? "";
if (!/^supabase_db_orderops-phase06-[a-z0-9-]+$/.test(container)) {
  console.error("qa_container_required");
  process.exit(1);
}

const sink = resolveEmailSink(process.env);
if (!sink.ok) {
  console.error(sink.reason);
  process.exit(1);
}

function psql(sql: string): string {
  const result = spawnSync(
    "docker",
    ["exec", "-i", container, "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-tA", "-c", sql],
    { encoding: "utf8" }
  );
  if (result.status !== 0) {
    throw new Error(result.stderr || "psql_failed");
  }
  return result.stdout.trim();
}

function quote(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

const store: DispatchStore = {
  async claim(limit) {
    const raw = psql(`select coalesce(jsonb_agg(jsonb_build_object('id', id, 'event_name', event_name, 'payload', payload, 'attempts', attempts)), '[]'::jsonb) from commercial.claim_outbox_batch(${limit})`);
    return JSON.parse(raw) as ClaimedOutboxEvent[];
  },
  async recordInbox(eventId, accountId, title, body) {
    psql(`select commercial.record_inbox(${quote(eventId)}::uuid, ${quote(accountId)}::uuid, ${quote(title)}, ${quote(body)})`);
  },
  async recordEmail(eventId, destination, status, error) {
    psql(`select commercial.record_email_result(${quote(eventId)}::uuid, ${quote(destination)}, ${quote(status)}, ${error ? quote(error) : "null"})`);
  },
  async release(eventId, outcome) {
    psql(`select commercial.release_outbox(${quote(eventId)}::uuid, ${quote(outcome)})`);
  }
};

async function main(): Promise<void> {
  const events = await store.claim(20);
  const result = await dispatchClaimedEvents({ env: process.env, events, store });
  console.log(JSON.stringify({ ok: true, ...result, claimed: events.length }));
}

void main();
