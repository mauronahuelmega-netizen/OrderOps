import "server-only";

import { notFound } from "next/navigation";
import { getCachedPublicBusinessStable } from "@/lib/catalog/public-cached-data";
import { getFreshPublicOrderingStatus } from "@/lib/store-sessions/public.server";

export type PublicBusiness = {
  catalog_hero_badge: string | null;
  catalog_hero_headline: string | null;
  catalog_hero_microcopy: string | null;
  cover_image_url: string | null;
  description: string | null;
  id: string;
  inactive_working_days: number[];
  instagram_url: string | null;
  is_active: boolean;
  name: string;
  /**
   * Live order acceptance (open session + on_demand), NOT the raw settings column.
   * Always overlaid fresh via getFreshPublicOrderingStatus.
   */
  on_demand_mode_active: boolean;
  /** Fail-closed flag from business_settings (cacheable stable). */
  product_customization_enabled: boolean;
  scheduled_cutoff_time: string;
  scheduled_max_days_in_advance: number;
  scheduled_min_lead_time_hours: number;
  scheduled_mode_active: boolean;
  primary_color: string | null;
  slug: string;
  whatsapp_number: string;
  logo_url: string | null;
};

/**
 * Public business by slug: stable branding/settings from cache + fresh acceptance.
 */
export async function getPublicBusinessBySlug(slug: string): Promise<PublicBusiness | null> {
  const stable = await getCachedPublicBusinessStable(slug);
  if (!stable) {
    return null;
  }

  const acceptingOrders = await getFreshPublicOrderingStatus(stable.id);

  return {
    ...stable,
    on_demand_mode_active: acceptingOrders
  };
}

export async function requirePublicBusinessBySlug(slug: string): Promise<PublicBusiness> {
  const business = await getPublicBusinessBySlug(slug);

  if (!business) {
    notFound();
  }

  return business;
}
