import "server-only";

import { cookies } from "next/headers";
import {
  CATALOG_PREVIEW_COOKIE_MAX_AGE_SECONDS,
  CATALOG_PREVIEW_COOKIE_NAME,
  CATALOG_PREVIEW_ORDER_BLOCKED_MESSAGE
} from "@/lib/admin/catalog-preview-shared";

export {
  CATALOG_PREVIEW_COOKIE_MAX_AGE_SECONDS,
  CATALOG_PREVIEW_COOKIE_NAME,
  CATALOG_PREVIEW_ORDER_BLOCKED_MESSAGE,
  CATALOG_PREVIEW_QUERY_PARAM,
  CATALOG_PREVIEW_QUERY_VALUE,
  buildCatalogPreviewPath,
  buildPublicCatalogPath,
  isCatalogPreviewQueryFlag
} from "@/lib/admin/catalog-preview-shared";

function catalogPreviewCookiePath(businessSlug: string): string {
  return `/b/${businessSlug.trim().toLowerCase()}`;
}

/**
 * Sets a short-lived httpOnly cookie scoped to /b/{slug}.
 * Value is businessId — used by checkout action to reject create_order.
 */
export async function setCatalogPreviewCookie(params: {
  businessId: string;
  businessSlug: string;
}): Promise<void> {
  const cookieStore = await cookies();
  const path = catalogPreviewCookiePath(params.businessSlug);

  cookieStore.set({
    name: CATALOG_PREVIEW_COOKIE_NAME,
    value: params.businessId,
    httpOnly: true,
    sameSite: "lax",
    path,
    secure: process.env.NODE_ENV === "production",
    maxAge: CATALOG_PREVIEW_COOKIE_MAX_AGE_SECONDS
  });
}

/**
 * Expires the preview cookie with the same name/path used at set time.
 * Call only after admin + tenant revalidation in a Server Action.
 */
export async function clearCatalogPreviewCookie(params: {
  businessSlug: string;
}): Promise<void> {
  const cookieStore = await cookies();
  const path = catalogPreviewCookiePath(params.businessSlug);

  cookieStore.set({
    name: CATALOG_PREVIEW_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0
  });
}

export async function readCatalogPreviewCookieBusinessId(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(CATALOG_PREVIEW_COOKIE_NAME)?.value?.trim();
  return value && value.length > 0 ? value : null;
}

/**
 * True when server should refuse create_order for this business.
 * Cookie match is primary; client-declared isPreview is defense-in-depth.
 */
export async function shouldBlockCatalogPreviewOrder(params: {
  businessId: string;
  clientDeclaredPreview?: boolean;
}): Promise<boolean> {
  if (params.clientDeclaredPreview === true) {
    return true;
  }

  const cookieBusinessId = await readCatalogPreviewCookieBusinessId();
  return cookieBusinessId === params.businessId;
}
