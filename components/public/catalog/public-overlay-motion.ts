/** Shared exit timing for public catalog overlay delayed unmount (140–200ms). */
export const PUBLIC_OVERLAY_EXIT_MS = 180;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
