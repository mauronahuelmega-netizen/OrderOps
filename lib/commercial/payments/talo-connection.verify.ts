import assert from "node:assert/strict";

import { aliasPrefixState, readTaloSdkConnection } from "@/lib/commercial/payments/talo-connection";

const secret = "sandbox-value-not-for-logs";
const blocked = readTaloSdkConnection({});
assert.equal(blocked.status, "BLOCKED");
if (blocked.status === "BLOCKED") {
  assert.deepEqual(blocked.missing, ["TALO_CLIENT_ID", "TALO_CLIENT_SECRET", "TALO_USER_ID"]);
}
assert.equal(JSON.stringify(blocked).includes(secret), false);

const ready = readTaloSdkConnection({
  TALO_CLIENT_ID: secret,
  TALO_CLIENT_SECRET: secret,
  TALO_USER_ID: secret
});
assert.equal(ready.status, "ready");
assert.equal(JSON.stringify(ready).includes(secret), false);
assert.equal(aliasPrefixState(" "), "unset");
assert.equal(aliasPrefixState("ab"), "set");

console.log("talo-connection.verify: ok");
