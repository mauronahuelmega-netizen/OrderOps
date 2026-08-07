"use client";

import { useEffect, useState } from "react";

type UseHideOnScrollOptions = {
  /** When true, force visible and skip hide logic (e.g. menu open). */
  disabled?: boolean;
  /** When true, preserve the current state and ignore transient overlay scroll. */
  freeze?: boolean;
  thresholdPx?: number;
  minDeltaPx?: number;
};

/**
 * Directional hide-on-scroll for public catalog header.
 * Passive scroll + rAF throttle; no layout reads in the hot path.
 */
export function useHideOnScroll({
  disabled = false,
  freeze = false,
  thresholdPx = 36,
  minDeltaPx = 7
}: UseHideOnScrollOptions = {}): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (disabled) {
      setHidden(false);
      return;
    }

    if (freeze) {
      return;
    }

    let lastY = window.scrollY;
    let rafId = 0;
    let pending = false;

    const evaluate = () => {
      pending = false;
      const y = window.scrollY;
      const delta = y - lastY;

      if (y <= thresholdPx) {
        setHidden(false);
        lastY = y;
        return;
      }

      if (Math.abs(delta) < minDeltaPx) {
        return;
      }

      if (delta > 0) {
        setHidden(true);
      } else {
        setHidden(false);
      }

      lastY = y;
    };

    const onScroll = () => {
      if (pending) {
        return;
      }
      pending = true;
      rafId = window.requestAnimationFrame(evaluate);
    };

    lastY = window.scrollY;
    if (lastY <= thresholdPx) {
      setHidden(false);
    }

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [disabled, freeze, thresholdPx, minDeltaPx]);

  return disabled ? false : hidden;
}
