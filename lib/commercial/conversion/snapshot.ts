export type FrozenProgramTerms = {
  programId: string;
  programCode: string;
  programVersion: number;
  setupPriceCents: number;
  monthlyPriceCents: number;
  setupCommissionCents: number;
  recurringBps: number;
  maxRecurringSlots: number;
  attributionId: string;
  wonBusinessId: string;
};

export function freezeProgramTerms(input: FrozenProgramTerms): FrozenProgramTerms {
  return {
    programId: input.programId,
    programCode: input.programCode,
    programVersion: input.programVersion,
    setupPriceCents: input.setupPriceCents,
    monthlyPriceCents: input.monthlyPriceCents,
    setupCommissionCents: input.setupCommissionCents,
    recurringBps: input.recurringBps,
    maxRecurringSlots: input.maxRecurringSlots,
    attributionId: input.attributionId,
    wonBusinessId: input.wonBusinessId
  };
}
