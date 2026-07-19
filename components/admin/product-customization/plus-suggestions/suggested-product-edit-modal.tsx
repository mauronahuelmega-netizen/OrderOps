"use client";

import { useActionState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  addUpsellGroupItemAction,
  updateUpsellGroupItemAction
} from "@/app/admin/(protected)/products/customizations/actions";
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
  open: boolean;
  mode: "create" | "edit";
  group: AdminUpsellGroup;
  item: AdminUpsellGroup["items"][number] | null;
  products: AdminCatalogProductOption[];
  onClose: () => void;
};

export default function SuggestedProductEditModal({
  open,
  mode,
  group,
  item,
  products,
  onClose
}: Props) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [createState, createAction, createPending] = useActionState(
    addUpsellGroupItemAction,
    initialState
  );
  const [updateState, updateAction, updatePending] = useActionState(
    updateUpsellGroupItemAction,
    initialState
  );

  const pending = mode === "create" ? createPending : updatePending;
  const state = mode === "create" ? createState : updateState;
  const formAction = mode === "create" ? createAction : updateAction;

  const nextSort = useMemo(() => {
    if (group.items.length === 0) {
      return 0;
    }
    return Math.max(...group.items.map((entry) => entry.sort_order)) + 10;
  }, [group.items]);

  const suggestedProducts = useMemo(() => {
    return products.filter((product) => {
      if (group.items.some((entry) => entry.product_id === product.id)) {
        return false;
      }
      if (group.target_type === "product" && product.id === group.target_id) {
        return false;
      }
      return true;
    });
  }, [products, group]);

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
    if (!open || !state.success) {
      return;
    }
    router.refresh();
    onClose();
  }, [open, state.success, router, onClose]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onClose={onClose}
      aria-labelledby="suggested-product-edit-title"
    >
      {open ? (
        <form action={formAction} className={styles.dialogForm}>
          <input type="hidden" name="upsell_group_id" value={group.id} />
          {mode === "edit" && item ? (
            <input type="hidden" name="upsell_item_id" value={item.id} />
          ) : null}

          <div className={styles.dialogHeader}>
            <h2 id="suggested-product-edit-title" className={styles.dialogTitle}>
              {mode === "create"
                ? "Agregar producto sugerido"
                : "Editar producto sugerido"}
            </h2>
            <p className={styles.dialogSubtitle}>
              Plus: {group.name}. Solo podés sugerir productos que ya existen en tu
              catálogo.
            </p>
          </div>

          <div className={styles.fields}>
            {mode === "create" ? (
              <label className="admin-field">
                <span>Producto a sugerir</span>
                <select name="product_id" required disabled={pending} defaultValue="">
                  <option value="" disabled>
                    Seleccionar…
                  </option>
                  {suggestedProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} — {formatCustomizationPriceDelta(product.price)}
                      {!product.is_available ? " (no disponible)" : ""}
                    </option>
                  ))}
                </select>
                <p className={styles.helper}>
                  El precio lo define el producto en Catálogo. Acá solo elegís qué
                  sugerir.
                </p>
              </label>
            ) : (
              <div className={styles.readOnlyBox}>
                <p className={styles.readOnlyLabel}>Producto sugerido</p>
                <p className={styles.readOnlyValue}>{item?.product_name}</p>
                <p className={styles.helper}>
                  Precio: +
                  {formatCustomizationPriceDelta(Number(item?.product_price ?? 0))}.
                  Para cambiar el producto, ocultá este y agregá otro.
                </p>
              </div>
            )}

            <div className={styles.fieldsTwo}>
              <label className="admin-field">
                <span>Orden de aparición</span>
                <input
                  name="sort_order"
                  type="number"
                  min={0}
                  step={1}
                  required
                  disabled={pending}
                  defaultValue={mode === "edit" ? (item?.sort_order ?? 0) : nextSort}
                  key={mode === "edit" ? `sort-${item?.id}` : "sort-create"}
                />
              </label>

              <label className={styles.checkboxRow}>
                <input type="hidden" name="is_available" value="false" />
                <input
                  name="is_available"
                  type="checkbox"
                  value="true"
                  defaultChecked={
                    mode === "edit" ? (item?.is_available ?? true) : true
                  }
                  disabled={pending}
                  key={mode === "edit" ? `avail-${item?.id}` : "avail-create"}
                />
                <span>
                  Visible para clientes
                  <span className={styles.helper}>
                    {" "}
                    Si está oculto, no aparece en este plus.
                  </span>
                </span>
              </label>
            </div>
          </div>

          {mode === "create" && suggestedProducts.length === 0 ? (
            <p className={styles.helper} role="status">
              No hay más productos disponibles para sugerir en este plus.
            </p>
          ) : null}

          {state.error ? (
            <p className="admin-feedback admin-feedback--error" role="alert">
              {state.error}
            </p>
          ) : null}

          <div className={styles.dialogFooter}>
            <button
              type="button"
              className="admin-secondary-link admin-secondary-link--compact"
              onClick={onClose}
              disabled={pending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="admin-primary-button"
              disabled={
                pending || (mode === "create" && suggestedProducts.length === 0)
              }
            >
              {pending
                ? "Guardando…"
                : mode === "create"
                  ? "Agregar producto"
                  : "Guardar cambios"}
            </button>
          </div>
        </form>
      ) : null}
    </dialog>
  );
}
