"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toggleUpsellGroupAction } from "@/app/admin/(protected)/products/customizations/actions";
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
const PREVIEW_LIMIT = 3;

type Props = {
  group: AdminUpsellGroup;
  productById: Map<string, AdminCatalogProductOption>;
  onEdit: () => void;
  onManageProducts: () => void;
};

function buildItemsPreview(
  group: AdminUpsellGroup,
  productById: Map<string, AdminCatalogProductOption>
) {
  const sorted = [...group.items].sort((a, b) => {
    if (a.sort_order !== b.sort_order) {
      return a.sort_order - b.sort_order;
    }
    return a.created_at.localeCompare(b.created_at);
  });

  if (sorted.length === 0) {
    return "Sin productos sugeridos todavía";
  }

  const slice = sorted.slice(0, PREVIEW_LIMIT);
  const parts = slice.map((item) => {
    const catalog = productById.get(item.product_id);
    const price = `+${formatCustomizationPriceDelta(Number(item.product_price))}`;
    const hidden = item.is_available ? "" : " (oculto)";
    const unavailable =
      catalog && !catalog.is_available ? " · No disponible en catálogo" : "";
    return `${item.product_name} · ${price}${hidden}${unavailable}`;
  });

  const remaining = sorted.length - slice.length;
  const hiddenCount = sorted.filter((item) => !item.is_available).length;
  let text = parts.join(" · ");
  if (remaining > 0) {
    text += ` · +${remaining} más`;
  }
  if (hiddenCount > 0) {
    text += ` · ${hiddenCount} oculto${hiddenCount === 1 ? "" : "s"}`;
  }
  return text;
}

export default function PlusSuggestionCard({
  group,
  productById,
  onEdit,
  onManageProducts
}: Props) {
  const router = useRouter();
  const [toggleState, toggleAction, togglePending] = useActionState(
    toggleUpsellGroupAction,
    initialState
  );

  useEffect(() => {
    if (toggleState.success) {
      router.refresh();
    }
  }, [toggleState.success, router]);

  const targetChip =
    group.target_type === "category"
      ? `Categoría · ${group.target_name}`
      : `Producto · ${group.target_name}`;

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
          ) : (
            <p className={styles.sectionDescription}>
              Se ofrece como adicional antes de agregar el producto al carrito.
            </p>
          )}
          <div className={styles.chipRow}>
            <span className={styles.chip}>Aparece en {group.target_name}</span>
            <span className={styles.chip}>{targetChip}</span>
            <span className={styles.chip}>
              {group.items.length}{" "}
              {group.items.length === 1
                ? "producto sugerido"
                : "productos sugeridos"}
            </span>
            <span
              className={`${styles.chip} ${
                group.is_available ? "" : styles.chipDanger
              }`}
            >
              {group.is_available ? "Visible" : "Oculto"}
            </span>
          </div>
        </div>

        <div className={styles.sectionToolbar}>
          <ActionsMenu label={`Abrir menú de plus sugerido ${group.name}`}>
            <button
              type="button"
              className={styles.menuItem}
              role="menuitem"
              onClick={(event) => {
                closeNearestMenu(event.currentTarget);
                onEdit();
              }}
            >
              Editar plus
            </button>
            <button
              type="button"
              className={styles.menuItem}
              role="menuitem"
              onClick={(event) => {
                closeNearestMenu(event.currentTarget);
                onManageProducts();
              }}
            >
              Gestionar productos sugeridos
            </button>
            <form action={toggleAction} className={styles.menuForm}>
              <input type="hidden" name="upsell_group_id" value={group.id} />
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
        <strong>Producto sugerido:</strong>{" "}
        {buildItemsPreview(group, productById)}
      </p>

      {toggleState.error ? (
        <p className="admin-feedback admin-feedback--error" role="alert">
          {toggleState.error}
        </p>
      ) : null}
    </article>
  );
}
