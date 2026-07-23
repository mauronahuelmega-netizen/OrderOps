"use client";

import { useActionState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toggleCustomizationGroupAssignmentAction } from "@/app/admin/(protected)/products/customizations/actions";
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

type Props = {
  assignment: AdminCustomizationAssignment;
  group: AdminCustomizationGroup | null;
  originLabel: string;
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
  chrome
}: Props) {
  const router = useRouter();
  const [toggleState, toggleAction, isToggling] = useActionState(
    toggleCustomizationGroupAssignmentAction,
    initialState
  );

  useEffect(() => {
    if (toggleState.success) {
      router.refresh();
    }
  }, [toggleState.success, router]);

  const chips = buildMetaChips(assignment, group);
  const description =
    group?.description?.trim() ||
    "Sección aplicada al catálogo. Podés ocultarla sin borrarla.";

  return (
    <article
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
        </div>

        <div className={styles.toolbar}>
          {chrome?.dragHandle}
          {chrome?.moveControls}
          <ActionsMenu label={`Abrir menú de asignación ${assignment.group_name}`}>
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
                disabled={isToggling}
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
    </article>
  );
}
