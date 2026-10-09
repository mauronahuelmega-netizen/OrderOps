/**
 * Feature-local FLIP reflow for Category Order rows (Subir/Bajar).
 * Presentation only — does not change draft order algorithm.
 */

const REFLOW_MS = 160;
const REFLOW_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const ANIMATION_NAME = "category-order-reflow";

export function prefersCategoryOrderReducedMotion(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function captureCategoryRowTops(list: HTMLElement): Map<string, number> {
  const tops = new Map<string, number>();
  const rows = list.querySelectorAll<HTMLElement>("[data-category-order-id]");
  rows.forEach((row) => {
    const id = row.dataset.categoryOrderId;
    if (!id) {
      return;
    }
    tops.set(id, row.getBoundingClientRect().top);
  });
  return tops;
}

export function animateCategoryRowReflow(
  list: HTMLElement,
  previousTops: Map<string, number>
): void {
  if (prefersCategoryOrderReducedMotion()) {
    return;
  }

  const rows = list.querySelectorAll<HTMLElement>("[data-category-order-id]");
  rows.forEach((row) => {
    const id = row.dataset.categoryOrderId;
    if (!id) {
      return;
    }

    const previousTop = previousTops.get(id);
    if (previousTop === undefined) {
      return;
    }

    const nextTop = row.getBoundingClientRect().top;
    const deltaY = previousTop - nextTop;
    if (Math.abs(deltaY) < 0.5) {
      return;
    }

    for (const animation of row.getAnimations()) {
      if (animation.id === ANIMATION_NAME) {
        animation.cancel();
      }
    }

    const animation = row.animate(
      [
        { transform: `translateY(${deltaY}px)` },
        { transform: "translateY(0)" }
      ],
      {
        duration: REFLOW_MS,
        easing: REFLOW_EASING,
        fill: "none"
      }
    );
    animation.id = ANIMATION_NAME;
  });
}
