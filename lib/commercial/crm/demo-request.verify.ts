import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { validateDemoRequest } from "@/lib/commercial/crm/demo-request";

assert.equal(
  validateDemoRequest({
    contactName: "Ana",
    tradeName: "Pan Norte",
    whatsapp: "11 5555-0101",
    tradeCategory: "",
    email: "",
    needs: ""
  }),
  "El rubro es obligatorio."
);

const sql = readFileSync("supabase/migrations/20261009005428_commercial_phase02_demo.sql", "utf8");
assert.equal(sql.includes("attribution_claims"), false);
assert.equal(sql.includes("demo.submitted"), true);
assert.equal(sql.includes("p_ip_hash"), true);
const fix = readFileSync("supabase/migrations/20261009013318_commercial_phase02_audit_fix.sql", "utf8");
assert.equal(fix.includes("'unavailable'"), true);
assert.equal(fix.includes("- 'submission_id' - 'business_id' - 'opportunity_id'"), true);
const action = readFileSync("app/demo/actions.ts", "utf8");
assert.equal(action.includes("x-forwarded-for"), false);
assert.equal(action.includes("prepareDemoRateLimitHash"), true);
assert.equal(action.includes("createSupabaseServiceClient"), true);

console.log("demo-request.verify: ok");
