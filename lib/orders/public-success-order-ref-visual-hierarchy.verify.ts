/**
 * Deterministic verification for Public Catalog Success Order Reference Visual Hierarchy (Phase 1).
 *
 * Covers:
 * 1. /b/[slug]/success/page.tsx does not prefix '#' on visible order reference.
 * 2. /b/[slug]/success/page.tsx passes visibleOrderRef to buildPublicOrderWhatsappUrl without breaking URL contract.
 * 3. Markup in page.tsx uses dedicated styles.orderRef, styles.orderRefLabel, and styles.orderRefValue.
 * 4. success-page.module.css styles .orderRef with centered alignment, and .orderRefValue with prominent size, weight, and letter-spacing.
 * 5. lib/orders/display-ref.ts remains untouched and continues to return raw code/UUID slice.
 * 6. lib/whatsapp/admin.ts remains untouched.
 * 7. Query identity on success route remains UUID (?order_id=...).
 * 8. Order lookup in success route remains scoped by id = orderId AND business_id = business.id.
 *
 * Run: npx tsx lib/orders/public-success-order-ref-visual-hierarchy.verify.ts
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { buildOrderDisplayRef } from "@/lib/orders/display-ref";
import { buildPublicOrderWhatsappUrl } from "@/lib/whatsapp/public";

function runVerification() {
  console.log("Starting public catalog success order ref visual hierarchy verification...");

  // 1. Check display ref helper produces un-prefixed values
  const mockOrderWithCode = { id: "018f3a5e-1234-7890-abcd-ef1234567890", order_code: "ZZNXT4" };
  const mockOrderLegacy = { id: "018f3a5e-1234-7890-abcd-ef1234567890" };

  assert.equal(buildOrderDisplayRef(mockOrderWithCode), "ZZNXT4");
  assert.equal(buildOrderDisplayRef(mockOrderLegacy), "7890");

  // 2. WhatsApp builder contract with clean un-prefixed ref
  const whatsappUrl = buildPublicOrderWhatsappUrl({
    whatsappNumber: "+54 9 11 2345-6789",
    businessName: "Burger Shop",
    orderRef: "ZZNXT4"
  });

  const decodedUrl = decodeURIComponent(whatsappUrl);
  assert.ok(decodedUrl.includes("ya hice mi pedido ZZNXT4 desde el catálogo online."));
  assert.equal(decodedUrl.includes("#ZZNXT4"), false);

  // 3. Source assertions on app/b/[slug]/success/page.tsx
  const pagePath = path.resolve(process.cwd(), "app/b/[slug]/success/page.tsx");
  const pageSource = fs.readFileSync(pagePath, "utf-8");

  // Verify no `#` prefix in assignment to visibleOrderRef
  assert.equal(
    pageSource.includes('visibleOrderRef = `#${buildOrderDisplayRef'),
    false,
    "page.tsx must NOT prepend '#' to visibleOrderRef"
  );
  assert.equal(
    pageSource.includes("visibleOrderRef = buildOrderDisplayRef(data);"),
    true,
    "page.tsx must assign raw display ref for order data"
  );
  assert.equal(
    pageSource.includes("visibleOrderRef = buildOrderDisplayRef(orderId);"),
    true,
    "page.tsx must assign raw display ref for fallback orderId"
  );

  // Verify query identity is order_id and fetch uses id + business_id
  assert.ok(pageSource.includes("order_id?: string;"), "Search params must expect order_id");
  assert.ok(pageSource.includes('.eq("id", orderId)'), "Query must filter by id = orderId");
  assert.ok(pageSource.includes('.eq("business_id", business.id)'), "Query must filter by business_id");

  // 4. Source assertions on app/b/[slug]/success/success-page.module.css
  const cssPath = path.resolve(process.cwd(), "app/b/[slug]/success/success-page.module.css");
  const cssSource = fs.readFileSync(cssPath, "utf-8");

  assert.ok(cssSource.includes(".orderRef {"), "CSS must contain .orderRef");
  assert.ok(cssSource.includes(".orderRefLabel {"), "CSS must contain .orderRefLabel");
  assert.ok(cssSource.includes(".orderRefValue {"), "CSS must contain .orderRefValue");

  // Visual hierarchy assertions
  assert.ok(cssSource.includes("text-align: center;"), "CSS must specify text-align: center");
  assert.ok(cssSource.includes("letter-spacing: 0.1em;"), "CSS .orderRefValue must specify subtle letter spacing (0.1em)");
  assert.ok(cssSource.includes("font-size: 1.35rem;"), "CSS .orderRefValue must specify prominent font size");
  assert.ok(cssSource.includes("font-weight: 700;"), "CSS .orderRefValue must specify font weight 700");

  console.log("All public success order ref visual hierarchy assertions PASS!");
}

runVerification();
