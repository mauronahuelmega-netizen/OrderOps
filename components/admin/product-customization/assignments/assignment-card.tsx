"use client";

import { useActionState, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  removeCustomizationGroupAssignmentAction,
  toggleCustomizationGroupAssignmentAction
} from "@/app/admin/(protected)/products/customizations/actions";
import ActionsMenu, {
  closeNearestMenu
} from "@/components/admin/product-customization/reusable-sections/actions-menu";
import type {
  AdminCustomizationAssignment,
  AdminCustomizationGroup
} from "@/lib/product-customization/shared";
import styles from "./assignments.module.css";

type ActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

const initialState: ActionState = {};

type AssignmentTargetMode = "product" | "category";

type Props = {
  assignment: AdminCustomizationAssignment;
  group: AdminCustomizationGroup | null;
  originLabel: string;
  mode?: AssignmentTargetMode;
  chrome?: {
    dragHandle?: ReactNode;
    moveControls?: ReactNode;
  };
};

function buildMetaChips(
  assignment: AdminCustomizationAssignment,
  group: AdminCustomizationGroup | null
): string[] {
  const chips: string[] = [];
  if (group) {
    chips.push(group.selection_type === "single" ? "Única" : "Múltiple");
    chips.push(group.is_required ? "Requerida" : "Opcional");
    if (group.min_selections > 0 || group.max_selections !== null) {
      const minLabel = `Mín. ${group.min_selections}`;
      const maxLabel =
        group.max_selections === null ? "Máx. libre" : `Máx. ${group.max_selections}`;
      chips.push(`${minLabel} · ${maxLabel}`);
    }
    const optionCount = group.options.length;
    chips.push(`${optionCount} ${optionCount === 1 ? "opción" : "opciones"}`);
  }
  chips.push(assignment.is_enabled ? "Visible" : "Oculta");
  return chips;
}

