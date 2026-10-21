import type { CommercialPermission, InternalRole } from "./permissions";
import { hasCommercialPermission, isInternalRole } from "./permissions";

export type PlatformKind = "internal" | "promoter";

export type CommercialPrincipal = {
  accountId: string;
  userId: string;
  kind: PlatformKind;
  roles: readonly InternalRole[];
  disabled: boolean;
};

export function buildCommercialPrincipal(input: {
  accountId: string;
  userId: string;
  kind: PlatformKind;
  roles: readonly string[];
  disabledAt: string | null;
}): CommercialPrincipal {
  const roles = input.kind === "internal" ? input.roles.filter(isInternalRole) : [];
  return {
    accountId: input.accountId,
    userId: input.userId,
    kind: input.kind,
    roles,
    disabled: input.disabledAt !== null
  };
}

export function principalHasPermission(principal: CommercialPrincipal, code: CommercialPermission) {
  if (principal.disabled || principal.kind !== "internal") return false;
  return hasCommercialPermission(principal.roles, code);
}
