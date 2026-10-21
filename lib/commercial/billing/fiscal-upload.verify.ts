import assert from "node:assert/strict";

import { FISCAL_DOCUMENT_MAX_BYTES, fiscalStoragePath, isPdf, parseFiscalUpload } from "@/lib/commercial/billing/fiscal-upload";

const business = "70707070-7070-4070-8070-000000000101";
const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
const fields = {
  businessId: business,
  kind: "invoice",
  documentNumber: "A-0001-00000001",
  issuedOn: "2026-10-20",
  amountCents: 29_000_000,
  collectionId: ""
};
// Same pattern as business_fiscal_documents_path_chk.
const sqlPath = new RegExp(`^fiscal/${business}/[A-Za-z0-9][A-Za-z0-9_-]{0,100}\\.pdf$`);

assert.equal(isPdf(pdf), true);
assert.equal(isPdf(new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03])), false);

const ok = parseFiscalUpload(fields, { size: pdf.length, bytes: pdf }, "a1b2c3d4e5f6");
assert.equal(ok.ok, true);
if (ok.ok) {
  assert.equal(ok.input.storagePath, `fiscal/${business}/a-0001-00000001-a1b2c3d4e5f6.pdf`);
  assert.match(ok.input.storagePath, sqlPath);
  assert.equal(ok.input.collectionId, null);
}

for (const number of ["../../etc/passwd", "---", "Ñandú 2026 / 1", "x".repeat(60)]) {
  assert.match(fiscalStoragePath(business, number, "a1b2c3d4e5f6"), sqlPath, number);
}

assert.deepEqual(parseFiscalUpload({ ...fields, businessId: "not-a-uuid" }, { size: 8, bytes: pdf }, "n"), { ok: false, code: "validation" });
assert.deepEqual(parseFiscalUpload({ ...fields, kind: "factura" }, { size: 8, bytes: pdf }, "n"), { ok: false, code: "validation" });
assert.deepEqual(parseFiscalUpload({ ...fields, amountCents: null }, { size: 8, bytes: pdf }, "n"), { ok: false, code: "validation" });
assert.deepEqual(parseFiscalUpload({ ...fields, amountCents: 0 }, { size: 8, bytes: pdf }, "n"), { ok: false, code: "validation" });
assert.deepEqual(parseFiscalUpload({ ...fields, issuedOn: "20/10/2026" }, { size: 8, bytes: pdf }, "n"), { ok: false, code: "validation" });
assert.deepEqual(parseFiscalUpload({ ...fields, collectionId: "x" }, { size: 8, bytes: pdf }, "n"), { ok: false, code: "validation" });
assert.deepEqual(parseFiscalUpload(fields, null, "n"), { ok: false, code: "file_invalid" });
assert.deepEqual(parseFiscalUpload(fields, { size: FISCAL_DOCUMENT_MAX_BYTES + 1, bytes: pdf }, "n"), { ok: false, code: "file_invalid" });
assert.deepEqual(
  parseFiscalUpload(fields, { size: 5, bytes: new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03]) }, "n"),
  { ok: false, code: "file_invalid" }
);

console.log("fiscal-upload.verify: PASS");
