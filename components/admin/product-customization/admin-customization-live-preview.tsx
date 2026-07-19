"use client";

import { useEffect, useMemo, useState } from "react";
import CustomizationOptionGroup from "@/components/product-customization/shared/customization-option-group";
import CustomizationPriceSummary from "@/components/product-customization/shared/customization-price-summary";
import UpsellSuggestionGroup from "@/components/product-customization/shared/upsell-suggestion-group";
import sharedStyles from "@/components/product-customization/shared/customization-shared.module.css";
import {
  mapAdminCorpusToPreviewConfig,
  productHasDisableOverrides
} from "@/lib/product-customization/admin-preview-mapper";
import {
  pruneSelectedOptionsByGroupId,
  pruneSelectedUpsellProductIds,
  selectSingleOption,
  toggleMultipleOption,
  toggleUpsellProduct
} from "@/lib/product-customization/preview-selection";
import {
  computeVisualCustomizationTotal,
  formatPublicCatalogCurrency,
  validateCustomizationSelection
} from "@/lib/product-customization/public-shared";
import type {
  AdminCatalogProductOption,
  AdminCustomizationAssignment,
  AdminCustomizationGroup,
  AdminProductCustomizationOverride,
  AdminUpsellGroup
} from "@/lib/product-customization/shared";
import styles from "./product-customization-admin.module.css";

type Props = {
  product: AdminCatalogProductOption | null;
  groups: AdminCustomizationGroup[];
  assignments: AdminCustomizationAssignment[];
  upsellGroups: AdminUpsellGroup[];
  overrides: AdminProductCustomizationOverride[];
  collapsible?: boolean;
  defaultOpen?: boolean;
};

export default function AdminCustomizationLivePreview({
  product,
  groups,
  assignments,
  upsellGroups,
  overrides,
  collapsible = false,
  defaultOpen = true
}: Props) {
  const config = useMemo(
    () =>
      mapAdminCorpusToPreviewConfig({
        product,
        groups,
        assignments,
        upsellGroups,
        overrides
      }),
    [product, groups, assignments, upsellGroups, overrides]
  );

  const hasDisableOverrides = useMemo(
    () => (product ? productHasDisableOverrides(overrides, product.id) : false),
    [product, overrides]
  );

  const [selectedOptionsByGroupId, setSelectedOptionsByGroupId] = useState<
    Record<string, string[]>
  >({});
  const [selectedUpsellProductIds, setSelectedUpsellProductIds] = useState<string[]>(
    []
  );

  useEffect(() => {
    setSelectedOptionsByGroupId({});
    setSelectedUpsellProductIds([]);
  }, [product?.id]);

  useEffect(() => {
    if (!config) {
      setSelectedOptionsByGroupId({});
      setSelectedUpsellProductIds([]);
      return;
    }

    setSelectedOptionsByGroupId((current) =>
      pruneSelectedOptionsByGroupId(current, config.groups)
    );
    setSelectedUpsellProductIds((current) =>
      pruneSelectedUpsellProductIds(current, config.upsellGroup)
    );
  }, [config]);

  const validation = useMemo(() => {
    if (!config) {
      return { valid: true, issues: [] as { groupId: string; message: string }[] };
    }
    return validateCustomizationSelection(config.groups, selectedOptionsByGroupId);
  }, [config, selectedOptionsByGroupId]);

  const visualTotal = useMemo(() => {
    if (!config) {
      return 0;
    }
    return computeVisualCustomizationTotal({
      basePrice: config.productPrice,
      groups: config.groups,
      selectedOptionsByGroupId,
      upsellProducts: config.upsellGroup?.products ?? [],
      selectedUpsellProductIds
    });
  }, [config, selectedOptionsByGroupId, selectedUpsellProductIds]);

  const issueByGroupId = useMemo(() => {
    const map = new Map<string, string>();
    for (const issue of validation.issues) {
      map.set(issue.groupId, issue.message);
    }
    return map;
  }, [validation.issues]);

  const body = (
    <div className={styles.previewBody}>
      <p className={styles.previewNote}>
        {hasDisableOverrides
          ? "Vista previa del cliente según las excepciones de este producto · no agrega al carrito"
          : "Vista previa del cliente · no agrega productos reales al carrito"}
      </p>

      {!product || !config ? (
        <p className={styles.previewEmpty}>
          Elegí un producto a la izquierda para probar cómo verá el cliente las opciones.
        </p>
      ) : (
        <div className={styles.previewLiveShell}>
          <div className={styles.previewLiveHeader}>
            <p className={styles.previewLiveEyebrow}>Personalizar</p>
            <p className={styles.previewProductName}>{config.productName}</p>
            <p className={styles.previewProductPrice}>
              Precio base {formatPublicCatalogCurrency(config.productPrice)}
            </p>
          </div>

          <div className={styles.previewLiveBody}>
            {config.groups.length === 0 && !config.upsellGroup ? (
              <p className={styles.previewEmpty}>
                Este producto no tiene opciones ni plus configurados todavía.
              </p>
            ) : null}

            {config.groups.map((group) => (
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
                    return;
                  }
                  setSelectedOptionsByGroupId((current) =>
                    toggleMultipleOption(
                      current,
                      group.id,
                      optionId,
                      group.maxSelections
                    )
                  );
                }}
              />
            ))}

            {config.upsellGroup ? (
              <UpsellSuggestionGroup
                upsellGroup={config.upsellGroup}
                selectedProductIds={selectedUpsellProductIds}
                onToggleProduct={(upsellProductId) => {
                  setSelectedUpsellProductIds((current) =>
                    toggleUpsellProduct(current, upsellProductId)
                  );
                }}
              />
            ) : null}
          </div>

          <div className={styles.previewLiveFooter}>
            <CustomizationPriceSummary
              total={visualTotal}
              label="Total estimado"
              note="Vista previa. El pedido real se valida al finalizar la compra."
              incompleteHint={
                !validation.valid && validation.issues.length > 0
                  ? "Faltan opciones requeridas (solo aviso — la vista previa sigue usable)."
                  : null
              }
            >
              <button
                type="button"
                className={sharedStyles.previewCta}
                disabled
                aria-disabled="true"
              >
                Agregar al pedido
              </button>
              <p className={sharedStyles.previewCtaHint}>
                Solo vista previa · no agrega productos reales al carrito
              </p>
            </CustomizationPriceSummary>
          </div>
        </div>
      )}
    </div>
  );

  if (!collapsible) {
    return (
      <aside className={styles.previewPanel}>
        <div className={styles.previewHeader}>
          <h2 className={styles.panelTitle}>Vista previa del cliente</h2>
          <p className={styles.panelSubtitle}>
            {hasDisableOverrides
              ? "Soporte visual con las excepciones de este producto. No agrega productos reales al carrito."
              : "Probá cómo se verá la personalización. Esta vista no agrega productos reales al carrito."}
          </p>
        </div>
        {body}
      </aside>
    );
  }

  return (
    <details className={styles.previewPanel} open={defaultOpen}>
      <summary className={styles.previewSummary}>
        <span className={styles.panelTitle}>Vista previa del cliente</span>
        <span className={styles.panelSubtitleInline}>
          {hasDisableOverrides
            ? "Vista previa con excepciones"
            : "Solo vista previa · no agrega al carrito"}
        </span>
      </summary>
      {body}
    </details>
  );
}
