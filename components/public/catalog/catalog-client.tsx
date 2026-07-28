"use client";

import type { CSSProperties } from "react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { PublicBusiness } from "@/lib/business/public";
import type { PublicCategory, PublicProduct } from "@/lib/catalog/public";
import {
  getCartItemCount,
  getCartItemsTotal,
  getLegacyQuantityForProduct,
  loadUnifiedCartItems,
  mergeCustomizedSelectionIntoCart,
  persistUnifiedCartItems,
  removeSingleCartLine,
  selectionStateFromCartParent,
  setLegacyProductQuantity,
  setV2ParentQuantity,
  type CartStorageScope,
  type LocalCartItem,
  type LocalCartItemV2
} from "@/lib/cart/local";
import { buildCatalogPreviewPath } from "@/lib/admin/catalog-preview-shared";
import CartBar from "@/components/public/catalog/cart-bar";
import CartSheet from "@/components/public/catalog/cart-sheet";
import CategoryNav from "@/components/public/catalog/category-nav";
import ProductCard from "@/components/public/catalog/product-card";
import ProductDetailModal from "@/components/public/catalog/product-detail-modal";
import type { CustomizationConfirmResult } from "@/components/public/catalog/customization-modal";
import { productNeedsCustomizationModal } from "@/lib/product-customization/public-shared";

const CustomizationModal = dynamic(
  () => import("@/components/public/catalog/customization-modal"),
  { ssr: false }
);

type CatalogClientProps = {
  business: PublicBusiness;
  categories: PublicCategory[];
  products: PublicProduct[];
  slug: string;
  customizationEnabled?: boolean;
  isCatalogPreview?: boolean;
};

type ResolvedTheme = "light" | "dark";

type CustomizationSession = {
  productId: string;
  editingCartLineId: string | null;
  initialSelection: {
    selectedOptionsByGroupId: Record<string, string[]>;
    selectedUpsellProductIds: string[];
  } | null;
};

const THEME_STORAGE_KEY = "orderops-public-theme";
const THEME_CHANGE_EVENT = "orderops-public-theme-change";

