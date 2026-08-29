/**
 * Pure verify: display-only Argentine phone formatting (known BA patterns).
 *
 * Run: npx tsx lib/orders/phone-display.verify.ts
 */
import assert from "node:assert/strict";

import { formatAdminPhoneDisplay } from "@/lib/orders/presenter";

const cases: Array<{ raw: string; display: string }> = [
  { raw: "+5491159126321", display: "+54 9 11 5912-6321" },
  { raw: "5491159126321", display: "+54 9 11 5912-6321" },
  { raw: "+54 9 11 5912-6321", display: "+54 9 11 5912-6321" },
  { raw: "+541145678901", display: "+54 11 4567-8901" },
  { raw: "1159126321", display: "11 5912-6321" },
  // Unknown / non-BA: leave raw (no invented area codes)
  { raw: "+5492615123456", display: "+5492615123456" },
  { raw: "Sin telefono", display: "Sin telefono" },
  { raw: "", display: "" }
];

for (const row of cases) {
  assert.equal(
    formatAdminPhoneDisplay(row.raw),
    row.display,
    `formatAdminPhoneDisplay(${JSON.stringify(row.raw)})`
  );
}

console.log("phone-display.verify.ts: PASS");
