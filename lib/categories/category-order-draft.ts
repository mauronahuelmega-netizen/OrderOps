/** Pure helpers for Category Order local draft (IMPLEMENTATION-1). */

export function categoryOrderSequencesEqual(
  left: readonly string[],
  right: readonly string[]
): boolean {
  if (left.length !== right.length) {
    return false;
  }
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) {
      return false;
    }
  }
  return true;
}

export function isCategoryOrderDirty(
  persistedOrder: readonly string[],
  draftOrder: readonly string[]
): boolean {
  return !categoryOrderSequencesEqual(persistedOrder, draftOrder);
}

export function moveCategoryInOrder(
  orderedIds: readonly string[],
  fromIndex: number,
  toIndex: number
): string[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= orderedIds.length ||
    toIndex >= orderedIds.length ||
    fromIndex === toIndex
  ) {
    return [...orderedIds];
  }

  const next = [...orderedIds];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export function categoryIdSetsEqual(
  left: readonly string[],
  right: readonly string[]
): boolean {
  if (left.length !== right.length) {
    return false;
  }
  const rightSet = new Set(right);
  for (const id of left) {
    if (!rightSet.has(id)) {
      return false;
    }
  }
  return true;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isCategoryOrderUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function validateOrderedCategoryIds(
  orderedCategoryIds: unknown
): { ok: true; ids: string[] } | { ok: false; error: string } {
  if (!Array.isArray(orderedCategoryIds)) {
    return { ok: false, error: "El orden de categorías es inválido." };
  }

  if (orderedCategoryIds.length > 500) {
    return { ok: false, error: "El orden de categorías es inválido." };
  }

  const ids: string[] = [];
  const seen = new Set<string>();

  for (const entry of orderedCategoryIds) {
    if (typeof entry !== "string") {
      return { ok: false, error: "El orden de categorías es inválido." };
    }
    const id = entry.trim();
    if (!id || !isCategoryOrderUuid(id)) {
      return { ok: false, error: "El orden de categorías es inválido." };
    }
    if (seen.has(id)) {
      return { ok: false, error: "El orden de categorías es inválido." };
    }
    seen.add(id);
    ids.push(id);
  }

  return { ok: true, ids };
}

export const CATEGORY_ORDER_HELPER_COPY =
  "Usá las flechas para definir el orden del catálogo.";

export const CATEGORY_ORDER_SUCCESS_COPY = "Orden de categorías guardado.";

export const CATEGORY_ORDER_STALE_COPY =
  "Las categorías cambiaron mientras las ordenabas. Actualizá el orden e intentá de nuevo.";

export const CATEGORY_ORDER_GENERIC_ERROR_COPY =
  "No se pudo guardar el orden de categorías. Intentá nuevamente.";
