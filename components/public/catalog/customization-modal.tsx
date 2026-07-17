"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { getPublicProductCustomizationConfigAction } from "@/app/b/[slug]/catalogo/actions";
import {
  buildCartLinesFromCustomizationSelection,
  type LocalCartItemV2
} from "@/lib/cart/local";
import {
  computeVisualCustomizationTotal,
  formatPublicCatalogCurrency,
  validateCustomizationSelection,
  type PublicProductCustomizationConfig
} from "@/lib/product-customization/public-shared";
import {
  formatUpsellOptionPrice,
  getUpsellGroupCopy
} from "@/lib/product-customization/upsell-copy";
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

  function toggleSingle(groupId: string, optionId: string) {
    setSelectedOptionsByGroupId((current) => ({
      ...current,
      [groupId]: [optionId]
    }));
    setConfirmError(null);
  }

  function toggleMultiple(
    groupId: string,
    optionId: string,
    maxSelections: number | null
  ) {
    setSelectedOptionsByGroupId((current) => {
      const existing = current[groupId] ?? [];
      const isSelected = existing.includes(optionId);

      if (isSelected) {
        return {
          ...current,
          [groupId]: existing.filter((id) => id !== optionId)
        };
      }

      if (maxSelections !== null && existing.length >= maxSelections) {
        return current;
      }

      return {
        ...current,
        [groupId]: [...existing, optionId]
      };
    });
    setConfirmError(null);
  }

  function toggleUpsell(productIdToToggle: string) {
    setSelectedUpsellProductIds((current) =>
      current.includes(productIdToToggle)
        ? current.filter((id) => id !== productIdToToggle)
        : [...current, productIdToToggle]
    );
    setConfirmError(null);
  }

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

  const ctaLabel = editingCartLineId ? "Actualizar carrito" : "Agregar al carrito";

  const upsellCopy =
    loadState.status === "ready" && loadState.config.upsellGroup
      ? getUpsellGroupCopy(loadState.config.upsellGroup.name)
      : null;

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="customization-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Personalizar</p>
            <h2 id="customization-modal-title">{productName}</h2>
            {loadState.status === "ready" ? (
              <p className={styles.basePrice}>
                Precio base {formatPublicCatalogCurrency(loadState.config.productPrice)}
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

              {loadState.config.groups.map((group) => {
                const selected = selectedOptionsByGroupId[group.id] ?? [];
                const groupIssue = issueByGroupId.get(group.id);

                return (
                  <section key={group.id} className={styles.group}>
                    <div className={styles.groupHeader}>
                      <h3>{group.name}</h3>
                      <span className={styles.groupMeta}>
                        {group.isRequired ? "Requerido" : "Opcional"}
                        {group.selectionType === "multiple" && group.minSelections > 0
                          ? ` · mín. ${group.minSelections}`
                          : null}
                        {group.selectionType === "multiple" && group.maxSelections !== null
                          ? ` · máx. ${group.maxSelections}`
                          : null}
                      </span>
                    </div>
                    {group.description ? (
                      <p className={styles.groupDescription}>{group.description}</p>
                    ) : null}

                    {group.isBlocked ? (
                      <p className={styles.groupError} role="alert">
                        No hay opciones disponibles para este grupo requerido.
                      </p>
                    ) : (
                      <ul className={styles.optionList}>
                        {group.options.map((option) => {
                          const checked = selected.includes(option.id);
                          const inputId = `${group.id}-${option.id}`;
                          const atMax =
                            group.selectionType === "multiple" &&
                            group.maxSelections !== null &&
                            selected.length >= group.maxSelections &&
                            !checked;

                          return (
                            <li key={option.id}>
                              <label
                                htmlFor={inputId}
                                className={`${styles.optionRow}${
                                  checked ? ` ${styles.optionRowSelected}` : ""
                                }`}
                              >
                                <input
                                  id={inputId}
                                  type={
                                    group.selectionType === "single" ? "radio" : "checkbox"
                                  }
                                  name={
                                    group.selectionType === "single"
                                      ? `group-${group.id}`
                                      : undefined
                                  }
                                  checked={checked}
                                  disabled={atMax}
                                  onChange={() => {
                                    if (group.selectionType === "single") {
                                      toggleSingle(group.id, option.id);
                                      return;
                                    }
                                    toggleMultiple(
                                      group.id,
                                      option.id,
                                      group.maxSelections
                                    );
                                  }}
                                />
                                <span className={styles.optionCopy}>
                                  <strong>{option.name}</strong>
                                  {option.description ? <small>{option.description}</small> : null}
                                </span>
                                {option.priceDelta > 0 ? (
                                  <span className={styles.optionDelta}>
                                    +{formatPublicCatalogCurrency(option.priceDelta)}
                                  </span>
                                ) : null}
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    {groupIssue ? (
                      <p className={styles.groupError} role="alert">
                        {groupIssue}
                      </p>
                    ) : null}
                  </section>
                );
              })}

              {loadState.config.upsellGroup && upsellCopy ? (
                <section className={styles.upsell}>
                  <div className={styles.groupHeader}>
                    <h3>{upsellCopy.title}</h3>
                    <span className={styles.groupMeta}>Opcional</span>
                  </div>
                  <p className={styles.groupDescription}>{upsellCopy.description}</p>
                  <ul className={styles.optionList}>
                    {loadState.config.upsellGroup.products.map((product) => {
                      const checked = selectedUpsellProductIds.includes(product.id);
                      const inputId = `upsell-${product.id}`;

                      return (
                        <li key={product.id}>
                          <label
                            htmlFor={inputId}
                            className={`${styles.optionRow}${
                              checked ? ` ${styles.optionRowSelected}` : ""
                            }`}
                          >
                            <input
                              id={inputId}
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleUpsell(product.id)}
                            />
                            <span className={styles.optionCopy}>
                              <strong>{product.name}</strong>
                            </span>
                            <span className={styles.optionDelta}>
                              {formatUpsellOptionPrice(
                                product.price,
                                formatPublicCatalogCurrency
                              )}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ) : null}
            </>
          ) : null}
        </div>

        {loadState.status === "ready" ? (
          <footer className={styles.footer}>
            <div className={styles.footerTotal}>
              <span>Total</span>
              <strong>{formatPublicCatalogCurrency(visualTotal)}</strong>
            </div>

            {confirmError ? (
              <p className={styles.groupError} role="alert">
                {confirmError}
              </p>
            ) : null}

            {!validation.valid && validation.issues.length > 0 ? (
              <p className={styles.footerHint}>Completá las opciones requeridas para continuar.</p>
            ) : null}

            <button
              type="button"
              className={styles.primaryButton}
              disabled={!validation.valid}
              onClick={handleConfirm}
            >
              {ctaLabel}
            </button>
          </footer>
        ) : null}
      </div>
    </div>
  );
}
