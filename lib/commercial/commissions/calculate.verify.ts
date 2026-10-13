import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { nominalCommissionCents } from "@/lib/commercial/commissions/calculate";

const founder = { setupCommissionCents: BigInt(12000000), recurringBps: BigInt(4000) };

assert.equal(nominalCommissionCents("setup", BigInt(29000000), founder), BigInt(12000000));
assert.equal(nominalCommissionCents("recurring", BigInt(5500000), founder), BigInt(2200000));
assert.equal(nominalCommissionCents("recurring", BigInt(1), founder), BigInt(0));
assert.equal(nominalCommissionCents("setup", null, founder), null);
assert.equal(nominalCommissionCents("recurring", null, founder), null);
assert.throws(() => nominalCommissionCents("recurring", BigInt(-1), founder), /invalid_amount/);

const source = readFileSync("lib/commercial/commissions/calculate.ts", "utf8");
assert.equal(source.includes("lib/orders"), false);
assert.equal(source.includes("supabase"), false);
assert.equal(source.includes("Number("), false);
assert.equal(source.includes("Math."), false);

const collections = readFileSync(
  "supabase/migrations/20261012030000_commercial_phase05_collections.sql",
  "utf8"
);
assert.equal(collections.includes("accrue_commissions_for_collection"), false);

const accrual = readFileSync(
  "supabase/migrations/20261013010000_commercial_phase05_commissions.sql",
  "utf8"
);
assert.equal(accrual.includes("eligible_base_cents * v_terms.recurring_bps / 10000"), true);
assert.equal(accrual.includes("v_terms.setup_commission_cents"), true);
assert.equal(accrual.includes("'pending'"), true);

console.log("calculate.verify: ok");
