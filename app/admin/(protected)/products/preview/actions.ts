"use server";

import {
  clearCatalogPreviewCookie,
  setCatalogPreviewCookie
} from "@/lib/admin/catalog-preview";
import { requireAdminPermission } from "@/lib/admin/context";

export type ArmCatalogPreviewCookieResult =
  | { ok: true; businessId: string; businessSlug: string }
  | { ok: false; error: "missing_slug" | "unauthorized" };

export type ClearCatalogPreviewCookieResult =
  | { ok: true }
  | { ok: false; error: "missing_slug" | "unauthorized" | "tenant_mismatch" };

/**
 * Arms the httpOnly preview cookie before the iframe mounts.
 * Must run as a Server Action (cookies cannot be set from Server Components).
 */
export async function armCatalogPreviewCookieAction(): Promise<ArmCatalogPreviewCookieResult> {
  try {
    const adminContext = await requireAdminPermission("manageProducts");
    const businessSlug = adminContext.businessSlug?.trim().toLowerCase() || null;

    if (!businessSlug) {
      return { ok: false, error: "missing_slug" };
    }

    await setCatalogPreviewCookie({
      businessId: adminContext.businessId,
      businessSlug
    });

    return {
      ok: true,
      businessId: adminContext.businessId,
      businessSlug
    };
  } catch {
    return { ok: false, error: "unauthorized" };
  }
}

/**
 * Expires the preview cookie for the current admin tenant.
 * Client-sent ids are verified against server context — never trusted as source of truth.
 */
export async function clearCatalogPreviewCookieAction(input: {
  businessId: string;
  businessSlug: string;
}): Promise<ClearCatalogPreviewCookieResult> {
  try {
    const adminContext = await requireAdminPermission("manageProducts");
    const contextSlug = adminContext.businessSlug?.trim().toLowerCase() || null;

    if (!contextSlug) {
      return { ok: false, error: "missing_slug" };
    }

    const inputBusinessId = input.businessId?.trim() ?? "";
    const inputSlug = input.businessSlug?.trim().toLowerCase() ?? "";

    if (
      inputBusinessId !== adminContext.businessId ||
      inputSlug !== contextSlug
    ) {
      return { ok: false, error: "tenant_mismatch" };
    }

    await clearCatalogPreviewCookie({ businessSlug: contextSlug });
    return { ok: true };
  } catch {
    return { ok: false, error: "unauthorized" };
  }
}
