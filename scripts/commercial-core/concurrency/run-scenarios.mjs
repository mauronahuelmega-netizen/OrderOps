/**
 * Runs the three real two-session races and records redacted local results.
 * Do not run until a human authorizes concurrency execution.
 */
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  clip,
  parseSessionResults,
  psqlFile,
  psqlText,
  readState,
  redact,
  secretMaterial,
  stateDirectory,
} from "./lib.mjs";

const harness = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "supabase", "concurrency-harness");
const armToken = `select set_config(
  'concurrency.token',
  :'harness_token',
  false
) is not null as token_initialized;
`;
const scenarios = [
  { id: "AUD-P03-01", file: "aud-p03-01.sql", cleanup: `${armToken}select concurrency_harness.cleanup_aud_p03_01();` },
  { id: "AUD-P03-02", file: "aud-p03-02.sql", cleanup: `${armToken}select concurrency_harness.cleanup_aud_p03_02();` },
  { id: "BLK-CRM-02", file: "blk-crm-02.sql", cleanup: `${armToken}select concurrency_harness.cleanup_blk_crm_02();` },
];

function record(entry) {
  const directory = stateDirectory();
  mkdirSync(directory, { recursive: true });
  appendFileSync(join(directory, "results.jsonl"), `${JSON.stringify(entry)}\n`, "utf8");
}

function visibleText(result) {
  let text = [result.stderr, result.stdout].filter(Boolean).join("\n");
  for (const secret of secretMaterial(state)) text = text.split(secret).join("[redacted]");
  return redact(text);
}

const state = readState();
if (!state || state.status !== "ready") {
  console.error("scenarios require status ready");
  process.exit(1);
}

for (const scenario of scenarios) {
  const started = Date.now();
  const result = psqlFile(state, join(harness, "scenarios", scenario.file), { timeoutMs: 60000 });
  const cleanup = psqlText(state, scenario.cleanup, { timeoutMs: 20000 });
  const scenarioOk = result.status === 0;
  const cleanupOk = cleanup.status === 0;
  const passed = scenarioOk && cleanupOk;
  const scenarioText = visibleText(result);
  const cleanupText = visibleText(cleanup);
  const sessions = parseSessionResults(scenarioText);
  record({
    id: scenario.id,
    status: passed ? "PASS" : "FAIL",
    exitCode: result.status,
    cleanupExitCode: cleanup.status,
    elapsedMs: Date.now() - started,
    timedOut: result.timedOut === true || cleanup.timedOut === true,
    sessions,
    assertionError: scenarioOk ? null : clip(scenarioText),
    cleanupError: cleanupOk ? null : clip(cleanupText),
  });
  if (!scenarioOk) console.error(clip(scenarioText) || `${scenario.id} failed`);
  if (!cleanupOk) console.error(clip(cleanupText) || `${scenario.id} cleanup failed`);
  if (!passed) process.exit(result.status || cleanup.status || 1);
  console.log(`${scenario.id} PASS`);
}
