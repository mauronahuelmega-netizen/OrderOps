"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  createCustomizationOptionAction,
  reorderCustomizationOptionsAction,
  toggleCustomizationGroupAvailabilityAction,
  toggleCustomizationOptionAvailabilityAction,
  updateCustomizationGroupAction,
  updateCustomizationOptionAction
} from "@/app/admin/(protected)/products/customizations/actions";
import SortableReorderList from "@/components/admin/product-customization/sortable-reorder-list";
import {
  formatCustomizationPriceDelta,
  suggestNextOptionSortOrder,
  type AdminCustomizationGroup,
  type AdminCustomizationOption
} from "@/lib/product-customization/shared";
import styles from "./product-customization-admin.module.css";

type ActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

const initialState: ActionState = {};

type CustomizationGroupCardProps = {
  group: AdminCustomizationGroup;
};

function selectionLabel(group: AdminCustomizationGroup) {
  if (group.selection_type === "single") {
    return group.is_required ? "Única · requerida" : "Única · opcional";
  }

  return group.is_required ? "Múltiple · requerida" : "Múltiple · opcional";
}

function OptionEditor({
  option,
  groupId,
  chrome
}: {
  option: AdminCustomizationOption;
  groupId: string;
  chrome?: {
    dragHandle?: ReactNode;
    moveControls?: ReactNode;
  };
}) {
  const router = useRouter();
  const [updateState, updateAction, updatePending] = useActionState(
    updateCustomizationOptionAction,
    initialState
  );
  const [toggleState, toggleAction, togglePending] = useActionState(
    toggleCustomizationOptionAvailabilityAction,
    initialState
  );

  useEffect(() => {
    if (updateState.success || toggleState.success) {
      router.refresh();
    }
  }, [router, toggleState.success, updateState.success]);

  const pending = updatePending || togglePending;
  const feedback = updateState.error || toggleState.error;
  const success = updateState.success
    ? updateState.message
    : toggleState.success
      ? toggleState.message
      : null;

  return (
    <div className={styles.optionCard}>
      <div className={styles.optionHeader}>
        <div className={styles.sortableToolbarInline}>
          {chrome?.dragHandle}
          {chrome?.moveControls}
          <div>
            <p className={styles.optionName}>{option.name}</p>
            <p className={styles.optionPrice}>
              {Number(option.price_delta) > 0
                ? `+ ${formatCustomizationPriceDelta(Number(option.price_delta))}`
                : "Incluido / +$0"}
              {!option.is_available ? " · Desactivada" : ""}
            </p>
          </div>
        </div>
        <form action={toggleAction}>
          <input type="hidden" name="option_id" value={option.id} />
          <input
            type="hidden"
            name="is_available"
            value={option.is_available ? "false" : "true"}
          />
          <button type="submit" className="admin-ghost-link" disabled={pending}>
            {option.is_available ? "Desactivar" : "Activar"}
          </button>
        </form>
      </div>

      <form action={updateAction} className={styles.fields}>
        <input type="hidden" name="option_id" value={option.id} />
        <input type="hidden" name="group_id" value={groupId} />

        <div className={styles.fieldsTwo}>
          <label className="admin-field">
            <span>Nombre</span>
            <input
              name="name"
              type="text"
              defaultValue={option.name}
              required
              disabled={pending}
            />
          </label>
          <label className="admin-field">
            <span>Precio adicional</span>
            <input
              name="price_delta"
              type="text"
              inputMode="decimal"
              defaultValue={String(option.price_delta)}
              disabled={pending}
            />
          </label>
        </div>

        <label className="admin-field">
          <span>Descripción</span>
          <textarea
            name="description"
            rows={2}
            defaultValue={option.description ?? ""}
            disabled={pending}
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
              defaultValue={option.sort_order}
              required
              disabled={pending}
            />
          </label>
          <label className={styles.checkboxRow}>
            <input type="hidden" name="is_available" value="false" />
            <input
              name="is_available"
              type="checkbox"
              value="true"
              defaultChecked={option.is_available}
              disabled={pending}
            />
            <span>Visible para el cliente</span>
          </label>
        </div>

        {feedback ? (
          <p className="admin-feedback admin-feedback--error" aria-live="polite">
            {feedback}
          </p>
        ) : null}
        {success ? (
          <p className="admin-feedback admin-feedback--success" aria-live="polite">
            {success}
          </p>
        ) : null}

        <button type="submit" className="admin-primary-button" disabled={pending}>
          {updatePending ? "Guardando..." : "Guardar opción"}
        </button>
      </form>
    </div>
  );
}

