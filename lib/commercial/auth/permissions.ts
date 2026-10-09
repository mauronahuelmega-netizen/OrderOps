export type InternalRole = "superadmin" | "commercial" | "finance" | "support";

export type CommercialPermission =
  | "crm.read"
  | "crm.write"
  | "opportunity.win"
  | "opportunity.lose"
  | "attribution.confirm"
  | "dispute.decide"
  | "promoter.review"
  | "promoter.activate"
  | "promoter.separate"
  | "onboarding.manage"
  | "onboarding.exception"
  | "collection.write"
  | "commission.release_exception"
  | "settlement.prepare"
  | "settlement.approve"
  | "payment.record"
  | "program.write"
  | "role.grant"
  | "audit.read_all"
  | "privacy.resolve"
  | "bank.read_any";

const INTERNAL_ROLES = new Set<InternalRole>(["superadmin", "commercial", "finance", "support"]);

const GRANTS: Record<CommercialPermission, readonly InternalRole[]> = {
  "crm.read": ["superadmin", "commercial", "support"],
  "crm.write": ["superadmin", "commercial"],
  "opportunity.win": ["superadmin"],
  "opportunity.lose": ["superadmin", "commercial"],
  "attribution.confirm": ["superadmin"],
  "dispute.decide": ["superadmin"],
  "promoter.review": ["superadmin", "commercial"],
  "promoter.activate": ["superadmin"],
  "promoter.separate": ["superadmin"],
  "onboarding.manage": ["superadmin", "commercial", "support"],
  "onboarding.exception": ["superadmin"],
  "collection.write": ["finance"],
  "commission.release_exception": ["superadmin"],
  "settlement.prepare": ["finance"],
  "settlement.approve": ["superadmin", "finance"],
  "payment.record": ["finance"],
  "program.write": ["superadmin"],
  "role.grant": ["superadmin"],
  "audit.read_all": ["superadmin", "finance"],
  "privacy.resolve": ["superadmin"],
  "bank.read_any": ["superadmin", "finance"]
};

export type CommercialErrorCode = "ok" | "forbidden" | "sod_violation";

export type SodResult = {
  allowed: boolean;
  commercialErrorCode: CommercialErrorCode;
};

export function isInternalRole(value: string): value is InternalRole {
  return INTERNAL_ROLES.has(value as InternalRole);
}

export function commercialPermissions(): CommercialPermission[] {
  return Object.keys(GRANTS) as CommercialPermission[];
}

export function rolesGranting(code: CommercialPermission): readonly InternalRole[] {
  return GRANTS[code];
}

export function hasCommercialPermission(roles: readonly InternalRole[], code: CommercialPermission) {
  const granted = GRANTS[code];
  return roles.some((role) => granted.includes(role));
}

function sodExceptionApplies(roles: readonly InternalRole[], sodException: boolean) {
  return sodException && roles.includes("superadmin");
}

export function settlementApprovalAllowed(input: {
  preparerAccountId: string;
  approverAccountId: string;
  approverRoles: readonly InternalRole[];
  sodException: boolean;
}): SodResult {
  if (!hasCommercialPermission(input.approverRoles, "settlement.approve")) {
    return { allowed: false, commercialErrorCode: "forbidden" };
  }
  if (input.preparerAccountId === input.approverAccountId && !sodExceptionApplies(input.approverRoles, input.sodException)) {
    return { allowed: false, commercialErrorCode: "sod_violation" };
  }
  return { allowed: true, commercialErrorCode: "ok" };
}

export function paymentRecordingAllowed(input: {
  approverAccountId: string;
  recorderAccountId: string;
  recorderRoles: readonly InternalRole[];
  sodException: boolean;
}): SodResult {
  if (!hasCommercialPermission(input.recorderRoles, "payment.record")) {
    return { allowed: false, commercialErrorCode: "forbidden" };
  }
  if (input.approverAccountId === input.recorderAccountId && !sodExceptionApplies(input.recorderRoles, input.sodException)) {
    return { allowed: false, commercialErrorCode: "sod_violation" };
  }
  return { allowed: true, commercialErrorCode: "ok" };
}
