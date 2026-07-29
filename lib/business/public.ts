import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import {
  DEFAULT_SCHEDULED_DELIVERY_RULES,
  normalizeScheduledDeliveryRules
} from "@/lib/business/scheduled-delivery-rules";
import { isBusinessAcceptingPublicOrders } from "@/lib/store-sessions/public.server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

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
  on_demand_mode_active: boolean;
  /** Fail-closed flag from business_settings (same request as other settings). */
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

export async function getPublicBusinessBySlug(slug: string): Promise<PublicBusiness | null> {
  noStore();

  const normalizedSlug = slug.trim().toLowerCase();

  if (!normalizedSlug) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("businesses")
    .select(
      "id, name, slug, whatsapp_number, logo_url, description, primary_color, cover_image_url, instagram_url, catalog_hero_headline, catalog_hero_badge, catalog_hero_microcopy, is_active"
    )
    .eq("slug", normalizedSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (!data) {
    return null;
  }

  const serviceSupabase = createSupabaseServiceClient();
  const { data: settings, error: settingsError } = await serviceSupabase
    .from("business_settings")
    .select(
      "on_demand_mode_active, scheduled_mode_active, scheduled_min_lead_time_hours, scheduled_max_days_in_advance, scheduled_cutoff_time, inactive_working_days, product_customization_enabled"
    )
    .eq("business_id", data.id)
    .maybeSingle();

  if (settingsError) {
    console.error("[public-business] settings lookup failed", {
      businessId: data.id,
      code: settingsError.code,
      message: settingsError.message
    });
  }

  const acceptingOrders = await isBusinessAcceptingPublicOrders(data.id, {
    onDemandModeActive: settings?.on_demand_mode_active ?? false
  });
  const normalizedRules = normalizeScheduledDeliveryRules(settings);

  return {
    ...data,
    on_demand_mode_active: acceptingOrders,
    product_customization_enabled: settings?.product_customization_enabled === true,
    scheduled_mode_active: settings?.scheduled_mode_active ?? false,
    scheduled_min_lead_time_hours:
      normalizedRules.scheduled_min_lead_time_hours ??
      DEFAULT_SCHEDULED_DELIVERY_RULES.scheduled_min_lead_time_hours,
    scheduled_max_days_in_advance:
      normalizedRules.scheduled_max_days_in_advance ??
      DEFAULT_SCHEDULED_DELIVERY_RULES.scheduled_max_days_in_advance,
    scheduled_cutoff_time:
      normalizedRules.scheduled_cutoff_time ??
      DEFAULT_SCHEDULED_DELIVERY_RULES.scheduled_cutoff_time,
    inactive_working_days:
      normalizedRules.inactive_working_days ??
      DEFAULT_SCHEDULED_DELIVERY_RULES.inactive_working_days
  };
}

export async function requirePublicBusinessBySlug(slug: string): Promise<PublicBusiness> {
  const business = await getPublicBusinessBySlug(slug);

  if (!business) {
    notFound();
  }

  return business;
}
