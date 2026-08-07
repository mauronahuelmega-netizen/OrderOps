"use client";

import { useMemo } from "react";
import type { PublicCategory } from "@/lib/catalog/public";

export function formatCatalogCategoryName(name: string) {
  const locale = "es-AR";
  const trimmed = name.trim();

  if (
    !trimmed ||
    trimmed === trimmed.toLocaleLowerCase(locale) ||
    trimmed !== trimmed.toLocaleUpperCase(locale)
  ) {
    return name;
  }

  return trimmed
    .toLocaleLowerCase(locale)
    .replace(/(^|[\s/-])(\p{L})/gu, (_, prefix: string, letter: string) =>
      `${prefix}${letter.toLocaleUpperCase(locale)}`
    );
}

type CategoryNavProps = {
  categories: PublicCategory[];
  countsByCategoryId: Map<string, number>;
  activeCategoryId: string | null;
  isSearchActive?: boolean;
  onSelect: (categoryId: string) => void;
  onAll?: () => void;
};

export default function CategoryNav({
  categories,
  countsByCategoryId,
  activeCategoryId,
  isSearchActive = false,
  onSelect,
  onAll
}: CategoryNavProps) {
  const items = useMemo(
    () =>
      categories.filter((category) => (countsByCategoryId.get(category.id) ?? 0) > 0),
    [categories, countsByCategoryId]
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="catalog-category-nav" data-preview-pan-ignore>
      <nav className="catalog-category-nav__inner" aria-label="Categorías">
        {isSearchActive ? (
          <button type="button" className={`catalog-category-chip${activeCategoryId === null ? " catalog-category-chip--active" : ""}`} onClick={onAll} aria-pressed={activeCategoryId === null}>Todos</button>
        ) : null}
        {items.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`catalog-category-chip${
              activeCategoryId === category.id ? " catalog-category-chip--active" : ""
            }`}
            onClick={() => onSelect(category.id)}
            aria-pressed={isSearchActive ? activeCategoryId === category.id : undefined}
          >
            {formatCatalogCategoryName(category.name)}
          </button>
        ))}
      </nav>
    </div>
  );
}
