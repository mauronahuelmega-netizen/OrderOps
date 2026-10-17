import assert from "node:assert/strict";

import { sameBankIdentity, taloQaCustomer } from "@/lib/commercial/payments/talo-persistent-cvu";
import { TALO_SANDBOX_API_ORIGIN } from "@/lib/commercial/payments/sandbox-env";

assert.equal(TALO_SANDBOX_API_ORIGIN, "https://sandbox-api.talo.com.ar");
assert.equal(taloQaCustomer.customerId, "orderops-qa-burger-house");
assert.equal(taloQaCustomer.name, "Burger House QA");
assert.equal(
  sameBankIdentity(
    { cvu: "0000000000000000000001", alias: "prefix.burgerqa" },
    { cvu: "0000000000000000000001", alias: "prefix.burgerqa" }
  ),
  true
);
assert.equal(
  sameBankIdentity(
    { cvu: "0000000000000000000001", alias: "prefix.burgerqa" },
    { cvu: "0000000000000000000002", alias: "prefix.burgerqa" }
  ),
  false
);

console.log("talo-persistent-cvu.verify: ok");
