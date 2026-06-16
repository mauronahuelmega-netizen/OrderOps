"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductsManagement } from "@/components/admin/products/products-management-provider";
import styles from "./products-toolbar.module.css";

const FILTER_KEYS = ["q", "categoryId", "stock", "status"] as const;

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
  const { categories, totalCount } = useProductsManagement();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasActiveFilters = FILTER_KEYS.some((key) => {
    const value = searchParams.get(key);
    return value !== null && value !== "";
  });

  const categoryId = searchParams.get("categoryId") ?? "";
  const stock = searchParams.get("stock") ?? "";
  const status = searchParams.get("status") ?? "";

  return (
    <div className={styles.toolbar}>
      <p className={styles.summary}>
        {totalCount} {totalCount === 1 ? "producto" : "productos"} · {categories.length}{" "}
        {categories.length === 1 ? "categoría" : "categorías"}
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

        <div className={styles.filtersCluster}>
          <select
            className={`${styles.filterSelect} ${categoryId ? styles.filterSelectActive : ""}`}
            aria-label="Filtrar por categoría"
            value={categoryId}
            onChange={(event) => handleFilterChange("categoryId", event.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            className={`${styles.filterSelect} ${stock ? styles.filterSelectActive : ""}`}
            aria-label="Filtrar por stock"
            value={stock}
            onChange={(event) => handleFilterChange("stock", event.target.value)}
          >
            <option value="">Stock: Todos</option>
            <option value="out">Agotados (0)</option>
            <option value="low">Bajo stock (1-5)</option>
            <option value="in">Con stock (&gt;0)</option>
          </select>

          <select
            className={`${styles.filterSelect} ${status ? styles.filterSelectActive : ""}`}
            aria-label="Filtrar por estado"
            value={status}
            onChange={(event) => handleFilterChange("status", event.target.value)}
          >
            <option value="">Estado: Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>

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
    </div>
  );
}
