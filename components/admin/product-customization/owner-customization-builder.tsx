"use client";

import { useEffect, useMemo, useState } from "react";
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
    description:
      "Configurá lo que verá el cliente cuando personalice un producto específico."
  },
  {
    id: "category",
    label: "Por categoría",
    description:
      "Aplicá secciones a todos los productos de una categoría. Esto no incluye ajustes configurados individualmente por producto."
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

  // Keep ?product= as a shareable deep-link without forcing navigation or remounts.
  useEffect(() => {
    if (typeof window === "undefined" || !selectedProductId) {
      return;
    }

    const url = new URL(window.location.href);
    if (url.searchParams.get("product") === selectedProductId) {
      return;
    }

    url.searchParams.set("product", selectedProductId);
    const next = `${url.pathname}?${url.searchParams.toString()}${url.hash}`;
    window.history.replaceState(window.history.state, "", next);
  }, [selectedProductId]);

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

  const productSummaryLabels = selectedProduct
    ? [
        ...selectedProduct.sections.map((section) => section.groupName),
        ...(selectedProduct.hasUpsell
          ? [`Plus ${selectedProduct.upsellLabel ?? "sugerido"}`]
          : [])
      ]
    : [];

  const productAppliedFrom = selectedProduct
    ? (() => {
        const fromCategory = selectedProduct.sections.some(
          (section) => section.source === "category"
        );
        const fromProduct = selectedProduct.sections.some(
          (section) => section.source === "product"
        );
        if (fromCategory && fromProduct) {
          return "categoría + ajustes propios";
        }
        if (fromCategory) {
          return "la categoría";
        }
        if (fromProduct) {
          return "este producto";
        }
        return null;
      })()
    : null;

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
        <p className={styles.guideLine}>
          Usá secciones reutilizables para crear opciones, asigná por categoría para
          aplicar en lote y ajustá por producto cuando necesites excepciones.
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
              <h2 className={styles.panelTitle}>1. Elegí el producto</h2>
              <p className={styles.panelSubtitle}>
                Seleccioná un producto para revisar qué verá el cliente al personalizarlo.
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

          <section className={styles.configPane} aria-label="Configuración del producto">
            {!selectedProduct ? (
              <div className={styles.builderEmpty}>
                <h3>Elegí un producto para revisar sus ajustes</h3>
                <p>
                  Seleccioná un producto y vas a ver qué secciones aplica, qué ajustes
                  propios tiene y cómo se verá para el cliente.
                </p>
              </div>
            ) : (
              <>
                <article className={styles.summaryCard}>
                  <div className={styles.blockTitleRow}>
                    <h2 className={styles.panelTitle}>Producto seleccionado</h2>
                    <span className={styles.softChip}>
                      {selectedProduct.categoryName ?? "Sin categoría"}
                    </span>
                  </div>
                  <h3 className={styles.selectedProductName}>{selectedProduct.name}</h3>
                  <p className={styles.summaryLine}>
                    <span className={styles.summaryLabel}>Cliente verá</span>
                    {productSummaryLabels.length > 0
                      ? productSummaryLabels.join(" · ")
                      : "Todavía sin opciones configuradas"}
                  </p>
                  {productAppliedFrom ? (
                    <p className={styles.summaryLine}>
                      <span className={styles.summaryLabel}>Aplicado desde</span>
                      {productAppliedFrom}
                    </p>
                  ) : null}
                </article>

                <div className={styles.hierarchyBlock}>
                  <div className={styles.paneHeader}>
                    <h2 className={styles.panelTitle}>Secciones que verá el cliente</h2>
                    <p className={styles.panelSubtitle}>
                      Incluye opciones aplicadas desde la categoría y las propias de este
                      producto.
                    </p>
                  </div>

                  {selectedProduct.sections.length === 0 ? (
                    <div className={styles.builderEmpty}>
                      <h3>Sin opciones todavía</h3>
                      <p>
                        Este producto todavía no tiene secciones configuradas. Creá una
                        sección o asignala desde su categoría.
                      </p>
                      <div className={styles.actionsRow}>
                        <button
                          type="button"
                          className={styles.primaryCta}
                          onClick={() => setTab("sections")}
                        >
                          Crear sección
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
                          Asignar por categoría
                        </button>
                        <button
                          type="button"
                          className={styles.secondaryCta}
                          onClick={() => setTab("plus")}
                        >
                          Agregar plus sugerido
                        </button>
                      </div>
                    </div>
                  ) : (
                    <ul className={styles.sectionSummaryList}>
                      {selectedProduct.sections.map((section) => (
                        <li key={section.groupId} className={styles.sectionSummaryItem}>
                          <div className={styles.sectionSummaryTop}>
                            <p className={styles.sectionSummaryName}>{section.groupName}</p>
                            <span className={styles.softChip}>
                              {section.source === "category"
                                ? "Aplicado desde categoría"
                                : "Solo en este producto"}
                            </span>
                          </div>
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
                  )}

                  <div className={styles.actionsRow}>
                    <button
                      type="button"
                      className={styles.primaryCta}
                      onClick={() => setTab("sections")}
                    >
                      Gestionar secciones
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryCta}
                      onClick={() => setTab("plus")}
                    >
                      Configurar plus sugerido
                    </button>
                  </div>
                </div>

                  <div className={styles.hierarchyBlock}>
                    <CustomizationAssignmentsSection
                      groups={groups}
                      categories={categories}
                      products={products}
                      assignments={assignments}
                      defaultSortOrder={nextAssignmentSort}
                      mode="product"
                      preferredTargetId={selectedProduct.id}
                      hideIntro
                      onNavigateToSections={() => setTab("sections")}
                    />
                  </div>

                  {selectedProduct.sections.some(
                    (section) => section.source === "category"
                  ) ? (
                    <div className={styles.hierarchyBlock}>
                      <div className={styles.paneHeader}>
                        <h2 className={styles.panelTitle}>Aplicadas desde categoría</h2>
                        <p className={styles.panelSubtitle}>
                          Estas secciones vienen de la categoría del producto. No se
                          editan acá.
                        </p>
                      </div>
                      <ul className={styles.sectionSummaryList}>
                        {selectedProduct.sections
                          .filter((section) => section.source === "category")
                          .map((section) => (
                            <li
                              key={section.groupId}
                              className={styles.sectionSummaryItem}
                            >
                              <div className={styles.sectionSummaryTop}>
                                <p className={styles.sectionSummaryName}>
                                  {section.groupName}
                                </p>
                                <span className={styles.softChip}>
                                  Aplicado desde categoría
                                </span>
                              </div>
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
                    </div>
                  ) : null}

                  <div className={styles.secondaryBlock}>
                    <div className={styles.overridesEmbed}>
                      <ProductCustomizationOverridesPanel
                        productId={selectedProduct.id}
                        productName={selectedProduct.name}
                      />
                    </div>
                  </div>
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
              <h2 className={styles.panelTitle}>1. Elegí la categoría</h2>
              <p className={styles.panelSubtitle}>
                Las secciones asignadas aquí se aplican en lote a todos los productos de
                la categoría.
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
                                category.sections.length === 1
                                  ? "sección a nivel categoría"
                                  : "secciones a nivel categoría"
                              }`
                            : " · sin secciones a nivel categoría"}
                          {category.hasUpsell ? " · plus" : ""}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className={styles.configPaneWide} aria-label="Configuración de categoría">
            {selectedCategory ? (
              <>
                <article className={styles.summaryCard}>
                  <div className={styles.blockTitleRow}>
                    <h2 className={styles.panelTitle}>Categoría seleccionada</h2>
                    <span className={styles.softChip}>
                      {selectedCategory.productCount}{" "}
                      {selectedCategory.productCount === 1 ? "producto" : "productos"}
                    </span>
                  </div>
                  <h3 className={styles.selectedProductName}>{selectedCategory.name}</h3>
                  <p className={styles.summaryLine}>
                    <span className={styles.summaryLabel}>Impacto</span>
                    Las secciones de esta categoría se aplican automáticamente a sus
                    productos.
                  </p>
                  <p className={styles.helperText}>
                    Esto no incluye ni modifica ajustes configurados individualmente en
                    “Por producto”.
                  </p>
                </article>

                <div className={styles.hierarchyBlock}>
                  <CustomizationAssignmentsSection
                    groups={groups}
                    categories={categories}
                    products={products}
                    assignments={assignments}
                    defaultSortOrder={nextAssignmentSort}
                    mode="category"
                    preferredTargetId={selectedCategory.id}
                    hideIntro
                    onNavigateToSections={() => setTab("sections")}
                  />
                </div>
              </>
            ) : (
              <div className={styles.builderEmpty}>
                <h3>Elegí una categoría</h3>
                <p>
                  Seleccioná una categoría para asignar secciones a todos sus productos.
                </p>
              </div>
            )}
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
