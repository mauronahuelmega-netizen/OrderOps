"use client";

import { useCallback, useMemo, useState } from "react";
import { reorderCustomizationGroupsAction } from "@/app/admin/(protected)/products/customizations/actions";
import SortableReorderList from "@/components/admin/product-customization/sortable-reorder-list";
import type { AdminCustomizationGroup } from "@/lib/product-customization/shared";
import OptionsManagementModal from "./options-management-modal";
import ReusableSectionCard from "./reusable-section-card";
import SectionEditModal from "./section-edit-modal";
import styles from "./reusable-sections.module.css";

type Props = {
  groups: AdminCustomizationGroup[];
  nextGroupSort: number;
};

export default function ReusableSectionsTab({ groups, nextGroupSort }: Props) {
  const [sectionModal, setSectionModal] = useState<
    | { mode: "create" }
    | { mode: "edit"; groupId: string }
    | null
  >(null);
  const [optionsGroupId, setOptionsGroupId] = useState<string | null>(null);

  const groupsById = useMemo(() => {
    return new Map(groups.map((group) => [group.id, group]));
  }, [groups]);

  const editingGroup =
    sectionModal?.mode === "edit"
      ? (groupsById.get(sectionModal.groupId) ?? null)
      : null;

  const optionsGroup = optionsGroupId
    ? (groupsById.get(optionsGroupId) ?? null)
    : null;

  const closeSectionModal = useCallback(() => {
    setSectionModal(null);
  }, []);

  const closeOptionsModal = useCallback(() => {
    setOptionsGroupId(null);
  }, []);

  return (
    <div className={styles.tab}>
      <div className={styles.tabHeader}>
        <div className={styles.tabHeaderText}>
          <h2 className={styles.tabTitle}>Secciones reutilizables</h2>
          <p className={styles.tabSubtitle}>
            Creá secciones de opciones que después podés usar en varios productos o
            categorías. Ejemplos: Tamaño de papas, Extras, Aderezos.
          </p>
        </div>
        <button
          type="button"
          className="admin-primary-button"
          onClick={() => setSectionModal({ mode: "create" })}
        >
          + Nueva sección
        </button>
      </div>

      <section className={styles.listShell} aria-labelledby="reusable-sections-list">
        <div className={styles.listHeading}>
          <h3 id="reusable-sections-list">Tus secciones</h3>
        </div>

        {groups.length === 0 ? (
          <div className="admin-empty-state">
            <h2>Todavía no hay secciones</h2>
            <p>
              Creá la primera (por ejemplo “Tamaño de papas” o “Aderezos”) para empezar
              a armar opcionales y extras.
            </p>
            <button
              type="button"
              className="admin-primary-button"
              onClick={() => setSectionModal({ mode: "create" })}
            >
              + Nueva sección
            </button>
          </div>
        ) : groups.length === 1 ? (
          <ReusableSectionCard
            group={groups[0]}
            onEdit={() => setSectionModal({ mode: "edit", groupId: groups[0].id })}
            onManageOptions={() => setOptionsGroupId(groups[0].id)}
          />
        ) : (
          <SortableReorderList
            items={groups}
            successFallbackMessage="Orden de aparición de secciones actualizado."
            getItemAriaLabel={(group) => group.name}
            persist={async (orderedIds) => {
              const formData = new FormData();
              formData.set("orderedIdsJson", JSON.stringify(orderedIds));
              return reorderCustomizationGroupsAction({}, formData);
            }}
            renderItem={(group, chrome) => (
              <ReusableSectionCard
                group={group}
                chrome={{
                  dragHandle: chrome.dragHandle,
                  moveControls: chrome.moveControls
                }}
                onEdit={() => setSectionModal({ mode: "edit", groupId: group.id })}
                onManageOptions={() => setOptionsGroupId(group.id)}
              />
            )}
          />
        )}
      </section>

      {sectionModal ? (
        <SectionEditModal
          key={
            sectionModal.mode === "edit"
              ? `section-edit-${sectionModal.groupId}`
              : "section-create"
          }
          open
          mode={sectionModal.mode}
          group={editingGroup}
          defaultSortOrder={nextGroupSort}
          onClose={closeSectionModal}
        />
      ) : null}

      {optionsGroupId && optionsGroup ? (
        <OptionsManagementModal
          key={`options-${optionsGroupId}`}
          open
          group={optionsGroup}
          onClose={closeOptionsModal}
        />
      ) : null}
    </div>
  );
}
