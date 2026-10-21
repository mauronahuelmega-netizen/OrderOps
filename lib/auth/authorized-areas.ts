export type AppAreaId = "admin" | "promoter" | "commercial" | "finance" | "superadmin";

export type AuthorizedArea = {
  id: AppAreaId;
  label: string;
  href: string;
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
 * Finance roles never imply superadmin. Commercial internal role "superadmin"
 * grants the commercial board area; the platform shell `/super-admin` requires
 * profiles.role === "super_admin".
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

  const hasCommercialBoard =
    roles.includes("commercial") || roles.includes("superadmin");
  if (hasCommercialBoard) {
    areas.push({
      id: "commercial",
      label: "Área Comercial",
      href: "/commercial/opportunities"
    });
  }

  if (roles.includes("finance")) {
    areas.push({
      id: "finance",
      label: "Finanzas",
      href: "/commercial/settlements"
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
