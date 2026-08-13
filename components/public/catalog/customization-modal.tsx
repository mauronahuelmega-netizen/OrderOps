"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
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
import {
  canIncrementOptionQuantity,
  decrementOptionQuantity,
  formatQuantityGroupMeta,
  getEffectiveAllowsOptionQuantity,
  getSelectedOptionQuantity,
  incrementOptionQuantity,
  normalizeLegacySelectionToV2,
  normalizeSelectionToV2,
  selectionV2ToLegacyOptionIds,
  type CustomizationSelectionStateV2
} from "@/lib/product-customization/selection-v2";
import type { CustomizationLoadState } from "@/components/public/catalog/customization-config-cache";
import styles from "./customization-modal.module.css";
import {
  prefersReducedMotion,
  PUBLIC_OVERLAY_EXIT_MS
} from "./public-overlay-motion";
import { usePublicOverlayScrollLock } from "./public-overlay-scroll-lock";

/** Matches CSS exit duration; keep in sync with `.backdropClosing` / `.modalClosing`. */
const CUSTOMIZATION_MODAL_EXIT_MS = PUBLIC_OVERLAY_EXIT_MS;

export type CustomizationModalInitialSelection = {
  selectedOptionsByGroupId: Record<string, string[]>;
  selectedQuantitiesByGroupId?: Record<string, Record<string, number>>;
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
): {
  selection: CustomizationSelectionStateV2;
  droppedStale: boolean;
} {
  if (!initial) {
    return { selection: {}, droppedStale: false };
  }

  const fromQuantities = initial.selectedQuantitiesByGroupId
    ? normalizeSelectionToV2(initial.selectedQuantitiesByGroupId, config.groups)
    : normalizeLegacySelectionToV2(initial.selectedOptionsByGroupId, config.groups);

  const requestedLegacy = initial.selectedOptionsByGroupId;
  let droppedStale = false;

  for (const group of config.groups) {
    const requested = requestedLegacy[group.id] ?? [];
    const allowed = new Set(group.options.map((option) => option.id));
    if (requested.some((optionId) => !allowed.has(optionId))) {
      droppedStale = true;
    }
    const qtyMap = initial.selectedQuantitiesByGroupId?.[group.id];
    if (qtyMap) {
      for (const optionId of Object.keys(qtyMap)) {
        if (!allowed.has(optionId)) {
          droppedStale = true;
        }
      }
    }
  }

  return { selection: fromQuantities, droppedStale };
}

function groupUsesRequiredLayout(group: PublicCustomizationGroup): boolean {
  return group.isRequired || group.minSelections >= 1;
}

