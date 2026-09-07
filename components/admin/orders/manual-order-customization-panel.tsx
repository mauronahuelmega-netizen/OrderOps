"use client";

import type { ManualOrderProductCustomizationConfig } from "@/lib/orders/manual-order-types";
import {
  computeVisualCustomizationTotal,
  formatPublicCatalogCurrency,
  validateCustomizationSelection,
  type PublicCustomizationGroup,
  type PublicCustomizationOption
} from "@/lib/product-customization/public-shared";
import {
  canIncrementOptionQuantity,
  decrementOptionQuantity,
  formatQuantityGroupMeta,
  getEffectiveAllowsOptionQuantity,
  getSelectedOptionQuantity,
  incrementOptionQuantity,
  isSelectionStrictlyWithinLimits,
  selectSingleOptionInV2,
  selectionV2ToLegacyOptionIds,
  setOptionQuantityInSelection,
  toggleMultipleOptionInV2,
  type CustomizationSelectionStateV2
} from "@/lib/product-customization/selection-v2";
import { UPSELL_ASSOCIATED_LABEL } from "@/lib/product-customization/upsell-copy";
import styles from "./manual-order-customization-panel.module.css";

const MIN_PARENT_QTY = 1;
const MAX_PARENT_QTY = 99;

export type ManualOrderCustomizationDraft = {
  productId: string;
  quantity: number;
  selection: CustomizationSelectionStateV2;
  selectedUpsellProductIds: string[];
};

export type ManualOrderCustomizationPanelProps = {
  productName: string;
  config: ManualOrderProductCustomizationConfig;
  draft: ManualOrderCustomizationDraft;
  onDraftChange: (draft: ManualOrderCustomizationDraft) => void;
  disabled?: boolean;
};

export function createEmptyManualOrderCustomizationDraft(
  productId: string
): ManualOrderCustomizationDraft {
  return {
    productId,
    quantity: MIN_PARENT_QTY,
    selection: {},
    selectedUpsellProductIds: []
  };
}

export function isManualOrderCustomizationDraftValid(
  config: ManualOrderProductCustomizationConfig,
  draft: ManualOrderCustomizationDraft
): boolean {
  const selectedOptionsByGroupId = selectionV2ToLegacyOptionIds(draft.selection);
  const validation = validateCustomizationSelection(
    config.groups,
    selectedOptionsByGroupId,
    draft.selection
  );
  if (!validation.valid) {
    return false;
  }
  return isSelectionStrictlyWithinLimits(config.groups, draft.selection);
}

export function getManualOrderCustomizationDraftPreviewTotal(
  config: ManualOrderProductCustomizationConfig,
  draft: ManualOrderCustomizationDraft
): number {
  const unitTotal = computeVisualCustomizationTotal({
    basePrice: config.productPrice,
    groups: config.groups,
    selectedOptionsByGroupId: selectionV2ToLegacyOptionIds(draft.selection),
    selectedQuantitiesByGroupId: draft.selection,
    upsellProducts: config.upsellGroup?.products ?? [],
    selectedUpsellProductIds: draft.selectedUpsellProductIds
  });
  const quantity = clampParentQuantity(draft.quantity);
  return unitTotal * quantity;
}

function clampParentQuantity(quantity: number): number {
  if (typeof quantity !== "number" || !Number.isFinite(quantity)) {
    return MIN_PARENT_QTY;
  }
  const floored = Math.floor(quantity);
  if (floored < MIN_PARENT_QTY) {
    return MIN_PARENT_QTY;
  }
  if (floored > MAX_PARENT_QTY) {
    return MAX_PARENT_QTY;
  }
  return floored;
}

function formatOptionDelta(priceDelta: number): string | null {
  if (priceDelta <= 0) {
    return null;
  }
  const formatted = formatPublicCatalogCurrency(priceDelta).replace(/,00$/, "");
  return `+${formatted}`;
}

function patchDraft(
  draft: ManualOrderCustomizationDraft,
  patch: Partial<ManualOrderCustomizationDraft>
): ManualOrderCustomizationDraft {
  return { ...draft, ...patch };
}

