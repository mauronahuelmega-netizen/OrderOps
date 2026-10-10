/**
 * Confirms harness fixture ids are gone.
 * Do not run until a human authorizes concurrency execution.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { psqlFile, readState } from "./lib.mjs";

const filePath = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  "supabase",
  "concurrency-harness",
  "verify-cleanup.sql",
);

const state = readState();
if (!state || state.status !== "ready") {
  console.error("cleanup verification requires status ready");
  process.exit(1);
}

const result = psqlFile(state, filePath, { singleTransaction: true, timeoutMs: 20000 });
if (result.status !== 0) {
  console.error(result.stderr || result.stdout || "cleanup verification failed");
  process.exit(1);
}
const counts = [...String(result.stdout ?? "").matchAll(/\b(?:operational_fixtures|retained_audit_events|retained_actor_accounts|retained_actor_users)=\d+/g)]
  .map((match) => match[0]);
if (!counts.some((count) => count.startsWith("retained_audit_events="))) {
  console.error("cleanup verification did not report retained audit events");
  process.exit(1);
}
console.log(`cleanup verification ok ${counts.join(" ")}`);
