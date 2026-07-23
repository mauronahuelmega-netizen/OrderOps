"use client";

import { useActionState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toggleCustomizationGroupAvailabilityAction } from "@/app/admin/(protected)/products/customizations/actions";
import {
  formatCustomizationPriceDelta,
  type AdminCustomizationGroup
} from "@/lib/product-customization/shared";
import ActionsMenu, { closeNearestMenu } from "./actions-menu";
import styles from "./reusable-sections.module.css";

type ActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

const initialState: ActionState = {};

const PREVIEW_LIMIT = 4;

type Props = {
  group: AdminCustomizationGroup;
  chrome?: {
    dragHandle?: ReactNode;
    moveControls?: ReactNode;
  };
  onEdit: () => void;
  onManageOptions: () => void;
};

function buildOptionPreview(group: AdminCustomizationGroup) {
  const sorted = [...group.options].sort((a, b) => {
    if (a.sort_order !== b.sort_order) {
      return a.sort_order - b.sort_order;
    }
    return a.created_at.localeCompare(b.created_at);
  });

  if (sorted.length === 0) {
    return "Sin opciones todavía";
  }

  const visibleSlice = sorted.slice(0, PREVIEW_LIMIT);
  const parts = visibleSlice.map((option) => {
    const price =
      Number(option.price_delta) > 0
        ? ` +${formatCustomizationPriceDelta(Number(option.price_delta))}`
        : "";
    const hidden = option.is_available ? "" : " (oculta)";
    return `${option.name}${price}${hidden}`;
  });

  const remaining = sorted.length - visibleSlice.length;
  const hiddenCount = sorted.filter((option) => !option.is_available).length;
  let text = parts.join(" · ");
  if (remaining > 0) {
    text += ` · +${remaining} más`;
  }
  if (hiddenCount > 0) {
    text += ` · ${hiddenCount} oculta${hiddenCount === 1 ? "" : "s"}`;
  }
  return text;
}

export default function ReusableSectionCard({
  group,
  chrome,
  onEdit,
  onManageOptions
}: Props) {
  const router = useRouter();
  const [toggleState, toggleAction, togglePending] = useActionState(
    toggleCustomizationGroupAvailabilityAction,
    initialState
  );

  useEffect(() => {
    if (toggleState.success) {
      router.refresh();
    }
  }, [toggleState.success, router]);

  const selectionChip =
    group.selection_type === "single" ? "Única" : "Múltiple";
  const requiredChip = group.is_required ? "Requerida" : "Opcional";
  const maxChip =
    group.max_selections === null
      ? "Sin máx."
      : `Máx. ${group.max_selections}`;

  return (
    <article
      className={`${styles.sectionCard} ${
        group.is_available ? "" : styles.sectionCardHidden
      }`}
    >
      <div className={styles.sectionCardTop}>
        <div className={styles.sectionCardMeta}>
          <h3 className={styles.sectionName}>{group.name}</h3>
          {group.description?.trim() ? (
            <p className={styles.sectionDescription}>{group.description.trim()}</p>
          ) : null}
          <div className={styles.chipRow}>
            <span className={styles.chip}>{selectionChip}</span>
            <span className={styles.chip}>{requiredChip}</span>
            <span className={styles.chip}>Mín. {group.min_selections}</span>
            <span className={styles.chip}>{maxChip}</span>
            <span className={styles.chip}>
              {group.options.length}{" "}
              {group.options.length === 1 ? "opción" : "opciones"}
            </span>
            <span
              className={`${styles.chip} ${
                group.is_available ? "" : styles.chipDanger
              }`}
            >
              {group.is_available ? "Visible" : "Oculta"}
            </span>
          </div>
        </div>

        <div className={styles.sectionToolbar}>
          {chrome?.dragHandle}
          {chrome?.moveControls}
          <ActionsMenu label={group.name}>
            <button
              type="button"
              className={styles.menuItem}
              role="menuitem"
              onClick={(event) => {
                closeNearestMenu(event.currentTarget);
                onEdit();
              }}
            >
              Editar sección
            </button>
            <button
              type="button"
              className={styles.menuItem}
              role="menuitem"
              onClick={(event) => {
                closeNearestMenu(event.currentTarget);
                onManageOptions();
              }}
            >
              Gestionar opciones
            </button>
            <form action={toggleAction} className={styles.menuForm}>
              <input type="hidden" name="group_id" value={group.id} />
              <input
                type="hidden"
                name="is_available"
                value={group.is_available ? "false" : "true"}
              />
              <button
                type="submit"
                className={styles.menuItem}
                role="menuitem"
                disabled={togglePending}
                onClick={(event) => closeNearestMenu(event.currentTarget)}
              >
                {togglePending
                  ? "Guardando…"
                  : group.is_available
                    ? "Ocultar para clientes"
                    : "Mostrar para clientes"}
              </button>
            </form>
          </ActionsMenu>
        </div>
      </div>

      <p className={styles.optionsPreview}>
        <strong>Opciones:</strong> {buildOptionPreview(group)}
      </p>

      {toggleState.error ? (
        <p className="admin-feedback admin-feedback--error" role="alert">
          {toggleState.error}
        </p>
      ) : null}
    </article>
  );
}
