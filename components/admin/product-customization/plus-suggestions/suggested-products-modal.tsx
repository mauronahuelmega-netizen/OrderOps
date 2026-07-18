"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUpsellGroupItemAction } from "@/app/admin/(protected)/products/customizations/actions";
import type {
  AdminCatalogProductOption,
  AdminUpsellGroup
} from "@/lib/product-customization/shared";
import SuggestedProductEditModal from "./suggested-product-edit-modal";
import SuggestedProductRow from "./suggested-product-row";
import styles from "./plus-suggestions.module.css";

type Props = {
  open: boolean;
  group: AdminUpsellGroup | null;
  products: AdminCatalogProductOption[];
  categoryNameById: Map<string, string>;
  productById: Map<string, AdminCatalogProductOption>;
  onClose: () => void;
};

export default function SuggestedProductsModal({
  open,
  group,
  products,
  categoryNameById,
  productById,
  onClose
}: Props) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [reorderPending, startReorder] = useTransition();
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [itemModal, setItemModal] = useState<
    | { mode: "create" }
    | { mode: "edit"; item: AdminUpsellGroup["items"][number] }
    | null
  >(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open && group && !dialog.open) {
      dialog.showModal();
    }
    if ((!open || !group) && dialog.open) {
      dialog.close();
    }
  }, [open, group]);

  useEffect(() => {
    if (!open) {
      setItemModal(null);
      setReorderError(null);
    }
  }, [open]);

  const sortedItems = useMemo(() => {
    if (!group) {
      return [];
    }
    return [...group.items].sort((a, b) => {
      if (a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order;
      }
      return a.created_at.localeCompare(b.created_at);
    });
  }, [group]);

  function moveItem(index: number, direction: -1 | 1) {
    if (!group) {
      return;
    }
    const otherIndex = index + direction;
    if (otherIndex < 0 || otherIndex >= sortedItems.length) {
      return;
    }

    const current = sortedItems[index];
    const other = sortedItems[otherIndex];
    let currentSort = current.sort_order;
    let otherSort = other.sort_order;

    if (currentSort === otherSort) {
      currentSort = otherIndex * 10;
      otherSort = index * 10;
    }

    startReorder(async () => {
      setReorderError(null);

      const firstData = new FormData();
      firstData.set("upsell_item_id", current.id);
      firstData.set("sort_order", String(otherSort));
      const firstResult = await updateUpsellGroupItemAction({}, firstData);
      if (firstResult.error) {
        setReorderError(firstResult.error);
        return;
      }

      const secondData = new FormData();
      secondData.set("upsell_item_id", other.id);
      secondData.set("sort_order", String(currentSort));
      const secondResult = await updateUpsellGroupItemAction({}, secondData);
      if (secondResult.error) {
        setReorderError(secondResult.error);
        return;
      }

      router.refresh();
    });
  }

  const itemModalOpen = itemModal !== null && group !== null;

  return (
    <>
      <dialog
        ref={dialogRef}
        className={`${styles.dialog} ${styles.dialogWide}`}
        onClose={onClose}
        aria-labelledby="suggested-products-title"
      >
        {open && group ? (
          <div className={styles.dialogForm}>
            <div className={styles.dialogHeader}>
              <h2 id="suggested-products-title" className={styles.dialogTitle}>
                Productos sugeridos en {group.name}
              </h2>
              <p className={styles.dialogSubtitle}>
                Estos productos se ofrecerán como adicionales cuando el cliente compre{" "}
                {group.target_type === "category" ? "en" : ""} {group.target_name}.
              </p>
            </div>

            <div className={styles.optionsModalBody}>
              <div className={styles.optionsModalToolbar}>
                <p className={styles.helper}>
                  {sortedItems.length}{" "}
                  {sortedItems.length === 1 ? "producto" : "productos"}
                  {reorderPending ? " · Guardando orden…" : ""}
                </p>
                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={() => setItemModal({ mode: "create" })}
                  disabled={reorderPending}
                >
                  + Agregar producto
                </button>
              </div>

              {reorderError ? (
                <p className="admin-feedback admin-feedback--error" role="alert">
                  {reorderError}
                </p>
              ) : null}

              {sortedItems.length === 0 ? (
                <p className={styles.emptyState}>
                  Este plus todavía no tiene productos. Agregá el primero (por ejemplo
                  una bebida) para que el cliente pueda sumarlo.
                </p>
              ) : (
                <div className={styles.cardList}>
                  {sortedItems.map((item, index) => (
                    <SuggestedProductRow
                      key={item.id}
                      item={item}
                      productById={productById}
                      categoryNameById={categoryNameById}
                      canMoveUp={index > 0}
                      canMoveDown={index < sortedItems.length - 1}
                      reorderPending={reorderPending}
                      onMoveUp={() => moveItem(index, -1)}
                      onMoveDown={() => moveItem(index, 1)}
                      onEdit={() => setItemModal({ mode: "edit", item })}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className={styles.dialogFooter}>
              <button
                type="button"
                className="admin-secondary-link admin-secondary-link--compact"
                onClick={onClose}
                disabled={reorderPending}
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : null}
      </dialog>

      {itemModal && group ? (
        <SuggestedProductEditModal
          key={
            itemModal.mode === "edit"
              ? `item-edit-${itemModal.item.id}`
              : `item-create-${group.id}`
          }
          open={itemModalOpen}
          mode={itemModal.mode}
          group={group}
          item={itemModal.mode === "edit" ? itemModal.item : null}
          products={products}
          onClose={() => setItemModal(null)}
        />
      ) : null}
    </>
  );
}
