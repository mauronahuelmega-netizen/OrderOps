"use client";

import {
  buildHierarchicalCartRows,
  getCartItemsTotal,
  type LocalCartItem,
  type LocalCartItemV2
} from "@/lib/cart/local";
import { formatPublicCatalogCurrency } from "@/lib/product-customization/public-shared";
import styles from "./cart-sheet.module.css";

type CartSheetProps = {
  slug: string;
  items: LocalCartItem[];
  onClose: () => void;
  onCheckout: () => void;
  onEditParent: (parent: LocalCartItemV2, children: LocalCartItemV2[]) => void;
  onRemoveLine: (cartLineId: string) => void;
  onChangeParentQuantity: (parentCartLineId: string, quantity: number) => void;
  onChangeLegacyQuantity: (productId: string, quantity: number) => void;
};

export default function CartSheet({
  slug,
  items,
  onClose,
  onCheckout,
  onEditParent,
  onRemoveLine,
  onChangeParentQuantity,
  onChangeLegacyQuantity
}: CartSheetProps) {
  const rows = buildHierarchicalCartRows(items);
  const total = getCartItemsTotal(items);
  const isEmpty = items.length === 0;

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-sheet-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Tu pedido</p>
            <h2 id="cart-sheet-title">Carrito</h2>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            Cerrar
          </button>
        </header>

        <div className={styles.body}>
          {isEmpty ? (
            <p className={styles.empty}>Todavía no agregaste productos.</p>
          ) : (
            <ul className={styles.list}>
              {rows.map((row) => {
                if (row.kind === "legacy") {
                  const item = row.item;
                  return (
                    <li key={`legacy-${item.productId}`} className={styles.row}>
                      <div className={styles.rowMain}>
                        <div className={styles.rowCopy}>
                          <strong>{item.name}</strong>
                          <span>
                            {formatPublicCatalogCurrency(item.price)} c/u
                          </span>
                        </div>
                        <strong className={styles.rowTotal}>
                          {formatPublicCatalogCurrency(item.price * item.quantity)}
                        </strong>
                      </div>
                      <div className={styles.rowActions}>
                        <div className={styles.qty} aria-label={`Cantidad de ${item.name}`}>
                          <button
                            type="button"
                            onClick={() =>
                              onChangeLegacyQuantity(item.productId, item.quantity - 1)
                            }
                          >
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() =>
                              onChangeLegacyQuantity(item.productId, item.quantity + 1)
                            }
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                }

                const { parent, children } = row;
                const childrenTotal = children.reduce(
                  (sum, child) => sum + child.lineTotal,
                  0
                );
                const groupTotal = parent.lineTotal + childrenTotal;

                return (
                  <li key={parent.cartLineId} className={styles.row}>
                    <div className={styles.rowMain}>
                      <div className={styles.rowCopy}>
                        <strong>{parent.productName}</strong>
                        <span>
                          {formatPublicCatalogCurrency(parent.finalUnitPrice)} c/u
                        </span>
                      </div>
                      <strong className={styles.rowTotal}>
                        {formatPublicCatalogCurrency(groupTotal)}
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
                      <ul className={styles.children}>
                        {children.map((child) => (
                          <li key={child.cartLineId} className={styles.child}>
                            <span>
                              + {child.productName}{" "}
                              <small>
                                {formatPublicCatalogCurrency(child.finalUnitPrice)}
                              </small>
                            </span>
                            <button
                              type="button"
                              className={styles.linkButton}
                              onClick={() => onRemoveLine(child.cartLineId)}
                            >
                              Quitar
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    <div className={styles.rowActions}>
                      <div
                        className={styles.qty}
                        aria-label={`Cantidad de ${parent.productName}`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            onChangeParentQuantity(parent.cartLineId, parent.quantity - 1)
                          }
                        >
                          -
                        </button>
                        <span>{parent.quantity}</span>
                        <button
                          type="button"
                          onClick={() =>
                            onChangeParentQuantity(parent.cartLineId, parent.quantity + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                      <div className={styles.rowButtons}>
                        <button
                          type="button"
                          className={styles.linkButton}
                          onClick={() => onEditParent(parent, children)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className={styles.linkButton}
                          onClick={() => onRemoveLine(parent.cartLineId)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <footer className={styles.footer}>
          <div className={styles.footerTotal}>
            <span>Total</span>
            <strong>{formatPublicCatalogCurrency(total)}</strong>
          </div>

          <button
            type="button"
            className={styles.primaryButton}
            disabled={isEmpty}
            onClick={onCheckout}
          >
            Continuar al checkout
          </button>

          {!isEmpty ? (
            <p className={styles.helper}>
              Vas a continuar a <code>/b/{slug}/checkout</code>
            </p>
          ) : null}
        </footer>
      </div>
    </div>
  );
}

