"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent
} from "react";
import { ChevronDown } from "lucide-react";
import styles from "./compact-products-filter-menu.module.css";

export type CompactFilterOption = {
  value: string;
  label: string;
};

export type CompactFilterTrailingAction = {
  label: string;
  onSelect: () => void;
};

type CompactProductsFilterMenuProps = {
  filterKey: "category" | "stock" | "status";
  ariaLabel: string;
  options: CompactFilterOption[];
  value: string;
  onChange: (value: string) => void;
  triggerClassName: string;
  triggerActiveClassName: string;
  /** Logical open from toolbar-owned openFilter. */
  open: boolean;
  onRequestOpen: () => void;
  onRequestClose: () => void;
  menuAlign?: "start" | "end";
  menuWide?: boolean;
  /** When value is empty, closed trigger shows this instead of the empty option label. */
  emptyTriggerLabel?: string;
  trailingAction?: CompactFilterTrailingAction;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Presence model:
 * - `open` is logical truth from toolbar.
 * - Local `exiting` keeps the panel mounted for exit animation only.
 * - Exit finish never calls onRequestClose (avoids wiping a handoff target).
 */
export default function CompactProductsFilterMenu({
  filterKey,
  ariaLabel,
  options,
  value,
  onChange,
  triggerClassName,
  triggerActiveClassName,
  open,
  onRequestOpen,
  onRequestClose,
  menuAlign = "start",
  menuWide = false,
  emptyTriggerLabel,
  trailingAction
}: CompactProductsFilterMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listId = useId();
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mounted, setMounted] = useState(open);
  const [exiting, setExiting] = useState(false);

  const selected = options.find((option) => option.value === value) ?? options[0];
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  );
  const triggerLabel =
    !value && emptyTriggerLabel ? emptyTriggerLabel : (selected?.label ?? "");

  const clearExitTimer = useCallback(() => {
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearExitTimer();
    };
  }, [clearExitTimer]);

  useEffect(() => {
    if (open) {
      clearExitTimer();
      setExiting(false);
      setMounted(true);
      return;
    }

    if (!mounted) {
      return;
    }

    if (prefersReducedMotion()) {
      setExiting(false);
      setMounted(false);
      return;
    }

    setExiting(true);
    clearExitTimer();
    exitTimerRef.current = setTimeout(() => {
      setExiting(false);
      setMounted(false);
      exitTimerRef.current = null;
    }, 110);
  }, [clearExitTimer, mounted, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (target instanceof Element && target.closest("[data-products-filter]")) {
        return;
      }
      onRequestClose();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onRequestClose();
        queueMicrotask(() => {
          triggerRef.current?.focus();
        });
      }
    }

    function handleViewportChange() {
      onRequestClose();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [onRequestClose, open]);

  useEffect(() => {
    if (!open || exiting) {
      return;
    }
    queueMicrotask(() => {
      optionRefs.current[selectedIndex]?.focus();
    });
  }, [exiting, open, selectedIndex]);

  const selectOption = (nextValue: string) => {
    if (nextValue !== value) {
      onChange(nextValue);
    }
    onRequestClose();
    queueMicrotask(() => {
      triggerRef.current?.focus();
    });
  };

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) {
        optionRefs.current[selectedIndex]?.focus();
        return;
      }
      onRequestOpen();
    }
  };

  const handleOptionKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = Math.min(options.length - 1, index + 1);
      optionRefs.current[next]?.focus();
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      const next = Math.max(0, index - 1);
      optionRefs.current[next]?.focus();
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      optionRefs.current[0]?.focus();
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      optionRefs.current[options.length - 1]?.focus();
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectOption(options[index]?.value ?? "");
      return;
    }
    if (event.key === "Tab") {
      onRequestClose();
    }
  };

  const triggerClasses = [
    triggerClassName,
    value ? triggerActiveClassName : "",
    styles.trigger,
    open || exiting ? styles.triggerOpen : ""
  ]
    .filter(Boolean)
    .join(" ");

  const interactive = open && !exiting;

  return (
    <div
      ref={rootRef}
      className={`${styles.root} ${menuWide ? styles.rootWide : ""}`}
      data-products-filter={filterKey}
    >
      <button
        ref={triggerRef}
        type="button"
        className={triggerClasses}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={mounted ? listId : undefined}
        title={triggerLabel}
        data-products-filter-trigger={filterKey}
        onClick={() => {
          if (open) {
            onRequestClose();
            return;
          }
          onRequestOpen();
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className={styles.triggerLabel}>{triggerLabel}</span>
        <ChevronDown
          className={styles.chevron}
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </button>

      {mounted ? (
        <div
          className={`${styles.menuShell} ${exiting ? styles.menuClosing : styles.menuOpen} ${
            menuAlign === "end" ? styles.menuAlignEnd : ""
          } ${menuWide ? styles.menuWide : ""}`}
          data-products-filter-menu={filterKey}
          data-exiting={exiting ? "true" : "false"}
          aria-hidden={exiting ? true : undefined}
          style={exiting ? { pointerEvents: "none" } : undefined}
        >
          <ul
            id={listId}
            className={styles.menuList}
            role="listbox"
            aria-label={ariaLabel}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <li key={option.value || "__default"} className={styles.optionItem}>
                  <button
                    ref={(node) => {
                      optionRefs.current[index] = node;
                    }}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={interactive ? 0 : -1}
                    className={`${styles.option} ${isSelected ? styles.optionSelected : ""}`}
                    onClick={() => {
                      if (!interactive) {
                        return;
                      }
                      selectOption(option.value);
                    }}
                    onKeyDown={(event) => handleOptionKeyDown(event, index)}
                  >
                    <span className={styles.optionLabel}>{option.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {trailingAction ? (
            <div className={styles.trailingRegion}>
              <button
                type="button"
                className={styles.trailingAction}
                tabIndex={interactive ? 0 : -1}
                onClick={() => {
                  if (!interactive) {
                    return;
                  }
                  trailingAction.onSelect();
                }}
              >
                {trailingAction.label}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
