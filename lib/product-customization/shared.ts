import type { Tables } from "@/types/database";

export type AdminCustomizationOption = Tables<"customization_options">;

export type AdminCustomizationGroup = Tables<"customization_groups"> & {
  options: AdminCustomizationOption[];
};

export type CustomizationSelectionType = "single" | "multiple";

export type ParsedCustomizationGroupInput = {
  name: string;
  description: string | null;
  selectionType: CustomizationSelectionType;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number | null;
  allowsOptionQuantity: boolean;
  maxTotalQuantity: number | null;
  isAvailable: boolean;
  sortOrder: number;
};

export type ParsedCustomizationOptionInput = {
  name: string;
  description: string | null;
  priceDelta: number;
  maxQuantity: number;
  isAvailable: boolean;
  sortOrder: number;
};

export type CustomizationTargetType = "category" | "product";

export type AdminCustomizationAssignment = Tables<"customization_group_assignments"> & {
  group_name: string;
  target_name: string;
};

/** Read-only admin row for product_customization_overrides (preview + inheritance). */
export type AdminProductCustomizationOverride = Tables<"product_customization_overrides">;

export type AdminCatalogProductOption = {
  id: string;
  name: string;
  category_id: string;
  price: number;
  is_available: boolean;
};

export type AdminUpsellGroupItem = Tables<"upsell_group_items"> & {
  product_name: string;
  product_price: number;
};

export type AdminUpsellGroup = Tables<"upsell_groups"> & {
  target_name: string;
  items: AdminUpsellGroupItem[];
};

export type ProductCustomizationInheritanceOption = {
  optionId: string;
  optionName: string;
  priceDelta: number;
  optionAvailable: boolean;
  isDisabledForProduct: boolean;
};

export type ProductCustomizationInheritanceGroup = {
  groupId: string;
  groupName: string;
  source: CustomizationTargetType;
  assignmentId: string;
  assignmentSortOrder: number;
  assignmentEnabled: boolean;
  isDisabledForProduct: boolean;
  options: ProductCustomizationInheritanceOption[];
};

export type ProductCustomizationInheritance = {
  productId: string;
  productName: string;
  categoryId: string | null;
  categoryName: string | null;
  groups: ProductCustomizationInheritanceGroup[];
};

export type ParsedAssignmentInput = {
  targetType: CustomizationTargetType;
  targetId: string;
  groupId: string;
  isEnabled: boolean;
  sortOrder: number;
};

export type ParsedUpsellGroupInput = {
  name: string;
  description: string | null;
  targetType: CustomizationTargetType;
  targetId: string;
  isAvailable: boolean;
  sortOrder: number;
};

export type ParsedUpsellItemInput = {
  upsellGroupId: string;
  productId: string;
  isAvailable: boolean;
  sortOrder: number;
};

function getTrimmedString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalDescription(formData: FormData, key: string) {
  const value = getTrimmedString(formData, key);
  return value.length > 0 ? value : null;
}

function getBoolean(formData: FormData, key: string, fallback = false) {
  const values = formData.getAll(key).map(String);

  if (values.length === 0) {
    return fallback;
  }

  if (values.some((value) => value === "true" || value === "on" || value === "1")) {
    return true;
  }

  if (values.some((value) => value === "false" || value === "off" || value === "0")) {
    return false;
  }

  return fallback;
}

function parseNonNegativeInteger(
  raw: string,
  fieldLabel: string
): { value: number } | { error: string } {
  if (!raw) {
    return { error: `${fieldLabel} es obligatorio.` };
  }

  if (!/^\d+$/.test(raw)) {
    return { error: `${fieldLabel} debe ser un número entero mayor o igual a 0.` };
  }

  return { value: Number.parseInt(raw, 10) };
}

function parseNullableNonNegativeInteger(
  raw: string,
  fieldLabel: string
): { value: number | null } | { error: string } {
  if (!raw) {
    return { value: null };
  }

  return parseNonNegativeInteger(raw, fieldLabel);
}

function parsePriceDelta(raw: string): { value: number } | { error: string } {
  const normalized = raw.replace(",", ".").trim();

  if (!normalized) {
    return { value: 0 };
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return {
      error: "El precio adicional debe ser un número mayor o igual a 0 (máx. 2 decimales)."
    };
  }

  const value = Number.parseFloat(normalized);

  if (!Number.isFinite(value) || value < 0) {
    return { error: "El precio adicional no puede ser negativo." };
  }

  return { value };
}

