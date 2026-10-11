export const forbiddenPromoterCatalogFields = [
  "price",
  "stock",
  "track_stock",
  "is_available",
  "sku",
  "price_delta"
] as const;

const forbiddenFieldSet = new Set<string>(forbiddenPromoterCatalogFields);

export function promoterCatalogDecision(fields: readonly string[]): "reject" | "content" {
  for (const field of fields) {
    if (forbiddenFieldSet.has(field)) {
      return "reject";
    }
  }
  return "content";
}

export function presentCatalogFields(formData: FormData, candidates: readonly string[]): string[] {
  return candidates.filter((field) => {
    const value = formData.get(field);
    if (value === null) {
      return false;
    }
    if (typeof value === "string" && value.trim().length === 0 && field !== "price" && field !== "price_delta") {
      return false;
    }
    return true;
  });
}
