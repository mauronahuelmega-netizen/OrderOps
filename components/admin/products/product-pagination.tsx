"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import styles from "./product-pagination.module.css";

type ProductPaginationProps = {
  page: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  className?: string;
};

export default function ProductPagination({
  page,
  totalPages,
  totalCount,
  limit,
  className
}: ProductPaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) {
    return null;
  }

  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams(searchParams.toString());

    if (targetPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(targetPage));
    }

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, totalCount);
  const hasPreviousPage = page > 1;
  const hasNextPage = page < totalPages;

  return (
    <nav
      className={[styles.pagination, className].filter(Boolean).join(" ")}
      aria-label="Paginación del catálogo"
    >
      <p className={styles.summary}>
        Mostrando {rangeStart}–{rangeEnd} de {totalCount} productos
      </p>

      <div className={styles.controls}>
        {hasPreviousPage ? (
          <Button href={buildHref(page - 1)} className="admin-secondary-link" variant="secondary">
            Anterior
          </Button>
        ) : (
          <Button type="button" className="admin-secondary-link" disabled variant="secondary">
            Anterior
          </Button>
        )}

        <span className={styles.status}>
          Página {page} de {totalPages}
        </span>

        {hasNextPage ? (
          <Button href={buildHref(page + 1)} className="admin-secondary-link" variant="secondary">
            Siguiente
          </Button>
        ) : (
          <Button type="button" className="admin-secondary-link" disabled variant="secondary">
            Siguiente
          </Button>
        )}
      </div>
    </nav>
  );
}
