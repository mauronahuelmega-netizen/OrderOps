"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CustomizationOptionGroup from "@/components/product-customization/shared/customization-option-group";
import CustomizationPriceSummary from "@/components/product-customization/shared/customization-price-summary";
import {
  buildCartLinesFromCustomizationSelection,
  type LocalCartItemV2
} from "@/lib/cart/local";
import {
  selectSingleOption,
  toggleMultipleOption
} from "@/lib/product-customization/preview-selection";
import {
  computeVisualCustomizationTotal,
  formatPublicCatalogCurrency,
  validateCustomizationSelection,
  type PublicCustomizationGroup,
  type PublicProductCustomizationConfig,
  type PublicUpsellSuggestedProduct
} from "@/lib/product-customization/public-shared";
import type { CustomizationLoadState } from "@/components/public/catalog/customization-config-cache";
import styles from "./customization-modal.module.css";

export type CustomizationModalInitialSelection = {
  selectedOptionsByGroupId: Record<string, string[]>;
  selectedUpsellProductIds: string[];
};

export type CustomizationConfirmResult = {
  parent: LocalCartItemV2;
  children: LocalCartItemV2[];
  replaceCartLineId: string | null;
  /** Attached upsell product IDs eligible for edit preservation (from config.upsellGroup). */
  eligibleAttachedUpsellProductIds?: ReadonlySet<string>;
  /** Same config.upsellGroup.products for post-add (not selected in modal). */
  suggestedUpsellProducts: PublicUpsellSuggestedProduct[];
};

type CustomizationModalProps = {
  productId: string;
  productName: string;
  categoryId: string;
  loadState: CustomizationLoadState;
  editingCartLineId?: string | null;
  initialSelection?: CustomizationModalInitialSelection | null;
  onClose: () => void;
  onRetry: () => void;
  onConfirmSelection: (
    result: CustomizationConfirmResult
  ) => { ok: true } | { ok: false; error: string } | boolean | void;
};

function filterInitialSelection(
  config: PublicProductCustomizationConfig,
  initial: CustomizationModalInitialSelection | null | undefined
): Pick<CustomizationModalInitialSelection, "selectedOptionsByGroupId"> & {
  droppedStale: boolean;
} {
  if (!initial) {
    return { selectedOptionsByGroupId: {}, droppedStale: false };
  }

  const selectedOptionsByGroupId: Record<string, string[]> = {};
  let droppedStale = false;

  for (const group of config.groups) {
    const requested = initial.selectedOptionsByGroupId[group.id] ?? [];
    const allowed = new Set(group.options.map((option) => option.id));
    const kept = requested.filter((optionId) => allowed.has(optionId));
    if (kept.length !== requested.length) {
      droppedStale = true;
    }
    if (kept.length > 0) {
      selectedOptionsByGroupId[group.id] = kept;
    }
  }

  return { selectedOptionsByGroupId, droppedStale };
}

function groupUsesRequiredLayout(group: PublicCustomizationGroup): boolean {
  return group.isRequired || group.minSelections >= 1;
}

