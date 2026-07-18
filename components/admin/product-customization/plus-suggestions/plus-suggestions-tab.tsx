"use client";

import { useCallback, useMemo, useState } from "react";
import type { AdminCategory } from "@/lib/categories/admin";
import type {
  AdminCatalogProductOption,
  AdminUpsellGroup
} from "@/lib/product-customization/shared";
import PlusEditModal from "./plus-edit-modal";
import PlusSuggestionCard from "./plus-suggestion-card";
import SuggestedProductsModal from "./suggested-products-modal";
import styles from "./plus-suggestions.module.css";

type Props = {
  categories: AdminCategory[];
  products: AdminCatalogProductOption[];
  upsellGroups: AdminUpsellGroup[];
  defaultSortOrder: number;
};

export default function PlusSuggestionsTab({
  categories,
  products,
  upsellGroups,
  defaultSortOrder
}: Props) {
  const [plusModal, setPlusModal] = useState<
    { mode: "create" } | { mode: "edit"; groupId: string } | null
  >(null);
  const [manageGroupId, setManageGroupId] = useState<string | null>(null);

  const groupsById = useMemo(() => {
    return new Map(upsellGroups.map((group) => [group.id, group]));
  }, [upsellGroups]);

  const categoryNameById = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category.name]));
  }, [categories]);

  const productById = useMemo(() => {
    return new Map(products.map((product) => [product.id, product]));
  }, [products]);

  const editingGroup =
    plusModal?.mode === "edit"
      ? (groupsById.get(plusModal.groupId) ?? null)
      : null;

  const manageGroup = manageGroupId
    ? (groupsById.get(manageGroupId) ?? null)
    : null;

  const closePlusModal = useCallback(() => {
    setPlusModal(null);
  }, []);

  const closeManageModal = useCallback(() => {
    setManageGroupId(null);
  }, []);

  const sortedGroups = useMemo(() => {
    return [...upsellGroups].sort((a, b) => {
      if (a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order;
      }
      return a.created_at.localeCompare(b.created_at);
    });
  }, [upsellGroups]);

  return (
    <div className={styles.tab}>
      <div className={styles.tabHeader}>
        <div className={styles.tabHeaderText}>
          <h2 className={styles.tabTitle}>Plus sugeridos</h2>
          <p className={styles.tabSubtitle}>
            Sugerí productos extra para aumentar el ticket promedio. Por ejemplo,
            ofrecé una bebida cuando el cliente personaliza una hamburguesa. Cada
            producto o categoría puede tener una venta sugerida activa.
          </p>
        </div>
        <button
          type="button"
          className="admin-primary-button"
          onClick={() => setPlusModal({ mode: "create" })}
        >
          + Nuevo plus
        </button>
      </div>

      <section className={styles.listShell} aria-labelledby="plus-suggestions-list">
        <div className={styles.listHeading}>
          <h3 id="plus-suggestions-list">Tus ventas sugeridas</h3>
        </div>

        {sortedGroups.length === 0 ? (
          <div className="admin-empty-state">
            <h2>Todavía no estás sugiriendo productos extra</h2>
            <p>
              Creá una venta sugerida para una categoría o producto y sumá ítems del
              catálogo.
            </p>
            <button
              type="button"
              className="admin-primary-button"
              onClick={() => setPlusModal({ mode: "create" })}
            >
              + Nuevo plus
            </button>
          </div>
        ) : (
          <div className={styles.cardList}>
            {sortedGroups.map((group) => (
              <PlusSuggestionCard
                key={group.id}
                group={group}
                productById={productById}
                onEdit={() => setPlusModal({ mode: "edit", groupId: group.id })}
                onManageProducts={() => setManageGroupId(group.id)}
              />
            ))}
          </div>
        )}
      </section>

      {plusModal ? (
        <PlusEditModal
          key={
            plusModal.mode === "edit"
              ? `plus-edit-${plusModal.groupId}`
              : "plus-create"
          }
          open
          mode={plusModal.mode}
          group={editingGroup}
          categories={categories}
          products={products}
          defaultSortOrder={defaultSortOrder}
          onClose={closePlusModal}
        />
      ) : null}

      {manageGroupId && manageGroup ? (
        <SuggestedProductsModal
          key={`manage-${manageGroupId}`}
          open
          group={manageGroup}
          products={products}
          categoryNameById={categoryNameById}
          productById={productById}
          onClose={closeManageModal}
        />
      ) : null}
    </div>
  );
}
