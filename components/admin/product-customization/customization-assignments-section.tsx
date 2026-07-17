"use client";

import { useActionState, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  createCustomizationGroupAssignmentAction,
  reorderCustomizationAssignmentsAction,
  toggleCustomizationGroupAssignmentAction,
  updateCustomizationGroupAssignmentAction
} from "@/app/admin/(protected)/products/customizations/actions";
import SortableReorderList from "@/components/admin/product-customization/sortable-reorder-list";
import type { AdminCategory } from "@/lib/categories/admin";
import type {
  AdminCatalogProductOption,
  AdminCustomizationAssignment,
  AdminCustomizationGroup
} from "@/lib/product-customization/shared";
import styles from "./product-customization-admin.module.css";

type ActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

const initialState: ActionState = {};

type AssignmentsSectionMode = "all" | "category" | "product";

type SectionProps = {
  groups: AdminCustomizationGroup[];
  categories: AdminCategory[];
  products: AdminCatalogProductOption[];
  assignments: AdminCustomizationAssignment[];
  defaultSortOrder: number;
  mode?: AssignmentsSectionMode;
  preferredTargetId?: string;
  hideIntro?: boolean;
};

export default function CustomizationAssignmentsSection({
  groups,
  categories,
  products,
  assignments,
  defaultSortOrder,
  mode = "all",
  preferredTargetId,
  hideIntro = false
}: SectionProps) {
  const grouped = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        label: string;
        targetType: "category" | "product";
        targetId: string;
        items: AdminCustomizationAssignment[];
      }
    >();

    for (const assignment of assignments) {
      if (mode === "category" && assignment.target_type !== "category") {
        continue;
      }
      if (mode === "product" && assignment.target_type !== "product") {
        continue;
      }
      if (
        preferredTargetId &&
        (mode === "category" || mode === "product") &&
        assignment.target_id !== preferredTargetId
      ) {
        continue;
      }

      const key = `${assignment.target_type}:${assignment.target_id}`;
      const label =
        assignment.target_type === "category"
          ? `Categoría: ${assignment.target_name}`
          : `Producto: ${assignment.target_name}`;
      const current = map.get(key) ?? {
        key,
        label,
        targetType: assignment.target_type,
        targetId: assignment.target_id,
        items: []
      };
      current.items.push(assignment);
      map.set(key, current);
    }

    return [...map.values()];
  }, [assignments, mode, preferredTargetId]);

  return (
    <section className={styles.sectionBlock}>
      {hideIntro ? null : (
        <div className="admin-form-header">
          <h2>Dónde aparecen</h2>
          <p>
            Conectá secciones a categorías (para todos los productos) o a un producto
            concreto. Para dejar de mostrarlas, ocúltáas — no hace falta borrarlas.
          </p>
        </div>
      )}

      <div className={styles.sectionGrid}>
        <AssignmentCreateForm
          groups={groups}
          categories={categories}
          products={products}
          defaultSortOrder={defaultSortOrder}
          mode={mode}
          preferredTargetId={preferredTargetId}
        />

        <div className={styles.list}>
          {grouped.length > 0 ? (
            grouped.map((group) => (
              <div key={group.key} className={styles.groupCard}>
                <h3 className={styles.groupTitle}>{group.label}</h3>
                {group.items.length > 1 ? (
                  <SortableReorderList
                    items={group.items}
                    successFallbackMessage="Orden de aparición actualizado."
                    getItemAriaLabel={(assignment) => assignment.group_name}
                    listClassName={styles.optionList}
                    persist={async (orderedIds) => {
                      const formData = new FormData();
                      formData.set("targetType", group.targetType);
                      formData.set("targetId", group.targetId);
                      formData.set("orderedIdsJson", JSON.stringify(orderedIds));
                      return reorderCustomizationAssignmentsAction({}, formData);
                    }}
                    renderItem={(assignment, chrome) => (
                      <AssignmentRow
                        assignment={assignment}
                        chrome={{
                          dragHandle: chrome.dragHandle,
                          moveControls: chrome.moveControls
                        }}
                      />
                    )}
                  />
                ) : (
                  <div className={styles.optionList}>
                    {group.items.map((assignment) => (
                      <AssignmentRow key={assignment.id} assignment={assignment} />
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="admin-empty-state">
              <h2>Nada aparece todavía</h2>
              <p>
                Agregá una sección a{" "}
                {mode === "product"
                  ? "este producto"
                  : mode === "category"
                    ? "esta categoría"
                    : "una categoría o producto"}{" "}
                para que el cliente pueda elegir opciones.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function AssignmentCreateForm({
  groups,
  categories,
  products,
  defaultSortOrder,
  mode = "all",
  preferredTargetId
}: {
  groups: AdminCustomizationGroup[];
  categories: AdminCategory[];
  products: AdminCatalogProductOption[];
  defaultSortOrder: number;
  mode?: AssignmentsSectionMode;
  preferredTargetId?: string;
}) {
  const router = useRouter();
  const lockedType =
    mode === "category" ? "category" : mode === "product" ? "product" : null;
  const [targetType, setTargetType] = useState<"category" | "product">(
    lockedType ?? "category"
  );
  const resolvedTargetType = lockedType ?? targetType;
  const [state, formAction, isPending] = useActionState(
    createCustomizationGroupAssignmentAction,
    initialState
  );

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  const targetOptions =
    resolvedTargetType === "category"
      ? categories.map((category) => ({ id: category.id, name: category.name }))
      : products.map((product) => ({ id: product.id, name: product.name }));

  return (
    <form action={formAction} className="admin-form-card">
      <div className="admin-form-header">
        <h2>Agregar sección</h2>
        <p>
          {mode === "category"
            ? "La sección aparecerá en todos los productos de la categoría."
            : mode === "product"
              ? "La sección aparecerá solo en este producto."
              : "Elegí si aparece en toda una categoría o en un producto concreto."}
        </p>
      </div>

      <div className={styles.fields}>
        <div className={styles.fieldsTwo}>
          {lockedType ? (
            <input type="hidden" name="target_type" value={lockedType} />
          ) : (
            <label className="admin-field">
              <span>Aparece en</span>
              <select
                name="target_type"
                value={targetType}
                onChange={(event) =>
                  setTargetType(event.target.value === "product" ? "product" : "category")
                }
                disabled={isPending}
              >
                <option value="category">Categoría</option>
                <option value="product">Producto</option>
              </select>
            </label>
          )}

          <label className="admin-field">
            <span>{resolvedTargetType === "category" ? "Categoría" : "Producto"}</span>
            <select
              key={`${resolvedTargetType}:${preferredTargetId ?? ""}`}
              name="target_id"
              required
              disabled={isPending}
              defaultValue={preferredTargetId ?? ""}
            >
              <option value="" disabled>
                Seleccionar…
              </option>
              {targetOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="admin-field">
          <span>Sección</span>
          <select name="group_id" required disabled={isPending} defaultValue="">
            <option value="" disabled>
              Seleccionar…
            </option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
                {group.is_available ? "" : " (oculta)"}
              </option>
            ))}
          </select>
        </label>

        <details className={styles.advancedInline}>
          <summary>Opciones avanzadas</summary>
          <label className="admin-field">
            <span>Orden de aparición</span>
            <input
              name="sort_order"
              type="number"
              min={0}
              step={1}
              defaultValue={defaultSortOrder}
              disabled={isPending}
              required
            />
          </label>
        </details>

        <label className={styles.checkboxRow}>
          <input type="hidden" name="is_enabled" value="false" />
          <input
            type="checkbox"
            name="is_enabled"
            value="true"
            defaultChecked
            disabled={isPending}
          />
          <span>Visible para el cliente</span>
        </label>
      </div>

      {state.error ? (
        <p className="admin-feedback admin-feedback--error" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success && state.message ? (
        <p className="admin-feedback admin-feedback--success">{state.message}</p>
      ) : null}

      <div className={styles.actionsRow}>
        <button type="submit" className="admin-primary-button" disabled={isPending}>
          {isPending ? "Guardando…" : "Agregar sección"}
        </button>
      </div>
    </form>
  );
}

function AssignmentRow({
  assignment,
  chrome
}: {
  assignment: AdminCustomizationAssignment;
  chrome?: {
    dragHandle?: ReactNode;
    moveControls?: ReactNode;
  };
}) {
  const router = useRouter();
  const [updateState, updateAction, isUpdating] = useActionState(
    updateCustomizationGroupAssignmentAction,
    initialState
  );
  const [toggleState, toggleAction, isToggling] = useActionState(
    toggleCustomizationGroupAssignmentAction,
    initialState
  );

  useEffect(() => {
    if (updateState.success || toggleState.success) {
      router.refresh();
    }
  }, [router, updateState.success, toggleState.success]);

  const feedback = updateState.error || toggleState.error;
  const successMsg =
    (updateState.success && updateState.message) ||
    (toggleState.success && toggleState.message);

  return (
    <div className={styles.optionCard}>
      <div className={styles.optionHeader}>
        <div className={styles.sortableToolbarInline}>
          {chrome?.dragHandle}
          {chrome?.moveControls}
          <p className={styles.optionName}>{assignment.group_name}</p>
        </div>
        <span className={`${styles.chip} ${assignment.is_enabled ? "" : styles.chipDanger}`}>
          {assignment.is_enabled ? "Visible" : "Oculta"}
        </span>
      </div>

      <form action={updateAction} className={styles.inlineEdit}>
        <input type="hidden" name="assignment_id" value={assignment.id} />
        <label className="admin-field">
          <span>Orden de aparición</span>
          <input
            name="sort_order"
            type="number"
            min={0}
            step={1}
            defaultValue={assignment.sort_order}
            disabled={isUpdating || isToggling}
            required
          />
        </label>
        <button
          type="submit"
          className="admin-secondary-link admin-secondary-link--compact"
          disabled={isUpdating || isToggling}
        >
          {isUpdating ? "Guardando…" : "Guardar orden de aparición"}
        </button>
      </form>

      <form action={toggleAction} className={styles.actionsRow}>
        <input type="hidden" name="assignment_id" value={assignment.id} />
        <input
          type="hidden"
          name="is_enabled"
          value={assignment.is_enabled ? "false" : "true"}
        />
        <button
          type="submit"
          className="admin-secondary-link admin-secondary-link--compact"
          disabled={isUpdating || isToggling}
        >
          {isToggling
            ? "Actualizando…"
            : assignment.is_enabled
              ? "Ocultar"
              : "Mostrar"}
        </button>
      </form>

      {feedback ? (
        <p className="admin-feedback admin-feedback--error" role="alert">
          {feedback}
        </p>
      ) : null}
      {successMsg && !feedback ? (
        <p className="admin-feedback admin-feedback--success">{successMsg}</p>
      ) : null}
    </div>
  );
}
