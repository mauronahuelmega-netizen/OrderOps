export type AppAreaId = "admin" | "promoter" | "commercial" | "superadmin";

/** Scopes inside the shared `/commercial` workspace (not separate login areas). */
export type CommercialWorkspaceScope = "board" | "finance";

export type AuthorizedArea = {
  id: AppAreaId;
  label: string;
  href: string;
  /** Set when id === "commercial": which modules the user may deep-link into. */
  commercialScopes?: readonly CommercialWorkspaceScope[];
};

export type AccessFacts = {
  hasBusinessAdmin: boolean;
  isProfileSuperAdmin: boolean;
  commercialRoles: readonly string[];
  isPromoter: boolean;
};

/**
 * Enumerate authorized app areas from already-resolved access facts.
 * Pure: never calls guards that redirect or throw forbidden().
 *
 * Comercial and Finanzas share one login area (`commercial` → `/commercial`).
 * Module visibility stays role-scoped via `commercialScopes` and route guards.
 * Finance never implies platform superadmin (`profiles.role === "super_admin"`).
 */
export function areasFromAccessFacts(facts: AccessFacts): AuthorizedArea[] {
  const areas: AuthorizedArea[] = [];
  const roles = facts.commercialRoles;

  if (facts.hasBusinessAdmin) {
    areas.push({
      id: "admin",
      label: "Administración del negocio",
      href: "/admin/dashboard"
    });
  }

  if (facts.isPromoter) {
    areas.push({
      id: "promoter",
      label: "Panel de Promotores",
      href: "/promoter"
    });
  }

  const hasBoard = roles.includes("commercial") || roles.includes("superadmin");
  const hasFinance = roles.includes("finance");
  if (hasBoard || hasFinance) {
    const commercialScopes: CommercialWorkspaceScope[] = [];
    if (hasBoard) commercialScopes.push("board");
    if (hasFinance) commercialScopes.push("finance");
    areas.push({
      id: "commercial",
      label: "Gestión Comercial",
      href: "/commercial",
      commercialScopes
    });
  }

  if (facts.isProfileSuperAdmin) {
    areas.push({
      id: "superadmin",
      label: "Administración general",
      href: "/super-admin"
    });
  }

  return areas;
}

export function commercialAreaHasScope(
  area: AuthorizedArea | undefined,
  scope: CommercialWorkspaceScope
): boolean {
  return Boolean(area?.id === "commercial" && area.commercialScopes?.includes(scope));
}
