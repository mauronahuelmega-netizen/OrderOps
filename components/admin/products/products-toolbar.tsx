"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/skeleton";
import CategoryOrderDialog from "@/components/admin/products/category-order-dialog";
import CompactProductsFilterMenu from "@/components/admin/products/compact-products-filter-menu";
import { useProductsManagement } from "@/components/admin/products/products-management-provider";
import styles from "./products-toolbar.module.css";

const FILTER_KEYS = ["q", "categoryId", "stock", "status"] as const;

const STOCK_OPTIONS = [
  { value: "", label: "Stock" },
  { value: "out", label: "Agotados" },
  { value: "low", label: "Bajo stock" },
  { value: "in", label: "Con stock" }
] as const;

const STATUS_OPTIONS = [
  { value: "", label: "Estado" },
  { value: "active", label: "Disponibles" },
  { value: "inactive", label: "No disponibles" },
  { value: "archived", label: "Archivados" }
] as const;

/** Single logical open owner for Category / Stock / Estado compact menus. */
type OpenProductFilter = "category" | "stock" | "status" | null;

export function ProductsToolbarSkeleton() {
  return (
    <div className={styles.toolbar} aria-hidden="true">
      <Skeleton className={styles.toolbarSkeletonSummary} />
      <div className={styles.controlsRow}>
        <Skeleton className={styles.toolbarSkeletonSearch} />
        <div className={styles.filtersCluster}>
          <Skeleton className={styles.toolbarSkeletonFilter} />
          <Skeleton className={styles.toolbarSkeletonFilter} />
          <Skeleton className={styles.toolbarSkeletonFilter} />
        </div>
      </div>
    </div>
  );
}

export default function ProductsToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const { categories, catalogTotalCount } = useProductsManagement();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [openFilter, setOpenFilter] = useState<OpenProductFilter>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);

  const [searchValue, setSearchValue] = useState(() => searchParams.get("q") ?? "");

  useEffect(() => {
    setSearchValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // URL navigation closes logical compact menus; presence exits locally.
    setOpenFilter(null);
  }, [searchParams]);

  const pushParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        mutate(params);
        params.delete("page");
        const query = params.toString();
        router.push(query ? `${pathname}?${query}` : pathname);
      });
    },
    [pathname, router, searchParams]
  );

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      pushParams((params) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
    },
    [pushParams]
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchValue(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      pushParams((params) => {
        const trimmed = value.trim();
        if (trimmed) {
          params.set("q", trimmed);
        } else {
          params.delete("q");
        }
      });
    }, 300);
  };

  const handleClearFilters = () => {
    setOpenFilter(null);
    startTransition(() => {
      router.push(pathname);
    });
  };

  const requestOpenFilter = useCallback((key: Exclude<OpenProductFilter, null>) => {
    setOpenFilter(key);
  }, []);

  const requestCloseFilter = useCallback((key: Exclude<OpenProductFilter, null>) => {
    setOpenFilter((current) => (current === key ? null : current));
  }, []);

  const openOrderDialog = useCallback(() => {
    setOpenFilter(null);
    setOrderDialogOpen(true);
  }, []);

  const hasActiveFilters = FILTER_KEYS.some((key) => {
    const value = searchParams.get(key);
    return value !== null && value !== "";
  });

  const categoryId = searchParams.get("categoryId") ?? "";
  const stock = searchParams.get("stock") ?? "";
  const status = searchParams.get("status") ?? "";

  const categoryOptions = [
    { value: "", label: "Todas" },
    ...categories.map((category) => ({
      value: category.id,
      label: category.name
    }))
  ];

  const canOrder = categories.length >= 2;

  return (
    <div className={styles.toolbar}>
      <p className={styles.summary}>
        {catalogTotalCount} {catalogTotalCount === 1 ? "producto" : "productos"} ·{" "}
        {categories.length} {categories.length === 1 ? "categoría" : "categorías"}
      </p>

      <div className={styles.controlsRow}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} strokeWidth={1.75} aria-hidden="true" />
          <input
            type="search"
            className={styles.search}
            placeholder="Buscar producto o SKU..."
            aria-label="Buscar productos"
            value={searchValue}
            onChange={handleSearchChange}
          />
        </div>

        <div className={styles.filtersCluster} data-products-filter-cluster="">
          <CompactProductsFilterMenu
            filterKey="category"
            ariaLabel={
              categoryId
                ? `Filtrar por categoría: ${
                    categories.find((category) => category.id === categoryId)?.name ??
                    "Categorías"
                  }`
                : "Filtrar por categoría"
            }
            options={categoryOptions}
            value={categoryId}
            onChange={(next) => handleFilterChange("categoryId", next)}
            triggerClassName={`${styles.filterSelect} ${styles.categoryTrigger}`}
            triggerActiveClassName={styles.filterSelectActive}
            open={openFilter === "category"}
            onRequestOpen={() => requestOpenFilter("category")}
            onRequestClose={() => requestCloseFilter("category")}
            emptyTriggerLabel="Categorías"
            menuWide
            trailingAction={
              canOrder
                ? {
                    label: "Ordenar categorías",
                    onSelect: openOrderDialog
                  }
                : undefined
            }
          />

          <CompactProductsFilterMenu
            filterKey="stock"
            ariaLabel="Filtrar por stock"
            options={[...STOCK_OPTIONS]}
            value={stock}
            onChange={(next) => handleFilterChange("stock", next)}
            triggerClassName={styles.filterSelect}
            triggerActiveClassName={styles.filterSelectActive}
            open={openFilter === "stock"}
            onRequestOpen={() => requestOpenFilter("stock")}
            onRequestClose={() => requestCloseFilter("stock")}
          />

          <CompactProductsFilterMenu
            filterKey="status"
            ariaLabel="Filtrar por estado"
            options={[...STATUS_OPTIONS]}
            value={status}
            onChange={(next) => handleFilterChange("status", next)}
            triggerClassName={styles.filterSelect}
            triggerActiveClassName={styles.filterSelectActive}
            open={openFilter === "status"}
            onRequestOpen={() => requestOpenFilter("status")}
            onRequestClose={() => requestCloseFilter("status")}
            menuAlign="end"
          />

          {hasActiveFilters ? (
            <Button
              type="button"
              className={styles.clearFilters}
              onClick={handleClearFilters}
              variant="ghost"
            >
              Limpiar filtros
            </Button>
          ) : null}
        </div>
      </div>

      <CategoryOrderDialog
        categories={categories}
        open={orderDialogOpen}
        onClose={() => setOrderDialogOpen(false)}
      />
    </div>
  );
}
