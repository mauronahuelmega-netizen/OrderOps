export type NominalRightKind = "setup" | "recurring";

export type CommissionSnapshot = {
  setupCommissionCents: bigint;
  recurringBps: bigint;
};

/** Integer cents. A null eligible base means the collection is not nominal, so no right is born. */
export function nominalCommissionCents(
  kind: NominalRightKind,
  eligibleBaseCents: bigint | null,
  snapshot: CommissionSnapshot
): bigint | null {
  if (eligibleBaseCents === null) {
    return null;
  }
  const zero = BigInt(0);
  if (
    eligibleBaseCents < zero ||
    snapshot.setupCommissionCents < zero ||
    snapshot.recurringBps < zero
  ) {
    throw new Error("invalid_amount");
  }
  if (kind === "setup") {
    return snapshot.setupCommissionCents;
  }
  return (eligibleBaseCents * snapshot.recurringBps) / BigInt(10000);
}
