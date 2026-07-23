"use client";

import { useActionState, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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

type Props = {
  productId: string;
  productName?: string;
};

function formatActiveCount(count: number): string {
  if (count === 0) {
    return "0 excepciones activas";
  }
  if (count === 1) {
    return "1 excepción activa";
  }
  return `${count} excepciones activas`;
}

export default function ProductCustomizationOverridesPanel({
  productId,
  productName
}: Props) {
  const router = useRouter();
  const [inheritance, setInheritance] = useState<ProductCustomizationInheritance | null>(
    null
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, startLoad] = useTransition();

  const reload = useCallback(() => {
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
    reload();
  }, [reload]);

  const displayName = productName?.trim() || inheritance?.productName || "este producto";

  const exceptionSummary = useMemo(() => {
    if (!inheritance) {
      return { count: 0, labels: [] as string[] };
    }

    const labels: string[] = [];
    for (const group of inheritance.groups) {
      if (group.isDisabledForProduct) {
        labels.push(group.groupName);
      }
      for (const option of group.options) {
        if (option.isDisabledForProduct) {
          labels.push(option.optionName);
        }
      }
    }

    return { count: labels.length, labels };
  }, [inheritance]);

  const optionRows = useMemo(() => {
    if (!inheritance) {
      return [] as Array<{
        group: ProductCustomizationInheritanceGroup;
        option: ProductCustomizationInheritanceOption;
      }>;
    }

    return inheritance.groups.flatMap((group) =>
      group.options.map((option) => ({ group, option }))
    );
  }, [inheritance]);

  return (
    <section
      className={`${styles.productPanel} ${styles.exceptionsPanel}`}
      aria-labelledby="product-customization-panel-title"
    >
      <div className={styles.productPanelHeader}>
        <div>
          <div className={styles.blockTitleRow}>
            <h3 id="product-customization-panel-title" className={styles.optionsTitle}>
              Ajustes propios de este producto
            </h3>
            <span className={styles.advancedBadge}>Avanzado</span>
          </div>
          <p className={styles.groupSummary}>
            Ocultá secciones u opciones solo para {displayName} cuando necesite
            comportarse distinto al resto.
          </p>
          <p className={styles.helperText}>
            Esto no cambia la configuración de otros productos.
          </p>
        </div>
      </div>

      {isLoading && !inheritance ? (
        <p className={styles.emptyOptions}>Cargando ajustes…</p>
      ) : null}

      {loadError ? (
        <p className="admin-feedback admin-feedback--error" role="alert">
          {loadError}
        </p>
      ) : null}

      {inheritance ? (
        <>
          <div className={styles.exceptionsSummary}>
            <div className={styles.blockTitleRow}>
              <span className={styles.softChip}>
                {formatActiveCount(exceptionSummary.count)}
              </span>
              {exceptionSummary.count === 0 ? (
                <span className={styles.softChip}>Usa configuración general</span>
              ) : null}
            </div>
            {exceptionSummary.count > 0 ? (
              <p className={styles.summaryLine}>
                <span className={styles.summaryLabel}>Oculto solo aquí</span>
                {exceptionSummary.labels.join(" · ")}
              </p>
            ) : (
              <p className={styles.helperText}>
                Sin excepciones todavía. Este producto usa la configuración general.
                Ocultá algo solo si necesita comportarse distinto.
              </p>
            )}
            {inheritance.categoryName ? (
              <p className={styles.helperText}>
                Categoría: {inheritance.categoryName}
              </p>
            ) : (
              <p className={styles.helperText}>
                Sin categoría — solo se muestran secciones asignadas a este producto.
              </p>
            )}
          </div>

          {inheritance.groups.length === 0 ? (
            <div className={styles.builderEmptyMuted}>
              <h3>No hay secciones disponibles para ajustar</h3>
              <p>
                Primero asigná secciones por categoría o por producto. Después vas a
                poder crear excepciones.
              </p>
            </div>
          ) : (
            <div className={styles.exceptionsStacks}>
              <div className={styles.exceptionsStack}>
                <div className={styles.paneHeader}>
                  <h4 className={styles.exceptionsStackTitle}>Secciones</h4>
                  <p className={styles.helperText}>
                    Ocultá una sección completa solo en este producto.
                  </p>
                </div>
                <div className={styles.exceptionsRows}>
                  {inheritance.groups.map((group) => (
                    <InheritanceGroupRow
                      key={group.groupId}
                      productId={productId}
                      group={group}
                      onChanged={() => {
                        reload();
                        router.refresh();
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className={styles.exceptionsStack}>
                <div className={styles.paneHeader}>
                  <h4 className={styles.exceptionsStackTitle}>Opciones</h4>
                  <p className={styles.helperText}>
                    Ocultá una opción puntual sin ocultar toda la sección.
                  </p>
                </div>
                {optionRows.length === 0 ? (
                  <p className={styles.emptyOptions}>
                    Estas secciones todavía no tienen opciones para ajustar.
                  </p>
                ) : (
                  <div className={styles.exceptionsRows}>
                    {optionRows.map(({ group, option }) => (
                      <InheritanceOptionRow
                        key={option.optionId}
                        productId={productId}
                        groupId={group.groupId}
                        groupName={group.groupName}
                        option={option}
                        onChanged={() => {
                          reload();
                          router.refresh();
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}

function InheritanceGroupRow({
  productId,
  group,
  onChanged
}: {
  productId: string;
  group: ProductCustomizationInheritanceGroup;
  onChanged: () => void;
}) {
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

  return (
    <div className={styles.exceptionRow}>
      <div className={styles.exceptionRowMain}>
        <div className={styles.exceptionRowCopy}>
          <p className={styles.optionName}>{group.groupName}</p>
          <p className={styles.optionPrice}>
            {group.source === "category"
              ? "Aplicado desde categoría"
              : "Propia de este producto"}
            {!group.assignmentEnabled ? " · sección oculta en la asignación" : ""}
          </p>
        </div>
        <span
          className={`${styles.softChip} ${
            group.isDisabledForProduct ? styles.exceptionChipHidden : ""
          }`}
        >
          {group.isDisabledForProduct ? "Oculta solo aquí" : "Visible en este producto"}
        </span>
      </div>

      <div className={styles.exceptionRowActions}>
        {group.isDisabledForProduct ? (
          <form action={restoreAction}>
            <input type="hidden" name="product_id" value={productId} />
            <input type="hidden" name="group_id" value={group.groupId} />
            <button
              type="submit"
              className={styles.exceptionAction}
              disabled={isRestoring}
            >
              {isRestoring ? "Mostrando…" : "Volver a mostrar en este producto"}
            </button>
          </form>
        ) : (
          <form action={disableAction}>
            <input type="hidden" name="product_id" value={productId} />
            <input type="hidden" name="group_id" value={group.groupId} />
            <button
              type="submit"
              className={styles.exceptionAction}
              disabled={isDisabling}
            >
              {isDisabling ? "Ocultando…" : "Ocultar solo en este producto"}
            </button>
          </form>
        )}
      </div>

      {actionError ? (
        <p className="admin-feedback admin-feedback--error" role="alert">
          {actionError}
        </p>
      ) : null}
    </div>
  );
}

function InheritanceOptionRow({
  productId,
  groupId,
  groupName,
  option,
  onChanged
}: {
  productId: string;
  groupId: string;
  groupName: string;
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

  return (
    <div className={styles.exceptionRow}>
      <div className={styles.exceptionRowMain}>
        <div className={styles.exceptionRowCopy}>
          <p className={styles.optionName}>{option.optionName}</p>
          <p className={styles.optionPrice}>
            En {groupName}
            {" · "}
            {formatCustomizationPriceDelta(option.priceDelta)}
            {!option.optionAvailable ? " · oculta en la sección" : ""}
          </p>
        </div>
        <span
          className={`${styles.softChip} ${
            option.isDisabledForProduct ? styles.exceptionChipHidden : ""
          }`}
        >
          {option.isDisabledForProduct ? "Oculta solo aquí" : "Visible en este producto"}
        </span>
      </div>

      <div className={styles.exceptionRowActions}>
        {option.isDisabledForProduct ? (
          <form action={restoreAction}>
            <input type="hidden" name="product_id" value={productId} />
            <input type="hidden" name="option_id" value={option.optionId} />
            <button
              type="submit"
              className={styles.exceptionAction}
              disabled={isRestoring}
            >
              {isRestoring ? "Mostrando…" : "Volver a mostrar en este producto"}
            </button>
          </form>
        ) : (
          <form action={disableAction}>
            <input type="hidden" name="product_id" value={productId} />
            <input type="hidden" name="group_id" value={groupId} />
            <input type="hidden" name="option_id" value={option.optionId} />
            <button
              type="submit"
              className={styles.exceptionAction}
              disabled={isDisabling}
            >
              {isDisabling ? "Ocultando…" : "Ocultar solo en este producto"}
            </button>
          </form>
        )}
      </div>

      {actionError ? (
        <p className="admin-feedback admin-feedback--error" role="alert">
          {actionError}
        </p>
      ) : null}
    </div>
  );
}
