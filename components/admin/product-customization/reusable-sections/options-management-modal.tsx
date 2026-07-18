"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { reorderCustomizationOptionsAction } from "@/app/admin/(protected)/products/customizations/actions";
import SortableReorderList from "@/components/admin/product-customization/sortable-reorder-list";
import type {
  AdminCustomizationGroup,
  AdminCustomizationOption
} from "@/lib/product-customization/shared";
import OptionEditModal from "./option-edit-modal";
import ReusableOptionRow from "./reusable-option-row";
import styles from "./reusable-sections.module.css";

type Props = {
  open: boolean;
  group: AdminCustomizationGroup | null;
  onClose: () => void;
};

export default function OptionsManagementModal({ open, group, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [optionModal, setOptionModal] = useState<
    | { mode: "create" }
    | { mode: "edit"; option: AdminCustomizationOption }
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
      setOptionModal(null);
    }
  }, [open]);

  const optionModalOpen = optionModal !== null && group !== null;

  const sortedOptions = useMemo(() => {
    if (!group) {
      return [];
    }
    return [...group.options].sort((a, b) => {
      if (a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order;
      }
      return a.created_at.localeCompare(b.created_at);
    });
  }, [group]);

  return (
    <>
      <dialog
        ref={dialogRef}
        className={`${styles.dialog} ${styles.dialogWide}`}
        onClose={onClose}
        aria-labelledby="options-manage-title"
      >
        {open && group ? (
          <div className={styles.dialogForm}>
            <div className={styles.dialogHeader}>
              <h2 id="options-manage-title" className={styles.dialogTitle}>
                Opciones de {group.name}
              </h2>
              <p className={styles.dialogSubtitle}>
                Estas son las opciones que verá el cliente dentro de esta sección.
              </p>
            </div>

            <div className={styles.optionsModalBody}>
              <div className={styles.optionsModalToolbar}>
                <p className={styles.helper}>
                  {sortedOptions.length}{" "}
                  {sortedOptions.length === 1 ? "opción" : "opciones"}
                </p>
                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={() => setOptionModal({ mode: "create" })}
                >
                  + Agregar opción
                </button>
              </div>

              {sortedOptions.length === 0 ? (
                <p className={styles.emptyState}>
                  Esta sección todavía no tiene opciones. Agregá la primera para que el
                  cliente pueda elegir.
                </p>
              ) : sortedOptions.length === 1 ? (
                <ReusableOptionRow
                  option={sortedOptions[0]}
                  onEdit={() =>
                    setOptionModal({ mode: "edit", option: sortedOptions[0] })
                  }
                />
              ) : (
                <SortableReorderList
                  items={sortedOptions}
                  successFallbackMessage="Orden de aparición de opciones actualizado."
                  getItemAriaLabel={(option) => option.name}
                  persist={async (orderedIds) => {
                    const formData = new FormData();
                    formData.set("groupId", group.id);
                    formData.set("orderedIdsJson", JSON.stringify(orderedIds));
                    return reorderCustomizationOptionsAction({}, formData);
                  }}
                  renderItem={(option, chrome) => (
                    <ReusableOptionRow
                      option={option}
                      chrome={{
                        dragHandle: chrome.dragHandle,
                        moveControls: chrome.moveControls
                      }}
                      onEdit={() => setOptionModal({ mode: "edit", option })}
                    />
                  )}
                />
              )}
            </div>

            <div className={styles.dialogFooter}>
              <button
                type="button"
                className="admin-secondary-link admin-secondary-link--compact"
                onClick={onClose}
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : null}
      </dialog>

      {optionModal && group ? (
        <OptionEditModal
          key={
            optionModal.mode === "edit"
              ? `option-edit-${optionModal.option.id}`
              : `option-create-${group.id}`
          }
          open={optionModalOpen}
          mode={optionModal.mode}
          group={group}
          option={optionModal.mode === "edit" ? optionModal.option : null}
          onClose={() => setOptionModal(null)}
        />
      ) : null}
    </>
  );
}
