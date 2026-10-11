import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { freezeProgramTerms } from "@/lib/commercial/conversion/snapshot";

const source = {
  programId: "program-1",
  programCode: "founder",
  programVersion: 1,
  setupPriceCents: 29000000,
  monthlyPriceCents: 5500000,
  setupCommissionCents: 12000000,
  recurringBps: 4000,
  maxRecurringSlots: 12,
  attributionId: "attr-1",
  wonBusinessId: "business-1"
};
const frozen = freezeProgramTerms(source);
source.programVersion = 2;
source.setupPriceCents = 1;
assert.equal(frozen.programVersion, 1);
assert.equal(frozen.setupPriceCents, 29000000);
assert.equal(frozen.setupCommissionCents, 12000000);

const sql = readFileSync("supabase/migrations/20261011020000_commercial_phase04_conversion.sql", "utf8");
assert.equal(sql.includes("promoter_commissions"), false);
assert.equal(sql.includes("conversion.terms_frozen"), true);
assert.equal(sql.includes("terms_immutable"), true);
assert.equal(sql.includes("opportunity.win"), true);

console.log("conversion-snapshot.verify: ok");
