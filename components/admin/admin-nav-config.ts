import { hasAdminPermission, type AdminPermission } from "@/lib/admin/permissions";
import type { Database, ProfileRole } from "@/types/database";

export type AdminNavFeatureFlag = keyof Pick<
  Database["public"]["Tables"]["business_settings"]["Row"],
  | "on_demand_mode_active"
  | "scheduled_mode_active"
  | "kitchen_mode_active"
  | "delivery_mode_active"
>;

export type AdminNavItem = {
  href: string;
  label: string;
  matchPrefixes: string[];
  requiredPermission?: AdminPermission;
  releasePending?: boolean;
  requiredFeatureFlag?: AdminNavFeatureFlag;
};

export const adminNavItems: AdminNavItem[] = [
  {
    href: "/admin/dashboard",
    label: "Pedidos",
    matchPrefixes: ["/admin/dashboard", "/admin/orders"],
    requiredPermission: "viewOrders"
  },
  {
    href: "/admin/kitchen",
    label: "Cocina",
    matchPrefixes: ["/admin/kitchen"],
    requiredPermission: "viewOrders",
    requiredFeatureFlag: "kitchen_mode_active"
  },
  {
    href: "/admin/onboarding",
    label: "Asistencia",
    matchPrefixes: ["/admin/onboarding"],
    requiredPermission: "manageProducts"
  },
  {
    href: "/admin/products",
    label: "Productos",
    matchPrefixes: [
      "/admin/products",
      "/admin/categories",
      "/admin/products/customizations"
    ],
    requiredPermission: "manageProducts"
  },
  {
    href: "/admin/statistics",
    label: "Estadísticas",
    matchPrefixes: ["/admin/statistics"],
    requiredPermission: "viewStatistics",
    releasePending: true
  },
  {
    href: "/admin/settings",
    label: "Configuración",
    matchPrefixes: ["/admin/settings", "/admin/team"],
    requiredPermission: "manageNotifications"
  }
];

export function isAdminNavItemActive(pathname: string, item: AdminNavItem) {
  return item.matchPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function getAdminNavItemsForRole(role: ProfileRole) {
  return adminNavItems.filter(
    (item) => !item.releasePending && (!item.requiredPermission || hasAdminPermission(role, item.requiredPermission))
  );
}

export function isAdminNavItemFeatureEnabled(
  item: AdminNavItem,
  settings: Database["public"]["Tables"]["business_settings"]["Row"] | null,
  loading: boolean
) {
  if (item.releasePending) {
    return false;
  }

  if (!item.requiredFeatureFlag) {
    return true;
  }

  if (loading) {
    return false;
  }

  return settings?.[item.requiredFeatureFlag] === true;
}
