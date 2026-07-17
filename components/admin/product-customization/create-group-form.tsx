"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createCustomizationGroupAction } from "@/app/admin/(protected)/products/customizations/actions";
import styles from "./product-customization-admin.module.css";

type ActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

const initialState: ActionState = {};

type CreateGroupFormProps = {
  defaultSortOrder: number;
};

export default function CreateCustomizationGroupForm({
  defaultSortOrder
}: CreateGroupFormProps) {
  const router = useRouter();
  const [selectionType, setSelectionType] = useState<"single" | "multiple">("single");
  const [isRequired, setIsRequired] = useState(false);
  const [state, formAction, isPending] = useActionState(
    createCustomizationGroupAction,
    initialState
  );

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <form action={formAction} className="admin-form-card">
      <div className="admin-form-header">
        <h2>Nueva sección</h2>
        <p>Creá una sección reutilizable de opciones u extras.</p>
      </div>

      <div className={styles.fields}>
        <label className="admin-field">
          <span>Nombre</span>
          <input name="name" type="text" required disabled={isPending} />
        </label>

        <label className="admin-field">
          <span>Descripción</span>
          <textarea name="description" rows={2} disabled={isPending} />
        </label>

        <div className={styles.fieldsTwo}>
          <label className="admin-field">
            <span>Tipo de selección</span>
            <select
              name="selection_type"
              value={selectionType}
              onChange={(event) =>
                setSelectionType(event.target.value === "multiple" ? "multiple" : "single")
              }
              disabled={isPending}
            >
              <option value="single">Única</option>
              <option value="multiple">Múltiple</option>
            </select>
          </label>

          <label className="admin-field">
            <span>Orden de aparición</span>
            <input
              name="sort_order"
              type="number"
              min={0}
              step={1}
              defaultValue={defaultSortOrder}
              disabled={isPending}
              required
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
              defaultValue={isRequired ? 1 : 0}
              disabled={isPending}
              required
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
                defaultValue={3}
                disabled={isPending}
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
            disabled={isPending}
          />
          <span>Sección requerida</span>
        </label>

        <label className={styles.checkboxRow}>
          <input type="hidden" name="is_available" value="false" />
          <input
            name="is_available"
            type="checkbox"
            value="true"
            defaultChecked
            disabled={isPending}
          />
          <span>Visible para el cliente</span>
        </label>
      </div>

      {state.error ? (
        <p className="admin-feedback admin-feedback--error" aria-live="polite">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="admin-feedback admin-feedback--success" aria-live="polite">
          {state.message ?? "Sección creada."}
        </p>
      ) : null}

      <button type="submit" className="admin-primary-button" disabled={isPending}>
        {isPending ? "Guardando..." : "Crear sección"}
      </button>
    </form>
  );
}
