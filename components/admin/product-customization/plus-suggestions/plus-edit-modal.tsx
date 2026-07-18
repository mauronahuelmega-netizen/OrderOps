"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUpsellGroupAction,
  updateUpsellGroupAction
} from "@/app/admin/(protected)/products/customizations/actions";
import type { AdminCategory } from "@/lib/categories/admin";
import type {
  AdminCatalogProductOption,
  AdminUpsellGroup
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
  group: AdminUpsellGroup | null;
  categories: AdminCategory[];
  products: AdminCatalogProductOption[];
  defaultSortOrder: number;
  onClose: () => void;
};

export default function PlusEditModal({
  open,
  mode,
  group,
  categories,
  products,
  defaultSortOrder,
  onClose
}: Props) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [targetType, setTargetType] = useState<"category" | "product">("product");
  const [createState, createAction, createPending] = useActionState(
    createUpsellGroupAction,
    initialState
  );
  const [updateState, updateAction, updatePending] = useActionState(
    updateUpsellGroupAction,
    initialState
  );

  const pending = mode === "create" ? createPending : updatePending;
  const state = mode === "create" ? createState : updateState;
  const formAction = mode === "create" ? createAction : updateAction;

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
    if (!open) {
      return;
    }
    if (mode === "edit" && group) {
      setTargetType(group.target_type === "category" ? "category" : "product");
      return;
    }
    setTargetType("product");
  }, [open, mode, group]);

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
      aria-labelledby="plus-edit-title"
    >
      {open ? (
        <form action={formAction} className={styles.dialogForm}>
          {mode === "edit" && group ? (
            <>
              <input type="hidden" name="upsell_group_id" value={group.id} />
              <input type="hidden" name="target_type" value={group.target_type} />
              <input type="hidden" name="target_id" value={group.target_id} />
            </>
          ) : null}

          <div className={styles.dialogHeader}>
            <h2 id="plus-edit-title" className={styles.dialogTitle}>
              {mode === "create" ? "Crear plus sugerido" : "Editar plus"}
            </h2>
            <p className={styles.dialogSubtitle}>
              Un plus sugerido es un producto extra que se ofrece antes de agregar el
              pedido al carrito. Ejemplo: sugerir una bebida junto a una hamburguesa.
            </p>
          </div>

          <div className={styles.fields}>
            <label className="admin-field">
              <span>Nombre</span>
              <input
                name="name"
                type="text"
                required
                disabled={pending}
                defaultValue={mode === "edit" ? (group?.name ?? "") : ""}
                key={mode === "edit" ? `name-${group?.id}` : "name-create"}
              />
            </label>

            <label className="admin-field">
              <span>Descripción</span>
              <textarea
                name="description"
                rows={2}
                disabled={pending}
                defaultValue={mode === "edit" ? (group?.description ?? "") : ""}
                key={mode === "edit" ? `desc-${group?.id}` : "desc-create"}
                placeholder="Sumá una bebida a tu pedido"
              />
            </label>

            {mode === "create" ? (
              <>
                <div className={styles.fieldsTwo}>
                  <label className="admin-field">
                    <span>Dónde aparece</span>
                    <select
                      name="target_type"
                      value={targetType}
                      onChange={(event) =>
                        setTargetType(
                          event.target.value === "category" ? "category" : "product"
                        )
                      }
                      disabled={pending}
                    >
                      <option value="product">Producto específico</option>
                      <option value="category">Categoría</option>
                    </select>
                  </label>

                  <label className="admin-field">
                    <span>{targetType === "category" ? "Categoría" : "Producto"}</span>
                    <select
                      key={targetType}
                      name="target_id"
                      required
                      disabled={pending}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Seleccionar…
                      </option>
                      {targetType === "category"
                        ? categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))
                        : products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                    </select>
                  </label>
                </div>
                <p className={styles.helper}>
                  Solo puede haber una venta sugerida por categoría o producto. Si ya
                  existe una, editá o mostrá/ocultá la existente.
                </p>
              </>
            ) : (
              <div className={styles.readOnlyBox}>
                <p className={styles.readOnlyLabel}>Aparece en</p>
                <p className={styles.readOnlyValue}>
                  {group?.target_type === "category" ? "Categoría" : "Producto"} ·{" "}
                  {group?.target_name}
                </p>
                <p className={styles.helper}>
                  Para cambiar dónde aparece este plus, creá uno nuevo para otro
                  producto o categoría.
                </p>
              </div>
            )}

            <details className={styles.advancedInline}>
              <summary>Opciones avanzadas</summary>
              <label className="admin-field">
                <span>Orden de aparición</span>
                <input
                  name="sort_order"
                  type="number"
                  min={0}
                  step={1}
                  required
                  disabled={pending}
                  defaultValue={
                    mode === "edit" ? (group?.sort_order ?? 0) : defaultSortOrder
                  }
                  key={mode === "edit" ? `sort-${group?.id}` : "sort-create"}
                />
              </label>
            </details>

            <label className={styles.checkboxRow}>
              <input type="hidden" name="is_available" value="false" />
              <input
                name="is_available"
                type="checkbox"
                value="true"
                defaultChecked={mode === "edit" ? (group?.is_available ?? true) : true}
                disabled={pending}
                key={mode === "edit" ? `avail-${group?.id}` : "avail-create"}
              />
              <span>
                Visible para el cliente
                <span className={styles.helper}>
                  {" "}
                  Aparece en el modal del catálogo público.
                </span>
              </span>
            </label>
          </div>

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
            <button type="submit" className="admin-primary-button" disabled={pending}>
              {pending
                ? "Guardando…"
                : mode === "create"
                  ? "Crear plus"
                  : "Guardar plus"}
            </button>
          </div>
        </form>
      ) : null}
    </dialog>
  );
}
