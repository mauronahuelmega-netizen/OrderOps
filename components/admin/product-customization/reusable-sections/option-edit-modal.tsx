"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  createCustomizationOptionAction,
  updateCustomizationOptionAction
} from "@/app/admin/(protected)/products/customizations/actions";
import {
  suggestNextOptionSortOrder,
  type AdminCustomizationGroup,
  type AdminCustomizationOption
} from "@/lib/product-customization/shared";
import styles from "./reusable-sections.module.css";

type ActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

const initialState: ActionState = {};

type Props = {
  open: boolean;
  mode: "create" | "edit";
  group: AdminCustomizationGroup;
  option: AdminCustomizationOption | null;
  onClose: () => void;
};

export default function OptionEditModal({
  open,
  mode,
  group,
  option,
  onClose
}: Props) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [createState, createAction, createPending] = useActionState(
    createCustomizationOptionAction,
    initialState
  );
  const [updateState, updateAction, updatePending] = useActionState(
    updateCustomizationOptionAction,
    initialState
  );

  const pending = mode === "create" ? createPending : updatePending;
  const state = mode === "create" ? createState : updateState;
  const formAction = mode === "create" ? createAction : updateAction;
  const nextSort = suggestNextOptionSortOrder(group.options);

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
      aria-labelledby="option-edit-title"
    >
      {open ? (
        <form action={formAction} className={styles.dialogForm}>
          <input type="hidden" name="group_id" value={group.id} />
          {mode === "edit" && option ? (
            <input type="hidden" name="option_id" value={option.id} />
          ) : null}

          <div className={styles.dialogHeader}>
            <h2 id="option-edit-title" className={styles.dialogTitle}>
              {mode === "create" ? "Crear opción" : "Editar opción"}
            </h2>
            <p className={styles.dialogSubtitle}>
              Sección: {group.name}
            </p>
          </div>

          <div className={styles.fields}>
            <div className={styles.fieldsTwo}>
              <label className="admin-field">
                <span>Nombre</span>
                <input
                  name="name"
                  type="text"
                  required
                  disabled={pending}
                  defaultValue={mode === "edit" ? (option?.name ?? "") : ""}
                  key={mode === "edit" ? `oname-${option?.id}` : "oname-create"}
                />
              </label>
              <label className="admin-field">
                <span>Precio adicional</span>
                <input
                  name="price_delta"
                  type="text"
                  inputMode="decimal"
                  disabled={pending}
                  defaultValue={
                    mode === "edit" ? String(option?.price_delta ?? 0) : "0"
                  }
                  key={mode === "edit" ? `oprice-${option?.id}` : "oprice-create"}
                />
                <p className={styles.helper}>
                  Usá 0 si esta opción está incluida en el precio base.
                </p>
              </label>
            </div>

            <label className="admin-field">
              <span>Descripción</span>
              <textarea
                name="description"
                rows={2}
                disabled={pending}
                defaultValue={mode === "edit" ? (option?.description ?? "") : ""}
                key={mode === "edit" ? `odesc-${option?.id}` : "odesc-create"}
              />
            </label>

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
                  defaultValue={
                    mode === "edit" ? (option?.sort_order ?? 0) : nextSort
                  }
                  key={mode === "edit" ? `osort-${option?.id}` : "osort-create"}
                />
              </label>
              <label className={styles.checkboxRow}>
                <input type="hidden" name="is_available" value="false" />
                <input
                  name="is_available"
                  type="checkbox"
                  value="true"
                  defaultChecked={
                    mode === "edit" ? (option?.is_available ?? true) : true
                  }
                  disabled={pending}
                  key={mode === "edit" ? `oavail-${option?.id}` : "oavail-create"}
                />
                <span>
                  Visible para clientes
                  <span className={styles.helper}>
                    {" "}
                    Si está oculta, el cliente no la verá en el catálogo.
                  </span>
                </span>
              </label>
            </div>
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
              {pending ? "Guardando..." : "Guardar opción"}
            </button>
          </div>
        </form>
      ) : null}
    </dialog>
  );
}
