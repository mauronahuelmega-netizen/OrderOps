"use client";

import type { RefObject } from "react";
import { Search } from "lucide-react";
import styles from "./catalog-discovery-controls.module.css";

type Props = {
  query: string;
  resultCount: number;
  inputRef: RefObject<HTMLInputElement | null>;
  surfaceRef: RefObject<HTMLDivElement | null>;
  onQueryChange: (query: string) => void;
  onClear: () => void;
};

export default function CatalogDiscoveryControls({ query, resultCount, inputRef, surfaceRef, onQueryChange, onClear }: Props) {
  return (
    <div className={styles.surface} ref={surfaceRef} role="search">
      <label className={styles.label} htmlFor="catalog-product-search">Buscar productos</label>
      <div className={styles.fieldWrap}>
        <Search className={styles.icon} aria-hidden="true" strokeWidth={2} />
        <input ref={inputRef} id="catalog-product-search" className={styles.field} type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape" && query) { event.preventDefault(); onClear(); } }} placeholder="Buscar productos o categorias" aria-describedby={query ? "catalog-search-results" : undefined} />
        {query ? <button className={styles.clear} type="button" onClick={onClear} aria-label="Limpiar búsqueda">Limpiar</button> : null}
      </div>
      {query ? <p id="catalog-search-results" className={styles.status} aria-live="polite">{resultCount} {resultCount === 1 ? "producto" : "productos"}</p> : null}
    </div>
  );
}
