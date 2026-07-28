/** Client-safe catalog preview constants and path helpers (no server APIs). */

export const CATALOG_PREVIEW_QUERY_PARAM = "orderopsPreview";
export const CATALOG_PREVIEW_QUERY_VALUE = "1";

export const CATALOG_PREVIEW_COOKIE_NAME = "orderops-admin-catalog-preview";

/** Short TTL so admin real orders on /b/{slug} are not blocked for long after preview. */
export const CATALOG_PREVIEW_COOKIE_MAX_AGE_SECONDS = 300;

export const CATALOG_PREVIEW_ORDER_BLOCKED_MESSAGE =
  "La confirmación de pedidos está deshabilitada en la vista previa del catálogo.";

/** Same-origin postMessage: parent → iframe (clear preview cart React state). */
export const ORDEROPS_PREVIEW_CLEAR_CART_MESSAGE = "ORDEROPS_PREVIEW_CLEAR_CART" as const;

/** Same-origin postMessage: iframe → parent (ACK after clear). */
export const ORDEROPS_PREVIEW_CLEAR_CART_ACK_MESSAGE =
  "ORDEROPS_PREVIEW_CLEAR_CART_ACK" as const;

export type OrderOpsPreviewClearCartMessage = {
  type: typeof ORDEROPS_PREVIEW_CLEAR_CART_MESSAGE;
  businessId: string;
};

export type OrderOpsPreviewClearCartAckMessage = {
  type: typeof ORDEROPS_PREVIEW_CLEAR_CART_ACK_MESSAGE;
  businessId: string;
};

export function isCatalogPreviewQueryFlag(value: string | string[] | undefined): boolean {
  if (Array.isArray(value)) {
    return value.includes(CATALOG_PREVIEW_QUERY_VALUE);
  }

  return value === CATALOG_PREVIEW_QUERY_VALUE;
}

export function buildCatalogPreviewPath(slug: string, page: "catalogo" | "checkout"): string {
  const normalized = slug.trim().toLowerCase();
  return `/b/${normalized}/${page}?${CATALOG_PREVIEW_QUERY_PARAM}=${CATALOG_PREVIEW_QUERY_VALUE}`;
}

export function buildPublicCatalogPath(slug: string): string {
  return `/b/${slug.trim().toLowerCase()}/catalogo`;
}