export default function AssignmentCard({
  assignment,
  group,
  originLabel,
  mode,
  chrome
}: Props) {
  const router = useRouter();
  const cardRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toggleState, toggleAction, isToggling] = useActionState(
    toggleCustomizationGroupAssignmentAction,
    initialState
  );
  const [removeState, removeAction, isRemoving] = useActionState(
    removeCustomizationGroupAssignmentAction,
    initialState
  );

  const targetMode: AssignmentTargetMode =
    mode ?? (assignment.target_type === "category" ? "category" : "product");

  const removeLabel =
    targetMode === "category" ? "Quitar de esta categoría" : "Quitar de este producto";
  const confirmTitle =
    targetMode === "category"
      ? "Quitar sección de esta categoría"
      : "Quitar sección de este producto";
  const confirmBody =
    targetMode === "category"
      ? "Esta sección dejará de aplicarse automáticamente a los productos de esta categoría. La sección reutilizable y sus opciones no se eliminarán."
      : "Esta sección dejará de aplicarse solo a este producto. La sección reutilizable y sus opciones no se eliminarán.";

  useEffect(() => {
    if (toggleState.success) {
      router.refresh();
    }
  }, [toggleState.success, router]);

  useEffect(() => {
    if (removeState.success) {
      setConfirmOpen(false);
      router.refresh();
    }
  }, [removeState.success, router]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (confirmOpen && !dialog.open) {
      dialog.showModal();
    }
    if (!confirmOpen && dialog.open) {
      dialog.close();
    }
  }, [confirmOpen]);

  const chips = buildMetaChips(assignment, group);
  const description =
    group?.description?.trim() ||
    "Sección aplicada al catálogo. Podés ocultarla sin borrarla.";

  function restoreMenuTriggerFocus() {
    const trigger =
      returnFocusRef.current ??
      cardRef.current?.querySelector<HTMLElement>("[data-actions-menu-trigger]");
    returnFocusRef.current = null;
    queueMicrotask(() => {
      trigger?.focus();
    });
  }

  return (
    <article
      ref={cardRef}
      className={`${styles.assignmentCard} ${
        assignment.is_enabled ? "" : styles.assignmentCardHidden
      }`}
    >
      <div className={styles.assignmentCardTop}>
        <div className={styles.assignmentMeta}>
          <h3 className={styles.assignmentName}>{assignment.group_name}</h3>
          <p className={styles.assignmentDescription}>{description}</p>
          <div className={styles.chipRow}>
            {chips.map((chip) => (
              <span
                key={chip}
                className={`${styles.chip} ${
                  chip === "Oculta" ? styles.chipDanger : ""
                }`}
              >
                {chip}
              </span>
            ))}
            <span className={styles.chip}>{originLabel}</span>
          </div>
          <p className={styles.helperText}>
            Ocultar conserva la asignación para usarla después. Quitar la remueve de
            esta lista.
          </p>
        </div>

        <div className={styles.toolbar}>
          {chrome?.dragHandle}
          {chrome?.moveControls}
          <ActionsMenu label={assignment.group_name}>
            <form action={toggleAction} className={styles.menuItemForm}>
              <input type="hidden" name="assignment_id" value={assignment.id} />
              <input
                type="hidden"
                name="is_enabled"
                value={assignment.is_enabled ? "false" : "true"}
              />
              <button
                type="submit"
                className={styles.menuItem}
                role="menuitem"
                disabled={isToggling || isRemoving}
                onClick={(event) => {
                  closeNearestMenu(event.currentTarget);
                }}
              >
                {isToggling
                  ? "Actualizando…"
                  : assignment.is_enabled
                    ? "Ocultar para clientes"
                    : "Mostrar para clientes"}
              </button>
            </form>
            <button
              type="button"
              className={`${styles.menuItem} ${styles.menuItemDanger}`}
              role="menuitem"
              disabled={isRemoving}
              onClick={(event) => {
                returnFocusRef.current =
                  cardRef.current?.querySelector<HTMLElement>(
                    "[data-actions-menu-trigger]"
                  ) ?? null;
                closeNearestMenu(event.currentTarget);
                setConfirmOpen(true);
              }}
            >
              {removeLabel}
            </button>
          </ActionsMenu>
        </div>
      </div>

      {toggleState.error ? (
        <p className={`admin-feedback admin-feedback--error ${styles.feedback}`} role="alert">
          {toggleState.error}
        </p>
      ) : null}
      {toggleState.success && toggleState.message && !toggleState.error ? (
        <p className={`admin-feedback admin-feedback--success ${styles.feedback}`}>
          {toggleState.message}
        </p>
      ) : null}
      {removeState.error ? (
        <p className={`admin-feedback admin-feedback--error ${styles.feedback}`} role="alert">
          {removeState.error}
        </p>
      ) : null}

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        onClose={() => {
          setConfirmOpen(false);
          restoreMenuTriggerFocus();
        }}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <form action={removeAction} className={styles.dialogForm}>
          <input type="hidden" name="assignment_id" value={assignment.id} />
          <input type="hidden" name="target_type" value={targetMode} />
          <input type="hidden" name="target_id" value={assignment.target_id} />
          <div className={styles.dialogHeader}>
            <h2 id={titleId} className={styles.dialogTitle}>
              {confirmTitle}
            </h2>
            <p id={descriptionId} className={styles.dialogSubtitle}>
              {confirmBody}
            </p>
          </div>
          {removeState.error ? (
            <p className="admin-feedback admin-feedback--error" role="alert">
              {removeState.error}
            </p>
          ) : null}
          <div className={styles.dialogFooter}>
            <button
              type="button"
              className="admin-secondary-link admin-secondary-link--compact"
              onClick={() => dialogRef.current?.close()}
              disabled={isRemoving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`admin-primary-button ${styles.dangerButton}`}
              disabled={isRemoving}
            >
              {isRemoving ? "Quitando sección…" : removeLabel}
            </button>
          </div>
        </form>
      </dialog>
    </article>
  );
}
