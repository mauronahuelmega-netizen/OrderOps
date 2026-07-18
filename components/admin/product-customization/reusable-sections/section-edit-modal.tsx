"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createCustomizationGroupAction,
  updateCustomizationGroupAction
} from "@/app/admin/(protected)/products/customizations/actions";
import type { AdminCustomizationGroup } from "@/lib/product-customization/shared";
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
  group: AdminCustomizationGroup | null;
  defaultSortOrder: number;
  onClose: () => void;
};

export default function SectionEditModal({
  open,
  mode,
  group,
  defaultSortOrder,
  onClose
}: Props) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectionType, setSelectionType] = useState<"single" | "multiple">("single");
  const [isRequired, setIsRequired] = useState(false);
  const [createState, createAction, createPending] = useActionState(
    createCustomizationGroupAction,
    initialState
  );
  const [updateState, updateAction, updatePending] = useActionState(
    updateCustomizationGroupAction,
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
      setSelectionType(group.selection_type);
      setIsRequired(group.is_required);
      return;
    }
    setSelectionType("single");
    setIsRequired(false);
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
      aria-labelledby="section-edit-title"
    >
      {open ? (
        <form action={formAction} className={styles.dialogForm}>
          {mode === "edit" && group ? (
            <input type="hidden" name="group_id" value={group.id} />
          ) : null}

          <div className={styles.dialogHeader}>
            <h2 id="section-edit-title" className={styles.dialogTitle}>
              {mode === "create" ? "Crear sección" : "Editar sección"}
            </h2>
            <p className={styles.dialogSubtitle}>
              Configurá cómo el cliente elige dentro de esta sección.
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
              />
            </label>

            <div className={styles.fieldsTwo}>
              <label className="admin-field">
                <span>Tipo de selección</span>
                <select
                  name="selection_type"
                  value={selectionType}
                  onChange={(event) =>
                    setSelectionType(
                      event.target.value === "multiple" ? "multiple" : "single"
                    )
                  }
                  disabled={pending}
                >
                  <option value="single">Única</option>
                  <option value="multiple">Múltiple</option>
                </select>
                <p className={styles.helper}>
                  {selectionType === "single"
                    ? "El cliente elige una sola opción."
                    : "El cliente puede elegir varias opciones."}
                </p>
              </label>

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
            </div>

            <div className={styles.fieldsTwo}>
              <label className="admin-field">
                <span>Mínimo</span>
                <input
                  name="min_selections"
                  type="number"
                  min={0}
                  step={1}
                  required
                  disabled={pending}
                  defaultValue={
                    mode === "edit"
                      ? group?.min_selections
                      : isRequired
                        ? 1
                        : 0
                  }
                  key={
                    mode === "edit"
                      ? `min-${group?.id}-${isRequired}`
                      : `min-create-${isRequired}`
                  }
                />
              </label>

              {selectionType === "single" ? (
                <input type="hidden" name="max_selections" value="1" />
              ) : (
                <label className="admin-field">
                  <span>Máximo</span>
                  <input
                    name="max_selections"
                    type="number"
                    min={0}
                    step={1}
                    disabled={pending}
                    defaultValue={
                      mode === "edit" ? (group?.max_selections ?? "") : 3
                    }
                    key={mode === "edit" ? `max-${group?.id}` : "max-create"}
                  />
                </label>
              )}
            </div>

            <label className={styles.checkboxRow}>
              <input type="hidden" name="is_required" value="false" />
              <input
                name="is_required"
                type="checkbox"
                value="true"
                checked={isRequired}
                onChange={(event) => setIsRequired(event.target.checked)}
                disabled={pending}
              />
              <span>
                Sección requerida
                <span className={styles.helper}>
                  {" "}
                  El cliente debe completar esta sección para continuar.
                </span>
              </span>
            </label>

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
                  Aparece en el catálogo público.
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
              {pending ? "Guardando..." : "Guardar sección"}
            </button>
          </div>
        </form>
      ) : null}
    </dialog>
  );
}
