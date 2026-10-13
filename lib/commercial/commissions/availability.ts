export type AvailabilityInput = {
  rightKind: "setup" | "recurring";
  postedAt: Date;
  asOf: Date;
  onboardingCompleted: boolean;
  releaseException: boolean;
  holdUnpaid: boolean;
};

export type AvailabilityDecision = {
  status: "pending" | "available" | "held";
  availableAt: Date;
};

const WINDOW_MS = 15 * 24 * 60 * 60 * 1000;

export function decideCommissionAvailability(input: AvailabilityInput): AvailabilityDecision {
  const availableAt = new Date(input.postedAt.getTime() + WINDOW_MS);
  if (input.holdUnpaid) {
    return { status: "held", availableAt };
  }
  if (input.releaseException && input.rightKind === "setup") {
    return { status: "available", availableAt };
  }
  if (input.asOf.getTime() < availableAt.getTime()) {
    return { status: "pending", availableAt };
  }
  if (input.rightKind === "recurring" || input.onboardingCompleted) {
    return { status: "available", availableAt };
  }
  return { status: "pending", availableAt };
}
