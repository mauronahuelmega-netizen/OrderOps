import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { decideStageTransition } from "@/lib/commercial/crm/stages";

assert.equal(decideStageTransition({ toStage: "demo_done", reason: null, openTaskCount: 0 }).ok, true);
assert.equal(
  decideStageTransition({ toStage: "won", reason: null, openTaskCount: 0 }).commercialErrorCode,
  "won_requires_business"
);
assert.equal(
  decideStageTransition({ toStage: "lost", reason: "  ", openTaskCount: 0 }).commercialErrorCode,
  "lost_reason_required"
);
assert.equal(
  decideStageTransition({ toStage: "lost", reason: "sin interes", openTaskCount: 1 }).commercialErrorCode,
  "open_tasks_remaining"
);

const sql = readFileSync("supabase/migrations/20261009005251_commercial_phase02_pipeline.sql", "utf8");
assert.equal(sql.includes("attribution_claims"), false);
assert.equal(sql.includes("opportunity_stage_events"), true);
assert.equal(sql.includes("audit_events"), true);
assert.equal(sql.includes("won_requires_business"), true);

console.log("stages.verify: ok");
