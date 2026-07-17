"use server";

import { getRequestPublicBusiness } from "@/app/b/[slug]/get-public-business";
import { isProductCustomizationEnabled } from "@/lib/product-customization/flags";
import { getPublicProductCustomizationConfig } from "@/lib/product-customization/public";
import type { PublicProductCustomizationConfig } from "@/lib/product-customization/public-shared";

export type GetPublicProductCustomizationConfigResult =
  | {
      ok: true;
      enabled: false;
      config: null;
    }
  | {
      ok: true;
      enabled: true;
      config: PublicProductCustomizationConfig;
    }
  | {
      ok: false;
      enabled: boolean;
      error: string;
    };

export async function getPublicProductCustomizationConfigAction(params: {
  slug: string;
  productId: string;
}): Promise<GetPublicProductCustomizationConfigResult> {
  const slug = params.slug.trim();
  const productId = params.productId.trim();

  if (!slug || !productId) {
    return { ok: false, enabled: false, error: "Faltan datos del producto." };
  }

  try {
    const business = await getRequestPublicBusiness(slug);
    const enabled = await isProductCustomizationEnabled(business.id);

    if (!enabled) {
      return { ok: true, enabled: false, config: null };
    }

    const config = await getPublicProductCustomizationConfig({
      businessId: business.id,
      productId
    });

    if (!config) {
      return {
        ok: false,
        enabled: true,
        error: "No encontramos personalización para este producto."
      };
    }

    return { ok: true, enabled: true, config };
  } catch (error) {
    console.error("[product-customization] Failed to load public modal config", {
      slug,
      productId,
      message: error instanceof Error ? error.message : "unknown"
    });

    return {
      ok: false,
      enabled: false,
      error: "No pudimos cargar la personalización. Probá de nuevo."
    };
  }
}
