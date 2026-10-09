"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import { getAdminProductByIdAction } from "@/app/admin/(protected)/products/actions";
import type { AdminCategory } from "@/lib/categories/admin";
import type { AdminProduct } from "@/lib/products/admin";
import {
  resolveEmptyCatalogFlyoutMode,
  type ProductsFlyoutMode
} from "@/lib/products/products-list-contracts";

export type { ProductsFlyoutMode };

type ProductsManagementInitialData = {
  businessId: string;
  categories: AdminCategory[];
  /** Unfiltered tenant product total. Catalog existence only — never a filtered count. */
  catalogTotalCount: number;
};

/** Intercept flyout close requests. Call `commitClose` to dismiss immediately. */
export type FlyoutCloseRequestHandler = (commitClose: () => void) => void;

type ProductsManagementContextValue = {
  businessId: string;
  categories: AdminCategory[];
  catalogTotalCount: number;
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
  /** Immediate close — Save success / confirmed discard. Bypasses dirty guard. */
  closeFlyout: () => void;
  /** User dismissal paths (Cerrar / Escape / backdrop). Honors dirty close handler. */
  requestCloseFlyout: () => void;
  registerFlyoutCloseHandler: (handler: FlyoutCloseRequestHandler | null) => void;
  openCreateProduct: () => void;
  openCreateCategory: () => void;
  syncCatalogData: (input: {
    categories: AdminCategory[];
    catalogTotalCount: number;
  }) => void;
};

const ProductsManagementContext = createContext<ProductsManagementContextValue | null>(null);

type ProductsManagementProviderProps = {
  initialData: ProductsManagementInitialData;
  children: ReactNode;
};

function captureActiveOpener(openerRef: { current: HTMLElement | null }) {
  const active = document.activeElement;
  openerRef.current = active instanceof HTMLElement ? active : null;
}

export function ProductsManagementProvider({
  initialData,
  children
}: ProductsManagementProviderProps) {
  const [categories, setCategories] = useState(initialData.categories);
  const [catalogTotalCount, setCatalogTotalCount] = useState(initialData.catalogTotalCount);
  const [flyoutMode, setFlyoutMode] = useState<ProductsFlyoutMode>(() =>
    resolveEmptyCatalogFlyoutMode({
      categoriesCount: initialData.categories.length,
      catalogTotalCount: initialData.catalogTotalCount
    })
  );
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedProductName, setSelectedProductName] = useState("Producto");
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null);
  const [isLoadingSelectedProduct, setIsLoadingSelectedProduct] = useState(false);
  const [selectedProductError, setSelectedProductError] = useState<string | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const wasFlyoutOpenRef = useRef(flyoutMode !== null);
  const flyoutCloseHandlerRef = useRef<FlyoutCloseRequestHandler | null>(null);

  const syncCatalogData = useCallback(
    (input: { categories: AdminCategory[]; catalogTotalCount: number }) => {
      setCategories(input.categories);
      setCatalogTotalCount(input.catalogTotalCount);
      setFlyoutMode((currentMode) => {
        if (currentMode === "edit") {
          return currentMode;
        }

        return resolveEmptyCatalogFlyoutMode({
          categoriesCount: input.categories.length,
          catalogTotalCount: input.catalogTotalCount
        });
      });
    },
    []
  );

  useEffect(() => {
    syncCatalogData({
      categories: initialData.categories,
      catalogTotalCount: initialData.catalogTotalCount
    });
  }, [initialData.categories, initialData.catalogTotalCount, syncCatalogData]);

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

  useEffect(() => {
    const isOpen = flyoutMode !== null;

    if (isOpen) {
      wasFlyoutOpenRef.current = true;
      return;
    }

    if (!wasFlyoutOpenRef.current) {
      return;
    }

    wasFlyoutOpenRef.current = false;
    const opener = openerRef.current;
    openerRef.current = null;

    if (opener?.isConnected) {
      opener.focus();
    }
  }, [flyoutMode]);

  const openEditProduct = useCallback((productId: string, productName = "Producto") => {
    captureActiveOpener(openerRef);
    setSelectedProductId(productId);
    setSelectedProductName(productName);
    setSelectedProduct(null);
    setSelectedProductError(null);
    setFlyoutMode("edit");
  }, []);

  const closeFlyout = useCallback(() => {
    flyoutCloseHandlerRef.current = null;
    setSelectedProductId(null);
    setSelectedProductName("Producto");
    setSelectedProduct(null);
    setSelectedProductError(null);
    setIsLoadingSelectedProduct(false);
    setFlyoutMode(null);
  }, []);

  const registerFlyoutCloseHandler = useCallback((handler: FlyoutCloseRequestHandler | null) => {
    flyoutCloseHandlerRef.current = handler;
  }, []);

  const requestCloseFlyout = useCallback(() => {
    const handler = flyoutCloseHandlerRef.current;
    if (handler) {
      handler(() => {
        closeFlyout();
      });
      return;
    }
    closeFlyout();
  }, [closeFlyout]);

  const openCreateProduct = useCallback(() => {
    captureActiveOpener(openerRef);
    setSelectedProductId(null);
    setSelectedProduct(null);
    setSelectedProductError(null);
    setFlyoutMode("create-product");
  }, []);

  const openCreateCategory = useCallback(() => {
    captureActiveOpener(openerRef);
    setSelectedProductId(null);
    setSelectedProduct(null);
    setSelectedProductError(null);
    setFlyoutMode("create-category");
  }, []);

  const value = useMemo<ProductsManagementContextValue>(
    () => ({
      businessId: initialData.businessId,
      categories,
      catalogTotalCount,
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
      requestCloseFlyout,
      registerFlyoutCloseHandler,
      openCreateProduct,
      openCreateCategory,
      syncCatalogData
    }),
    [
      initialData.businessId,
      categories,
      catalogTotalCount,
      flyoutMode,
      selectedProductId,
      selectedProductName,
      selectedProduct,
      isLoadingSelectedProduct,
      selectedProductError,
      openEditProduct,
      closeFlyout,
      requestCloseFlyout,
      registerFlyoutCloseHandler,
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
