"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addUpsellGroupItemAction,
  createUpsellGroupAction,
  toggleUpsellGroupAction,
  toggleUpsellGroupItemAction,
  updateUpsellGroupAction,
  updateUpsellGroupItemAction
} from "@/app/admin/(protected)/products/customizations/actions";
import type { AdminCategory } from "@/lib/categories/admin";
import {
  formatCustomizationPriceDelta,
  type AdminCatalogProductOption,
  type AdminUpsellGroup
} from "@/lib/product-customization/shared";
import styles from "./product-customization-admin.module.css";

type ActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

const initialState: ActionState = {};

type Props = {
  categories: AdminCategory[];
  products: AdminCatalogProductOption[];
  upsellGroups: AdminUpsellGroup[];
  defaultSortOrder: number;
};

export default function UpsellGroupsSection({
  categories,
  products,
  upsellGroups,
  defaultSortOrder
}: Props) {
  return (
    <section className={styles.sectionBlock}>
      <div className="admin-form-header">
        <h2>Plus sugeridos</h2>
        <p>
          Ofrecé productos extra antes de agregar al carrito. Ideal para bebidas, papas,
          postres o combos. Cada producto o categoría puede tener una venta sugerida activa.
        </p>
      </div>

      <div className={styles.sectionGrid}>
        <UpsellCreateForm
          categories={categories}
          products={products}
          defaultSortOrder={defaultSortOrder}
        />

        <div className={styles.list}>
          {upsellGroups.length > 0 ? (
            upsellGroups.map((group) => (
              <UpsellGroupCard
                key={group.id}
                group={group}
                products={products}
              />
            ))
          ) : (
            <div className="admin-empty-state">
              <h2>Todavía no estás sugiriendo productos extra</h2>
              <p>Creá una venta sugerida para una categoría o producto y sumá ítems.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function UpsellCreateForm({
  categories,
  products,
  defaultSortOrder
}: {
  categories: AdminCategory[];
  products: AdminCatalogProductOption[];
  defaultSortOrder: number;
}) {
  const router = useRouter();
  const [targetType, setTargetType] = useState<"category" | "product">("category");
  const [state, formAction, isPending] = useActionState(createUpsellGroupAction, initialState);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <form action={formAction} className="admin-form-card">
      <div className="admin-form-header">
        <h2>Nueva venta sugerida</h2>
        <p>
          Cuando el cliente compre un producto o de una categoría, sugerile extras. Una
          venta sugerida por destino.
        </p>
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
            <span>Cuando el cliente compre</span>
            <select
              name="target_type"
              value={targetType}
              onChange={(event) =>
                setTargetType(event.target.value === "product" ? "product" : "category")
              }
              disabled={isPending}
            >
              <option value="category">Categoría</option>
              <option value="product">Producto</option>
            </select>
          </label>

          <label className="admin-field">
            <span>De</span>
            <select
              key={targetType}
              name="target_id"
              required
              disabled={isPending}
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

        <details className={styles.advancedInline}>
          <summary>Opciones avanzadas</summary>
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
        </details>

        <label className={styles.checkboxRow}>
          <input type="hidden" name="is_available" value="false" />
          <input
            type="checkbox"
            name="is_available"
            value="true"
            defaultChecked
            disabled={isPending}
          />
          <span>Visible para el cliente</span>
        </label>
      </div>

      {state.error ? (
        <p className="admin-feedback admin-feedback--error" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success && state.message ? (
        <p className="admin-feedback admin-feedback--success">{state.message}</p>
      ) : null}

      <div className={styles.actionsRow}>
        <button type="submit" className="admin-primary-button" disabled={isPending}>
          {isPending ? "Guardando…" : "Crear venta sugerida"}
        </button>
      </div>
    </form>
  );
}

function UpsellGroupCard({
  group,
  products
}: {
  group: AdminUpsellGroup;
  products: AdminCatalogProductOption[];
}) {
  const router = useRouter();
  const [updateState, updateAction, isUpdating] = useActionState(
    updateUpsellGroupAction,
    initialState
  );
  const [toggleState, toggleAction, isToggling] = useActionState(
    toggleUpsellGroupAction,
    initialState
  );
  const [addState, addAction, isAdding] = useActionState(addUpsellGroupItemAction, initialState);

  useEffect(() => {
    if (updateState.success || toggleState.success || addState.success) {
      router.refresh();
    }
  }, [router, updateState.success, toggleState.success, addState.success]);

  const nextItemSort =
    group.items.length === 0
      ? 0
      : Math.max(...group.items.map((item) => item.sort_order)) + 10;

  const suggestedProducts = products.filter((product) => {
    if (group.items.some((item) => item.product_id === product.id)) {
      return false;
    }
    if (group.target_type === "product" && product.id === group.target_id) {
      return false;
    }
    return true;
  });

  return (
    <article className={styles.groupCard}>
      <div className={styles.groupHeader}>
        <div className={styles.groupMeta}>
          <h3 className={styles.groupTitle}>{group.name}</h3>
          <p className={styles.groupSummary}>
            {group.target_type === "category" ? "Categoría" : "Producto"}: {group.target_name}
          </p>
        </div>
        <span className={`${styles.chip} ${group.is_available ? "" : styles.chipDanger}`}>
          {group.is_available ? "Activo" : "Desactivado"}
        </span>
      </div>

      <form action={updateAction} className={styles.fields}>
        <input type="hidden" name="upsell_group_id" value={group.id} />
        <input type="hidden" name="target_type" value={group.target_type} />
        <input type="hidden" name="target_id" value={group.target_id} />

        <label className="admin-field">
          <span>Nombre</span>
          <input
            name="name"
            type="text"
            defaultValue={group.name}
            required
            disabled={isUpdating}
          />
        </label>

        <label className="admin-field">
          <span>Descripción</span>
          <textarea
            name="description"
            rows={2}
            defaultValue={group.description ?? ""}
            disabled={isUpdating}
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
              defaultValue={group.sort_order}
              required
              disabled={isUpdating}
            />
          </label>
          <label className={styles.checkboxRow}>
            <input type="hidden" name="is_available" value="false" />
            <input
              type="checkbox"
              name="is_available"
              value="true"
              defaultChecked={group.is_available}
              disabled={isUpdating}
            />
            <span>Visible para el cliente</span>
          </label>
        </div>

        <div className={styles.actionsRow}>
          <button type="submit" className="admin-primary-button" disabled={isUpdating}>
            {isUpdating ? "Guardando…" : "Guardar venta sugerida"}
          </button>
        </div>
      </form>

      <form action={toggleAction} className={styles.actionsRow}>
        <input type="hidden" name="upsell_group_id" value={group.id} />
        <input
          type="hidden"
          name="is_available"
          value={group.is_available ? "false" : "true"}
        />
        <button
          type="submit"
          className="admin-secondary-link admin-secondary-link--compact"
          disabled={isToggling}
        >
          {isToggling
            ? "Actualizando…"
            : group.is_available
              ? "Ocultar venta sugerida"
              : "Mostrar venta sugerida"}
        </button>
      </form>

      {(updateState.error || toggleState.error) && (
        <p className="admin-feedback admin-feedback--error" role="alert">
          {updateState.error || toggleState.error}
        </p>
      )}

      <div className={styles.optionsSection}>
        <h4 className={styles.optionsTitle}>Productos para sugerir</h4>

        {group.items.length > 0 ? (
          <div className={styles.optionList}>
            {group.items.map((item) => (
              <UpsellItemRow key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p className={styles.emptyOptions}>Todavía no hay productos sugeridos.</p>
        )}

        <form action={addAction} className={styles.fields}>
          <input type="hidden" name="upsell_group_id" value={group.id} />
          <div className={styles.fieldsTwo}>
            <label className="admin-field">
              <span>Producto</span>
              <select name="product_id" required disabled={isAdding} defaultValue="">
                <option value="" disabled>
                  Seleccionar…
                </option>
                {suggestedProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} — {formatCustomizationPriceDelta(product.price)}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              <span>Orden de aparición</span>
              <input
                name="sort_order"
                type="number"
                min={0}
                step={1}
                defaultValue={nextItemSort}
                required
                disabled={isAdding}
              />
            </label>
          </div>
          <label className={styles.checkboxRow}>
            <input type="hidden" name="is_available" value="false" />
            <input
              type="checkbox"
              name="is_available"
              value="true"
              defaultChecked
              disabled={isAdding}
            />
            <span>Visible para el cliente</span>
          </label>
          {addState.error ? (
            <p className="admin-feedback admin-feedback--error" role="alert">
              {addState.error}
            </p>
          ) : null}
          <button type="submit" className="admin-primary-button" disabled={isAdding}>
            {isAdding ? "Agregando…" : "Agregar sugerido"}
          </button>
        </form>
      </div>
    </article>
  );
}

function UpsellItemRow({
  item
}: {
  item: AdminUpsellGroup["items"][number];
}) {
  const router = useRouter();
  const [updateState, updateAction, isUpdating] = useActionState(
    updateUpsellGroupItemAction,
    initialState
  );
  const [toggleState, toggleAction, isToggling] = useActionState(
    toggleUpsellGroupItemAction,
    initialState
  );

  useEffect(() => {
    if (updateState.success || toggleState.success) {
      router.refresh();
    }
  }, [router, updateState.success, toggleState.success]);

  return (
    <div className={styles.optionCard}>
      <div className={styles.optionHeader}>
        <div>
          <p className={styles.optionName}>{item.product_name}</p>
          <p className={styles.optionPrice}>
            {formatCustomizationPriceDelta(item.product_price)}
          </p>
        </div>
        <span className={`${styles.chip} ${item.is_available ? "" : styles.chipDanger}`}>
          {item.is_available ? "Visible" : "Oculto"}
        </span>
      </div>

      <form action={updateAction} className={styles.inlineEdit}>
        <input type="hidden" name="upsell_item_id" value={item.id} />
        <label className="admin-field">
          <span>Orden de aparición</span>
          <input
            name="sort_order"
            type="number"
            min={0}
            step={1}
            defaultValue={item.sort_order}
            required
            disabled={isUpdating || isToggling}
          />
        </label>
        <button
          type="submit"
          className="admin-secondary-link admin-secondary-link--compact"
          disabled={isUpdating || isToggling}
        >
          {isUpdating ? "Guardando…" : "Guardar orden"}
        </button>
      </form>

      <form action={toggleAction}>
        <input type="hidden" name="upsell_item_id" value={item.id} />
        <input
          type="hidden"
          name="is_available"
          value={item.is_available ? "false" : "true"}
        />
        <button
          type="submit"
          className="admin-secondary-link admin-secondary-link--compact"
          disabled={isUpdating || isToggling}
        >
          {isToggling
            ? "Actualizando…"
            : item.is_available
              ? "Desactivar"
              : "Activar"}
        </button>
      </form>

      {(updateState.error || toggleState.error) && (
        <p className="admin-feedback admin-feedback--error" role="alert">
          {updateState.error || toggleState.error}
        </p>
      )}
    </div>
  );
}
