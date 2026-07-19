"use client";

import { useActionState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toggleCustomizationOptionAvailabilityAction } from "@/app/admin/(protected)/products/customizations/actions";
import {
  formatCustomizationPriceDelta,
  type AdminCustomizationOption
} from "@/lib/product-customization/shared";
import ActionsMenu, { closeNearestMenu } from "./actions-menu";
import styles from "./reusable-sections.module.css";

type ActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

const initialState: ActionState = {};

type Props = {
  option: AdminCustomizationOption;
  chrome?: {
    dragHandle?: ReactNode;
    moveControls?: ReactNode;
  };
  onEdit: () => void;
};

export default function ReusableOptionRow({ option, chrome, onEdit }: Props) {
  const router = useRouter();
  const [toggleState, toggleAction, togglePending] = useActionState(
    toggleCustomizationOptionAvailabilityAction,
    initialState
  );

  useEffect(() => {
    if (toggleState.success) {
      router.refresh();
    }
  }, [toggleState.success, router]);

  const priceLabel =
    Number(option.price_delta) > 0
      ? `+${formatCustomizationPriceDelta(Number(option.price_delta))}`
      : "Incluido";

  return (
    <div
      className={`${styles.optionRow} ${
        option.is_available ? "" : styles.optionRowHidden
      }`}
    >
      <div className={styles.sectionToolbar}>
        {chrome?.dragHandle}
        {chrome?.moveControls}
      </div>

      <div className={styles.optionMain}>
        <p className={styles.optionName}>{option.name}</p>
        <p className={styles.optionMeta}>
          {priceLabel}
          {option.description?.trim()
            ? ` · ${option.description.trim()}`
            : ""}
        </p>
        {toggleState.error ? (
          <p className="admin-feedback admin-feedback--error" role="alert">
            {toggleState.error}
          </p>
        ) : null}
      </div>

      <div className={styles.optionSide}>
        <span
          className={`${styles.chip} ${
            option.is_available ? "" : styles.chipDanger
          }`}
        >
          {option.is_available ? "Visible" : "Oculta"}
        </span>

        <ActionsMenu label={`Abrir menú de opción ${option.name}`}>
          <button
            type="button"
            className={styles.menuItem}
            role="menuitem"
            onClick={(event) => {
              closeNearestMenu(event.currentTarget);
              onEdit();
            }}
          >
            Editar opción
          </button>
          <form action={toggleAction} className={styles.menuForm}>
            <input type="hidden" name="option_id" value={option.id} />
            <input
              type="hidden"
              name="is_available"
              value={option.is_available ? "false" : "true"}
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
                : option.is_available
                  ? "Ocultar para clientes"
                  : "Mostrar para clientes"}
            </button>
          </form>
        </ActionsMenu>
      </div>
    </div>
  );
}
