"use client";

import { useMemo } from "react";
import type { PublicCategory } from "@/lib/catalog/public";

type CategoryNavProps = {
  categories: PublicCategory[];
  countsByCategoryId: Map<string, number>;
  activeCategoryId: string | null;
  onSelect: (categoryId: string) => void;
};

export default function CategoryNav({
  categories,
  countsByCategoryId,
  activeCategoryId,
  onSelect
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
    <div className="catalog-category-nav">
      <div className="catalog-category-nav__inner" aria-label="Categorías">
        {items.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`catalog-category-chip${
              activeCategoryId === category.id ? " catalog-category-chip--active" : ""
            }`}
            onClick={() => onSelect(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}
