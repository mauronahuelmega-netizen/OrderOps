"use client";

import { useMemo, useState } from "react";
import AssignSectionModal from "@/components/admin/product-customization/assignments/assign-section-modal";
import AssignmentCard from "@/components/admin/product-customization/assignments/assignment-card";
import styles from "@/components/admin/product-customization/assignments/assignments.module.css";
import SortableReorderList from "@/components/admin/product-customization/sortable-reorder-list";
import {
  reorderCustomizationAssignmentsAction
} from "@/app/admin/(protected)/products/customizations/actions";
import type { AdminCategory } from "@/lib/categories/admin";
import type {
  AdminCatalogProductOption,
  AdminCustomizationAssignment,
  AdminCustomizationGroup
} from "@/lib/product-customization/shared";

type AssignmentsSectionMode = "all" | "category" | "product";

type SectionProps = {
  groups: AdminCustomizationGroup[];
  categories: AdminCategory[];
  products: AdminCatalogProductOption[];
  assignments: AdminCustomizationAssignment[];
  defaultSortOrder: number;
  mode?: AssignmentsSectionMode;
  preferredTargetId?: string;
  hideIntro?: boolean;
  onNavigateToSections?: () => void;
};

export default function CustomizationAssignmentsSection({
  groups,
  categories,
  products,
  assignments,
  defaultSortOrder,
  mode = "all",
  preferredTargetId,
  onNavigateToSections
}: SectionProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const groupsById = useMemo(() => {
    return new Map(groups.map((group) => [group.id, group]));
  }, [groups]);

  const targetMeta = useMemo(() => {
    if (!preferredTargetId) {
      return null;
    }
    if (mode === "category") {
      const category = categories.find((item) => item.id === preferredTargetId);
      return category
        ? { id: category.id, name: category.name, kind: "category" as const }
        : null;
    }
    if (mode === "product") {
      const product = products.find((item) => item.id === preferredTargetId);
      return product
        ? { id: product.id, name: product.name, kind: "product" as const }
        : null;
    }
    return null;
  }, [preferredTargetId, mode, categories, products]);

  const scopedAssignments = useMemo(() => {
    return assignments
      .filter((assignment) => {
        if (mode === "category" && assignment.target_type !== "category") {
          return false;
        }
        if (mode === "product" && assignment.target_type !== "product") {
          return false;
        }
        if (
          preferredTargetId &&
          (mode === "category" || mode === "product") &&
          assignment.target_id !== preferredTargetId
        ) {
          return false;
        }
        return true;
      })
      .slice()
      .sort((a, b) => {
        if (a.sort_order !== b.sort_order) {
          return a.sort_order - b.sort_order;
        }
        return a.created_at.localeCompare(b.created_at);
      });
  }, [assignments, mode, preferredTargetId]);

  const title =
    mode === "product"
      ? "Secciones propias de este producto"
      : mode === "category"
        ? "Secciones aplicadas a esta categoría"
        : "Dónde aparecen";

  const subtitle =
    mode === "product"
      ? targetMeta
        ? `Estas secciones se aplican solo a ${targetMeta.name}, además de lo que venga por categoría.`
        : "Estas secciones se aplican solo a este producto."
      : mode === "category"
        ? "Estas secciones se aplican automáticamente a los productos de la categoría."
        : "Conectá secciones a categorías o productos.";

  const emptyTitle =
    mode === "category"
      ? "Sin secciones asignadas directamente"
      : mode === "product"
        ? "Sin secciones propias todavía"
        : "Nada aparece todavía";

  const emptyBody =
    mode === "category"
      ? "Esta categoría todavía no aplica secciones en lote. Los productos pueden tener ajustes propios en “Por producto”."
      : mode === "product"
        ? "Este producto usa las secciones aplicadas por categoría. Agregá una sección acá solo si necesita algo especial."
        : "Agregá una sección a una categoría o producto para que el cliente pueda elegir opciones.";

  const originLabel =
    mode === "product"
      ? "Propia de este producto"
      : mode === "category"
        ? targetMeta
          ? `Aplicada a ${targetMeta.name}`
          : "Aplicada a esta categoría"
        : "Asignación";

  const canAdd = Boolean(targetMeta && (mode === "product" || mode === "category"));

  return (
    <section className={styles.panel} aria-label={title}>
      <div className={styles.panelHeader}>
        <div className={styles.panelHeaderText}>
          <h2 className={styles.panelTitle}>{title}</h2>
          <p className={styles.panelSubtitle}>{subtitle}</p>
          <p className={styles.helperText}>
            Primero creá secciones reutilizables; después asignálas a productos o
            categorías.
          </p>
          {mode === "product" ? (
            <p className={styles.helperText}>
              Para ocultar algo solo en este producto, usá “Ajustes propios de este
              producto”.
            </p>
          ) : null}
        </div>
        {canAdd ? (
          <button
            type="button"
            className="admin-primary-button"
            onClick={() => setModalOpen(true)}
          >
            + Agregar sección
          </button>
        ) : null}
      </div>

      {scopedAssignments.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>{emptyTitle}</h3>
          <p>{emptyBody}</p>
          <div className={styles.emptyActions}>
            {canAdd ? (
              <button
                type="button"
                className="admin-primary-button"
                onClick={() => setModalOpen(true)}
              >
                + Agregar sección
              </button>
            ) : null}
            {onNavigateToSections ? (
              <button
                type="button"
                className="admin-secondary-link admin-secondary-link--compact"
                onClick={onNavigateToSections}
              >
                Ir a Secciones reutilizables
              </button>
            ) : null}
          </div>
        </div>
      ) : targetMeta && scopedAssignments.length > 1 ? (
        <SortableReorderList
          items={scopedAssignments}
          successFallbackMessage="Orden de aparición actualizado."
          getItemAriaLabel={(assignment) => assignment.group_name}
          listClassName={styles.cardList}
          persist={async (orderedIds) => {
            const formData = new FormData();
            formData.set("targetType", targetMeta.kind);
            formData.set("targetId", targetMeta.id);
            formData.set("orderedIdsJson", JSON.stringify(orderedIds));
            return reorderCustomizationAssignmentsAction({}, formData);
          }}
          renderItem={(assignment, chrome) => (
            <AssignmentCard
              assignment={assignment}
              group={groupsById.get(assignment.group_id) ?? null}
              originLabel={originLabel}
              chrome={{
                dragHandle: chrome.dragHandle,
                moveControls: chrome.moveControls
              }}
            />
          )}
        />
      ) : (
        <div className={styles.cardList}>
          {scopedAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              group={groupsById.get(assignment.group_id) ?? null}
              originLabel={originLabel}
            />
          ))}
        </div>
      )}

      {targetMeta && (mode === "product" || mode === "category") ? (
        <AssignSectionModal
          open={modalOpen}
          mode={mode}
          targetId={targetMeta.id}
          targetName={targetMeta.name}
          groups={groups}
          assignments={assignments}
          defaultSortOrder={defaultSortOrder}
          onClose={() => setModalOpen(false)}
        />
      ) : null}
    </section>
  );
}
