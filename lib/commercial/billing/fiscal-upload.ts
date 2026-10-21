export const FISCAL_DOCUMENT_MAX_BYTES = 5 * 1024 * 1024;
export const FISCAL_DOCUMENT_KINDS = ["invoice", "credit_note", "receipt"] as const;

export type FiscalDocumentKind = (typeof FISCAL_DOCUMENT_KINDS)[number];

export type FiscalUploadInput = {
  businessId: string;
  kind: FiscalDocumentKind;
  documentNumber: string;
  issuedOn: string;
  amountCents: number;
  collectionId: string | null;
  storagePath: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d];

// Mirrors business_fiscal_documents_path_chk: fiscal/{business_id}/{segment}.pdf
export function fiscalStoragePath(businessId: string, documentNumber: string, nonce: string): string {
  const slug = documentNumber
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `fiscal/${businessId}/${slug === "" ? "doc" : slug}-${nonce}.pdf`;
}

export function isPdf(bytes: Uint8Array): boolean {
  return PDF_MAGIC.every((value, index) => bytes[index] === value);
}

export function parseFiscalUpload(
  fields: { businessId: string; kind: string; documentNumber: string; issuedOn: string; amountCents: number | null; collectionId: string },
  file: { size: number; bytes: Uint8Array } | null,
  nonce: string
): { ok: true; input: FiscalUploadInput } | { ok: false; code: string } {
  const documentNumber = fields.documentNumber.trim();
  const collectionId = fields.collectionId.trim();
  if (
    !UUID.test(fields.businessId) ||
    !(FISCAL_DOCUMENT_KINDS as readonly string[]).includes(fields.kind) ||
    documentNumber === "" ||
    documentNumber.length > 60 ||
    !DAY.test(fields.issuedOn) ||
    fields.amountCents === null ||
    fields.amountCents <= 0 ||
    (collectionId !== "" && !UUID.test(collectionId))
  ) {
    return { ok: false, code: "validation" };
  }
  if (!file || file.size === 0 || file.size > FISCAL_DOCUMENT_MAX_BYTES || !isPdf(file.bytes)) {
    return { ok: false, code: "file_invalid" };
  }
  return {
    ok: true,
    input: {
      businessId: fields.businessId,
      kind: fields.kind as FiscalDocumentKind,
      documentNumber,
      issuedOn: fields.issuedOn,
      amountCents: fields.amountCents,
      collectionId: collectionId === "" ? null : collectionId,
      storagePath: fiscalStoragePath(fields.businessId, documentNumber, nonce)
    }
  };
}
