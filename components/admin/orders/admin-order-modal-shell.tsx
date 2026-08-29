"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "./admin-order-modal.module.css";

type AdminOrderModalShellProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  headerLeading?: ReactNode;
  headerMeta?: ReactNode;
  variant?: "default" | "workstation";
  children: ReactNode;
};

export default function AdminOrderModalShell({
  isOpen,
  onClose,
  title = "Pedido",
  headerLeading,
  headerMeta,
  variant = "default",
  children
}: AdminOrderModalShellProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    closeButtonRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className={[
        styles["admin-order-modal-shell"],
        variant === "workstation" ? styles["admin-order-modal-shell--workstation"] : null
      ]
        .filter(Boolean)
        .join(" ")}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        className={styles["admin-order-modal-shell__overlay"]}
        aria-label="Cerrar detalle del pedido"
        onClick={onClose}
      />

      <div
        className={[
          styles["admin-order-modal-shell__panel"],
          variant === "workstation" ? styles["admin-order-modal-shell__panel--workstation"] : null
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div
          className={[
            styles["admin-order-modal-shell__header"],
            variant === "workstation" ? styles["admin-order-modal-shell__header--workstation"] : null
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className={styles["admin-order-modal-shell__header-main"]}>
            {headerLeading ?? <h2>{title}</h2>}
          </div>
          <div className={styles["admin-order-modal-shell__header-actions"]}>
            {headerMeta ? (
              <div className={styles["admin-order-modal-shell__header-meta"]}>{headerMeta}</div>
            ) : null}
            <button
              type="button"
              className={[
                styles["admin-order-modal-shell__close"],
                variant === "workstation"
                  ? styles["admin-order-modal-shell__close--quiet"]
                  : null
              ]
                .filter(Boolean)
                .join(" ")}
              aria-label="Cerrar detalle del pedido"
              onClick={onClose}
              ref={closeButtonRef}
            >
              {variant === "workstation" ? (
                <span aria-hidden="true">×</span>
              ) : (
                "Cerrar"
              )}
            </button>
          </div>
        </div>

        <div
          className={[
            styles["admin-order-modal-shell__body"],
            variant === "workstation" ? styles["admin-order-modal-shell__body--workstation"] : null
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
