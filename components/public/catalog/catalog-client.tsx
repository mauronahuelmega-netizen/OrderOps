"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import type { PublicBusiness } from "@/lib/business/public";
import type { PublicCategory, PublicProduct } from "@/lib/catalog/public";
import {
  getCartStorageKey,
  parseLocalCartItems,
  type LocalCartItem
} from "@/lib/cart/local";
import CartBar from "@/components/public/catalog/cart-bar";
import CategoryNav from "@/components/public/catalog/category-nav";
import ProductCard from "@/components/public/catalog/product-card";
import ProductDetailModal from "@/components/public/catalog/product-detail-modal";
import ThemeToggle from "@/components/public/catalog/theme-toggle";

type CatalogClientProps = {
  business: PublicBusiness;
  categories: PublicCategory[];
  products: PublicProduct[];
  slug: string;
};

type ThemePreference = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

const THEME_STORAGE_KEY = "orderops-public-theme";

export default function CatalogClient({
  business,
  categories,
  products,
  slug
}: CatalogClientProps) {
  const [cartItems, setCartItems] = useState<LocalCartItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [themePreference, setThemePreference] = useState<ThemePreference>("system");
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>("light");
  const storageKey = getCartStorageKey(business.id);

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

  const cartCount = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems]
  );

  const cartTotal = useMemo(
    () => cartItems.reduce((total, item) => total + item.price * item.quantity, 0),
    [cartItems]
  );

  const selectedProduct = selectedProductId ? productMap.get(selectedProductId) ?? null : null;
  const resolvedTheme: ResolvedTheme =
    themePreference === "system" ? systemTheme : themePreference;

  useEffect(() => {
    const storedValue = window.localStorage.getItem(storageKey);

    if (!storedValue) {
      return;
    }

    try {
      setCartItems(
        parseLocalCartItems(storedValue).filter((item) => productMap.has(item.productId))
      );
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [productMap, storageKey]);

  useEffect(() => {
    setCartItems((currentItems) =>
      currentItems.filter((item) => productMap.has(item.productId))
    );
  }, [productMap]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(cartItems));
  }, [cartItems, storageKey]);

  useEffect(() => {
    if (selectedCategoryId || categoriesWithProducts.length === 0) {
      return;
    }

    setSelectedCategoryId(categoriesWithProducts[0].id);
  }, [categoriesWithProducts, selectedCategoryId]);

  useEffect(() => {
    const storedPreference = window.localStorage.getItem(THEME_STORAGE_KEY);

    if (storedPreference === "light" || storedPreference === "dark") {
      setThemePreference(storedPreference);
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemTheme = () => {
      setSystemTheme(mediaQuery.matches ? "dark" : "light");
    };

    syncSystemTheme();
    mediaQuery.addEventListener("change", syncSystemTheme);

    return () => {
      mediaQuery.removeEventListener("change", syncSystemTheme);
    };
  }, []);

  useEffect(() => {
    if (themePreference === "system") {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(THEME_STORAGE_KEY, themePreference);
  }, [themePreference]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-catalog-theme", resolvedTheme);

    return () => {
      root.removeAttribute("data-catalog-theme");
    };
  }, [resolvedTheme]);

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

  function getCartItem(productId: string) {
    return cartItems.find((item) => item.productId === productId) ?? null;
  }

  function setProductQuantity(product: PublicProduct, quantity: number) {
    setCartItems((currentItems) => {
      if (quantity <= 0) {
        return currentItems.filter((item) => item.productId !== product.id);
      }

      const existingItem = currentItems.find((item) => item.productId === product.id);

      if (existingItem) {
        return currentItems.map((item) =>
          item.productId === product.id ? { ...item, quantity } : item
        );
      }

      return [
        ...currentItems,
        {
          productId: product.id,
          categoryId: product.category_id,
          name: product.name,
          description: product.description,
          imageUrl: product.image_url,
          price: Number(product.price),
          quantity
        }
      ];
    });
  }

  function handleCategorySelect(categoryId: string) {
    setSelectedCategoryId(categoryId);
    document.getElementById(`category-${categoryId}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function toggleTheme() {
    setThemePreference((currentPreference) => {
      const currentTheme = currentPreference === "system" ? systemTheme : currentPreference;
      return currentTheme === "dark" ? "light" : "dark";
    });
  }

  const businessStyles = {
    "--business-primary": business.primary_color ?? "var(--color-primary)",
    "--business-primary-foreground": "#ffffff"
  } as CSSProperties;

  const description =
    business.description?.trim() || "Elegí productos y armá tu pedido.";

  return (
    <main
      className="catalog-page catalog-page--with-cart"
      data-theme={resolvedTheme}
      style={businessStyles}
    >
      <header className="catalog-hero">
        <div className="catalog-hero__topline">
          <div className="catalog-hero__brand">
            {business.logo_url ? (
              <img
                className="catalog-hero__logo"
                src={business.logo_url}
                alt={`${business.name} logo`}
              />
            ) : (
              <div className="catalog-hero__logo catalog-hero__logo--placeholder" aria-hidden="true">
                {business.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="catalog-hero__copy">
              <p className="catalog-eyebrow">Catálogo de pedidos</p>
              <h1>{business.name}</h1>
              <p>{description}</p>
            </div>
          </div>

          <ThemeToggle theme={resolvedTheme} onToggle={toggleTheme} />
        </div>

        <div className="catalog-hero__notes">
          <span className="catalog-hero__trust-chip">Confirmación final por WhatsApp</span>
          <p>Tu pedido queda registrado y luego se confirma por WhatsApp.</p>
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
            <h2>El catálogo todavía no está listo.</h2>
            <p>Estamos preparando las categorías para que puedas hacer tu pedido.</p>
          </section>
        ) : categoriesWithProducts.length === 0 ? (
          <section className="catalog-empty-panel">
            <h2>Todavía no hay productos disponibles.</h2>
            <p>Volvé a consultar más tarde o contactá al negocio.</p>
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
                      const quantity = getCartItem(product.id)?.quantity ?? 0;

                      return (
                        <ProductCard
                          key={product.id}
                          product={product}
                          quantity={quantity}
                          onOpen={() => setSelectedProductId(product.id)}
                          onAdd={() => setProductQuantity(product, 1)}
                          onIncrement={() => setProductQuantity(product, quantity + 1)}
                          onDecrement={() => setProductQuantity(product, quantity - 1)}
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

      <CartBar slug={slug} count={cartCount} total={cartTotal} />

      {selectedProduct ? (
        <ProductDetailModal
          product={selectedProduct}
          currentQuantity={getCartItem(selectedProduct.id)?.quantity ?? 0}
          onClose={() => setSelectedProductId(null)}
          onSaveQuantity={(quantity) => setProductQuantity(selectedProduct, quantity)}
        />
      ) : null}
    </main>
  );
}

function formatCount(value: number, singular: string, plural: string) {
  return `${value} ${value === 1 ? singular : plural}`;
}
