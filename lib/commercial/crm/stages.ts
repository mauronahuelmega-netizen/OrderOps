export const opportunityStages = [
  "new",
  "contacting",
  "qualified",
  "demo_scheduled",
  "demo_done",
  "follow_up",
  "won",
  "lost"
] as const;

export type OpportunityStage = (typeof opportunityStages)[number];

export type StageDecision = {
  ok: boolean;
  commercialErrorCode: "ok" | "won_requires_business" | "lost_reason_required" | "open_tasks_remaining" | "validation";
};

export function decideStageTransition(input: {
  toStage: string;
  reason: string | null;
  openTaskCount: number;
}): StageDecision {
  if (input.toStage === "won") {
    return { ok: false, commercialErrorCode: "won_requires_business" };
  }
  if (!opportunityStages.includes(input.toStage as OpportunityStage)) {
    return { ok: false, commercialErrorCode: "validation" };
  }
  if (input.toStage === "lost" && (input.reason === null || input.reason.trim().length === 0)) {
    return { ok: false, commercialErrorCode: "lost_reason_required" };
  }
  if (input.toStage === "lost" && input.openTaskCount > 0) {
    return { ok: false, commercialErrorCode: "open_tasks_remaining" };
  }
  return { ok: true, commercialErrorCode: "ok" };
}
