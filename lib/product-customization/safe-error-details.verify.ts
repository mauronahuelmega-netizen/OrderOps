/**
 * Fixture for safe error serialization (D1 schema runtime fix diagnostics).
 * Run: npx tsx lib/product-customization/safe-error-details.verify.ts
 */

import assert from "node:assert/strict";
import { getSafeErrorDetails } from "@/lib/product-customization/safe-error-details";

const fromError = getSafeErrorDetails(new Error("boom"));
assert.equal(fromError.message, "boom");
assert.equal(fromError.name, "Error");

const fromPostgrest = getSafeErrorDetails({
  message: "column upsell_groups.placement does not exist",
  code: "42703",
  details: null,
  hint: null
});
assert.equal(fromPostgrest.message, "column upsell_groups.placement does not exist");
assert.equal(fromPostgrest.code, "42703");

const fromString = getSafeErrorDetails("plain");
assert.equal(fromString.message, "plain");

const fromNull = getSafeErrorDetails(null);
assert.equal(fromNull.message, "Unknown error");

console.log("ALL_PASS safe-error-details.verify.ts");
