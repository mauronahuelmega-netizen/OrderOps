"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import CustomizationAssignmentsSection from "@/components/admin/product-customization/customization-assignments-section";
import AdminCustomizationLivePreview from "@/components/admin/product-customization/admin-customization-live-preview";
import ProductCustomizationOverridesPanel from "@/components/admin/product-customization/product-customization-overrides-panel";
import PlusSuggestionsTab from "@/components/admin/product-customization/plus-suggestions/plus-suggestions-tab";
import ReusableSectionsTab from "@/components/admin/product-customization/reusable-sections/reusable-sections-tab";
import type { AdminCategory } from "@/lib/categories/admin";
import {
  buildCategoryRows,
  buildProductRows
} from "@/lib/product-customization/builder-presentation";
import type {
  AdminCatalogProductOption,
  AdminCustomizationAssignment,
  AdminCustomizationGroup,
  AdminProductCustomizationOverride,
  AdminUpsellGroup
} from "@/lib/product-customization/shared";
import styles from "./product-customization-admin.module.css";

type BuilderTab = "product" | "category" | "sections" | "plus";

type Props = {
  customizationEnabled: boolean;
  initialProductId?: string;
  groups: AdminCustomizationGroup[];
  categories: AdminCategory[];
  products: AdminCatalogProductOption[];
  assignments: AdminCustomizationAssignment[];
  upsellGroups: AdminUpsellGroup[];
  overrides: AdminProductCustomizationOverride[];
  nextGroupSort: number;
  nextAssignmentSort: number;
  nextUpsellSort: number;
};

const TABS: Array<{ id: BuilderTab; label: string; description: string }> = [
  {
    id: "product",
    label: "Por producto",
    description: "Elegí un producto y revisá qué opciones verá el cliente."
  },
  {
    id: "category",
    label: "Por categoría",
    description: "Aplicá opciones a todos los productos de una categoría."
  },
  {
    id: "sections",
    label: "Secciones reutilizables",
    description: "Creá secciones de opciones que podés usar en varios productos."
  },
  {
    id: "plus",
    label: "Plus sugeridos",
    description: "Ofrecé productos extra antes de agregar al carrito."
  }
];

