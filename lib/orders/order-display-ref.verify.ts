/**
 * Verify order display reference generation with order_code preference and UUID fallback.
 *
 * Run: npx tsx lib/orders/order-display-ref.verify.ts
 */
import assert from "node:assert/strict";

import {
  buildOrderDisplayRef,
  buildOrderDisplayRefFromOrder,
  normalizeOrderCode
} from "@/lib/orders/display-ref";

const TEST_UUID = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
const LEGACY_REF = "D479";

// Case 1 — existing UUID string behavior unchanged
assert.equal(buildOrderDisplayRef(TEST_UUID), LEGACY_REF);
assert.equal(buildOrderDisplayRef("e6e2a819-3018-48f9-b9d9-4025b4847dc3"), "7DC3");

// Case 2 — normalizeOrderCode accepts valid 6-char reduced alphabet codes
assert.equal(normalizeOrderCode("K7M4Q9"), "K7M4Q9");
assert.equal(normalizeOrderCode("  k7m4q9  "), "K7M4Q9");
assert.equal(normalizeOrderCode("234567"), "234567");
assert.equal(normalizeOrderCode("89ABCDEFGHJKMNPQRSTUVWXYZ".slice(0, 6)), "89ABCD");

// Case 3 — normalizeOrderCode rejects invalid codes (ambiguous chars, invalid lengths, special chars)
assert.equal(normalizeOrderCode(null), null);
assert.equal(normalizeOrderCode(undefined), null);
assert.equal(normalizeOrderCode(""), null);
assert.equal(normalizeOrderCode("K7M4Q"), null); // 5 chars
assert.equal(normalizeOrderCode("K7M4Q99"), null); // 7 chars
assert.equal(normalizeOrderCode("K7M4Q0"), null); // '0' is ambiguous / not in reduced alphabet
assert.equal(normalizeOrderCode("K7M4Q1"), null); // '1' is ambiguous / not in reduced alphabet
assert.equal(normalizeOrderCode("K7M4QI"), null); // 'I' is ambiguous / not in reduced alphabet
assert.equal(normalizeOrderCode("K7M4QL"), null); // 'L' is ambiguous / not in reduced alphabet
assert.equal(normalizeOrderCode("K7M4QO"), null); // 'O' is ambiguous / not in reduced alphabet
assert.equal(normalizeOrderCode("K7-4Q9"), null);

// Case 4 — order-aware helper prefers valid order_code
assert.equal(buildOrderDisplayRef({ id: TEST_UUID, order_code: "K7M4Q9" }), "K7M4Q9");
assert.equal(buildOrderDisplayRefFromOrder({ id: TEST_UUID, order_code: "K7M4Q9" }), "K7M4Q9");

// Case 5 — lowercase order_code is normalized
assert.equal(buildOrderDisplayRef({ id: TEST_UUID, order_code: "k7m4q9" }), "K7M4Q9");
assert.equal(buildOrderDisplayRef({ id: TEST_UUID, order_code: "  k7m4q9  " }), "K7M4Q9");

// Case 6 — invalid/missing order_code falls back to legacy UUID ref
assert.equal(buildOrderDisplayRef({ id: TEST_UUID, order_code: null }), LEGACY_REF);
assert.equal(buildOrderDisplayRef({ id: TEST_UUID, order_code: undefined }), LEGACY_REF);
assert.equal(buildOrderDisplayRef({ id: TEST_UUID, order_code: "" }), LEGACY_REF);
assert.equal(buildOrderDisplayRef({ id: TEST_UUID, order_code: "INVALID_CODE" }), LEGACY_REF);
assert.equal(buildOrderDisplayRef({ id: TEST_UUID, order_code: "K7M4Q0" }), LEGACY_REF);

// Case 7 — helper returns raw string without prepending '#' (prevents double hash in UI)
assert.equal(buildOrderDisplayRef({ id: TEST_UUID, order_code: "K7M4Q9" }).startsWith("#"), false);
assert.equal(buildOrderDisplayRef(TEST_UUID).startsWith("#"), false);

console.log("order-display-ref.verify.ts: PASS");
