"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import styles from "./reusable-sections.module.css";

type Props = {
  label: string;
  children: ReactNode;
};

export default function ActionsMenu({ label, children }: Props) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const menuId = useId();

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const el = detailsRef.current;
      if (!el?.open) {
        return;
      }
      if (event.target instanceof Node && !el.contains(event.target)) {
        el.open = false;
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && detailsRef.current?.open) {
        detailsRef.current.open = false;
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <details ref={detailsRef} className={styles.menuRoot}>
      <summary
        className={styles.menuSummary}
        aria-label={label}
        aria-controls={menuId}
      >
        ⋮
      </summary>
      <div id={menuId} className={styles.menuPanel} role="menu">
        {children}
      </div>
    </details>
  );
}

export function closeNearestMenu(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return;
  }
  const details = target.closest("details");
  if (details) {
    details.open = false;
  }
}