function formatOptionUnitDelta(priceDelta: number): string | null {
  if (priceDelta <= 0) {
    return null;
  }
  return `${formatPublicCatalogCurrency(priceDelta)} c/u`;
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
  const [selectionV2, setSelectionV2] = useState<CustomizationSelectionStateV2>({});
  const [staleWarning, setStaleWarning] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [priceBump, setPriceBump] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const previousTotalRef = useRef<number | null>(null);
  const priceBumpTimeoutRef = useRef<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const restoreFocusTimeoutRef = useRef<number | null>(null);
  const closingRef = useRef(false);
  const closeTimerRef = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);

  onCloseRef.current = onClose;
  usePublicOverlayScrollLock();

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const finishClose = useCallback(() => {
    clearCloseTimer();
    onCloseRef.current();
  }, [clearCloseTimer]);

  /** Dismiss/close with exit animation. Not for confirm/add handoff. */
  const requestClose = useCallback(() => {
    if (closingRef.current) {
      return;
    }

    closingRef.current = true;

    if (prefersReducedMotion()) {
      onCloseRef.current();
      return;
    }

    setIsClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      finishClose();
    }, CUSTOMIZATION_MODAL_EXIT_MS);
  }, [finishClose]);

  /** Immediate close after successful confirm — preserves upsell/cart handoff. */
  const closeImmediate = useCallback(() => {
    if (closingRef.current) {
      return;
    }

    closingRef.current = true;
    clearCloseTimer();
    onCloseRef.current();
  }, [clearCloseTimer]);

  useEffect(() => {
    return () => {
      clearCloseTimer();
    };
  }, [clearCloseTimer]);

  useEffect(() => {
    if (!triggerRef.current && document.activeElement instanceof HTMLElement) {
      triggerRef.current = document.activeElement;
    }

    closeButtonRef.current?.focus();

    return () => {
      // Delay restoration so Strict Mode's effect replay cannot steal focus.
      restoreFocusTimeoutRef.current = window.setTimeout(() => {
        if (!modalRef.current && triggerRef.current?.isConnected) {
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

    function focusableElements() {
      const root = modalRef.current;
      if (!root) {
        return [] as HTMLElement[];
      }

      return [
        ...root.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ].filter((element) => element.tabIndex !== -1 && element.getClientRects().length > 0);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        requestClose();
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
        if (!active || active === first || !modalRef.current?.contains(active)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (!active || active === last || !modalRef.current?.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [requestClose]);

  useEffect(() => {
    if (loadState.status !== "ready") {
      return;
    }

    const filtered = filterInitialSelection(loadState.config, initialSelection);
    const hadInitial =
      Boolean(initialSelection) &&
      (Object.keys(initialSelection?.selectedOptionsByGroupId ?? {}).length > 0 ||
        Object.keys(initialSelection?.selectedQuantitiesByGroupId ?? {}).length > 0);

    setSelectionV2(filtered.selection);
    setStaleWarning(
      hadInitial && filtered.droppedStale
        ? "Algunas opciones ya no están disponibles. Revisá tu selección antes de continuar."
        : null
    );
    setConfirmError(null);
    previousTotalRef.current = null;
    setPriceBump(false);
    // Apply initial selection once per ready config for this product open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, loadState.status === "ready" ? loadState.config.productId : null]);

  const selectedOptionsByGroupId = useMemo(
    () => selectionV2ToLegacyOptionIds(selectionV2),
    [selectionV2]
  );

  const validation = useMemo(() => {
    if (loadState.status !== "ready") {
      return { valid: false, issues: [] as { groupId: string; message: string }[] };
    }

    return validateCustomizationSelection(
      loadState.config.groups,
      selectedOptionsByGroupId,
      selectionV2
    );
  }, [loadState, selectedOptionsByGroupId, selectionV2]);

  const visualTotal = useMemo(() => {
    if (loadState.status !== "ready") {
      return 0;
    }

    return computeVisualCustomizationTotal({
      basePrice: loadState.config.productPrice,
      groups: loadState.config.groups,
      selectedOptionsByGroupId,
      selectedQuantitiesByGroupId: selectionV2,
      upsellProducts: [],
      selectedUpsellProductIds: []
    });
  }, [loadState, selectedOptionsByGroupId, selectionV2]);

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
        selectedQuantitiesByGroupId: selectionV2,
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

      closeImmediate();
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
      className={`${styles.backdrop}${isClosing ? ` ${styles.backdropClosing}` : ""}`}
      role="presentation"
      data-preview-pan-ignore
      data-closing={isClosing ? "true" : "false"}
      onClick={requestClose}
    >
      <div
        ref={modalRef}
        className={`${styles.modal}${isClosing ? ` ${styles.modalClosing}` : ""}`}
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
            ref={closeButtonRef}
            onClick={requestClose}
            aria-label="Cerrar personalización"
          >
            <X aria-hidden="true" focusable="false" size={20} strokeWidth={2} />
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
              <button type="button" className={styles.secondaryButton} onClick={requestClose}>
                Cerrar
              </button>
            </div>
          ) : null}

          {loadState.status === "disabled" ? (
            <div className={styles.errorPanel}>
              <p>La personalización no está disponible para este producto.</p>
              <button type="button" className={styles.secondaryButton} onClick={requestClose}>
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

              {loadState.config.groups.map((group) => {
                if (getEffectiveAllowsOptionQuantity(group)) {
                  return (
                    <section key={group.id} className={styles.quantityGroup}>
                      <div className={styles.quantityGroupHeader}>
                        <h3>{group.name}</h3>
                        <span className={styles.quantityGroupMeta}>
                          {formatQuantityGroupMeta(group)}
                        </span>
                      </div>
                      {group.description ? (
                        <p className={styles.quantityGroupDescription}>{group.description}</p>
                      ) : null}

                      <ul className={styles.quantityOptionList}>
                        {group.options.map((option) => {
                          const qty = getSelectedOptionQuantity(
                            selectionV2,
                            group.id,
                            option.id
                          );
                          const canPlus = canIncrementOptionQuantity({
                            selection: selectionV2,
                            group,
                            optionId: option.id
                          });
                          const unitLabel = formatOptionUnitDelta(option.priceDelta);
                          const lineDelta = option.priceDelta * qty;

                          return (
                            <li key={option.id} className={styles.quantityOptionCard}>
                              <div className={styles.quantityOptionCopy}>
                                <p className={styles.quantityOptionName}>{option.name}</p>
                                <p className={styles.quantityOptionMeta}>
                                  {unitLabel ? (
                                    <span>{unitLabel}</span>
                                  ) : (
                                    <span>Sin costo</span>
                                  )}
                                  {qty > 1 && lineDelta > 0 ? (
                                    <span>
                                      {" "}
                                      · x{qty} · +{formatPublicCatalogCurrency(lineDelta)}
                                    </span>
                                  ) : null}
                                </p>
                              </div>

                              {qty < 1 ? (
                                <button
                                  type="button"
                                  className={styles.quantityAddButton}
                                  disabled={!canPlus}
                                  onClick={() => {
                                    setSelectionV2((current) =>
                                      incrementOptionQuantity({
                                        selection: current,
                                        groups: loadState.config.groups,
                                        group,
                                        optionId: option.id
                                      })
                                    );
                                    setConfirmError(null);
                                  }}
                                >
                                  Agregar
                                </button>
                              ) : (
                                <div className={styles.quantityStepper}>
                                  <button
                                    type="button"
                                    className={styles.quantityStepperButton}
                                    aria-label={`Quitar una unidad de ${option.name}`}
                                    onClick={() => {
                                      setSelectionV2((current) =>
                                        decrementOptionQuantity({
                                          selection: current,
                                          groups: loadState.config.groups,
                                          group,
                                          optionId: option.id
                                        })
                                      );
                                      setConfirmError(null);
                                    }}
                                  >
                                    <Minus aria-hidden="true" focusable="false" size={16} />
                                  </button>
                                  <span
                                    className={styles.quantityStepperValue}
                                    aria-live="polite"
                                  >
                                    {qty}
                                  </span>
                                  <button
                                    type="button"
                                    className={styles.quantityStepperButton}
                                    aria-label={`Sumar una unidad de ${option.name}`}
                                    disabled={!canPlus}
                                    onClick={() => {
                                      setSelectionV2((current) =>
                                        incrementOptionQuantity({
                                          selection: current,
                                          groups: loadState.config.groups,
                                          group,
                                          optionId: option.id
                                        })
                                      );
                                      setConfirmError(null);
                                    }}
                                  >
                                    <Plus aria-hidden="true" focusable="false" size={16} />
                                  </button>
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>

                      {issueByGroupId.get(group.id) ? (
                        <p className={styles.groupError} role="alert">
                          {issueByGroupId.get(group.id)}
                        </p>
                      ) : null}
                    </section>
                  );
                }

                return (
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
                        setSelectionV2((current) =>
                          normalizeSelectionToV2(
                            normalizeLegacySelectionToV2(
                              selectSingleOption(
                                selectionV2ToLegacyOptionIds(current),
                                group.id,
                                optionId
                              )
                            ),
                            loadState.config.groups
                          )
                        );
                      } else {
                        setSelectionV2((current) =>
                          normalizeSelectionToV2(
                            normalizeLegacySelectionToV2(
                              toggleMultipleOption(
                                selectionV2ToLegacyOptionIds(current),
                                group.id,
                                optionId,
                                group.maxSelections
                              )
                            ),
                            loadState.config.groups
                          )
                        );
                      }
                      setConfirmError(null);
                    }}
                  />
                );
              })}
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
                  ? "Completá las opciones obligatorias para continuar."
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