export default function OwnerCustomizationBuilder({
  customizationEnabled,
  initialProductId = "",
  groups,
  categories,
  products,
  assignments,
  upsellGroups,
  overrides,
  nextGroupSort,
  nextAssignmentSort,
  nextUpsellSort
}: Props) {
  const [tab, setTab] = useState<BuilderTab>("product");
  const [selectedProductId, setSelectedProductId] = useState(initialProductId);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const productRows = useMemo(
    () =>
      buildProductRows({
        products,
        categories,
        groups,
        assignments,
        upsellGroups
      }),
    [products, categories, groups, assignments, upsellGroups]
  );

  const categoryRows = useMemo(
    () =>
      buildCategoryRows({
        categories,
        products,
        groups,
        assignments,
        upsellGroups
      }),
    [categories, products, groups, assignments, upsellGroups]
  );

  const selectedProduct =
    productRows.find((row) => row.id === selectedProductId) ?? null;

  const selectedCatalogProduct =
    products.find((item) => item.id === selectedProductId) ?? null;

  const selectedCategory =
    categoryRows.find((row) => row.id === selectedCategoryId) ??
    categoryRows[0] ??
    null;

  const activeTab = TABS.find((item) => item.id === tab) ?? TABS[0];

  return (
    <div className={styles.builderShell}>
      <aside className={styles.notice} aria-live="polite">
        <span className={styles.badge}>
          {customizationEnabled
            ? "Visible para clientes"
            : "No visible para clientes"}
        </span>
        <p className={styles.noticeTitle}>
          {customizationEnabled ? "Personalización activa" : "Modo preparación"}
        </p>
        <p className={styles.noticeBody}>
          {customizationEnabled
            ? "La personalización está encendida para este negocio. Los cambios de esta pantalla pueden verse en el catálogo público."
            : "Estas opciones todavía no son visibles para clientes. Podés prepararlas y revisarlas antes de activar la personalización."}
        </p>
      </aside>

      <div
        className={styles.builderTabs}
        role="tablist"
        aria-label="Navegación de personalización"
      >
        {TABS.map((item) => {
          const isActive = item.id === tab;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={isActive ? styles.builderTabActive : styles.builderTab}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <p className={styles.tabHint}>{activeTab.description}</p>

      {tab === "product" ? (
        <div className={styles.productWorkspace}>
          <section className={styles.productListPane} aria-label="Productos">
            <div className={styles.paneHeader}>
              <h2 className={styles.panelTitle}>Productos</h2>
              <p className={styles.panelSubtitle}>
                Elegí uno para ver qué puede elegir el cliente.
              </p>
            </div>

            {productRows.length === 0 ? (
              <div className={styles.builderEmpty}>
                <h3>Sin productos</h3>
                <p>Creá productos en el catálogo para configurar opciones por ítem.</p>
              </div>
            ) : (
              <ul className={styles.productSelectList}>
                {productRows.map((product) => {
                  const isSelected = product.id === selectedProductId;
                  return (
                    <li key={product.id}>
                      <button
                        type="button"
                        className={
                          isSelected
                            ? styles.productSelectItemActive
                            : styles.productSelectItem
                        }
                        onClick={() => setSelectedProductId(product.id)}
                        aria-pressed={isSelected}
                      >
                        <span className={styles.productSelectName}>{product.name}</span>
                        <span className={styles.productSelectMeta}>
                          {product.categoryName ?? "Sin categoría"}
                          {product.sectionCount > 0
                            ? " · con opciones"
                            : " · sin opciones"}
                          {product.hasUpsell ? " · plus" : ""}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className={styles.configPane} aria-label="Qué puede elegir el cliente">
            <div className={styles.paneHeader}>
              <h2 className={styles.panelTitle}>Qué puede elegir el cliente</h2>
              <p className={styles.panelSubtitle}>
                Este producto puede usar opciones propias o aplicadas desde su categoría.
              </p>
            </div>

            {!selectedProduct ? (
              <div className={styles.builderEmpty}>
                <h3>Elegí un producto</h3>
                <p>Elegí un producto para ver qué opciones puede elegir el cliente.</p>
              </div>
            ) : (
              <>
                <div className={styles.selectedProductHeader}>
                  <h3 className={styles.selectedProductName}>{selectedProduct.name}</h3>
                  <p className={styles.productSelectMeta}>
                    {selectedProduct.categoryName ?? "Sin categoría"}
                    {selectedProduct.hasUpsell
                      ? ` · plus sugerido: ${selectedProduct.upsellLabel ?? "visible"}`
                      : ""}
                  </p>
                </div>

                {selectedProduct.sections.length === 0 ? (
                  <div className={styles.builderEmpty}>
                    <h3>Sin opciones todavía</h3>
                    <p>Este producto todavía no tiene opciones configuradas.</p>
                    <div className={styles.actionsRow}>
                      <button
                        type="button"
                        className={styles.primaryCta}
                        onClick={() => setTab("sections")}
                      >
                        Agregar una sección
                      </button>
                      <button
                        type="button"
                        className={styles.secondaryCta}
                        onClick={() => {
                          if (selectedProduct.categoryId) {
                            setSelectedCategoryId(selectedProduct.categoryId);
                          }
                          setTab("category");
                        }}
                      >
                        Usar opciones de su categoría
                      </button>
                      <button
                        type="button"
                        className={styles.secondaryCta}
                        onClick={() => setTab("plus")}
                      >
                        Agregar un plus sugerido
                      </button>
                    </div>
                  </div>
                ) : (
                  <ul className={styles.sectionSummaryList}>
                    {selectedProduct.sections.map((section) => (
                      <li key={section.groupId} className={styles.sectionSummaryItem}>
                        <div>
                          <p className={styles.sectionSummaryName}>{section.groupName}</p>
                          <p className={styles.productSelectMeta}>
                            {section.source === "category"
                              ? "Desde la categoría"
                              : "Solo en este producto"}
                            {" · "}
                            {section.isEnabled
                              ? "Visible para clientes"
                              : "Oculta / no disponible"}
                            {" · "}
                            {section.options.length}{" "}
                            {section.options.length === 1 ? "opción" : "opciones"}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className={styles.actionsRow}>
                  <button
                    type="button"
                    className={styles.primaryCta}
                    onClick={() => setTab("sections")}
                  >
                    Agregar sección de opciones
                  </button>
                  <Link
                    href={`/admin/products/customizations?product=${selectedProduct.id}`}
                    className={styles.secondaryCta}
                  >
                    Excepciones del producto
                  </Link>
                  <button
                    type="button"
                    className={styles.secondaryCta}
                    onClick={() => setTab("plus")}
                  >
                    Configurar plus sugerido
                  </button>
                </div>

                {initialProductId === selectedProduct.id ? (
                  <div className={styles.overridesEmbed}>
                    <ProductCustomizationOverridesPanel productId={selectedProduct.id} />
                  </div>
                ) : (
                  <p className={styles.helperText}>
                    Usá excepciones del producto cuando este ítem no deba mostrar una
                    sección u opción que sí aparece en otros. Abrilas con “Excepciones del
                    producto”.
                  </p>
                )}

                <details className={styles.advancedBlock}>
                  <summary>Avanzado: asignar sección solo a este producto</summary>
                  <p className={styles.helperText}>
                    Normalmente conviene aplicar opciones por categoría. Usá esto si este
                    producto necesita una sección distinta.
                  </p>
                  <CustomizationAssignmentsSection
                    groups={groups}
                    categories={categories}
                    products={products}
                    assignments={assignments}
                    defaultSortOrder={nextAssignmentSort}
                    mode="product"
                    preferredTargetId={selectedProduct.id}
                    hideIntro
                  />
                </details>
              </>
            )}
          </section>

          <div className={styles.previewDesktop}>
            <AdminCustomizationLivePreview
              product={selectedCatalogProduct}
              groups={groups}
              assignments={assignments}
              upsellGroups={upsellGroups}
              overrides={overrides}
            />
          </div>
          <div className={styles.previewMobile}>
            <AdminCustomizationLivePreview
              product={selectedCatalogProduct}
              groups={groups}
              assignments={assignments}
              upsellGroups={upsellGroups}
              overrides={overrides}
              collapsible
              defaultOpen={false}
            />
          </div>
        </div>
      ) : null}

      {tab === "category" ? (
        <div className={styles.categoryWorkspace}>
          <section className={styles.productListPane} aria-label="Categorías">
            <div className={styles.paneHeader}>
              <h2 className={styles.panelTitle}>Categorías</h2>
              <p className={styles.panelSubtitle}>
                Las secciones asignadas a una categoría se aplican automáticamente a los
                productos de esa categoría.
              </p>
            </div>

            {categoryRows.length === 0 ? (
              <div className={styles.builderEmpty}>
                <h3>Sin categorías</h3>
                <p>Primero necesitás crear categorías para aplicar opciones en grupo.</p>
              </div>
            ) : (
              <ul className={styles.productSelectList}>
                {categoryRows.map((category) => {
                  const isSelected =
                    (selectedCategoryId || selectedCategory?.id) === category.id;
                  return (
                    <li key={category.id}>
                      <button
                        type="button"
                        className={
                          isSelected
                            ? styles.productSelectItemActive
                            : styles.productSelectItem
                        }
                        onClick={() => setSelectedCategoryId(category.id)}
                        aria-pressed={isSelected}
                      >
                        <span className={styles.productSelectName}>{category.name}</span>
                        <span className={styles.productSelectMeta}>
                          {category.productCount}{" "}
                          {category.productCount === 1 ? "producto" : "productos"}
                          {category.sections.length > 0
                            ? ` · ${category.sections.length} ${
                                category.sections.length === 1 ? "sección" : "secciones"
                              }`
                            : " · sin secciones"}
                          {category.hasUpsell ? " · plus" : ""}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className={styles.configPaneWide}>
            {selectedCategory ? (
              <div className={styles.selectedProductHeader}>
                <h2 className={styles.panelTitle}>Categoría: {selectedCategory.name}</h2>
                <p className={styles.panelSubtitle}>
                  Secciones asignadas a esta categoría
                  {selectedCategory.sections.length === 0
                    ? ": todavía ninguna. Esto no incluye secciones configuradas individualmente por producto."
                    : ":"}
                </p>
                {selectedCategory.sections.length > 0 ? (
                  <ul className={styles.sectionSummaryList}>
                    {selectedCategory.sections.map((section) => (
                      <li key={section.groupId} className={styles.sectionSummaryItem}>
                        <p className={styles.sectionSummaryName}>{section.groupName}</p>
                        <p className={styles.productSelectMeta}>
                          {section.isEnabled
                            ? "Visible para clientes"
                            : "Oculta / no disponible"}
                          {" · "}
                          {section.options.length}{" "}
                          {section.options.length === 1 ? "opción" : "opciones"}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            <CustomizationAssignmentsSection
              groups={groups}
              categories={categories}
              products={products}
              assignments={assignments}
              defaultSortOrder={nextAssignmentSort}
              mode="category"
              preferredTargetId={selectedCategory?.id}
              hideIntro
            />
            {selectedCategory && selectedCategory.sections.length === 0 ? (
              <p className={styles.helperText}>
                Esta categoría todavía no tiene secciones asignadas. Las opciones
                configuradas solo en un producto (por ejemplo en Por producto) no
                aparecen acá.
              </p>
            ) : null}
          </section>
        </div>
      ) : null}

      {tab === "sections" ? (
        <ReusableSectionsTab groups={groups} nextGroupSort={nextGroupSort} />
      ) : null}

      {tab === "plus" ? (
        <PlusSuggestionsTab
          categories={categories}
          products={products}
          upsellGroups={upsellGroups}
          defaultSortOrder={nextUpsellSort}
        />
      ) : null}
    </div>
  );
}
