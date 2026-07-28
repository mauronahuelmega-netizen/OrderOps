"use client";

import { useEffect, useRef, type RefObject } from "react";

const PAN_THRESHOLD_PX = 8;
const SAMPLE_WINDOW_MS = 100;
const MAX_SAMPLES = 5;

const MIN_MOMENTUM_VELOCITY = 0.15;
const MAX_MOMENTUM_VELOCITY = 2.2;
const MOMENTUM_FRICTION = 0.93;
const STOP_MOMENTUM_VELOCITY = 0.02;
const MAX_MOMENTUM_DURATION_MS = 900;

/**
 * Real controls only. Intentionally omits [role="button"] so product-card hit
 * surfaces (name/description/price/image) can pan without text selection.
 */
const INTERACTIVE_SELECTOR = [
  "button",
  "a",
  "input",
  "textarea",
  "select",
  "label",
  "summary",
  '[role="link"]',
  '[contenteditable="true"]',
  "[data-preview-pan-ignore]"
].join(",");

export type UsePreviewPointerPanScrollOptions = {
  enabled: boolean;
  targetRef: RefObject<HTMLElement | null>;
};

type PanSample = {
  y: number;
  time: number;
};

type PanPhase = "idle" | "candidate" | "active";

export function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return true;
  }

  return Boolean(target.closest(INTERACTIVE_SELECTOR));
}