export function parseCustomizationGroupInput(
  formData: FormData
): ParsedCustomizationGroupInput | { error: string } {
  const name = getTrimmedString(formData, "name");
  const description = getOptionalDescription(formData, "description");
  const selectionTypeRaw = getTrimmedString(formData, "selection_type");
  const isRequired = getBoolean(formData, "is_required");
  const isAvailable = getBoolean(formData, "is_available", true);
  const minRaw = getTrimmedString(formData, "min_selections");
  const maxRaw = getTrimmedString(formData, "max_selections");
  const sortRaw = getTrimmedString(formData, "sort_order");

  if (!name) {
    return { error: "El nombre es obligatorio." };
  }

  if (selectionTypeRaw !== "single" && selectionTypeRaw !== "multiple") {
    return { error: "El tipo de selección debe ser única o múltiple." };
  }

  const selectionType = selectionTypeRaw as CustomizationSelectionType;

  const minParsed = parseNonNegativeInteger(
    minRaw || (isRequired ? "1" : "0"),
    "El mínimo de selecciones"
  );
  if ("error" in minParsed) {
    return minParsed;
  }

  const maxParsed = parseNullableNonNegativeInteger(maxRaw, "El máximo de selecciones");
  if ("error" in maxParsed) {
    return maxParsed;
  }

  const sortParsed = parseNonNegativeInteger(sortRaw || "0", "El orden");
  if ("error" in sortParsed) {
    return sortParsed;
  }

  let minSelections = minParsed.value;
  let maxSelections = maxParsed.value;

  if (selectionType === "single") {
    maxSelections = 1;
    minSelections = isRequired ? 1 : Math.min(minSelections, 1);
  }

  if (isRequired && minSelections < 1) {
    return { error: "Si el grupo es requerido, el mínimo debe ser al menos 1." };
  }

  if (maxSelections !== null && maxSelections < minSelections) {
    return { error: "La configuración min/max no es válida." };
  }

  if (selectionType === "single" && maxSelections !== null && maxSelections > 1) {
    return { error: "La selección única admite máximo 1 opción." };
  }

  const allowsOptionQuantityRaw = getBoolean(formData, "allows_option_quantity", false);
  const allowsOptionQuantity =
    selectionType === "multiple" && allowsOptionQuantityRaw;
  const maxTotalRaw = getTrimmedString(formData, "max_total_quantity");

  let maxTotalQuantity: number | null = null;

  if (allowsOptionQuantity) {
    if (!maxTotalRaw) {
      return {
        error: "El máximo de unidades en total es obligatorio si permitís cantidades."
      };
    }

    const maxTotalParsed = parseNonNegativeInteger(
      maxTotalRaw,
      "El máximo de unidades en total"
    );
    if ("error" in maxTotalParsed) {
      return maxTotalParsed;
    }

    if (maxTotalParsed.value < 1) {
      return { error: "El máximo de unidades en total debe ser al menos 1." };
    }

    maxTotalQuantity = maxTotalParsed.value;
  }

  return {
    name,
    description,
    selectionType,
    isRequired,
    minSelections,
    maxSelections,
    allowsOptionQuantity,
    maxTotalQuantity,
    isAvailable,
    sortOrder: sortParsed.value
  };
}

export function parseCustomizationOptionInput(
  formData: FormData,
  options?: { groupAllowsOptionQuantity?: boolean }
): ParsedCustomizationOptionInput | { error: string } {
  const name = getTrimmedString(formData, "name");
  const description = getOptionalDescription(formData, "description");
  const priceRaw = getTrimmedString(formData, "price_delta");
  const isAvailable = getBoolean(formData, "is_available", true);
  const sortRaw = getTrimmedString(formData, "sort_order");
  const maxQuantityRaw = getTrimmedString(formData, "max_quantity");
  const groupAllowsOptionQuantity = Boolean(options?.groupAllowsOptionQuantity);

  if (!name) {
    return { error: "El nombre es obligatorio." };
  }

  const priceParsed = parsePriceDelta(priceRaw || "0");
  if ("error" in priceParsed) {
    return priceParsed;
  }

  const sortParsed = parseNonNegativeInteger(sortRaw || "0", "El orden");
  if ("error" in sortParsed) {
    return sortParsed;
  }

  let maxQuantity = 1;

  if (groupAllowsOptionQuantity) {
    const maxQuantityParsed = parseNonNegativeInteger(
      maxQuantityRaw || "1",
      "La cantidad máxima por opción"
    );
    if ("error" in maxQuantityParsed) {
      return maxQuantityParsed;
    }

    if (maxQuantityParsed.value < 1) {
      return { error: "La cantidad máxima por opción debe ser al menos 1." };
    }

    maxQuantity = maxQuantityParsed.value;
  }

  return {
    name,
    description,
    priceDelta: priceParsed.value,
    maxQuantity,
    isAvailable,
    sortOrder: sortParsed.value
  };
}

export function suggestNextGroupSortOrder(groups: AdminCustomizationGroup[]) {
  if (groups.length === 0) {
    return 0;
  }

  return Math.max(...groups.map((group) => group.sort_order)) + 10;
}

export function suggestNextOptionSortOrder(options: AdminCustomizationOption[]) {
  if (options.length === 0) {
    return 0;
  }

  return Math.max(...options.map((option) => option.sort_order)) + 10;
}

export function formatCustomizationPriceDelta(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value);
}

function parseTargetType(raw: string): CustomizationTargetType | { error: string } {
  if (raw === "category" || raw === "product") {
    return raw;
  }

  return { error: "El destino debe ser categoría o producto." };
}

