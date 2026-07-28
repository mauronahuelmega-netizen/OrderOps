"use client";

import { useEffect, type RefObject } from "react";
import styles from "./catalog-preview-mobile-feel.module.css";

export type UsePreviewTouchCursorOptions = {
  enabled: boolean;
  targetRef: RefObject<HTMLElement | null>;
};

/**
 * Floating circular touch-style cursor for catalog preview (mouse only).
 * Visual only — pointer-events: none, never captures clicks.
 */
export function usePreviewTouchCursor({
  enabled,
  targetRef
}: UsePreviewTouchCursorOptions): void {
  useEffect(() => {
    const surface = targetRef.current;
    if (!enabled || !surface) {
      return;
    }

    const doc = surface.ownerDocument;
    const win = doc.defaultView;
    if (!win) {
      return;
    }

    const cursor = doc.createElement("div");
    cursor.className = styles.previewTouchCursor;
    cursor.setAttribute("aria-hidden", "true");
    cursor.dataset.previewTouchCursor = "true";
    cursor.hidden = true;
    doc.body.appendChild(cursor);

    let visible = false;
    let pressed = false;

    const setPressed = (next: boolean) => {
      pressed = next;
      cursor.classList.toggle(styles.previewTouchCursorPressed, pressed);
    };

    const moveTo = (clientX: number, clientY: number) => {
      cursor.style.transform = `translate3d(${clientX}px, ${clientY}px, 0) translate(-50%, -50%)`;
    };

    const show = () => {
      if (visible) {
        return;
      }
      visible = true;
      cursor.hidden = false;
      surface.dataset.previewTouchCursorActive = "true";
    };

    const hide = () => {
      visible = false;
      cursor.hidden = true;
      setPressed(false);
      delete surface.dataset.previewTouchCursorActive;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") {
        hide();
        return;
      }

      show();
      moveTo(event.clientX, event.clientY);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0) {
        return;
      }
      show();
      moveTo(event.clientX, event.clientY);
      setPressed(true);
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") {
        return;
      }
      setPressed(false);
      moveTo(event.clientX, event.clientY);
    };

    const onPointerLeave = () => {
      hide();
    };

    surface.addEventListener("pointermove", onPointerMove);
    surface.addEventListener("pointerdown", onPointerDown);
    surface.addEventListener("pointerup", onPointerUp);
    surface.addEventListener("pointercancel", onPointerUp);
    surface.addEventListener("pointerleave", onPointerLeave);

    return () => {
      surface.removeEventListener("pointermove", onPointerMove);
      surface.removeEventListener("pointerdown", onPointerDown);
      surface.removeEventListener("pointerup", onPointerUp);
      surface.removeEventListener("pointercancel", onPointerUp);
      surface.removeEventListener("pointerleave", onPointerLeave);
      delete surface.dataset.previewTouchCursorActive;
      cursor.remove();
    };
  }, [enabled, targetRef]);
}
