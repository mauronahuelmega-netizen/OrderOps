import assert from "node:assert/strict";

import { activationAmountArs } from "@/lib/commercial/payments/talo-sandbox-transfer";
import { TALO_SANDBOX_API_ORIGIN } from "@/lib/commercial/payments/sandbox-env";

assert.equal(TALO_SANDBOX_API_ORIGIN, "https://sandbox-api.talo.com.ar");
assert.equal(activationAmountArs(), 290000);

console.log("talo-sandbox-transfer.verify: ok");
