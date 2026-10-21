import {
  commercialAreaHasScope,
  type AppAreaId,
  type AuthorizedArea
} from "@/lib/auth/authorized-areas";

const LOGIN_ALIASES = new Set(["/login", "/admin/login", "/promoter/login"]);

/**
 * Sanitize an internal relative path. Rejects open redirects and non-app paths.
 * Does not authorize against the user's areas — use authorizeNextForAreas for that.
 */
export function sanitizeInternalNext(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\") || trimmed.includes("://")) {
    return null;
  }

  const path = trimmed.split("?")[0]?.split("#")[0] ?? "";
  if (!path || LOGIN_ALIASES.has(path) || path.startsWith("/login/")) {
    return null;
  }

  if (
    path.startsWith("/admin") ||
    path.startsWith("/commercial") ||
    path.startsWith("/promoter") ||
    path.startsWith("/super-admin")
  ) {
    return path;
  }

  return null;
}

function areaIdsAllowingPath(path: string): AppAreaId[] {
  if (path.startsWith("/admin") && !path.startsWith("/admin/login")) {
    return ["admin"];
  }
  if (path.startsWith("/promoter") && !path.startsWith("/promoter/login")) {
    return ["promoter"];
  }
  if (path.startsWith("/super-admin")) {
    return ["superadmin"];
  }
  if (path.startsWith("/commercial")) {
    return ["commercial"];
  }
  return [];
}

/** True when the path belongs to at least one of the caller's authorized areas. */
export function isPathAuthorizedForAreas(path: string, areas: readonly AuthorizedArea[]): boolean {
  if (path.startsWith("/commercial/opportunities")) {
    const commercial = areas.find((area) => area.id === "commercial");
    return commercialAreaHasScope(commercial, "board");
  }

  if (path.startsWith("/commercial")) {
    return areas.some((area) => area.id === "commercial");
  }

  const allowed = new Set(areas.map((area) => area.id));
  return areaIdsAllowingPath(path).some((id) => allowed.has(id));
}

/**
 * Return a safe, authorized next path, or null when the candidate is missing,
 * malformed, external, or outside the user's authorized areas.
 */
export function authorizeNextForAreas(
  value: string | null | undefined,
  areas: readonly AuthorizedArea[]
): string | null {
  const path = sanitizeInternalNext(value);
  if (!path) return null;
  if (!isPathAuthorizedForAreas(path, areas)) return null;
  return path;
}
