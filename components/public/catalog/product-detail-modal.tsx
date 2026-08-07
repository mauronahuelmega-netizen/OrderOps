"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import type { PublicProduct } from "@/lib/catalog/public";
import {
  formatPublicCatalogCurrency,
  shouldShowPriceFrom
} from "@/lib/product-customization/public-shared";
import PublicStorageImage from "@/components/public/catalog/public-storage-image";
import { usePublicOverlayScrollLock } from "@/components/public/catalog/public-overlay-scroll-lock";

type ProductDetailModalProps = {
  product: PublicProduct;
  currentQuantity: number;
  requiresCustomization?: boolean;
  onClose: () => void;
  onSaveQuantity: (quantity: number) => void;
  onCustomize?: () => void;
};

export default function ProductDetailModal({
  product,
  currentQuantity,
  requiresCustomization = false,
  onClose,
  onSaveQuantity,
  onCustomize
}: ProductDetailModalProps) {
  const [draftQuantity, setDraftQuantity] = useState(Math.max(currentQuantity, 1));
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const restoreFocusTimeoutRef = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);

  onCloseRef.current = onClose;
  usePublicOverlayScrollLock();

  useEffect(() => {
    setDraftQuantity(Math.max(currentQuantity, 1));
  }, [currentQuantity, product.id]);

  useEffect(() => {
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
      restoreFocusTimeoutRef.current = window.setTimeout(() => {
        if (!modalRef.current && triggerRef.current?.isConnected) {
          triggerRef.current.focus();
        }
      }, 0);
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const modal = modalRef.current;
      if (!modal) {
        return;
      }

      const focusableElements = Array.from(
        modal.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        modal.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        if (activeElement === firstElement || !modal.contains(activeElement)) {
          event.preventDefault();
          lastElement.focus();
        }
        return;
      }

      if (activeElement === lastElement || !modal.contains(activeElement)) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);

  const summary = product.customizationSummary
    ? {
        productId: product.id,
        hasCustomizations: product.customizationSummary.hasCustomizations,
        hasPaidCustomizations: product.customizationSummary.hasPaidCustomizations,
        hasUpsell: product.customizationSummary.hasUpsell,
        priceFrom: product.customizationSummary.priceFrom
      }
    : null;

  const showFrom = shouldShowPriceFrom(summary);
  const displayPrice =
    showFrom && summary?.priceFrom !== null && summary?.priceFrom !== undefined
      ? summary.priceFrom
      : Number(product.price);

  const primaryLabel = useMemo(() => {
    if (requiresCustomization) {
      return "Elegir opciones";
    }

    if (currentQuantity === 0) {
      return "Agregar al pedido";
    }

    if (draftQuantity === 0) {
      return "Quitar del pedido";
    }

    return "Actualizar pedido";
  }, [currentQuantity, draftQuantity, requiresCustomization]);

  function submitQuantity() {
    if (requiresCustomization) {
      onCustomize?.();
      return;
    }

    onSaveQuantity(draftQuantity);
    onClose();
  }

  return (
    <div
      className="catalog-modal-backdrop"
      role="presentation"
      data-preview-pan-ignore
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="catalog-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-product-modal-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="catalog-modal__scroll">
          <header className="catalog-modal__header">
            <h2 id="catalog-product-modal-title">{product.name}</h2>
            <button
              ref={closeButtonRef}
              type="button"
              className="catalog-modal__close"
              aria-label="Cerrar detalle del producto"
              onClick={onClose}
            >
              <X aria-hidden="true" focusable="false" size={20} strokeWidth={2} />
            </button>
          </header>

          <div className="catalog-modal__media">
            {product.image_url ? (
              <div className="catalog-modal__image-shell">
                <PublicStorageImage
                  className="catalog-modal__image"
                  src={product.image_url}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 92vw, 480px"
                />
              </div>
            ) : (
              <div className="catalog-modal__placeholder">Sin foto</div>
            )}
          </div>

          <div className="catalog-modal__content">
            <div className="catalog-modal__summary">
              <strong>
                {showFrom ? (
                  <span className="catalog-product-card__price-from">Desde </span>
                ) : null}
                {formatPublicCatalogCurrency(displayPrice)}
              </strong>
              {product.description ? <p>{product.description}</p> : null}
              {requiresCustomization ? (
                <p className="catalog-modal__helper">
                  El precio se actualiza según las opciones y extras que elijas.
                </p>
              ) : null}
            </div>

            {!requiresCustomization ? (
              <div className="catalog-modal__quantity-block">
                <span>Cantidad</span>
                <div
                  className="catalog-quantity-control catalog-quantity-control--large"
                  role="group"
                  aria-label={`Cantidad de ${product.name}`}
                >
                  <button
                    type="button"
                    aria-label={`Disminuir cantidad de ${product.name}`}
                    onClick={() => setDraftQuantity((current) => Math.max(current - 1, 0))}
                  >
                    -
                  </button>
                  <span aria-live="polite">{draftQuantity}</span>
                  <button
                    type="button"
                    aria-label={`Aumentar cantidad de ${product.name}`}
                    onClick={() => setDraftQuantity((current) => current + 1)}
                  >
                    +
                  </button>
                </div>
                {draftQuantity === 0 ? (
                  <p className="catalog-modal__helper">
                    Si guardás con cero, el producto se elimina del pedido.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <footer className="catalog-modal__footer">
          <div className="catalog-modal__footer-copy">
            {requiresCustomization ? (
              <>
                <strong>Personalización</strong>
                <span>
                  {showFrom ? "Desde " : null}
                  {formatPublicCatalogCurrency(displayPrice)}
                </span>
              </>
            ) : (
              <>
                <strong>
                  {draftQuantity > 0
                    ? `${draftQuantity} ${draftQuantity === 1 ? "producto" : "productos"}`
                    : "Sin productos"}
                </strong>
                <span>
                  {formatPublicCatalogCurrency(Number(product.price) * Math.max(draftQuantity, 0))}
                </span>
              </>
            )}
          </div>
          <button type="button" className="catalog-modal__submit" onClick={submitQuantity}>
            {primaryLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}
