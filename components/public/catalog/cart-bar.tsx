"use client";

import { useEffect, useRef, useState } from "react";
import { ShoppingCart } from "lucide-react";
import styles from "./cart-bar.module.css";

type CartBarProps = {
  count: number;
  /** Kept for call-site compatibility; FAB intentionally does not show total. */
  total?: number;
  onOpenCart: () => void;
};

const FAB_PULSE_MS = 240;

export default function CartBar({ count, onOpenCart }: CartBarProps) {
  const previousCountRef = useRef(count);
  const hasMountedCountRef = useRef(false);
  const pulseTimeoutRef = useRef<number | null>(null);
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    const previousCount = previousCountRef.current;

    if (!hasMountedCountRef.current) {
      hasMountedCountRef.current = true;
      previousCountRef.current = count;
      return;
    }

    if (previousCount > 0 && count > previousCount) {
      setIsPulsing(false);
      const frameId = window.requestAnimationFrame(() => {
        setIsPulsing(true);
      });

      if (pulseTimeoutRef.current !== null) {
        window.clearTimeout(pulseTimeoutRef.current);
      }

      pulseTimeoutRef.current = window.setTimeout(() => {
        setIsPulsing(false);
        pulseTimeoutRef.current = null;
      }, FAB_PULSE_MS);

      previousCountRef.current = count;

      return () => {
        window.cancelAnimationFrame(frameId);
        if (pulseTimeoutRef.current !== null) {
          window.clearTimeout(pulseTimeoutRef.current);
          pulseTimeoutRef.current = null;
        }
      };
    }

    previousCountRef.current = count;
  }, [count]);

  useEffect(() => {
    return () => {
      if (pulseTimeoutRef.current !== null) {
        window.clearTimeout(pulseTimeoutRef.current);
      }
    };
  }, []);

  if (count <= 0) {
    return null;
  }

  const label = `Ver pedido, ${count} ${count === 1 ? "producto" : "productos"}`;

  return (
    <button
      type="button"
      className={`${styles.fab}${isPulsing ? ` ${styles.fabPulse}` : ""}`}
      onClick={onOpenCart}
      aria-label={label}
      data-preview-pan-ignore
    >
      <span className={styles.fabMotionSurface}>
        <ShoppingCart className={styles.icon} aria-hidden="true" />
        <span
          className={`${styles.count}${isPulsing ? ` ${styles.countPop}` : ""}`}
        >
          {count}
        </span>
      </span>
    </button>
  );
}
