"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { getPublicProductCustomizationConfigAction } from "@/app/b/[slug]/catalogo/actions";
import CustomizationOptionGroup from "@/components/product-customization/shared/customization-option-group";
import CustomizationPriceSummary from "@/components/product-customization/shared/customization-price-summary";
import UpsellSuggestionGroup from "@/components/product-customization/shared/upsell-suggestion-group";
import {
  buildCartLinesFromCustomizationSelection,
  type LocalCartItemV2
} from "@/lib/cart/local";
import {
  selectSingleOption,
  toggleMultipleOption,
  toggleUpsellProduct
} from "@/lib/product-customization/preview-selection";
import {
  computeVisualCustomizationTotal,
  formatPublicCatalogCurrency,
  validateCustomizationSelection,
  type PublicProductCustomizationConfig
} from "@/lib/product-customization/public-shared";
import styles from "./customization-modal.module.css";

export type CustomizationModalInitialSelection = {
  selectedOptionsByGroupId: Record<string, string[]>;
  selectedUpsellProductIds: string[];
};

export type CustomizationConfirmResult = {
  parent: LocalCartItemV2;
  children: LocalCartItemV2[];
  replaceCartLineId: string | null;
};

type CustomizationModalProps = {
  slug: string;
  productId: string;
  productName: string;
  categoryId: string;
  editingCartLineId?: string | null;
  initialSelection?: CustomizationModalInitialSelection | null;
  onClose: () => void;
  onConfirmSelection: (result: CustomizationConfirmResult) => void;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; config: PublicProductCustomizationConfig }
  | { status: "disabled" };

function filterInitialSelection(
  config: PublicProductCustomizationConfig,
  initial: CustomizationModalInitialSelection | null | undefined
): CustomizationModalInitialSelection {
  if (!initial) {
    return { selectedOptionsByGroupId: {}, selectedUpsellProductIds: [] };
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

  const upsellAllowed = new Set(
    (config.upsellGroup?.products ?? []).map((product) => product.id)
  );
  const selectedUpsellProductIds = initial.selectedUpsellProductIds.filter((id) =>
    upsellAllowed.has(id)
  );
  if (selectedUpsellProductIds.length !== initial.selectedUpsellProductIds.length) {
    droppedStale = true;
  }

  return {
    selectedOptionsByGroupId,
    selectedUpsellProductIds,
    ...(droppedStale ? {} : {})
  };
}

export default function CustomizationModal({
  slug,
  productId,
  productName,
  categoryId,
  editingCartLineId = null,
  initialSelection = null,
  onClose,
  onConfirmSelection
}: CustomizationModalProps) {
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [selectedOptionsByGroupId, setSelectedOptionsByGroupId] = useState<
    Record<string, string[]>
  >({});
  const [selectedUpsellProductIds, setSelectedUpsellProductIds] = useState<string[]>(
    []
  );
  const [staleWarning, setStaleWarning] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    startTransition(() => {
      void (async () => {
        const result = await getPublicProductCustomizationConfigAction({
          slug,
          productId
        });

        if (cancelled) {
          return;
        }

        if (!result.ok) {
          setLoadState({ status: "error", message: result.error });
          return;
        }

        if (!result.enabled || !result.config) {
          setLoadState({ status: "disabled" });
          return;
        }

        const filtered = filterInitialSelection(result.config, initialSelection);
        const hadInitial =
          Boolean(initialSelection) &&
          (Object.keys(initialSelection?.selectedOptionsByGroupId ?? {}).length > 0 ||
            (initialSelection?.selectedUpsellProductIds.length ?? 0) > 0);
        const lostOptions =
          hadInitial &&
          (JSON.stringify(filtered.selectedOptionsByGroupId) !==
            JSON.stringify(initialSelection?.selectedOptionsByGroupId ?? {}) ||
            JSON.stringify(filtered.selectedUpsellProductIds) !==
              JSON.stringify(initialSelection?.selectedUpsellProductIds ?? []));

        setLoadState({ status: "ready", config: result.config });
        setSelectedOptionsByGroupId(filtered.selectedOptionsByGroupId);
        setSelectedUpsellProductIds(filtered.selectedUpsellProductIds);
        setStaleWarning(
          lostOptions
            ? "Algunas opciones ya no están disponibles. Revisá tu selección antes de continuar."
            : null
        );
        setConfirmError(null);
      })();
    });

    return () => {
      cancelled = true;
    };
    // initialSelection is only applied on open for this product
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, slug]);

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
      upsellProducts: loadState.config.upsellGroup?.products ?? [],
      selectedUpsellProductIds
    });
  }, [loadState, selectedOptionsByGroupId, selectedUpsellProductIds]);

  function handleConfirm() {
    if (loadState.status !== "ready" || !validation.valid) {
      return;
    }

    try {
      const { parent, children } = buildCartLinesFromCustomizationSelection({
        config: loadState.config,
        categoryId,
        selectedOptionsByGroupId,
        selectedUpsellProductIds,
        quantity: 1
      });

      onConfirmSelection({
        parent,
        children,
        replaceCartLineId: editingCartLineId
      });
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

  const ctaLabel = editingCartLineId ? "Actualizar pedido" : "Agregar al pedido";

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
          <div>
            <p className={styles.eyebrow}>Armá tu pedido</p>
            <h2 id="customization-modal-title">{productName}</h2>
            {loadState.status === "ready" ? (
              <p className={styles.basePrice}>
                Precio base {formatPublicCatalogCurrency(loadState.config.productPrice)}
                {" · "}
                Completá las opciones marcadas como obligatorias
              </p>
            ) : null}
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            Cerrar
          </button>
        </header>

        <div className={styles.body}>
          {loadState.status === "loading" || isPending ? (
            <p className={styles.statusMessage}>Cargando opciones…</p>
          ) : null}

          {loadState.status === "error" ? (
            <div className={styles.errorPanel} role="alert">
              <p>{loadState.message}</p>
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

              {loadState.config.groups.length === 0 && !loadState.config.upsellGroup ? (
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

              {loadState.config.upsellGroup ? (
                <UpsellSuggestionGroup
                  upsellGroup={loadState.config.upsellGroup}
                  selectedProductIds={selectedUpsellProductIds}
                  onToggleProduct={(upsellProductId) => {
                    setSelectedUpsellProductIds((current) =>
                      toggleUpsellProduct(current, upsellProductId)
                    );
                    setConfirmError(null);
                  }}
                />
              ) : null}
            </>
          ) : null}
        </div>

        {loadState.status === "ready" ? (
          <footer className={styles.footer}>
            <CustomizationPriceSummary
              total={visualTotal}
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
              >
                {ctaLabel}
              </button>
            </CustomizationPriceSummary>
          </footer>
        ) : null}
      </div>
    </div>
  );
}
