"use client";

import { useEffect } from "react";

export const PUBLIC_OVERLAY_LOCK_CHANGE_EVENT = "orderops-public-overlay-lock-change";

type StyleSnapshot = {
  htmlOverflow: string;
  htmlScrollBehavior: string;
  bodyPosition: string;
  bodyTop: string;
  bodyLeft: string;
  bodyRight: string;
  bodyWidth: string;
  bodyOverflow: string;
  overlayOpenAttribute: string | null;
  scrollY: number;
};

let lockCount = 0;
let snapshot: StyleSnapshot | null = null;

function notifyLockChange() {
  window.dispatchEvent(
    new CustomEvent(PUBLIC_OVERLAY_LOCK_CHANGE_EVENT, {
      detail: { isOpen: lockCount > 0 }
    })
  );
}

function lockPublicOverlayScroll() {
  if (lockCount === 0) {
    const root = document.documentElement;
    const body = document.body;

    snapshot = {
      htmlOverflow: root.style.overflow,
      htmlScrollBehavior: root.style.scrollBehavior,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyWidth: body.style.width,
      bodyOverflow: body.style.overflow,
      overlayOpenAttribute: root.getAttribute("data-public-overlay-open"),
      scrollY: window.scrollY
    };

    root.dataset.publicOverlayOpen = "true";
    root.style.scrollBehavior = "auto";
    root.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${snapshot.scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
  }

  lockCount += 1;
  if (lockCount === 1) {
    notifyLockChange();
  }
}

function unlockPublicOverlayScroll() {
  lockCount = Math.max(0, lockCount - 1);

  if (lockCount !== 0 || !snapshot) {
    return;
  }

  const root = document.documentElement;
  const body = document.body;
  const previous = snapshot;

  root.style.overflow = previous.htmlOverflow;
  root.style.scrollBehavior = previous.htmlScrollBehavior;
  body.style.position = previous.bodyPosition;
  body.style.top = previous.bodyTop;
  body.style.left = previous.bodyLeft;
  body.style.right = previous.bodyRight;
  body.style.width = previous.bodyWidth;
  body.style.overflow = previous.bodyOverflow;

  if (previous.overlayOpenAttribute === null) {
    root.removeAttribute("data-public-overlay-open");
  } else {
    root.setAttribute("data-public-overlay-open", previous.overlayOpenAttribute);
  }

  snapshot = null;
  window.scrollTo(0, previous.scrollY);
  notifyLockChange();
}

/**
 * Locks the public catalog viewport while an overlay is mounted. The module
 * ref-count keeps the lock active during handoffs between public overlays.
 */
export function usePublicOverlayScrollLock(isOpen = true) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    lockPublicOverlayScroll();
    return () => {
      // Let a replacement overlay acquire the lock in the same React commit.
      window.setTimeout(unlockPublicOverlayScroll, 0);
    };
  }, [isOpen]);
}
