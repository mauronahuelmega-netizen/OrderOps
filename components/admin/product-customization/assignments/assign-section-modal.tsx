"use client";

import { useActionState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { createCustomizationGroupAssignmentAction } from "@/app/admin/(protected)/products/customizations/actions";
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

type Props = {
  open: boolean;
  mode: "product" | "category";
  targetId: string;
  targetName: string;
  groups: AdminCustomizationGroup[];
  assignments: AdminCustomizationAssignment[];
  defaultSortOrder: number;
  onClose: () => void;
};

export default function AssignSectionModal({
  open,
  mode,
  targetId,
  targetName,
  groups,
  assignments,
  defaultSortOrder,
  onClose
}: Props) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, isPending] = useActionState(
    createCustomizationGroupAssignmentAction,
    initialState
  );

  const assignedGroupIds = useMemo(() => {
    return new Set(
      assignments
        .filter(
          (assignment) =>
            assignment.target_type === mode && assignment.target_id === targetId
        )
        .map((assignment) => assignment.group_id)
    );
  }, [assignments, mode, targetId]);

  const availableGroups = useMemo(() => {
    return groups.filter((group) => !assignedGroupIds.has(group.id));
  }, [groups, assignedGroupIds]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (state.success) {
      router.refresh();
      onClose();
    }
  }, [state.success, router, onClose]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onClose={onClose}
      aria-labelledby="assign-section-modal-title"
    >
      <form action={formAction} className={styles.dialogForm}>
        <div className={styles.dialogHeader}>
          <h2 id="assign-section-modal-title" className={styles.dialogTitle}>
            Agregar sección a {targetName}
          </h2>
          <p className={styles.dialogSubtitle}>
            {mode === "category"
              ? "Elegí una sección reutilizable para aplicarla a todos los productos de esta categoría."
              : "Elegí una sección reutilizable para aplicarla solo a este producto."}
          </p>
          <p className={styles.helperText}>
            Las secciones se crean y editan desde “Secciones reutilizables”.
          </p>
        </div>

        <input type="hidden" name="target_type" value={mode} />
        <input type="hidden" name="target_id" value={targetId} />
        <input type="hidden" name="sort_order" value={defaultSortOrder} />
        <input type="hidden" name="is_enabled" value="true" />

        <div className={styles.fields}>
          <label className="admin-field">
            <span>Sección reutilizable</span>
            <select
              name="group_id"
              required
              disabled={isPending || availableGroups.length === 0}
              defaultValue=""
            >
              <option value="" disabled>
                {availableGroups.length === 0
                  ? "No hay secciones disponibles para agregar"
                  : "Seleccionar…"}
              </option>
              {availableGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                  {group.is_available ? "" : " (oculta)"}
                </option>
              ))}
            </select>
          </label>
        </div>

        {state.error ? (
          <p className={`admin-feedback admin-feedback--error ${styles.feedback}`} role="alert">
            {state.error}
          </p>
        ) : null}

        <div className={styles.dialogFooter}>
          <button
            type="button"
            className="admin-secondary-link admin-secondary-link--compact"
            onClick={onClose}
            disabled={isPending}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="admin-primary-button"
            disabled={isPending || availableGroups.length === 0}
          >
            {isPending ? "Agregando sección…" : "Agregar sección"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
