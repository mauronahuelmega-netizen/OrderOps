"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition
} from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import {
  disableProductCustomizationGroupOverrideAction,
  disableProductCustomizationOptionOverrideAction,
  loadProductCustomizationInheritanceAction,
  restoreProductCustomizationGroupOverrideAction,
  restoreProductCustomizationOptionOverrideAction
} from "@/app/admin/(protected)/products/customizations/actions";
import {
  formatCustomizationPriceDelta,
  type ProductCustomizationInheritance,
  type ProductCustomizationInheritanceGroup,
  type ProductCustomizationInheritanceOption
} from "@/lib/product-customization/shared";
import styles from "./product-customization-admin.module.css";

type ActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

const initialState: ActionState = {};

export type CustomizationBaselineReport = {
  productId: string;
  hiddenGroupIds: string[];
  hiddenOptionIds: string[];
  loadState: "ready" | "empty";
};

type Props = {
  productId: string;
  productName?: string;
  mode?: "immediate" | "draft";
  /** Draft-mode inspect only: accordion stays operable; visibility toggles are inert. */
  readOnly?: boolean;
  hiddenGroupIds?: readonly string[];
  hiddenOptionIds?: readonly string[];
  onToggleGroupHidden?: (groupId: string) => void;
  onToggleOptionHidden?: (optionId: string) => void;
  onCustomizationBaseline?: (report: CustomizationBaselineReport) => void;
  onCustomizationLoadError?: (productId: string, error: string) => void;
  onCustomizationLoading?: (productId: string) => void;
};

function formatExceptionCount(count: number): string {
  if (count === 1) {
    return "1 excepción";
  }
  return `${count} excepciones`;
}

function formatOptionCount(count: number): string {
  if (count === 1) {
    return "1 opción";
  }
  return `${count} opciones`;
}

function formatSectionCount(count: number): string {
  if (count === 1) {
    return "1 sección";
  }
  return `${count} secciones`;
}

function formatHiddenCount(count: number): string {
  if (count === 1) {
    return "1 oculta";
  }
  return `${count} ocultas`;
}

function collectDisabledIdsFromInheritance(
  inheritance: ProductCustomizationInheritance
): { hiddenGroupIds: string[]; hiddenOptionIds: string[] } {
  const hiddenGroupIds: string[] = [];
  const hiddenOptionIds: string[] = [];

  for (const group of inheritance.groups) {
    if (group.isDisabledForProduct) {
      hiddenGroupIds.push(group.groupId);
    }
    for (const option of group.options) {
      if (option.isDisabledForProduct) {
        hiddenOptionIds.push(option.optionId);
      }
    }
  }

  return { hiddenGroupIds, hiddenOptionIds };
}

