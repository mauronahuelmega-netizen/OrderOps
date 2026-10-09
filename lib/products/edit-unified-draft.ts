/**
 * Pure helpers for unified Edit Product draft (ONE EDITOR = ONE DRAFT = ONE SAVE).
 * Feature-local — no React state ownership.
 */

export type EditImageIntent = "keep" | "replace" | "remove";

export type UnifiedEditDraftSnapshot = {
  name: string;
  description: string;
  price: number;
  sku: string;
  stock: number;
  isAvailable: boolean;
  trackStock: boolean;
  imageIntent: EditImageIntent;
  hiddenGroupIds: readonly string[];
  hiddenOptionIds: readonly string[];
};

export type CustomizationLoadState = "loading" | "ready" | "error" | "empty";

export function canonicalizeIdSet(ids: Iterable<string>): string[] {
  const unique = new Set<string>();
  for (const id of ids) {
    const trimmed = id.trim();
    if (trimmed) {
      unique.add(trimmed);
    }
  }
  return Array.from(unique).sort((a, b) => a.localeCompare(b));
}

export function idSetsEqual(
  a: Iterable<string>,
  b: Iterable<string>
): boolean {
  const left = canonicalizeIdSet(a);
  const right = canonicalizeIdSet(b);
  if (left.length !== right.length) {
    return false;
  }
  return left.every((id, index) => id === right[index]);
}

export function toggleIdInCanonicalSet(
  ids: Iterable<string>,
  id: string
): string[] {
  const next = new Set(canonicalizeIdSet(ids));
  const trimmed = id.trim();
  if (!trimmed) {
    return Array.from(next).sort((a, b) => a.localeCompare(b));
  }
  if (next.has(trimmed)) {
    next.delete(trimmed);
  } else {
    next.add(trimmed);
  }
  return Array.from(next).sort((a, b) => a.localeCompare(b));
}

export function unifiedEditDraftEqual(
  a: UnifiedEditDraftSnapshot,
  b: UnifiedEditDraftSnapshot
): boolean {
  return (
    a.name === b.name &&
    a.description === b.description &&
    a.price === b.price &&
    a.sku === b.sku &&
    a.stock === b.stock &&
    a.isAvailable === b.isAvailable &&
    a.trackStock === b.trackStock &&
    a.imageIntent === b.imageIntent &&
    idSetsEqual(a.hiddenGroupIds, b.hiddenGroupIds) &&
    idSetsEqual(a.hiddenOptionIds, b.hiddenOptionIds)
  );
}

export function countCustomizationExceptions(
  hiddenGroupIds: Iterable<string>,
  hiddenOptionIds: Iterable<string>
): number {
  return canonicalizeIdSet(hiddenGroupIds).length + canonicalizeIdSet(hiddenOptionIds).length;
}

export function parseEditPriceInput(value: string): number | null {
  if (value.trim() === "") {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}
