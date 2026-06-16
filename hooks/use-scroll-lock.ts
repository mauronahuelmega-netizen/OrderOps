import { useEffect } from "react";

/**
 * Locks page scroll while `enabled` is true by setting `overflow: hidden` on
 * `document.body`. Compensates for scrollbar width to avoid layout shift.
 */
export function useScrollLock(enabled = true) {
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [enabled]);
}
