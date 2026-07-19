"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toggleUpsellGroupItemAction } from "@/app/admin/(protected)/products/customizations/actions";
import ActionsMenu, {
  closeNearestMenu
} from "@/components/admin/product-customization/reusable-sections/actions-menu";
import {
  formatCustomizationPriceDelta,
  type AdminCatalogProductOption,
  type AdminUpsellGroup
} from "@/lib/product-customization/shared";
import styles from "./plus-suggestions.module.css";

type ActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

const initialState: ActionState = {};

type Props = {
  item: AdminUpsellGroup["items"][number];
  productById: Map<string, AdminCatalogProductOption>;
  categoryNameById: Map<string, string>;
  canMoveUp: boolean;
  canMoveDown: boolean;
  reorderPending: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
};

export default function SuggestedProductRow({
  item,
  productById,
  categoryNameById,
  canMoveUp,
  canMoveDown,
  reorderPending,
  onMoveUp,
  onMoveDown,
  onEdit
}: Props) {
  const router = useRouter();
  const [toggleState, toggleAction, togglePending] = useActionState(
    toggleUpsellGroupItemAction,
    initialState
  );

  useEffect(() => {
    if (toggleState.success) {
      router.refresh();
    }
  }, [toggleState.success, router]);

  const catalog = productById.get(item.product_id);
  const categoryName = catalog
    ? (categoryNameById.get(catalog.category_id) ?? null)
    : null;
  const priceLabel = `+${formatCustomizationPriceDelta(Number(item.product_price))}`;
  const metaParts = [
    categoryName,
    priceLabel,
    catalog && !catalog.is_available ? "No disponible en catálogo" : null
  ].filter((part): part is string => Boolean(part));

  return (
    <div
      className={`${styles.optionRow} ${
        item.is_available ? "" : styles.optionRowHidden
      }`}
    >
      <div className={styles.sectionToolbar}>
        <button
          type="button"
          className={styles.moveButton}
          aria-label={`Mover ${item.product_name} hacia arriba`}
          disabled={!canMoveUp || reorderPending || togglePending}
          onClick={onMoveUp}
        >
          ↑
        </button>
        <button
          type="button"
          className={styles.moveButton}
          aria-label={`Mover ${item.product_name} hacia abajo`}
          disabled={!canMoveDown || reorderPending || togglePending}
          onClick={onMoveDown}
        >
          ↓
        </button>
      </div>

      <div className={styles.optionMain}>
        <p className={styles.optionName}>{item.product_name}</p>
        <p className={styles.optionMeta}>{metaParts.join(" · ")}</p>
        {toggleState.error ? (
          <p className="admin-feedback admin-feedback--error" role="alert">
            {toggleState.error}
          </p>
        ) : null}
      </div>

      <div className={styles.optionSide}>
        <span
          className={`${styles.chip} ${
            item.is_available ? "" : styles.chipDanger
          }`}
        >
          {item.is_available ? "Visible" : "Oculto"}
        </span>

        <ActionsMenu label={`Abrir menú de producto sugerido ${item.product_name}`}>
          <button
            type="button"
            className={styles.menuItem}
            role="menuitem"
            onClick={(event) => {
              closeNearestMenu(event.currentTarget);
              onEdit();
            }}
          >
            Editar producto sugerido
          </button>
          <form action={toggleAction} className={styles.menuForm}>
            <input type="hidden" name="upsell_item_id" value={item.id} />
            <input
              type="hidden"
              name="is_available"
              value={item.is_available ? "false" : "true"}
            />
            <button
              type="submit"
              className={styles.menuItem}
              role="menuitem"
              disabled={togglePending || reorderPending}
              onClick={(event) => closeNearestMenu(event.currentTarget)}
            >
              {togglePending
                ? "Guardando…"
                : item.is_available
                  ? "Ocultar para clientes"
                  : "Mostrar para clientes"}
            </button>
          </form>
        </ActionsMenu>
      </div>
    </div>
  );
}