export default function ProductCustomizationOverridesPanel({
  productId,
  productName,
  mode = "immediate",
  readOnly = false,
  hiddenGroupIds,
  hiddenOptionIds,
  onToggleGroupHidden,
  onToggleOptionHidden,
  onCustomizationBaseline,
  onCustomizationLoadError,
  onCustomizationLoading
}: Props) {
  const router = useRouter();
  const reactId = useId();
  const advancedPanelId = `${reactId}-advanced-panel`;
  const [inheritance, setInheritance] = useState<ProductCustomizationInheritance | null>(
    null
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [, startLoad] = useTransition();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  const isDraftMode = mode === "draft";

  const hiddenGroupIdSet = useMemo(
    () => new Set(hiddenGroupIds ?? []),
    [hiddenGroupIds]
  );
  const hiddenOptionIdSet = useMemo(
    () => new Set(hiddenOptionIds ?? []),
    [hiddenOptionIds]
  );

  // Stable callback refs so load runs once per productId (not on parent re-renders).
  const onCustomizationBaselineRef = useRef(onCustomizationBaseline);
  const onCustomizationLoadErrorRef = useRef(onCustomizationLoadError);
  const onCustomizationLoadingRef = useRef(onCustomizationLoading);
  onCustomizationBaselineRef.current = onCustomizationBaseline;
  onCustomizationLoadErrorRef.current = onCustomizationLoadError;
  onCustomizationLoadingRef.current = onCustomizationLoading;

  const reloadImmediate = useCallback(() => {
    startLoad(async () => {
      const result = await loadProductCustomizationInheritanceAction(productId);
      if (!result.ok) {
        setLoadError(result.error);
        setInheritance(null);
        return;
      }
      setLoadError(null);
      setInheritance(result.data);
    });
  }, [productId]);

  useEffect(() => {
    let cancelled = false;

    setInheritance(null);
    setLoadError(null);
    onCustomizationLoadingRef.current?.(productId);

    startLoad(async () => {
      const result = await loadProductCustomizationInheritanceAction(productId);
      if (cancelled) {
        return;
      }

      if (!result.ok) {
        setLoadError(result.error);
        setInheritance(null);
        onCustomizationLoadErrorRef.current?.(productId, result.error);
        return;
      }

      setLoadError(null);
      setInheritance(result.data);

      const baseline = onCustomizationBaselineRef.current;
      if (baseline) {
        const disabled = collectDisabledIdsFromInheritance(result.data);
        baseline({
          productId,
          hiddenGroupIds: disabled.hiddenGroupIds,
          hiddenOptionIds: disabled.hiddenOptionIds,
          loadState: result.data.groups.length === 0 ? "empty" : "ready"
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [productId]);

  // Accordion UI state must not leak across products (panel may stay mounted).
  useEffect(() => {
    setAdvancedOpen(false);
    setExpandedGroupId(null);
  }, [productId]);

  const displayName = (
    productName?.trim() ||
    inheritance?.productName?.trim() ||
    "este producto"
  );

  const exceptionCount = useMemo(() => {
    if (isDraftMode) {
      return hiddenGroupIdSet.size + hiddenOptionIdSet.size;
    }

    if (!inheritance) {
      return 0;
    }

    let count = 0;
    for (const group of inheritance.groups) {
      if (group.isDisabledForProduct) {
        count += 1;
      }
      for (const option of group.options) {
        if (option.isDisabledForProduct) {
          count += 1;
        }
      }
    }
    return count;
  }, [isDraftMode, inheritance, hiddenGroupIdSet, hiddenOptionIdSet]);

  const sectionCount = inheritance?.groups.length ?? 0;
  const optionTotalCount = useMemo(() => {
    if (!inheritance) {
      return 0;
    }
    let total = 0;
    for (const group of inheritance.groups) {
      total += group.options.length;
    }
    return total;
  }, [inheritance]);

  const panelClassName = [
    styles.productPanel,
    styles.exceptionsPanel,
    isDraftMode ? styles.editHierarchy : ""
  ]
    .filter(Boolean)
    .join(" ");

  const toggleAdvanced = () => {
    setAdvancedOpen((prev) => {
      if (prev) {
        setExpandedGroupId(null);
      }
      return !prev;
    });
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroupId((prev) => (prev === groupId ? null : groupId));
  };

  // Pending readiness: first paint + in-flight load share the same disabled shell.
  // Do not gate on isLoading alone — useTransition is false before the effect starts.
  if (!inheritance && !loadError) {
    return (
      <section
        className={panelClassName}
        aria-label="Ajustes avanzados de personalización"
        data-level="advanced"
        data-loading="true"
        aria-busy="true"
      >
        <button
          type="button"
          className={`${styles.advancedDisclosure} ${styles.advancedDisclosureLoading}`}
          disabled
          aria-busy="true"
          aria-expanded="false"
        >
          <span className={styles.advancedDisclosureCopy}>
            <span className={styles.advancedDisclosureLabel}>Avanzado…</span>
          </span>
          <ChevronDown
            className={styles.advancedChevron}
            aria-hidden="true"
            size={18}
            strokeWidth={2}
          />
        </button>
        <span className={styles.visuallyHidden} role="status">
          Cargando ajustes avanzados
        </span>
      </section>
    );
  }

  if (loadError && !inheritance) {
    return (
      <section
        className={panelClassName}
        aria-label="Ajustes avanzados de personalización"
        data-level="advanced"
        data-error="true"
      >
        <button
          type="button"
          className={`${styles.advancedDisclosure} ${styles.advancedDisclosureLoading}`}
          disabled
          aria-expanded="false"
        >
          <span className={styles.advancedDisclosureCopy}>
            <span className={styles.advancedDisclosureLabel}>Avanzado</span>
          </span>
          <ChevronDown
            className={styles.advancedChevron}
            aria-hidden="true"
            size={18}
            strokeWidth={2}
          />
        </button>
        <p className="admin-feedback admin-feedback--error" role="alert">
          {loadError}
        </p>
      </section>
    );
  }

  // Empty-valid: preserve structural Advanced row (do not disappear after load).
  if (inheritance && inheritance.groups.length === 0) {
    return (
      <section
        className={panelClassName}
        aria-label="Ajustes avanzados de personalización"
        data-level="advanced"
        data-empty="true"
      >
        <button
          type="button"
          className={`${styles.advancedDisclosure} ${styles.advancedDisclosureEmpty}`}
          disabled
          aria-expanded="false"
        >
          <span className={styles.advancedDisclosureCopy}>
            <span className={styles.advancedDisclosureLabel}>Avanzado</span>
            <span className={styles.advancedEmptyStatus}>Sin ajustes</span>
          </span>
          <ChevronDown
            className={styles.advancedChevron}
            aria-hidden="true"
            size={18}
            strokeWidth={2}
          />
        </button>
        <span className={styles.visuallyHidden}>
          No hay ajustes avanzados disponibles para este producto.
        </span>
      </section>
    );
  }

  // Loading / error branches above should always resolve inheritance;
  // defensive guard keeps TS + runtime safe.
  if (!inheritance) {
    return null;
  }

  const collapsedHiddenLabel =
    isDraftMode && exceptionCount > 0
      ? formatHiddenCount(exceptionCount)
      : exceptionCount > 0
        ? formatExceptionCount(exceptionCount)
        : null;

  return (
    <section
      className={panelClassName}
      aria-label="Ajustes avanzados de personalización"
      data-level="advanced"
    >
      <button
        type="button"
        className={styles.advancedDisclosure}
        aria-expanded={advancedOpen}
        aria-controls={advancedPanelId}
        onClick={toggleAdvanced}
      >
        <span className={styles.advancedDisclosureCopy}>
          <span className={styles.advancedDisclosureLabel}>Avanzado</span>
          {collapsedHiddenLabel ? (
            <span className={styles.advancedExceptionCount}>{collapsedHiddenLabel}</span>
          ) : null}
        </span>
        <ChevronDown
          className={`${styles.advancedChevron}${
            advancedOpen ? ` ${styles.advancedChevronOpen}` : ""
          }`}
          aria-hidden="true"
          size={18}
          strokeWidth={2}
        />
      </button>

      {(() => {
        const advancedBody = (
          <div id={advancedPanelId} className={styles.advancedPanel}>
            <p className={styles.advancedHelper}>
              Ocultá secciones u opciones solo para este producto. La configuración
              general no cambia.
            </p>

            {isDraftMode ? (
              <p className={styles.advancedSummary}>
                {formatSectionCount(sectionCount)}
                {" · "}
                {formatOptionCount(optionTotalCount)}
              </p>
            ) : null}

            <div className={styles.advancedGroups}>
              {inheritance.groups.map((group) =>
                isDraftMode ? (
                  <DraftInheritanceGroupAccordion
                    key={group.groupId}
                    productName={displayName}
                    group={group}
                    panelIdPrefix={reactId}
                    expanded={expandedGroupId === group.groupId}
                    onToggle={() => toggleGroup(group.groupId)}
                    isGroupHidden={hiddenGroupIdSet.has(group.groupId)}
                    hiddenOptionIds={hiddenOptionIdSet}
                    readOnly={readOnly}
                    onToggleGroupHidden={() => {
                      if (readOnly) {
                        return;
                      }
                      onToggleGroupHidden?.(group.groupId);
                    }}
                    onToggleOptionHidden={(optionId) => {
                      if (readOnly) {
                        return;
                      }
                      onToggleOptionHidden?.(optionId);
                    }}
                  />
                ) : (
                  <ImmediateInheritanceGroupAccordion
                    key={group.groupId}
                    productId={productId}
                    productName={displayName}
                    group={group}
                    panelIdPrefix={reactId}
                    expanded={expandedGroupId === group.groupId}
                    onToggle={() => toggleGroup(group.groupId)}
                    onChanged={() => {
                      reloadImmediate();
                      router.refresh();
                    }}
                  />
                )
              )}
            </div>
          </div>
        );

        // Edit draft: keep mounted for CSS height reveal + inert when closed.
        // Immediate/builder: preserve unmount semantics (no motion).
        if (isDraftMode) {
          return (
            <div
              className={styles.disclosureMotion}
              data-motion="advanced"
              data-open={advancedOpen ? "true" : "false"}
            >
              <div
                className={styles.disclosureMotionClip}
                inert={!advancedOpen ? true : undefined}
                aria-hidden={!advancedOpen}
              >
                <div className={styles.disclosureMotionInner}>{advancedBody}</div>
              </div>
            </div>
          );
        }

        return advancedOpen ? advancedBody : null;
      })()}
    </section>
  );
}

function ImmediateInheritanceGroupAccordion({
  productId,
  productName,
  group,
  panelIdPrefix,
  expanded,
  onToggle,
  onChanged
}: {
  productId: string;
  productName: string;
  group: ProductCustomizationInheritanceGroup;
  panelIdPrefix: string;
  expanded: boolean;
  onToggle: () => void;
  onChanged: () => void;
}) {
  const optionsPanelId = `${panelIdPrefix}-group-${group.groupId}-options`;
  const [disableState, disableAction, isDisabling] = useActionState(
    disableProductCustomizationGroupOverrideAction,
    initialState
  );
  const [restoreState, restoreAction, isRestoring] = useActionState(
    restoreProductCustomizationGroupOverrideAction,
    initialState
  );

  useEffect(() => {
    if (disableState.success || restoreState.success) {
      onChanged();
    }
    // Intentionally omit onChanged: parent recreates it each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disableState.success, restoreState.success]);

  const actionError = disableState.error || restoreState.error;
  const hideLabel = `Ocultar ${group.groupName} solo en ${productName}`;
  const restoreLabel = `Volver a mostrar ${group.groupName} en ${productName}`;
  const isPending = isDisabling || isRestoring;
  const sourceLabel =
    group.source === "category"
      ? "Aplicado desde categoría"
      : "Propia de este producto";
  const metaParts = [
    formatOptionCount(group.options.length),
    sourceLabel,
    !group.assignmentEnabled ? "sección oculta en la asignación" : null
  ].filter(Boolean);

  return (
    <div className={styles.advancedGroup}>
      <div className={styles.advancedGroupRow}>
        <button
          type="button"
          className={styles.groupDisclosure}
          aria-expanded={expanded}
          aria-controls={optionsPanelId}
          onClick={onToggle}
        >
          <span className={styles.groupDisclosureCopy}>
            <span className={styles.groupDisclosureName}>{group.groupName}</span>
            <span className={styles.groupDisclosureMeta}>{metaParts.join(" · ")}</span>
          </span>
          <ChevronDown
            className={`${styles.advancedChevron}${
              expanded ? ` ${styles.advancedChevronOpen}` : ""
            }`}
            aria-hidden="true"
            size={18}
            strokeWidth={2}
          />
        </button>

        <form
          action={group.isDisabledForProduct ? restoreAction : disableAction}
          className={styles.visibilityForm}
        >
          <input type="hidden" name="product_id" value={productId} />
          <input type="hidden" name="group_id" value={group.groupId} />
          <button
            type="submit"
            className={`${styles.visibilityAction}${
              group.isDisabledForProduct ? ` ${styles.visibilityActionHidden}` : ""
            }`}
            disabled={isPending}
            aria-label={group.isDisabledForProduct ? restoreLabel : hideLabel}
            aria-busy={isPending || undefined}
          >
            {group.isDisabledForProduct ? (
              <EyeOff aria-hidden="true" size={18} strokeWidth={2} />
            ) : (
              <Eye aria-hidden="true" size={18} strokeWidth={2} />
            )}
          </button>
        </form>
      </div>

      {expanded ? (
        <div id={optionsPanelId} className={styles.groupOptions}>
          {group.options.length === 0 ? (
            <p className={styles.emptyOptions}>
              Esta sección todavía no tiene opciones para ajustar.
            </p>
          ) : (
            group.options.map((option) => (
              <ImmediateInheritanceOptionRow
                key={option.optionId}
                productId={productId}
                productName={productName}
                groupId={group.groupId}
                option={option}
                onChanged={onChanged}
              />
            ))
          )}
        </div>
      ) : null}

      {actionError ? (
        <p className="admin-feedback admin-feedback--error" role="alert">
          {actionError}
        </p>
      ) : null}
    </div>
  );
}

function ImmediateInheritanceOptionRow({
  productId,
  productName,
  groupId,
  option,
  onChanged
}: {
  productId: string;
  productName: string;
  groupId: string;
  option: ProductCustomizationInheritanceOption;
  onChanged: () => void;
}) {
  const [disableState, disableAction, isDisabling] = useActionState(
    disableProductCustomizationOptionOverrideAction,
    initialState
  );
  const [restoreState, restoreAction, isRestoring] = useActionState(
    restoreProductCustomizationOptionOverrideAction,
    initialState
  );

  useEffect(() => {
    if (disableState.success || restoreState.success) {
      onChanged();
    }
    // Intentionally omit onChanged: parent recreates it each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disableState.success, restoreState.success]);

  const actionError = disableState.error || restoreState.error;
  const hideLabel = `Ocultar ${option.optionName} solo en ${productName}`;
  const restoreLabel = `Volver a mostrar ${option.optionName} en ${productName}`;
  const isPending = isDisabling || isRestoring;
  const priceLabel = formatCustomizationPriceDelta(option.priceDelta);
  const metaSuffix = !option.optionAvailable ? " · oculta en la sección" : "";

  return (
    <div className={styles.optionOverrideRow}>
      <div className={styles.optionOverrideCopy}>
        <span className={styles.optionOverrideName}>{option.optionName}</span>
        <span className={styles.optionOverrideMeta}>
          {" · "}
          {priceLabel}
          {metaSuffix}
        </span>
      </div>

      <form
        action={option.isDisabledForProduct ? restoreAction : disableAction}
        className={styles.visibilityForm}
      >
        <input type="hidden" name="product_id" value={productId} />
        {!option.isDisabledForProduct ? (
          <input type="hidden" name="group_id" value={groupId} />
        ) : null}
        <input type="hidden" name="option_id" value={option.optionId} />
        <button
          type="submit"
          className={`${styles.visibilityAction}${
            option.isDisabledForProduct ? ` ${styles.visibilityActionHidden}` : ""
          }`}
          disabled={isPending}
          aria-label={option.isDisabledForProduct ? restoreLabel : hideLabel}
          aria-busy={isPending || undefined}
        >
          {option.isDisabledForProduct ? (
            <EyeOff aria-hidden="true" size={18} strokeWidth={2} />
          ) : (
            <Eye aria-hidden="true" size={18} strokeWidth={2} />
          )}
        </button>
      </form>

      {actionError ? (
        <p className="admin-feedback admin-feedback--error" role="alert">
          {actionError}
        </p>
      ) : null}
    </div>
  );
}

function DraftInheritanceGroupAccordion({
  productName,
  group,
  panelIdPrefix,
  expanded,
  onToggle,
  isGroupHidden,
  hiddenOptionIds,
  readOnly,
  onToggleGroupHidden,
  onToggleOptionHidden
}: {
  productName: string;
  group: ProductCustomizationInheritanceGroup;
  panelIdPrefix: string;
  expanded: boolean;
  onToggle: () => void;
  isGroupHidden: boolean;
  hiddenOptionIds: ReadonlySet<string>;
  readOnly: boolean;
  onToggleGroupHidden: () => void;
  onToggleOptionHidden: (optionId: string) => void;
}) {
  const optionsPanelId = `${panelIdPrefix}-group-${group.groupId}-options`;
  const hideLabel = `Ocultar ${group.groupName} solo en ${productName}`;
  const restoreLabel = `Volver a mostrar ${group.groupName} en ${productName}`;
  const sourceLabel =
    group.source === "category"
      ? "Aplicado desde categoría"
      : "Propia de este producto";
  const metaParts = [
    formatOptionCount(group.options.length),
    sourceLabel,
    !group.assignmentEnabled ? "sección oculta en la asignación" : null
  ].filter(Boolean);

  return (
    <div
      className={styles.advancedGroup}
      data-level="group"
      data-expanded={expanded ? "true" : "false"}
      data-hidden={isGroupHidden ? "true" : "false"}
    >
      <div className={`${styles.advancedGroupRow} ${styles.groupHeader}`}>
        <button
          type="button"
          className={styles.groupDisclosure}
          aria-expanded={expanded}
          aria-controls={optionsPanelId}
          onClick={onToggle}
        >
          <span className={styles.groupDisclosureCopy}>
            <span className={styles.groupDisclosureTitleRow}>
              <span className={styles.groupDisclosureName}>{group.groupName}</span>
              {isGroupHidden ? (
                <span className={styles.hiddenBadge} aria-hidden="true">
                  Oculta
                </span>
              ) : null}
            </span>
            <span className={styles.groupDisclosureMeta}>{metaParts.join(" · ")}</span>
          </span>
          <ChevronDown
            className={`${styles.groupChevron}${
              expanded ? ` ${styles.groupChevronOpen}` : ""
            }`}
            aria-hidden="true"
            size={16}
            strokeWidth={2}
          />
        </button>

        <div className={styles.visibilityForm}>
          <button
            type="button"
            className={`${styles.visibilityAction}${
              isGroupHidden ? ` ${styles.visibilityActionHidden}` : ""
            }${readOnly ? ` ${styles.visibilityActionLocked}` : ""}`}
            onClick={() => {
              if (readOnly) {
                return;
              }
              onToggleGroupHidden();
            }}
            disabled={readOnly}
            aria-disabled={readOnly || undefined}
            aria-label={isGroupHidden ? restoreLabel : hideLabel}
          >
            {isGroupHidden ? (
              <EyeOff aria-hidden="true" size={18} strokeWidth={2} />
            ) : (
              <Eye aria-hidden="true" size={18} strokeWidth={2} />
            )}
          </button>
        </div>
      </div>

      <div
        className={styles.disclosureMotion}
        data-motion="group"
        data-open={expanded ? "true" : "false"}
      >
        <div
          className={styles.disclosureMotionClip}
          inert={!expanded ? true : undefined}
          aria-hidden={!expanded}
        >
          <div className={styles.disclosureMotionInner}>
            <div id={optionsPanelId} className={styles.groupOptions} data-level="options">
              {isGroupHidden ? (
                <p className={styles.groupHiddenHelper}>
                  Mostrá la sección para editar sus opciones.
                </p>
              ) : null}
              {group.options.length === 0 ? (
                <p className={styles.emptyOptions}>
                  Esta sección todavía no tiene opciones para ajustar.
                </p>
              ) : (
                <div className={styles.optionList}>
                  {group.options.map((option) => (
                    <DraftInheritanceOptionRow
                      key={option.optionId}
                      productName={productName}
                      option={option}
                      isOptionHidden={hiddenOptionIds.has(option.optionId)}
                      parentGroupHidden={isGroupHidden}
                      readOnly={readOnly}
                      onToggleOptionHidden={() => {
                        if (readOnly || isGroupHidden) {
                          return;
                        }
                        onToggleOptionHidden(option.optionId);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DraftInheritanceOptionRow({
  productName,
  option,
  isOptionHidden,
  parentGroupHidden,
  readOnly,
  onToggleOptionHidden
}: {
  productName: string;
  option: ProductCustomizationInheritanceOption;
  isOptionHidden: boolean;
  parentGroupHidden: boolean;
  readOnly: boolean;
  onToggleOptionHidden: () => void;
}) {
  const hideLabel = `Ocultar ${option.optionName} solo en ${productName}`;
  const restoreLabel = `Volver a mostrar ${option.optionName} en ${productName}`;
  const priceLabel = formatCustomizationPriceDelta(option.priceDelta);
  const metaSuffix = !option.optionAvailable ? " · oculta en la sección" : "";
  const controlsLocked = readOnly || parentGroupHidden;

  return (
    <div
      className={styles.optionOverrideRow}
      data-level="option"
      data-hidden={isOptionHidden ? "true" : "false"}
      data-parent-hidden={parentGroupHidden ? "true" : "false"}
    >
      <div className={styles.optionOverridePrimary}>
        <span className={styles.optionOverrideName}>{option.optionName}</span>
        {isOptionHidden ? (
          <span className={styles.hiddenBadge} aria-hidden="true">
            Oculta
          </span>
        ) : null}
        {metaSuffix ? (
          <span className={styles.optionOverrideMeta}>{metaSuffix}</span>
        ) : null}
      </div>

      <span className={styles.optionOverridePrice}>{priceLabel}</span>

      <div className={styles.visibilityForm}>
        <button
          type="button"
          className={`${styles.visibilityAction}${
            isOptionHidden ? ` ${styles.visibilityActionHidden}` : ""
          }${controlsLocked ? ` ${styles.visibilityActionLocked}` : ""}`}
          onClick={() => {
            if (controlsLocked) {
              return;
            }
            onToggleOptionHidden();
          }}
          disabled={controlsLocked}
          aria-disabled={controlsLocked || undefined}
          aria-label={
            readOnly
              ? isOptionHidden
                ? `${option.optionName}: oculta`
                : `${option.optionName}: visible`
              : controlsLocked
                ? isOptionHidden
                  ? `${option.optionName}: oculta (mostrá la sección para editar)`
                  : `${option.optionName}: visible (mostrá la sección para editar)`
                : isOptionHidden
                  ? restoreLabel
                  : hideLabel
          }
        >
          {isOptionHidden ? (
            <EyeOff aria-hidden="true" size={18} strokeWidth={2} />
          ) : (
            <Eye aria-hidden="true" size={18} strokeWidth={2} />
          )}
        </button>
      </div>
    </div>
  );
}
