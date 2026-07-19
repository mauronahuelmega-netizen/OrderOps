"use client";

import { useActionState, useCallback, useEffect, useState, useTransition } from "react";
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
  type ProductCustomizationInheritance
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
};

export default function ProductCustomizationOverridesPanel({ productId }: Props) {
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
            Ocultá secciones u opciones solo para este producto cuando necesite
            comportarse distinto al resto.
          </p>
        </div>
        <a
          className="admin-secondary-link admin-secondary-link--compact"
          href={`/admin/products/customizations?product=${encodeURIComponent(productId)}`}
        >
          Ir a personalización
        </a>
      </div>

      {isLoading && !inheritance ? (
        <p className={styles.emptyOptions}>Cargando excepciones…</p>
      ) : null}

      {loadError ? (
        <p className="admin-feedback admin-feedback--error" role="alert">
          {loadError}
        </p>
      ) : null}

      {inheritance ? (
        <>
          <p className={styles.groupSummary}>
            {inheritance.categoryName
              ? `Categoría: ${inheritance.categoryName}`
              : "Sin categoría — solo se muestran secciones asignadas a este producto."}
          </p>

          {inheritance.groups.length === 0 ? (
            <div className="admin-empty-state">
              <h2>Sin secciones en este producto</h2>
              <p>Este producto todavía no tiene secciones de opciones para ajustar.</p>
            </div>
          ) : (
            <div className={styles.optionList}>
              {inheritance.groups.map((group) => (
                <InheritanceGroupCard
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
          )}
        </>
      ) : null}
    </section>
  );
}

function InheritanceGroupCard({
  productId,
  group,
  onChanged
}: {
  productId: string;
  group: ProductCustomizationInheritance["groups"][number];
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

  return (
    <div className={styles.optionCard}>
      <div className={styles.optionHeader}>
        <div>
          <p className={styles.optionName}>{group.groupName}</p>
          <p className={styles.optionPrice}>
            Aplicado desde:{" "}
            {group.source === "category" ? "la categoría" : "este producto"}
            {!group.assignmentEnabled ? " · sección oculta en la asignación" : ""}
          </p>
        </div>
        <span
          className={`${styles.chip} ${group.isDisabledForProduct ? styles.chipDanger : ""}`}
        >
          {group.isDisabledForProduct ? "Oculta aquí" : "Visible"}
        </span>
      </div>

      {group.isDisabledForProduct ? (
        <form action={restoreAction}>
          <input type="hidden" name="product_id" value={productId} />
          <input type="hidden" name="group_id" value={group.groupId} />
          <button
            type="submit"
            className="admin-secondary-link admin-secondary-link--compact"
            disabled={isRestoring}
          >
            {isRestoring ? "Mostrando…" : "Mostrar para este producto"}
          </button>
        </form>
      ) : (
        <form action={disableAction}>
          <input type="hidden" name="product_id" value={productId} />
          <input type="hidden" name="group_id" value={group.groupId} />
          <button
            type="submit"
            className="admin-secondary-link admin-secondary-link--compact"
            disabled={isDisabling}
          >
            {isDisabling ? "Ocultando…" : "Ocultar para este producto"}
          </button>
        </form>
      )}

      {(disableState.error || restoreState.error) && (
        <p className="admin-feedback admin-feedback--error" role="alert">
          {disableState.error || restoreState.error}
        </p>
      )}

      {group.options.length > 0 ? (
        <div className={styles.optionList}>
          {group.options.map((option) => (
            <InheritanceOptionRow
              key={option.optionId}
              productId={productId}
              groupId={group.groupId}
              option={option}
              onChanged={onChanged}
            />
          ))}
        </div>
      ) : (
        <p className={styles.emptyOptions}>Esta sección no tiene opciones todavía.</p>
      )}
    </div>
  );
}

function InheritanceOptionRow({
  productId,
  groupId,
  option,
  onChanged
}: {
  productId: string;
  groupId: string;
  option: ProductCustomizationInheritance["groups"][number]["options"][number];
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

  return (
    <div className={styles.inlineOption}>
      <div>
        <p className={styles.optionName}>{option.optionName}</p>
        <p className={styles.optionPrice}>
          {formatCustomizationPriceDelta(option.priceDelta)}
          {!option.optionAvailable ? " · oculta en la sección" : ""}
          {option.isDisabledForProduct ? " · oculta aquí" : ""}
        </p>
      </div>

      {option.isDisabledForProduct ? (
        <form action={restoreAction}>
          <input type="hidden" name="product_id" value={productId} />
          <input type="hidden" name="option_id" value={option.optionId} />
          <button
            type="submit"
            className="admin-secondary-link admin-secondary-link--compact"
            disabled={isRestoring}
          >
            {isRestoring ? "…" : "Mostrar"}
          </button>
        </form>
      ) : (
        <form action={disableAction}>
          <input type="hidden" name="product_id" value={productId} />
          <input type="hidden" name="group_id" value={groupId} />
          <input type="hidden" name="option_id" value={option.optionId} />
          <button
            type="submit"
            className="admin-secondary-link admin-secondary-link--compact"
            disabled={isDisabling}
          >
            {isDisabling ? "…" : "Ocultar"}
          </button>
        </form>
      )}

      {(disableState.error || restoreState.error) && (
        <p className="admin-feedback admin-feedback--error" role="alert">
          {disableState.error || restoreState.error}
        </p>
      )}
    </div>
  );
}
