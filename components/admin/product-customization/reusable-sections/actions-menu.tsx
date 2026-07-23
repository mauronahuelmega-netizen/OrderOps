"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode
} from "react";
import styles from "./reusable-sections.module.css";

type Props = {
  /** Entity name used to build contextual aria labels (e.g. "Papas"). */
  label: string;
  children: ReactNode;
};

const CLOSE_EVENT = "actions-menu-close";

const openClosers = new Set<() => void>();

function registerOpenCloser(close: () => void) {
  for (const other of openClosers) {
    if (other !== close) {
      other();
    }
  }
  openClosers.add(close);
}

function unregisterOpenCloser(close: () => void) {
  openClosers.delete(close);
}

export default function ActionsMenu({ label, children }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const triggerLabel = `Más acciones para ${label}`;
  const menuLabel = `Acciones para ${label}`;

  const closeMenu = useCallback((options?: { restoreFocus?: boolean }) => {
    setIsOpen((wasOpen) => {
      if (wasOpen && options?.restoreFocus) {
        queueMicrotask(() => {
          triggerRef.current?.focus();
        });
      }
      return false;
    });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      unregisterOpenCloser(closeMenu);
      return;
    }

    registerOpenCloser(closeMenu);

    function handlePointerDown(event: MouseEvent) {
      const root = rootRef.current;
      if (!root) {
        return;
      }
      if (event.target instanceof Node && !root.contains(event.target)) {
        closeMenu({ restoreFocus: true });
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu({ restoreFocus: true });
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      unregisterOpenCloser(closeMenu);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeMenu]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    function handleCloseEvent() {
      closeMenu({ restoreFocus: false });
    }

    root.addEventListener(CLOSE_EVENT, handleCloseEvent);
    return () => {
      root.removeEventListener(CLOSE_EVENT, handleCloseEvent);
    };
  }, [closeMenu]);

  return (
    <div ref={rootRef} className={styles.menuRoot} data-actions-menu="">
      <button
        ref={triggerRef}
        type="button"
        className={styles.menuSummary}
        data-actions-menu-trigger=""
        aria-label={triggerLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => {
          setIsOpen((current) => !current);
        }}
      >
        <span aria-hidden="true">⋮</span>
      </button>
      {isOpen ? (
        <div
          id={menuId}
          className={styles.menuPanel}
          role="menu"
          aria-label={menuLabel}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function closeNearestMenu(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return;
  }
  const root = target.closest("[data-actions-menu]");
  if (!root) {
    return;
  }
  root.dispatchEvent(new Event(CLOSE_EVENT));
}
