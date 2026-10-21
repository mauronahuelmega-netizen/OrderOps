export const PROMOTER_STATUSES = [
  "registered",
  "pending_verification",
  "active",
  "suspended",
  "separated"
] as const;

export type PromoterStatus = (typeof PROMOTER_STATUSES)[number];

export function isPromoterStatus(value: string): value is PromoterStatus {
  return (PROMOTER_STATUSES as readonly string[]).includes(value);
}

export function assertCanOperate(status: PromoterStatus): boolean {
  return status === "active";
}

export function promoterStatusTransitionAllowed(from: PromoterStatus, to: PromoterStatus): boolean {
  if (to === "active") return false;
  if (from === "registered" && to === "pending_verification") return true;
  if (from === "active" && to === "suspended") return true;
  return false;
}
