"use client";

import { Minus, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import {
  buildHierarchicalCartRows,
  getCartItemCount,
  getCartItemsTotal,
  type LocalCartItem,
  type LocalCartItemV2
} from "@/lib/cart/local";
import { formatPublicCatalogCurrency } from "@/lib/product-customization/public-shared";
import { UPSELL_ASSOCIATED_LABEL } from "@/lib/product-customization/upsell-copy";
import styles from "./cart-sheet.module.css";
import { usePublicOverlayScrollLock } from "./public-overlay-scroll-lock";

type CartSheetProps = {
  slug: string;
  items: LocalCartItem[];
  notice?: string | null;
  onClose: () => void;
  onCheckout: () => void;
  onEditParent: (parent: LocalCartItemV2, children: LocalCartItemV2[]) => void;
  onRemoveLine: (cartLineId: string) => void;
  onChangeParentQuantity: (parentCartLineId: string, quantity: number) => void;
  onChangeLegacyQuantity: (productId: string, quantity: number) => void;
};

function formatProductCount(count: number) {
  return `${count} ${count === 1 ? "producto" : "productos"}`;
}

export default function CartSheet({
  slug: _checkoutSlug,
  items,
  notice = null,
  onClose,
  onCheckout,
  onEditParent,
  onRemoveLine,
  onChangeParentQuantity,
  onChangeLegacyQuantity
}: CartSheetProps) {
  usePublicOverlayScrollLock();
  void _checkoutSlug;

  const rows = buildHierarchicalCartRows(items);
  const total = getCartItemsTotal(items);
  const itemCount = getCartItemCount(items);
  const isEmpty = items.length === 0;

  const reactId = useId();
  const titleId = `cart-sheet-title-${reactId}`;
  const descriptionId = `cart-sheet-description-${reactId}`;

  const sheetRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const restoreFocusTimeoutRef = useRef<number | null>(null);
  const closingRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!triggerRef.current && document.activeElement instanceof HTMLElement) {
      triggerRef.current = document.activeElement;
    }

    const frame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      restoreFocusTimeoutRef.current = window.setTimeout(() => {
        if (!sheetRef.current && triggerRef.current?.isConnected) {
          triggerRef.current.focus();
        }
      }, 0);
    };
  }, []);

  useEffect(() => {
    if (restoreFocusTimeoutRef.current !== null) {
      window.clearTimeout(restoreFocusTimeoutRef.current);
      restoreFocusTimeoutRef.current = null;
    }

    function closeOnce() {
      if (closingRef.current) {
        return;
      }
      closingRef.current = true;
      onCloseRef.current();
    }

    function focusableElements() {
      const root = sheetRef.current;
      if (!root) {
        return [] as HTMLElement[];
      }

      return [
        ...root.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ].filter(
        (element) =>
          !element.hasAttribute("disabled") &&
          element.tabIndex !== -1 &&
          element.getClientRects().length > 0
      );
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeOnce();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusables = focusableElements();
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (!active || active === first || !sheetRef.current?.contains(active)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (!active || active === last || !sheetRef.current?.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, []);

  function handleClose() {
    if (closingRef.current) {
      return;
    }
    closingRef.current = true;
    onClose();
  }

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      data-preview-pan-ignore
      onClick={handleClose}
    >
      <div
        ref={sheetRef}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <h2 id={titleId}>Tu pedido</h2>
            <p id={descriptionId} className={styles.headerMeta}>
              {isEmpty ? "Sin productos" : formatProductCount(itemCount)}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.iconButton}
            onClick={handleClose}
            aria-label="Cerrar carrito"
          >
            <X className={styles.icon} aria-hidden="true" strokeWidth={2.25} />
          </button>
        </header>

        <div className={styles.body}>
          {notice ? (
            <p className={styles.notice} role="alert">
              {notice}
            </p>
          ) : null}
          {isEmpty ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>Tu pedido está vacío</p>
              <p className={styles.emptyCopy}>
                Sumá productos desde el catálogo para continuar.
              </p>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleClose}
              >
                Seguir comprando
              </button>
            </div>
          ) : (
            <ul className={styles.list}>
              {rows.map((row) => {
                if (row.kind === "legacy") {
                  const item = row.item;
                  const lineTotal = item.price * item.quantity;

                  return (
                    <li key={`legacy-${item.productId}`} className={styles.row}>
                      <div className={styles.rowMain}>
                        <div className={styles.rowCopy}>
                          <strong className={styles.productName}>{item.name}</strong>
                          {item.quantity > 1 ? (
                            <span className={styles.unitHint}>
                              {item.quantity} × {formatPublicCatalogCurrency(item.price)}
                            </span>
                          ) : null}
                        </div>
                        <strong className={styles.rowTotal}>
                          {formatPublicCatalogCurrency(lineTotal)}
                        </strong>
                      </div>

                      <div className={styles.rowActions}>
                        <div className={styles.actionCluster}>
                          <button
                            type="button"
                            className={styles.iconButton}
                            onClick={() => onChangeLegacyQuantity(item.productId, 0)}
                            aria-label={`Eliminar ${item.name}`}
                          >
                            <Trash2
                              className={styles.icon}
                              aria-hidden="true"
                              strokeWidth={2.1}
                            />
                          </button>
                        </div>

                        <div className={styles.qty} role="group" aria-label={`Cantidad de ${item.name}`}>
                          <button
                            type="button"
                            className={styles.qtyButton}
                            onClick={() =>
                              onChangeLegacyQuantity(item.productId, item.quantity - 1)
                            }
                            aria-label={`Disminuir cantidad de ${item.name}`}
                          >
                            <Minus
                              className={styles.icon}
                              aria-hidden="true"
                              strokeWidth={2.4}
                            />
                          </button>
                          <span className={styles.qtyValue} aria-live="polite">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            className={styles.qtyButton}
                            onClick={() =>
                              onChangeLegacyQuantity(item.productId, item.quantity + 1)
                            }
                            aria-label={`Aumentar cantidad de ${item.name}`}
                          >
                            <Plus
                              className={styles.icon}
                              aria-hidden="true"
                              strokeWidth={2.4}
                            />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                }

                const { parent, children } = row;
                const showUnitHint = parent.quantity > 1;

                return (
                  <li key={parent.cartLineId} className={styles.row}>
                    <div className={styles.rowMain}>
                      <div className={styles.rowCopy}>
                        <strong className={styles.productName}>{parent.productName}</strong>
                        {showUnitHint ? (
                          <span className={styles.unitHint}>
                            {parent.quantity} ×{" "}
                            {formatPublicCatalogCurrency(parent.finalUnitPrice)}
                          </span>
                        ) : null}
                      </div>
                      <strong className={styles.rowTotal}>
                        {formatPublicCatalogCurrency(parent.lineTotal)}
                      </strong>
                    </div>

                    {parent.displaySummary.length > 0 ? (
                      <ul className={styles.summary}>
                        {parent.displaySummary.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    ) : null}

                    {children.length > 0 ? (
                      <div className={styles.childrenBlock}>
                        <p className={styles.childrenLabel}>{UPSELL_ASSOCIATED_LABEL}</p>
                        <ul className={styles.children}>
                          {children.map((child) => (
                            <li key={child.cartLineId} className={styles.child}>
                              <span className={styles.childCopy}>{child.productName}</span>
                              <strong className={styles.childPrice}>
                                {formatPublicCatalogCurrency(child.lineTotal)}
                              </strong>
                              <button
                                type="button"
                                className={styles.iconButton}
                                onClick={() => onRemoveLine(child.cartLineId)}
                                aria-label={`Eliminar ${child.productName} del pedido`}
                              >
                                <Trash2
                                  className={styles.icon}
                                  aria-hidden="true"
                                  strokeWidth={1.85}
                                />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <div className={styles.rowActions}>
                      <div className={styles.actionCluster}>
                        <button
                          type="button"
                          className={styles.iconButton}
                          onClick={() => onEditParent(parent, children)}
                          aria-label={`Editar ${parent.productName}`}
                        >
                          <Pencil
                            className={styles.icon}
                            aria-hidden="true"
                            strokeWidth={1.85}
                          />
                        </button>
                        <button
                          type="button"
                          className={styles.iconButton}
                          onClick={() => onRemoveLine(parent.cartLineId)}
                          aria-label={`Eliminar ${parent.productName}`}
                        >
                          <Trash2
                            className={styles.icon}
                            aria-hidden="true"
                            strokeWidth={1.85}
                          />
                        </button>
                      </div>

                      <div
                        className={styles.qty}
                        role="group"
                        aria-label={`Cantidad de ${parent.productName}`}
                      >
                        <button
                          type="button"
                          className={styles.qtyButton}
                          onClick={() =>
                            onChangeParentQuantity(parent.cartLineId, parent.quantity - 1)
                          }
                          aria-label={`Disminuir cantidad de ${parent.productName}`}
                        >
                          <Minus
                            className={styles.icon}
                            aria-hidden="true"
                            strokeWidth={2.4}
                          />
                        </button>
                        <span className={styles.qtyValue} aria-live="polite">
                          {parent.quantity}
                        </span>
                        <button
                          type="button"
                          className={styles.qtyButton}
                          onClick={() =>
                            onChangeParentQuantity(parent.cartLineId, parent.quantity + 1)
                          }
                          aria-label={`Aumentar cantidad de ${parent.productName}`}
                        >
                          <Plus
                            className={styles.icon}
                            aria-hidden="true"
                            strokeWidth={2.4}
                          />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {!isEmpty ? (
          <footer className={styles.footer}>
            <div className={styles.footerTotal}>
              <span>Total</span>
              <strong>{formatPublicCatalogCurrency(total)}</strong>
            </div>

            <button type="button" className={styles.primaryButton} onClick={onCheckout}>
              Continuar al checkout
            </button>

            <p className={styles.helper}>
              En el siguiente paso completás tus datos para enviar el pedido.
            </p>
          </footer>
        ) : null}
      </div>
    </div>
  );
}