function resolveScrollElement(root: HTMLElement): HTMLElement {
  const doc = root.ownerDocument;
  const scrolling = doc.scrollingElement;
  if (scrolling instanceof HTMLElement) {
    return scrolling;
  }

  return doc.documentElement;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Desktop-only mouse drag → vertical scroll for catalog preview.
 * Blocks text/image selection during candidate/active pan without breaking clicks.
 * Adds vertical momentum after a real pan when release velocity is high enough.
 */
export function usePreviewPointerPanScroll({
  enabled,
  targetRef
}: UsePreviewPointerPanScrollOptions): void {
  const stateRef = useRef<{
    pointerId: number | null;
    startX: number;
    startY: number;
    scrollTop: number;
    phase: PanPhase;
    didPan: boolean;
    samples: PanSample[];
  }>({
    pointerId: null,
    startX: 0,
    startY: 0,
    scrollTop: 0,
    phase: "idle",
    didPan: false,
    samples: []
  });

  useEffect(() => {
    const surface = targetRef.current;
    if (!enabled || !surface) {
      return;
    }

    surface.dataset.previewPanEnabled = "true";

    const scrollEl = resolveScrollElement(surface);
    const doc = surface.ownerDocument;
    const html = doc.documentElement;
    const win = doc.defaultView;
    if (!win) {
      return;
    }

    html.dataset.previewPanEnabled = "true";

    let momentumRafId: number | null = null;
    let momentumVelocity = 0;
    let momentumStartedAt = 0;
    let momentumLastFrame = 0;

    const cancelMomentum = () => {
      if (momentumRafId !== null) {
        win.cancelAnimationFrame(momentumRafId);
        momentumRafId = null;
      }
      momentumVelocity = 0;
      momentumStartedAt = 0;
      momentumLastFrame = 0;
    };

    const setPanState = (phase: PanPhase) => {
      if (phase === "idle") {
        delete html.dataset.previewPanState;
        surface.removeAttribute("data-preview-pan-dragging");
        surface.removeAttribute("data-preview-pan-candidate");
        return;
      }

      html.dataset.previewPanState = phase;
      if (phase === "candidate") {
        surface.dataset.previewPanCandidate = "true";
        surface.removeAttribute("data-preview-pan-dragging");
        return;
      }

      surface.dataset.previewPanDragging = "true";
      surface.removeAttribute("data-preview-pan-candidate");
    };

    const clearSelection = () => {
      win.getSelection()?.removeAllRanges();
    };

    const suppressNextClick = () => {
      const onClickCapture = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        doc.removeEventListener("click", onClickCapture, true);
      };

      doc.addEventListener("click", onClickCapture, true);
      win.setTimeout(() => {
        doc.removeEventListener("click", onClickCapture, true);
      }, 0);
    };

    const pushSample = (y: number, time: number) => {
      const samples = stateRef.current.samples;
      samples.push({ y, time });
      while (samples.length > MAX_SAMPLES) {
        samples.shift();
      }
      const cutoff = time - SAMPLE_WINDOW_MS;
      while (samples.length > 0 && samples[0].time < cutoff) {
        samples.shift();
      }
    };

    const computeReleaseVelocity = (): number => {
      const samples = stateRef.current.samples;
      if (samples.length < 2) {
        return 0;
      }

      const first = samples[0];
      const last = samples[samples.length - 1];
      const dt = last.time - first.time;
      if (dt <= 0) {
        return 0;
      }

      // scrollTop = startScrollTop - (clientY - startY) → d(scrollTop)/dt = -d(clientY)/dt
      return -(last.y - first.y) / dt;
    };

    const startMomentum = (velocityPxPerMs: number) => {
      cancelMomentum();

      const absVelocity = Math.abs(velocityPxPerMs);
      if (absVelocity < MIN_MOMENTUM_VELOCITY) {
        return;
      }

      momentumVelocity = clamp(
        velocityPxPerMs,
        -MAX_MOMENTUM_VELOCITY,
        MAX_MOMENTUM_VELOCITY
      );
      momentumStartedAt = win.performance.now();
      // Seed previous frame slightly in the past so the first RAF has a usable dt.
      momentumLastFrame = momentumStartedAt - 16;

      const tick = (now: number) => {
        const elapsed = now - momentumStartedAt;
        if (elapsed >= MAX_MOMENTUM_DURATION_MS) {
          cancelMomentum();
          return;
        }

        const dt = Math.min(34, Math.max(0, now - momentumLastFrame));
        momentumLastFrame = now;

        if (dt > 0) {
          const before = scrollEl.scrollTop;
          scrollEl.scrollTop = before + momentumVelocity * dt;
          if (Math.abs(scrollEl.scrollTop - before) < 0.5) {
            cancelMomentum();
            return;
          }
        }

        momentumVelocity *= MOMENTUM_FRICTION;

        if (Math.abs(momentumVelocity) < STOP_MOMENTUM_VELOCITY) {
          cancelMomentum();
          return;
        }

        momentumRafId = win.requestAnimationFrame(tick);
      };

      momentumRafId = win.requestAnimationFrame(tick);
    };

    const onSelectStart = (event: Event) => {
      const phase = stateRef.current.phase;
      if (phase === "candidate" || phase === "active") {
        event.preventDefault();
      }
    };

    const onDragStart = (event: Event) => {
      const phase = stateRef.current.phase;
      if (phase === "candidate" || phase === "active") {
        event.preventDefault();
      }
    };

    const resetGesture = () => {
      stateRef.current.pointerId = null;
      stateRef.current.phase = "idle";
      stateRef.current.didPan = false;
      stateRef.current.samples = [];
      setPanState("idle");
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!enabled) {
        return;
      }

      if (event.pointerType !== "mouse" || event.button !== 0) {
        return;
      }

      // Any primary mouse down on the surface cuts in-flight inertia.
      cancelMomentum();

      if (isInteractiveTarget(event.target)) {
        return;
      }

      const state = stateRef.current;
      state.pointerId = event.pointerId;
      state.startX = event.clientX;
      state.startY = event.clientY;
      state.scrollTop = scrollEl.scrollTop;
      state.phase = "candidate";
      state.didPan = false;
      state.samples = [];
      pushSample(event.clientY, win.performance.now());
      setPanState("candidate");
      clearSelection();

      // Do not preventDefault here — preserves click-to-open on product cards.
      try {
        surface.setPointerCapture(event.pointerId);
      } catch {
        // Capture may fail on detached nodes; continue without it.
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      const state = stateRef.current;
      if (state.pointerId !== event.pointerId || state.phase === "idle") {
        return;
      }

      const deltaY = event.clientY - state.startY;
      const deltaX = event.clientX - state.startX;
      const now = win.performance.now();

      if (state.phase === "candidate") {
        if (Math.hypot(deltaX, deltaY) < PAN_THRESHOLD_PX) {
          // Still block selection during the small pre-threshold move.
          event.preventDefault();
          return;
        }

        state.phase = "active";
        state.didPan = true;
        setPanState("active");
        clearSelection();
      }

      event.preventDefault();
      pushSample(event.clientY, now);
      scrollEl.scrollTop = state.scrollTop - deltaY;
    };

    const endPan = (event: PointerEvent, cancelled: boolean) => {
      const state = stateRef.current;
      if (state.pointerId !== event.pointerId) {
        return;
      }

      const didPan = state.didPan;
      const releaseVelocity = didPan ? computeReleaseVelocity() : 0;
      const pointerId = state.pointerId;

      // Clear gesture before releasePointerCapture so a synchronous
      // lostpointercapture cannot cancel the momentum we are about to start.
      resetGesture();

      try {
        surface.releasePointerCapture(pointerId);
      } catch {
        // Ignore release errors.
      }

      if (cancelled) {
        cancelMomentum();
        return;
      }

      if (didPan) {
        clearSelection();
        suppressNextClick();
        startMomentum(releaseVelocity);
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      endPan(event, false);
    };

    const onPointerCancel = (event: PointerEvent) => {
      endPan(event, true);
    };

    const onLostPointerCapture = (event: PointerEvent) => {
      // Only end if the gesture is still active (abrupt capture loss).
      endPan(event, true);
    };

    doc.addEventListener("selectstart", onSelectStart, true);
    doc.addEventListener("dragstart", onDragStart, true);
    surface.addEventListener("pointerdown", onPointerDown);
    surface.addEventListener("pointermove", onPointerMove, { passive: false });
    surface.addEventListener("pointerup", onPointerUp);
    surface.addEventListener("pointercancel", onPointerCancel);
    surface.addEventListener("lostpointercapture", onLostPointerCapture);

    return () => {
      cancelMomentum();
      doc.removeEventListener("selectstart", onSelectStart, true);
      doc.removeEventListener("dragstart", onDragStart, true);
      surface.removeEventListener("pointerdown", onPointerDown);
      surface.removeEventListener("pointermove", onPointerMove);
      surface.removeEventListener("pointerup", onPointerUp);
      surface.removeEventListener("pointercancel", onPointerCancel);
      surface.removeEventListener("lostpointercapture", onLostPointerCapture);
      delete surface.dataset.previewPanEnabled;
      delete html.dataset.previewPanEnabled;
      resetGesture();
    };
  }, [enabled, targetRef]);
}
