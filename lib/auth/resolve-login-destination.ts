import type { AuthorizedArea } from "@/lib/auth/authorized-areas";
import { authorizeNextForAreas } from "@/lib/auth/safe-next";

export type LoginDestination =
  | { kind: "redirect"; href: string }
  | { kind: "choose"; areas: AuthorizedArea[] }
  | { kind: "none" };

/**
 * Decide where an authenticated user should go after login (or when visiting /login).
 * Prefers an authorized `next` when present; otherwise auto-redirects on a single area
 * or asks the user to choose when multiple areas apply.
 */
export function resolveLoginDestination(input: {
  areas: readonly AuthorizedArea[];
  next?: string | null;
}): LoginDestination {
  const areas = [...input.areas];
  if (areas.length === 0) {
    return { kind: "none" };
  }

  const authorizedNext = authorizeNextForAreas(input.next, areas);
  if (authorizedNext) {
    return { kind: "redirect", href: authorizedNext };
  }

  if (areas.length === 1) {
    return { kind: "redirect", href: areas[0].href };
  }

  return { kind: "choose", areas };
}