export default function CatalogClient({
  business,
  categories,
  products,
  slug,
  customizationEnabled = false,
  isCatalogPreview = false
}: CatalogClientProps) {
  const router = useRouter();
  const cartScope: CartStorageScope = isCatalogPreview ? "preview" : "public";
  const [cartItems, setCartItems] = useState<LocalCartItem[]>([]);
  const [cartHydrated, setCartHydrated] = useState(false);
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [customizationSession, setCustomizationSession] =
    useState<CustomizationSession | null>(null);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [coverState, setCoverState] = useState<"idle" | "loaded" | "error">(
    business.cover_image_url ? "idle" : "error"
  );
  const coverImageRef = useRef<HTMLImageElement | null>(null);

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  );

  const productsByCategoryId = useMemo(() => {
    const groupedProducts = new Map<string, PublicProduct[]>();

    products.forEach((product) => {
      const currentProducts = groupedProducts.get(product.category_id) ?? [];
      currentProducts.push(product);
      groupedProducts.set(product.category_id, currentProducts);
    });

    return groupedProducts;
  }, [products]);

  const categoriesWithProducts = useMemo(
    () =>
      categories.filter((category) => (productsByCategoryId.get(category.id)?.length ?? 0) > 0),
    [categories, productsByCategoryId]
  );

  const productCountsByCategoryId = useMemo(() => {
    const counts = new Map<string, number>();

    categoriesWithProducts.forEach((category) => {
      counts.set(category.id, productsByCategoryId.get(category.id)?.length ?? 0);
    });

    return counts;
  }, [categoriesWithProducts, productsByCategoryId]);

  const cartCount = useMemo(() => getCartItemCount(cartItems), [cartItems]);
  const cartTotal = useMemo(() => getCartItemsTotal(cartItems), [cartItems]);

  const selectedProduct = selectedProductId ? productMap.get(selectedProductId) ?? null : null;
  const customizingProduct = customizationSession
    ? productMap.get(customizationSession.productId) ?? null
    : null;

  function productRequiresCustomization(product: PublicProduct) {
    if (!customizationEnabled) {
      return false;
    }

    const summary = product.customizationSummary;
    if (!summary) {
      return false;
    }

    return productNeedsCustomizationModal({
      productId: product.id,
      hasCustomizations: summary.hasCustomizations,
      hasPaidCustomizations: summary.hasPaidCustomizations,
      hasUpsell: summary.hasUpsell,
      priceFrom: summary.priceFrom
    });
  }

  function openCustomizationModal(
    product: PublicProduct,
    options?: {
      editingCartLineId?: string | null;
      initialSelection?: CustomizationSession["initialSelection"];
    }
  ) {
    setSelectedProductId(null);
    setIsCartSheetOpen(false);
    setCustomizationSession({
      productId: product.id,
      editingCartLineId: options?.editingCartLineId ?? null,
      initialSelection: options?.initialSelection ?? null
    });
  }

  function handleAddProduct(product: PublicProduct) {
    if (productRequiresCustomization(product)) {
      openCustomizationModal(product);
      return;
    }

    setCartItems((current) => setLegacyProductQuantity(current, product, 1));
  }

  function handleConfirmCustomizationSelection(result: CustomizationConfirmResult) {
    setCartItems((current) =>
      mergeCustomizedSelectionIntoCart(current, result.parent, result.children, {
        replaceCartLineId: result.replaceCartLineId
      })
    );
    setIsCartSheetOpen(true);
  }

  useEffect(() => {
    const loaded = loadUnifiedCartItems(business.id, cartScope).filter((item) => {
      if ("schemaVersion" in item && item.schemaVersion === 2) {
        return productMap.has(item.productId);
      }
      return productMap.has(item.productId);
    });
    setCartItems(loaded);
    setCartHydrated(true);
  }, [business.id, cartScope, productMap]);

  useEffect(() => {
    if (!cartHydrated) {
      return;
    }

    try {
      persistUnifiedCartItems(business.id, cartItems, cartScope);
    } catch {
      // localStorage may be unavailable; keep in-memory cart.
    }
  }, [business.id, cartHydrated, cartItems, cartScope]);

  useEffect(() => {
    if (selectedCategoryId || categoriesWithProducts.length === 0) {
      return;
    }

    setSelectedCategoryId(categoriesWithProducts[0].id);
  }, [categoriesWithProducts, selectedCategoryId]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const syncTheme = () => {
      const storedPreference = window.localStorage.getItem(THEME_STORAGE_KEY);

      if (storedPreference === "light" || storedPreference === "dark") {
        setResolvedTheme(storedPreference);
        return;
      }

      setResolvedTheme(mediaQuery.matches ? "dark" : "light");
    };

    const handleThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ resolvedTheme?: ResolvedTheme }>;
      const nextTheme = customEvent.detail?.resolvedTheme;

      if (nextTheme === "light" || nextTheme === "dark") {
        setResolvedTheme(nextTheme);
        return;
      }

      syncTheme();
    };

    syncTheme();
    mediaQuery.addEventListener("change", syncTheme);
    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange as EventListener);

    return () => {
      mediaQuery.removeEventListener("change", syncTheme);
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange as EventListener);
    };
  }, []);

  useEffect(() => {
    if (categoriesWithProducts.length === 0) {
      return;
    }

    const sections = categoriesWithProducts
      .map((category) => document.getElementById(`category-${category.id}`))
      .filter((section): section is HTMLElement => Boolean(section));

    if (sections.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (visibleEntry?.target.id) {
          setSelectedCategoryId(visibleEntry.target.id.replace("category-", ""));
        }
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0.2, 0.35, 0.6]
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      observer.disconnect();
    };
  }, [categoriesWithProducts]);

  useEffect(() => {
    setCoverState(business.cover_image_url ? "idle" : "error");
  }, [business.cover_image_url]);

  useEffect(() => {
    if (!business.cover_image_url) {
      return;
    }

    const image = coverImageRef.current;

    if (!image) {
      return;
    }

    if (image.complete) {
      setCoverState(image.naturalWidth > 0 ? "loaded" : "error");
    }
  }, [business.cover_image_url]);

  function handleCategorySelect(categoryId: string) {
    setSelectedCategoryId(categoryId);
    document.getElementById(`category-${categoryId}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function handleEditParent(parent: LocalCartItemV2, children: LocalCartItemV2[]) {
    const product = productMap.get(parent.productId);
    if (!product) {
      return;
    }

    openCustomizationModal(product, {
      editingCartLineId: parent.cartLineId,
      initialSelection: selectionStateFromCartParent(parent, children)
    });
  }

  function handleCheckoutFromSheet() {
    setIsCartSheetOpen(false);
    router.push(
      isCatalogPreview
        ? buildCatalogPreviewPath(slug, "checkout")
        : `/b/${slug}/checkout`
    );
  }

  const businessStyles = {
    "--business-primary": business.primary_color ?? "var(--color-primary)",
    "--business-primary-foreground": "#ffffff"
  } as CSSProperties;

  const heroHeadline = business.catalog_hero_headline?.trim() || "Listo para pedir.";
  const heroBadge = business.catalog_hero_badge?.trim() || "Te confirmamos por WhatsApp";
  const heroMicrocopy =
    business.catalog_hero_microcopy?.trim() || "Hace tu pedido y seguimos por WhatsApp.";
  const showCoverImage = Boolean(business.cover_image_url) && coverState !== "error";
  const coverMediaState = showCoverImage
    ? coverState === "loaded"
      ? "loaded"
      : "loading"
    : "fallback";

  return (
    <main
      className="catalog-page catalog-page--with-cart"
      data-theme={resolvedTheme}
      style={businessStyles}
    >
      <header className="catalog-hero">
        <div className={`catalog-hero__media catalog-hero__media--${coverMediaState}`}>
          {coverMediaState === "loading" ? (
            <div className="catalog-hero__cover-skeleton" aria-hidden="true" />
          ) : null}

          {coverMediaState === "fallback" ? (
            <div className="catalog-hero__cover-fallback">
              <span className="catalog-hero__cover-kicker">Catalogo listo para pedir</span>
              <small>Elegi tus productos favoritos y envia el pedido.</small>
            </div>
          ) : null}

          {business.cover_image_url ? (
            <>
              <img
                ref={coverImageRef}
                className="catalog-hero__cover"
                src={business.cover_image_url}
                alt={`${business.name} cover`}
                loading="eager"
                decoding="async"
                onLoad={() => setCoverState("loaded")}
                onError={() => setCoverState("error")}
              />
              <div className="catalog-hero__cover-overlay" aria-hidden="true" />
            </>
          ) : null}
        </div>

        <div className="catalog-hero__copy">
          <p className="catalog-eyebrow">Pedi online</p>
          <p className="catalog-hero__description">{heroHeadline}</p>
        </div>

        <div className="catalog-hero__notes">
          <span className="catalog-hero__trust-chip">{heroBadge}</span>
          <p>{heroMicrocopy}</p>
        </div>
      </header>

      {categories.length > 0 ? (
        <CategoryNav
          categories={categories}
          countsByCategoryId={productCountsByCategoryId}
          activeCategoryId={selectedCategoryId}
          onSelect={handleCategorySelect}
        />
      ) : null}

      <div className="catalog-content">
        {categories.length === 0 ? (
          <section className="catalog-empty-panel">
            <h2>El catalogo todavia no esta listo.</h2>
            <p>Estamos preparando las categorias para que puedas hacer tu pedido.</p>
          </section>
        ) : categoriesWithProducts.length === 0 ? (
          <section className="catalog-empty-panel">
            <h2>Todavia no hay productos disponibles.</h2>
            <p>Volve a consultar mas tarde o contacta al negocio.</p>
          </section>
        ) : (
          <div className="catalog-groups">
            {categoriesWithProducts.map((category) => {
              const categoryProducts = productsByCategoryId.get(category.id) ?? [];

              return (
                <section
                  key={category.id}
                  id={`category-${category.id}`}
                  className="catalog-group"
                >
                  <div className="catalog-group__header">
                    <div>
                      <h2>{category.name}</h2>
                      <p>{formatCount(categoryProducts.length, "producto", "productos")}</p>
                    </div>
                  </div>

                  <div className="catalog-product-list">
                    {categoryProducts.map((product) => {
                      const quantity = getLegacyQuantityForProduct(cartItems, product.id);
                      const requiresCustomization = productRequiresCustomization(product);

                      return (
                        <ProductCard
                          key={product.id}
                          product={product}
                          quantity={quantity}
                          requiresCustomization={requiresCustomization}
                          onOpen={() => setSelectedProductId(product.id)}
                          onAdd={() => handleAddProduct(product)}
                          onIncrement={() => {
                            if (requiresCustomization) {
                              openCustomizationModal(product);
                              return;
                            }
                            setCartItems((current) =>
                              setLegacyProductQuantity(current, product, quantity + 1)
                            );
                          }}
                          onDecrement={() =>
                            setCartItems((current) =>
                              setLegacyProductQuantity(current, product, quantity - 1)
                            )
                          }
                        />
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <CartBar
        count={cartCount}
        total={cartTotal}
        onOpenCart={() => setIsCartSheetOpen(true)}
      />

      {isCartSheetOpen ? (
        <CartSheet
          slug={slug}
          items={cartItems}
          onClose={() => setIsCartSheetOpen(false)}
          onCheckout={handleCheckoutFromSheet}
          onEditParent={handleEditParent}
          onRemoveLine={(cartLineId) =>
            setCartItems((current) => removeSingleCartLine(current, cartLineId))
          }
          onChangeParentQuantity={(parentCartLineId, quantity) =>
            setCartItems((current) =>
              setV2ParentQuantity(current, parentCartLineId, quantity)
            )
          }
          onChangeLegacyQuantity={(productId, quantity) => {
            const product = productMap.get(productId);
            if (!product) {
              return;
            }
            setCartItems((current) =>
              setLegacyProductQuantity(current, product, quantity)
            );
          }}
        />
      ) : null}

      {selectedProduct ? (
        <ProductDetailModal
          product={selectedProduct}
          currentQuantity={getLegacyQuantityForProduct(cartItems, selectedProduct.id)}
          requiresCustomization={productRequiresCustomization(selectedProduct)}
          onClose={() => setSelectedProductId(null)}
          onSaveQuantity={(quantity) =>
            setCartItems((current) =>
              setLegacyProductQuantity(current, selectedProduct, quantity)
            )
          }
          onCustomize={() => openCustomizationModal(selectedProduct)}
        />
      ) : null}

      {customizingProduct && customizationSession ? (
        <CustomizationModal
          slug={slug}
          productId={customizingProduct.id}
          productName={customizingProduct.name}
          categoryId={customizingProduct.category_id}
          editingCartLineId={customizationSession.editingCartLineId}
          initialSelection={customizationSession.initialSelection}
          onClose={() => setCustomizationSession(null)}
          onConfirmSelection={handleConfirmCustomizationSelection}
        />
      ) : null}
    </main>
  );
}

function formatCount(value: number, singular: string, plural: string) {
  return `${value} ${value === 1 ? singular : plural}`;
}