export default function CustomizationGroupCard({ group }: CustomizationGroupCardProps) {
  const router = useRouter();
  const [selectionType, setSelectionType] = useState<"single" | "multiple">(
    group.selection_type
  );
  const [updateState, updateAction, updatePending] = useActionState(
    updateCustomizationGroupAction,
    initialState
  );
  const [toggleState, toggleAction, togglePending] = useActionState(
    toggleCustomizationGroupAvailabilityAction,
    initialState
  );
  const [createOptionState, createOptionAction, createOptionPending] = useActionState(
    createCustomizationOptionAction,
    initialState
  );

  useEffect(() => {
    if (updateState.success || toggleState.success || createOptionState.success) {
      router.refresh();
    }
  }, [
    createOptionState.success,
    router,
    toggleState.success,
    updateState.success
  ]);

  const nextOptionSort = suggestNextOptionSortOrder(group.options);
  const groupPending = updatePending || togglePending;

  return (
    <article className={styles.groupCard}>
      <div className={styles.groupHeader}>
        <div className={styles.groupMeta}>
          <h3 className={styles.groupTitle}>{group.name}</h3>
          <p className={styles.groupSummary}>
            {group.description?.trim() || "Sin descripción"}
          </p>
          <div className={styles.metaRow}>
            <span className={styles.chip}>{selectionLabel(group)}</span>
            <span className={styles.chip}>
              Min {group.min_selections}
              {group.max_selections === null ? "" : ` · Max ${group.max_selections}`}
            </span>
            <span className={styles.chip}>{group.options.length} opciones</span>
            {!group.is_available ? (
              <span className={`${styles.chip} ${styles.chipDanger}`}>Desactivado</span>
            ) : null}
          </div>
        </div>

        <form action={toggleAction}>
          <input type="hidden" name="group_id" value={group.id} />
          <input
            type="hidden"
            name="is_available"
            value={group.is_available ? "false" : "true"}
          />
          <button type="submit" className="admin-ghost-link" disabled={groupPending}>
            {group.is_available ? "Ocultar sección" : "Mostrar sección"}
          </button>
        </form>
      </div>

      <form action={updateAction} className={styles.fields}>
        <input type="hidden" name="group_id" value={group.id} />

        <label className="admin-field">
          <span>Nombre</span>
          <input
            name="name"
            type="text"
            defaultValue={group.name}
            required
            disabled={groupPending}
          />
        </label>

        <label className="admin-field">
          <span>Descripción</span>
          <textarea
            name="description"
            rows={2}
            defaultValue={group.description ?? ""}
            disabled={groupPending}
          />
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
              disabled={groupPending}
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
              defaultValue={group.sort_order}
              required
              disabled={groupPending}
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
              defaultValue={group.min_selections}
              required
              disabled={groupPending}
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
                defaultValue={group.max_selections ?? ""}
                disabled={groupPending}
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
            defaultChecked={group.is_required}
            disabled={groupPending}
          />
          <span>Sección requerida</span>
        </label>

        <label className={styles.checkboxRow}>
          <input type="hidden" name="is_available" value="false" />
          <input
            name="is_available"
            type="checkbox"
            value="true"
            defaultChecked={group.is_available}
            disabled={groupPending}
          />
          <span>Visible para el cliente</span>
        </label>

        {updateState.error || toggleState.error ? (
          <p className="admin-feedback admin-feedback--error" aria-live="polite">
            {updateState.error || toggleState.error}
          </p>
        ) : null}
        {updateState.success || toggleState.success ? (
          <p className="admin-feedback admin-feedback--success" aria-live="polite">
            {updateState.message || toggleState.message}
          </p>
        ) : null}

        <button type="submit" className="admin-primary-button" disabled={groupPending}>
          {updatePending ? "Guardando..." : "Guardar sección"}
        </button>
      </form>

      <section className={styles.optionsSection}>
        <h4 className={styles.optionsTitle}>Opciones</h4>

        {group.options.length > 1 ? (
          <SortableReorderList
            items={group.options}
            successFallbackMessage="Orden de aparición de opciones actualizado."
            getItemAriaLabel={(option) => option.name}
            listClassName={styles.optionList}
            persist={async (orderedIds) => {
              const formData = new FormData();
              formData.set("groupId", group.id);
              formData.set("orderedIdsJson", JSON.stringify(orderedIds));
              return reorderCustomizationOptionsAction({}, formData);
            }}
            renderItem={(option, chrome) => (
              <OptionEditor
                option={option}
                groupId={group.id}
                chrome={{
                  dragHandle: chrome.dragHandle,
                  moveControls: chrome.moveControls
                }}
              />
            )}
          />
        ) : group.options.length === 1 ? (
          <div className={styles.optionList}>
            <OptionEditor option={group.options[0]} groupId={group.id} />
          </div>
        ) : (
          <p className={styles.emptyOptions}>Este grupo todavía no tiene opciones.</p>
        )}

        <form action={createOptionAction} className={styles.fields}>
          <input type="hidden" name="group_id" value={group.id} />
          <h4 className={styles.optionsTitle}>Nueva opción</h4>

          <div className={styles.fieldsTwo}>
            <label className="admin-field">
              <span>Nombre</span>
              <input name="name" type="text" required disabled={createOptionPending} />
            </label>
            <label className="admin-field">
              <span>Precio adicional</span>
              <input
                name="price_delta"
                type="text"
                inputMode="decimal"
                defaultValue="0"
                disabled={createOptionPending}
              />
            </label>
          </div>

          <label className="admin-field">
            <span>Descripción</span>
            <textarea name="description" rows={2} disabled={createOptionPending} />
          </label>

          <div className={styles.fieldsTwo}>
            <label className="admin-field">
              <span>Orden de aparición</span>
              <input
                name="sort_order"
                type="number"
                min={0}
                step={1}
                defaultValue={nextOptionSort}
                required
                disabled={createOptionPending}
              />
            </label>
            <label className={styles.checkboxRow}>
              <input type="hidden" name="is_available" value="false" />
              <input
                name="is_available"
                type="checkbox"
                value="true"
                defaultChecked
                disabled={createOptionPending}
              />
              <span>Visible para el cliente</span>
            </label>
          </div>

          {createOptionState.error ? (
            <p className="admin-feedback admin-feedback--error" aria-live="polite">
              {createOptionState.error}
            </p>
          ) : null}
          {createOptionState.success ? (
            <p className="admin-feedback admin-feedback--success" aria-live="polite">
              {createOptionState.message ?? "Opción creada."}
            </p>
          ) : null}

          <button
            type="submit"
            className="admin-primary-button"
            disabled={createOptionPending}
          >
            {createOptionPending ? "Guardando..." : "Crear opción"}
          </button>
        </form>
      </section>
    </article>
  );
}