export function parseCustomizationAssignmentInput(
  formData: FormData
): ParsedAssignmentInput | { error: string } {
  const targetTypeRaw = getTrimmedString(formData, "target_type");
  const targetId = getTrimmedString(formData, "target_id");
  const groupId = getTrimmedString(formData, "group_id");
  const isEnabled = getBoolean(formData, "is_enabled", true);
  const sortRaw = getTrimmedString(formData, "sort_order");

  const targetType = parseTargetType(targetTypeRaw);
  if (typeof targetType === "object" && "error" in targetType) {
    return targetType;
  }

  if (!targetId) {
    return { error: "Seleccioná un destino." };
  }

  if (!groupId) {
    return { error: "Seleccioná un grupo." };
  }

  const sortParsed = parseNonNegativeInteger(sortRaw || "0", "El orden");
  if ("error" in sortParsed) {
    return sortParsed;
  }

  return {
    targetType,
    targetId,
    groupId,
    isEnabled,
    sortOrder: sortParsed.value
  };
}

export function parseUpsellGroupInput(
  formData: FormData
): ParsedUpsellGroupInput | { error: string } {
  const name = getTrimmedString(formData, "name");
  const description = getOptionalDescription(formData, "description");
  const targetTypeRaw = getTrimmedString(formData, "target_type");
  const targetId = getTrimmedString(formData, "target_id");
  const isAvailable = getBoolean(formData, "is_available", true);
  const sortRaw = getTrimmedString(formData, "sort_order");

  if (!name) {
    return { error: "El nombre es obligatorio." };
  }

  const targetType = parseTargetType(targetTypeRaw);
  if (typeof targetType === "object" && "error" in targetType) {
    return targetType;
  }

  if (!targetId) {
    return { error: "Seleccioná un destino." };
  }

  const sortParsed = parseNonNegativeInteger(sortRaw || "0", "El orden");
  if ("error" in sortParsed) {
    return sortParsed;
  }

  return {
    name,
    description,
    targetType,
    targetId,
    isAvailable,
    sortOrder: sortParsed.value
  };
}

export function parseUpsellItemInput(
  formData: FormData
): ParsedUpsellItemInput | { error: string } {
  const upsellGroupId = getTrimmedString(formData, "upsell_group_id");
  const productId = getTrimmedString(formData, "product_id");
  const isAvailable = getBoolean(formData, "is_available", true);
  const sortRaw = getTrimmedString(formData, "sort_order");

  if (!upsellGroupId) {
    return { error: "Falta identificar el grupo de plus." };
  }

  if (!productId) {
    return { error: "Seleccioná un producto sugerido." };
  }

  const sortParsed = parseNonNegativeInteger(sortRaw || "0", "El orden");
  if ("error" in sortParsed) {
    return sortParsed;
  }

  return {
    upsellGroupId,
    productId,
    isAvailable,
    sortOrder: sortParsed.value
  };
}

export function suggestNextAssignmentSortOrder(
  assignments: Array<{ sort_order: number }>
) {
  if (assignments.length === 0) {
    return 0;
  }

  return Math.max(...assignments.map((row) => row.sort_order)) + 10;
}

export function suggestNextUpsellSortOrder(groups: Array<{ sort_order: number }>) {
  if (groups.length === 0) {
    return 0;
  }

  return Math.max(...groups.map((row) => row.sort_order)) + 10;
}

export function suggestNextUpsellItemSortOrder(items: Array<{ sort_order: number }>) {
  if (items.length === 0) {
    return 0;
  }

  return Math.max(...items.map((row) => row.sort_order)) + 10;
}

/** Sortable reorder: increments of 10 (10, 20, 30…). */
export const CUSTOMIZATION_SORT_ORDER_STEP = 10;

export function parseOrderedIdsJson(
  raw: string
): { orderedIds: string[] } | { error: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { error: "La lista de orden está vacía." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { error: "El payload de orden no es JSON válido." };
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    return { error: "La lista de orden debe ser un array no vacío." };
  }

  const orderedIds: string[] = [];
  const seen = new Set<string>();

  for (const entry of parsed) {
    if (typeof entry !== "string" || !entry.trim()) {
      return { error: "La lista de orden contiene IDs inválidos." };
    }
    const id = entry.trim();
    if (seen.has(id)) {
      return { error: "La lista de orden contiene IDs duplicados." };
    }
    seen.add(id);
    orderedIds.push(id);
  }

  return { orderedIds };
}

export function buildIncrementalSortOrders(
  orderedIds: string[],
  step = CUSTOMIZATION_SORT_ORDER_STEP
): Array<{ id: string; sort_order: number }> {
  return orderedIds.map((id, index) => ({
    id,
    sort_order: (index + 1) * step
  }));
}

export function moveItemInOrderedIds(
  orderedIds: string[],
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
    return orderedIds;
  }

  const next = [...orderedIds];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}