export default function CustomizationModal({
  productId,
  productName,
  categoryId,
  loadState,
  editingCartLineId = null,
  initialSelection = null,
  onClose,
  onRetry,
  onConfirmSelection
}: CustomizationModalProps) {
  const [selectedOptionsByGroupId, setSelectedOptionsByGroupId] = useState<
    Record<string, string[]>
  >({});
  const [staleWarning, setStaleWarning] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [priceBump, setPriceBump] = useState(false);
  const previousTotalRef = useRef<number | null>(null);
  const priceBumpTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (loadState.status !== "ready") {
      return;
    }

    const filtered = filterInitialSelection(loadState.config, initialSelection);
    const hadInitial =
      Boolean(initialSelection) &&
      Object.keys(initialSelection?.selectedOptionsByGroupId ?? {}).length > 0;
    const lostOptions =
      hadInitial &&
      JSON.stringify(filtered.selectedOptionsByGroupId) !==
        JSON.stringify(initialSelection?.selectedOptionsByGroupId ?? {});

    setSelectedOptionsByGroupId(filtered.selectedOptionsByGroupId);
    setStaleWarning(
      lostOptions || filtered.droppedStale
        ? "Algunas opciones ya no están disponibles. Revisá tu selección antes de continuar."
        : null
    );
    setConfirmError(null);
    previousTotalRef.current = null;
    setPriceBump(false);
    // Apply initial selection once per ready config for this product open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, loadState.status === "ready" ? loadState.config.productId : null]);

  const validation = useMemo(() => {
    if (loadState.status !== "ready") {
      return { valid: false, issues: [] as { groupId: string; message: string }[] };
    }

    return validateCustomizationSelection(
      loadState.config.groups,
      selectedOptionsByGroupId
    );
  }, [loadState, selectedOptionsByGroupId]);

  const visualTotal = useMemo(() => {
    if (loadState.status !== "ready") {
      return 0;
    }

    return computeVisualCustomizationTotal({
      basePrice: loadState.config.productPrice,
      groups: loadState.config.groups,
      selectedOptionsByGroupId,
      upsellProducts: [],
      selectedUpsellProductIds: []
    });
  }, [loadState, selectedOptionsByGroupId]);

  useEffect(() => {
    if (loadState.status !== "ready") {
      return;
    }

    const previous = previousTotalRef.current;
    previousTotalRef.current = visualTotal;

    if (previous === null || previous === visualTotal) {
      return;
    }

    setPriceBump(true);
    if (priceBumpTimeoutRef.current !== null) {
      window.clearTimeout(priceBumpTimeoutRef.current);
    }
    priceBumpTimeoutRef.current = window.setTimeout(() => {
      setPriceBump(false);
      priceBumpTimeoutRef.current = null;
    }, 180);

    return () => {
      if (priceBumpTimeoutRef.current !== null) {
        window.clearTimeout(priceBumpTimeoutRef.current);
        priceBumpTimeoutRef.current = null;
      }
    };
  }, [loadState.status, visualTotal]);

  function handleConfirm() {
    if (loadState.status !== "ready" || !validation.valid) {
      return;
    }

    try {
      // Post-add owns Plus selection; modal always builds parent without Plus children.
      const { parent, children } = buildCartLinesFromCustomizationSelection({
        config: loadState.config,
        categoryId,
        selectedOptionsByGroupId,
        selectedUpsellProductIds: [],
        quantity: 1
      });

      const eligibleAttachedUpsellProductIds = editingCartLineId
        ? new Set(
            (loadState.config.upsellGroup?.products ?? []).map(
              (product) => product.id
            )
          )
        : undefined;

      const confirmResult = onConfirmSelection({
        parent,
        children,
        replaceCartLineId: editingCartLineId,
        eligibleAttachedUpsellProductIds,
        suggestedUpsellProducts: loadState.config.upsellGroup?.products ?? []
      });

      if (confirmResult && typeof confirmResult === "object" && confirmResult.ok === false) {
        setConfirmError(confirmResult.error);
        return;
      }

      if (confirmResult === false) {
        setConfirmError("No pudimos actualizar este producto. Volvé a intentarlo.");
        return;
      }

      onClose();
    } catch {
      setConfirmError("No pudimos agregar la personalización al carrito. Probá de nuevo.");
    }
  }

  const issueByGroupId = useMemo(() => {
    const map = new Map<string, string>();
    for (const issue of validation.issues) {
      map.set(issue.groupId, issue.message);
    }
    return map;
  }, [validation.issues]);

  const formattedTotal = formatPublicCatalogCurrency(visualTotal);
  const ctaVerb = editingCartLineId ? "Actualizar" : "Agregar";
  const ctaAriaLabel = `${ctaVerb} · ${formattedTotal}`;

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      data-preview-pan-ignore
      onClick={onClose}
    >
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="customization-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <p className={styles.eyebrow}>Armá tu pedido</p>
            <h2 id="customization-modal-title">{productName}</h2>
            {loadState.status === "ready" ? (
              <p className={styles.basePrice}>
                Precio base {formatPublicCatalogCurrency(loadState.config.productPrice)}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Cerrar personalización"
          >
            Cerrar
          </button>
        </header>

        <div className={styles.body}>
          {loadState.status === "loading" ? (
            <p className={styles.statusMessage}>Cargando opciones…</p>
          ) : null}

          {loadState.status === "error" ? (
            <div className={styles.errorPanel} role="alert">
              <p>{loadState.message}</p>
              <button type="button" className={styles.secondaryButton} onClick={onRetry}>
                Reintentar
              </button>
              <button type="button" className={styles.secondaryButton} onClick={onClose}>
                Cerrar
              </button>
            </div>
          ) : null}

          {loadState.status === "disabled" ? (
            <div className={styles.errorPanel}>
              <p>La personalización no está disponible para este producto.</p>
              <button type="button" className={styles.secondaryButton} onClick={onClose}>
                Cerrar
              </button>
            </div>
          ) : null}

          {loadState.status === "ready" ? (
            <>
              {staleWarning ? (
                <p className={styles.groupError} role="status">
                  {staleWarning}
                </p>
              ) : null}

              {loadState.config.productDescription ? (
                <p className={styles.description}>{loadState.config.productDescription}</p>
              ) : null}

              {loadState.config.groups.length === 0 ? (
                <p className={styles.statusMessage}>
                  Este producto no tiene opciones de personalización activas.
                </p>
              ) : null}

              {loadState.config.groups.map((group) => (
                <CustomizationOptionGroup
                  key={group.id}
                  group={group}
                  selectedOptionIds={selectedOptionsByGroupId[group.id] ?? []}
                  issue={issueByGroupId.get(group.id) ?? null}
                  optionLayout={
                    groupUsesRequiredLayout(group) ? "list" : "compact-grid"
                  }
                  onSelectOption={(optionId) => {
                    if (group.selectionType === "single") {
                      setSelectedOptionsByGroupId((current) =>
                        selectSingleOption(current, group.id, optionId)
                      );
                    } else {
                      setSelectedOptionsByGroupId((current) =>
                        toggleMultipleOption(
                          current,
                          group.id,
                          optionId,
                          group.maxSelections
                        )
                      );
                    }
                    setConfirmError(null);
                  }}
                />
              ))}
            </>
          ) : null}
        </div>

        {loadState.status === "ready" ? (
          <footer className={styles.footer}>
            <CustomizationPriceSummary
              total={visualTotal}
              showTotalRow={false}
              confirmError={confirmError}
              incompleteHint={
                !validation.valid && validation.issues.length > 0
                  ? "Completá las opciones obligatorias para agregar al pedido."
                  : null
              }
            >
              <button
                type="button"
                className={styles.primaryButton}
                disabled={!validation.valid}
                onClick={handleConfirm}
                aria-label={ctaAriaLabel}
              >
                <span className={styles.ctaVerb}>{ctaVerb}</span>
                <span className={styles.ctaSep} aria-hidden="true">
                  ·
                </span>
                <span
                  className={[
                    styles.ctaPrice,
                    priceBump ? styles.ctaPriceBump : ""
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {formattedTotal}
                </span>
              </button>
            </CustomizationPriceSummary>
          </footer>
        ) : null}
      </div>
    </div>
  );
}