export default function ManualOrderCustomizationPanel({
  productName,
  config,
  draft,
  onDraftChange,
  disabled = false
}: ManualOrderCustomizationPanelProps) {
  const selectedOptionsByGroupId = selectionV2ToLegacyOptionIds(draft.selection);
  const validation = validateCustomizationSelection(
    config.groups,
    selectedOptionsByGroupId,
    draft.selection
  );
  const previewTotal = getManualOrderCustomizationDraftPreviewTotal(config, draft);
  const parentQty = clampParentQuantity(draft.quantity);
  const upsellProducts = config.upsellGroup?.products ?? [];
  const showUpsell = upsellProducts.length > 0;
  const firstIssue = validation.issues[0]?.message ?? null;

  function updateSelection(next: CustomizationSelectionStateV2) {
    onDraftChange(patchDraft(draft, { selection: next }));
  }

  function setParentQuantity(nextRaw: number) {
    const next = clampParentQuantity(nextRaw);
    if (next === parentQty) {
      return;
    }
    onDraftChange(patchDraft(draft, { quantity: next }));
  }

  function toggleUpsell(productId: string) {
    const selected = draft.selectedUpsellProductIds.includes(productId);
    const selectedUpsellProductIds = selected
      ? draft.selectedUpsellProductIds.filter((id) => id !== productId)
      : [...draft.selectedUpsellProductIds, productId];
    onDraftChange(patchDraft(draft, { selectedUpsellProductIds }));
  }

  return (
    <div className={styles.panel} data-disabled={disabled ? "true" : undefined}>
      <header className={styles.header}>
        <h3 className={styles.title}>Configurar {productName}</h3>
        <p className={styles.subcopy}>
          Elegí las opciones del pedido tomado en el local.
        </p>
        <p className={styles.basePrice}>
          Precio base {formatPublicCatalogCurrency(config.productPrice)}
        </p>
      </header>

      <section className={styles.quantitySection} aria-label="Cantidad del producto">
        <div className={styles.quantityLabelRow}>
          <span className={styles.quantityLabel}>Cantidad</span>
          <span className={styles.quantityHint}>1–99</span>
        </div>
        <div className={styles.stepper}>
          <button
            type="button"
            className={styles.stepperButton}
            aria-label="Restar cantidad"
            disabled={disabled || parentQty <= MIN_PARENT_QTY}
            onClick={() => setParentQuantity(parentQty - 1)}
          >
            −
          </button>
          <span className={styles.stepperValue} aria-live="polite">
            {parentQty}
          </span>
          <button
            type="button"
            className={styles.stepperButton}
            aria-label="Sumar cantidad"
            disabled={disabled || parentQty >= MAX_PARENT_QTY}
            onClick={() => setParentQuantity(parentQty + 1)}
          >
            +
          </button>
        </div>
      </section>

      <div className={styles.groups}>
        {config.groups.map((group) => (
          <GroupSection
            key={group.id}
            group={group}
            groups={config.groups}
            selection={draft.selection}
            issue={
              validation.issues.find((item) => item.groupId === group.id)?.message ??
              null
            }
            disabled={disabled}
            onSelectionChange={updateSelection}
          />
        ))}

        {showUpsell ? (
          <section className={styles.group} aria-label={UPSELL_ASSOCIATED_LABEL}>
            <div className={styles.groupHeader}>
              <h4 className={styles.groupTitle}>{UPSELL_ASSOCIATED_LABEL}</h4>
              <span className={styles.groupBadge}>Opcional</span>
            </div>
            {config.upsellGroup?.description ? (
              <p className={styles.groupDescription}>{config.upsellGroup.description}</p>
            ) : null}
            <ul className={styles.optionList}>
              {upsellProducts.map((product) => {
                const pressed = draft.selectedUpsellProductIds.includes(product.id);
                return (
                  <li key={product.id}>
                    <button
                      type="button"
                      className={[
                        styles.optionButton,
                        pressed ? styles.optionButtonPressed : ""
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      aria-pressed={pressed}
                      disabled={disabled}
                      onClick={() => toggleUpsell(product.id)}
                    >
                      <span className={styles.optionCopy}>
                        <span className={styles.optionName}>{product.name}</span>
                      </span>
                      <span className={styles.optionDelta}>
                        {formatPublicCatalogCurrency(product.price)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </div>

      <div className={styles.preview}>
        <div className={styles.previewRow}>
          <span className={styles.previewLabel}>Total estimado</span>
          <span className={styles.previewValue}>
            {formatPublicCatalogCurrency(previewTotal)}
          </span>
        </div>
        {!validation.valid && firstIssue ? (
          <p className={styles.validationMessage} role="status">
            {firstIssue}
          </p>
        ) : null}
      </div>
    </div>
  );
}

type GroupSectionProps = {
  group: PublicCustomizationGroup;
  groups: PublicCustomizationGroup[];
  selection: CustomizationSelectionStateV2;
  issue: string | null;
  disabled: boolean;
  onSelectionChange: (selection: CustomizationSelectionStateV2) => void;
};

function GroupSection({
  group,
  groups,
  selection,
  issue,
  disabled,
  onSelectionChange
}: GroupSectionProps) {
  const meta = formatQuantityGroupMeta(group);
  const allowsQty = getEffectiveAllowsOptionQuantity(group);

  if (group.isBlocked) {
    return (
      <section className={styles.group}>
        <div className={styles.groupHeader}>
          <h4 className={styles.groupTitle}>{group.name}</h4>
          <span className={styles.groupBadge}>{meta}</span>
        </div>
        <p className={styles.blockedMessage} role="alert">
          “{group.name}” no tiene opciones disponibles.
        </p>
      </section>
    );
  }

  return (
    <section className={styles.group}>
      <div className={styles.groupHeader}>
        <h4 className={styles.groupTitle}>{group.name}</h4>
        <span className={styles.groupBadge}>{meta}</span>
      </div>
      {group.description ? (
        <p className={styles.groupDescription}>{group.description}</p>
      ) : null}

      {allowsQty ? (
        <ul className={styles.qtyOptionList}>
          {group.options.map((option) => (
            <QuantityOptionRow
              key={option.id}
              group={group}
              groups={groups}
              option={option}
              selection={selection}
              disabled={disabled}
              onSelectionChange={onSelectionChange}
            />
          ))}
        </ul>
      ) : (
        <ul className={styles.optionList}>
          {group.options.map((option) => {
            const qty = getSelectedOptionQuantity(selection, group.id, option.id);
            const pressed = qty >= 1;
            const distinct = Object.keys(selection[group.id] ?? {}).filter((id) => {
              const value = selection[group.id]?.[id];
              return typeof value === "number" && Number.isFinite(value) && value >= 1;
            }).length;
            const atMax =
              group.selectionType === "multiple" &&
              group.maxSelections !== null &&
              distinct >= group.maxSelections &&
              !pressed;
            const deltaLabel = formatOptionDelta(option.priceDelta);

            return (
              <li key={option.id}>
                <button
                  type="button"
                  className={[
                    styles.optionButton,
                    pressed ? styles.optionButtonPressed : "",
                    atMax ? styles.optionButtonDisabled : ""
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-pressed={pressed}
                  disabled={disabled || atMax}
                  onClick={() => {
                    if (group.selectionType === "single") {
                      onSelectionChange(
                        selectSingleOptionInV2({
                          selection,
                          groups,
                          group,
                          optionId: option.id
                        })
                      );
                      return;
                    }
                    onSelectionChange(
                      toggleMultipleOptionInV2({
                        selection,
                        groups,
                        group,
                        optionId: option.id
                      })
                    );
                  }}
                >
                  <span className={styles.optionCopy}>
                    <span className={styles.optionName}>{option.name}</span>
                    {option.description ? (
                      <span className={styles.optionDescription}>
                        {option.description}
                      </span>
                    ) : null}
                  </span>
                  {deltaLabel ? (
                    <span className={styles.optionDelta}>{deltaLabel}</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {issue ? (
        <p className={styles.groupIssue} role="alert">
          {issue}
        </p>
      ) : null}
    </section>
  );
}

type QuantityOptionRowProps = {
  group: PublicCustomizationGroup;
  groups: PublicCustomizationGroup[];
  option: PublicCustomizationOption;
  selection: CustomizationSelectionStateV2;
  disabled: boolean;
  onSelectionChange: (selection: CustomizationSelectionStateV2) => void;
};

function QuantityOptionRow({
  group,
  groups,
  option,
  selection,
  disabled,
  onSelectionChange
}: QuantityOptionRowProps) {
  const qty = getSelectedOptionQuantity(selection, group.id, option.id);
  const selected = qty >= 1;
  const canPlus = canIncrementOptionQuantity({
    selection,
    group,
    optionId: option.id
  });
  const deltaLabel = formatOptionDelta(option.priceDelta);

  return (
    <li
      className={[styles.qtyOptionCard, selected ? styles.qtyOptionCardSelected : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={styles.qtyOptionTop}>
        <button
          type="button"
          className={styles.qtyOptionToggle}
          aria-pressed={selected}
          disabled={disabled || (!selected && !canPlus)}
          onClick={() => {
            if (selected) {
              onSelectionChange(
                setOptionQuantityInSelection({
                  selection,
                  group,
                  optionId: option.id,
                  quantity: 0
                })
              );
              return;
            }
            onSelectionChange(
              incrementOptionQuantity({
                selection,
                groups,
                group,
                optionId: option.id
              })
            );
          }}
        >
          <span className={styles.optionName}>{option.name}</span>
          <span className={styles.optionDelta}>{deltaLabel ?? "Sin costo"}</span>
        </button>
      </div>

      {selected ? (
        <div className={styles.stepper}>
          <button
            type="button"
            className={styles.stepperButton}
            aria-label={`Quitar una unidad de ${option.name}`}
            disabled={disabled}
            onClick={() => {
              onSelectionChange(
                decrementOptionQuantity({
                  selection,
                  groups,
                  group,
                  optionId: option.id
                })
              );
            }}
          >
            −
          </button>
          <span className={styles.stepperValue} aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            className={styles.stepperButton}
            aria-label={`Sumar una unidad de ${option.name}`}
            disabled={disabled || !canPlus}
            onClick={() => {
              onSelectionChange(
                incrementOptionQuantity({
                  selection,
                  groups,
                  group,
                  optionId: option.id
                })
              );
            }}
          >
            +
          </button>
        </div>
      ) : null}
    </li>
  );
}
