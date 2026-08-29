/**
 * Verify public catalog success WhatsApp business-first message builder.
 *
 * Run: npx tsx lib/whatsapp/public.verify.ts
 */
import assert from "node:assert/strict";

import {
  buildPublicBusinessInquiryWhatsappUrl,
  buildPublicOrderWhatsappUrl
} from "@/lib/whatsapp/public";

// Case 1 — Builds business-first message exactly matching locked copy
const url1 = buildPublicOrderWhatsappUrl({
  whatsappNumber: "+54 9 11 1234-5678",
  businessName: "La Burguesía",
  orderRef: "EU86T4"
});

const decoded1 = decodeURIComponent(url1.split("text=")[1] ?? "");
const expectedMessage1 =
  "Hola La Burguesía, ya hice mi pedido EU86T4 desde el catálogo online.\nTe escribo para confirmarlo.";

assert.equal(decoded1, expectedMessage1);
assert.ok(url1.startsWith("https://wa.me/5491112345678?text="));

// Case 2 — Strips leading '#' from orderRef
const url2 = buildPublicOrderWhatsappUrl({
  whatsappNumber: "5491112345678",
  businessName: "La Burguesía",
  orderRef: "#EU86T4"
});

const decoded2 = decodeURIComponent(url2.split("text=")[1] ?? "");
assert.equal(decoded2, expectedMessage1);
assert.ok(decoded2.includes("pedido EU86T4"));
assert.equal(decoded2.includes("#EU86T4"), false);

// Case 3 — Does not mention platform 'OrderOps'
assert.equal(decoded1.includes("OrderOps"), false);
assert.equal(decoded2.includes("OrderOps"), false);

// Case 4 — Does not mention 'WhatsApp' in body text
assert.equal(decoded1.includes("WhatsApp"), false);
assert.equal(decoded2.includes("WhatsApp"), false);

// Case 5 — Preserves valid phone normalization (strips non-digits)
const url5 = buildPublicOrderWhatsappUrl({
  whatsappNumber: "  +54 (911) 9876-5432  ",
  businessName: "Burger Club",
  orderRef: "K7M4Q9"
});
assert.ok(url5.startsWith("https://wa.me/5491198765432?text="));

// Case 6 — Fallback when businessName is omitted
const url6 = buildPublicOrderWhatsappUrl({
  whatsappNumber: "5491112345678",
  orderRef: "EU86T4"
});
const decoded6 = decodeURIComponent(url6.split("text=")[1] ?? "");
assert.equal(
  decoded6,
  "Hola, ya hice mi pedido EU86T4 desde el catálogo online.\nTe escribo para confirmarlo."
);

// Case 7 — Fallback when orderRef/orderId is omitted
const url7 = buildPublicOrderWhatsappUrl({
  whatsappNumber: "5491112345678",
  businessName: "La Burguesía"
});
const decoded7 = decodeURIComponent(url7.split("text=")[1] ?? "");
assert.equal(
  decoded7,
  "Hola La Burguesía, ya hice mi pedido desde el catálogo online.\nTe escribo para confirmarlo."
);

// Case 8 — Business inquiry url remains intact
const inquiryUrl = buildPublicBusinessInquiryWhatsappUrl({
  businessName: "La Burguesía",
  whatsappNumber: "+54 9 11 1234-5678"
});
assert.ok(inquiryUrl?.startsWith("https://wa.me/5491112345678?text="));
assert.equal(
  decodeURIComponent(inquiryUrl?.split("text=")[1] ?? ""),
  "Hola, quiero consultar por el catálogo de La Burguesía."
);

console.log("public.verify.ts: PASS");
