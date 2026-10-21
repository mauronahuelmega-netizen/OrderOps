import { normalizeArPhone, normalizeCommercialName } from "@/lib/commercial/crm/normalize";

export type DedupClassification = "high" | "probable" | "none";

export function classifyDedup(input: {
  leftName: string;
  rightName: string;
  leftPhone: string;
  rightPhone: string;
  leftFiscalId?: string | null;
  rightFiscalId?: string | null;
}): DedupClassification {
  const leftName = normalizeCommercialName(input.leftName);
  const rightName = normalizeCommercialName(input.rightName);
  const leftPhone = normalizeArPhone(input.leftPhone);
  const rightPhone = normalizeArPhone(input.rightPhone);
  const nameMatches = leftName !== null && leftName === rightName;
  const phoneMatches = leftPhone !== null && leftPhone === rightPhone;
  const leftFiscal = input.leftFiscalId?.trim() || null;
  const rightFiscal = input.rightFiscalId?.trim() || null;
  const fiscalConflict = leftFiscal !== null && rightFiscal !== null && leftFiscal !== rightFiscal;

  if (nameMatches && phoneMatches && !fiscalConflict) return "high";
  if (nameMatches || phoneMatches) return "probable";
  return "none";
}
