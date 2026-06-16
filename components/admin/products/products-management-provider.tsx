"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { getAdminProductByIdAction } from "@/app/admin/(protected)/products/actions";
import type { AdminCategory } from "@/lib/categories/admin";
import type { AdminProduct } from "@/lib/products/admin";

export type ProductsFlyoutMode = "edit" | "create-product" | "create-category" | null;

type ProductsManagementInitialData = {
  businessId: string;
  categories: AdminCategory[];
  totalCount: number;
};

type ProductsManagementContextValue = {
  businessId: string;
  categories: AdminCategory[];
  totalCount: number;
  categoriesCount: number;
  flyoutMode: ProductsFlyoutMode;
  selectedProductId: string | null;
  selectedProductName: string;
  selectedProduct: AdminProduct | null;
  isLoadingSelectedProduct: boolean;
  selectedProductError: string | null;
  setFlyoutMode: (mode: ProductsFlyoutMode) => void;
  setSelectedProductId: (productId: string | null) => void;
  openEditProduct: (productId: string, productName?: string) => void;
  closeFlyout: () => void;
  openCreateProduct: () => void;
  openCreateCategory: () => void;
  syncCatalogData: (input: { categories: AdminCategory[]; totalCount: number }) => void;
};

const ProductsManagementContext = createContext<ProductsManagementContextValue | null>(null);

function resolveEmptyCatalogFlyoutMode(
  categories: AdminCategory[],
  totalCount: number
): ProductsFlyoutMode {
  if (categories.length === 0) {
    return "create-category";
  }

  if (totalCount === 0) {
    return "create-product";
  }

  return null;
}

type ProductsManagementProviderProps = {
  initialData: ProductsManagementInitialData;
  children: ReactNode;
};

export function ProductsManagementProvider({
  initialData,
  children
}: ProductsManagementProviderProps) {
  const [categories, setCategories] = useState(initialData.categories);
  const [totalCount, setTotalCount] = useState(initialData.totalCount);
  const [flyoutMode, setFlyoutMode] = useState<ProductsFlyoutMode>(() =>
    resolveEmptyCatalogFlyoutMode(initialData.categories, initialData.totalCount)
  );
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedProductName, setSelectedProductName] = useState("Producto");
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null);
  const [isLoadingSelectedProduct, setIsLoadingSelectedProduct] = useState(false);
  const [selectedProductError, setSelectedProductError] = useState<string | null>(null);

  const syncCatalogData = useCallback(
    (input: { categories: AdminCategory[]; totalCount: number }) => {
      setCategories(input.categories);
      setTotalCount(input.totalCount);
      setFlyoutMode((currentMode) => {
        if (currentMode === "edit") {
          return currentMode;
        }

        return resolveEmptyCatalogFlyoutMode(input.categories, input.totalCount);
      });
    },
    []
  );

  useEffect(() => {
    syncCatalogData({
      categories: initialData.categories,
      totalCount: initialData.totalCount
    });
  }, [initialData.categories, initialData.totalCount, syncCatalogData]);

  useEffect(() => {
    if (flyoutMode !== "edit" || !selectedProductId) {
      setSelectedProduct(null);
      setSelectedProductError(null);
      setIsLoadingSelectedProduct(false);
      return;
    }

    let cancelled = false;

    setSelectedProduct(null);
    setSelectedProductError(null);
    setIsLoadingSelectedProduct(true);

    void getAdminProductByIdAction(selectedProductId).then((result) => {
      if (cancelled) {
        return;
      }

      setIsLoadingSelectedProduct(false);

      if (result.error || !result.product) {
        setSelectedProductError(result.error ?? "No pudimos cargar el producto.");
        return;
      }

      setSelectedProduct(result.product);
    });

    return () => {
      cancelled = true;
    };
  }, [flyoutMode, selectedProductId]);

  const openEditProduct = useCallback((productId: string, productName = "Producto") => {
    setSelectedProductId(productId);
    setSelectedProductName(productName);
    setSelectedProduct(null);
    setSelectedProductError(null);
    setFlyoutMode("edit");
  }, []);

  const closeFlyout = useCallback(() => {
    setSelectedProductId(null);
    setSelectedProductName("Producto");
    setSelectedProduct(null);
    setSelectedProductError(null);
    setIsLoadingSelectedProduct(false);
    setFlyoutMode(null);
  }, []);

  const openCreateProduct = useCallback(() => {
    setSelectedProductId(null);
    setSelectedProduct(null);
    setSelectedProductError(null);
    setFlyoutMode("create-product");
  }, []);

  const openCreateCategory = useCallback(() => {
    setSelectedProductId(null);
    setSelectedProduct(null);
    setSelectedProductError(null);
    setFlyoutMode("create-category");
  }, []);

  const value = useMemo<ProductsManagementContextValue>(
    () => ({
      businessId: initialData.businessId,
      categories,
      totalCount,
      categoriesCount: categories.length,
      flyoutMode,
      selectedProductId,
      selectedProductName,
      selectedProduct,
      isLoadingSelectedProduct,
      selectedProductError,
      setFlyoutMode,
      setSelectedProductId,
      openEditProduct,
      closeFlyout,
      openCreateProduct,
      openCreateCategory,
      syncCatalogData
    }),
    [
      initialData.businessId,
      categories,
      totalCount,
      flyoutMode,
      selectedProductId,
      selectedProductName,
      selectedProduct,
      isLoadingSelectedProduct,
      selectedProductError,
      openEditProduct,
      closeFlyout,
      openCreateProduct,
      openCreateCategory,
      syncCatalogData
    ]
  );

  return (
    <ProductsManagementContext.Provider value={value}>{children}</ProductsManagementContext.Provider>
  );
}

export function useProductsManagement() {
  const context = useContext(ProductsManagementContext);

  if (!context) {
    throw new Error("useProductsManagement must be used within ProductsManagementProvider.");
  }

  return context;
}
