"use client";

import type { RefObject } from "react";
import styles from "./catalog-discovery-controls.module.css";

type Props = {
  isMediumCatalog: boolean;
  isExpanded: boolean;
  query: string;
  resultCount: number;
  inputRef: RefObject<HTMLInputElement | null>;
  surfaceRef: RefObject<HTMLDivElement | null>;
  onExpand: () => void;
  onQueryChange: (query: string) => void;
  onClear: () => void;
};

export default function CatalogDiscoveryControls({ isMediumCatalog, isExpanded, query, resultCount, inputRef, surfaceRef, onExpand, onQueryChange, onClear }: Props) {
  if (isMediumCatalog && !isExpanded) {
    return <div className={styles.surface} ref={surfaceRef}><button className={styles.trigger} type="button" onClick={onExpand}>Buscar productos</button></div>;
  }

  return (
    <div className={styles.surface} ref={surfaceRef} role="search">
      <label className={styles.label} htmlFor="catalog-product-search">Buscar productos</label>
      <div className={styles.fieldWrap}>
        <input ref={inputRef} id="catalog-product-search" className={styles.field} type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape" && query) { event.preventDefault(); onClear(); } }} placeholder="Buscar por producto o categoría" aria-describedby="catalog-search-results" />
        {query ? <button className={styles.clear} type="button" onClick={onClear} aria-label="Limpiar búsqueda">Limpiar</button> : null}
      </div>
      <p id="catalog-search-results" className={styles.status} aria-live="polite">{query ? `${resultCount} ${resultCount === 1 ? "producto" : "productos"}` : "Escribí para buscar productos"}</p>
    </div>
  );
}
