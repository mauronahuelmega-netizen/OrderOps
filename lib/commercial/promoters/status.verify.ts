import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { assertCanOperate, promoterStatusTransitionAllowed } from "@/lib/commercial/promoters/status";

assert.equal(assertCanOperate("registered"), false);
assert.equal(assertCanOperate("pending_verification"), false);
assert.equal(assertCanOperate("suspended"), false);
assert.equal(assertCanOperate("separated"), false);
assert.equal(assertCanOperate("active"), true);
assert.equal(promoterStatusTransitionAllowed("registered", "pending_verification"), true);
assert.equal(promoterStatusTransitionAllowed("pending_verification", "active"), false);
assert.equal(promoterStatusTransitionAllowed("active", "suspended"), true);
assert.equal(promoterStatusTransitionAllowed("suspended", "separated"), false);
assert.equal(promoterStatusTransitionAllowed("registered", "active"), false);

const sql = readFileSync("supabase/migrations/20261009015312_commercial_phase03_promoters.sql", "utf8");
assert.equal(sql.includes("profiles.role"), false);
assert.equal(sql.includes("verification_incomplete"), true);
const foundations = readFileSync("supabase/migrations/20261008215314_commercial_phase01_foundations.sql", "utf8");
assert.equal(foundations.includes("promoter_business_member_forbidden"), true);

console.log("promoter-status.verify: ok");
