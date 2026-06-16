import type { ProfileRole } from "@/types/database";

export type AdminPermission =
  | "viewOrders"
  | "updateOrders"
  | "manageNotifications"
  | "manageTeam"
  | "manageProducts"
  | "managePublicSettings";

export type BusinessAdminRole = "owner" | "manager" | "operator" | "viewer";

export function normalizeBusinessAdminRole(role: ProfileRole): BusinessAdminRole {
  switch (role) {
    case "super_admin":
    case "admin":
    case "owner":
      return "owner";
    case "manager":
      return "manager";
    case "operator":
      return "operator";
    case "viewer":
      return "viewer";
  }
}

export function isOwner(role: ProfileRole) {
  return normalizeBusinessAdminRole(role) === "owner";
}

export function isManager(role: ProfileRole) {
  return normalizeBusinessAdminRole(role) === "manager";
}

export function isOperator(role: ProfileRole) {
  return normalizeBusinessAdminRole(role) === "operator";
}

export function isViewer(role: ProfileRole) {
  return normalizeBusinessAdminRole(role) === "viewer";
}

export function canViewOrders(role: ProfileRole) {
  void role;
  return true;
}

export function canUpdateOrders(role: ProfileRole) {
  return !isViewer(role);
}

export function canManageProducts(role: ProfileRole) {
  return isOwner(role) || isManager(role);
}

export function canManageTeam(role: ProfileRole) {
  return isOwner(role);
}

export function canManageNotifications(role: ProfileRole) {
  return isOwner(role) || isManager(role) || isOperator(role);
}

export function canManagePublicSettings(role: ProfileRole) {
  return isOwner(role) || isManager(role);
}

export function hasAdminPermission(role: ProfileRole, permission: AdminPermission) {
  switch (permission) {
    case "viewOrders":
      return canViewOrders(role);
    case "updateOrders":
      return canUpdateOrders(role);
    case "manageNotifications":
      return canManageNotifications(role);
    case "manageTeam":
      return canManageTeam(role);
    case "manageProducts":
      return canManageProducts(role);
    case "managePublicSettings":
      return canManagePublicSettings(role);
  }
}

export function getAdminPermissions(role: ProfileRole) {
  return {
    canViewOrders: canViewOrders(role),
    canUpdateOrders: canUpdateOrders(role),
    canManageNotifications: canManageNotifications(role),
    canManageTeam: canManageTeam(role),
    canManageProducts: canManageProducts(role),
    canManagePublicSettings: canManagePublicSettings(role)
  };
}
