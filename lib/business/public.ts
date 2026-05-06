import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PublicBusiness = {
  cover_image_url: string | null;
  description: string | null;
  id: string;
  instagram_url: string | null;
  is_active: boolean;
  name: string;
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
      "id, name, slug, whatsapp_number, logo_url, description, primary_color, cover_image_url, instagram_url, is_active"
    )
    .eq("slug", normalizedSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return data;
}

export async function requirePublicBusinessBySlug(slug: string): Promise<PublicBusiness> {
  const business = await getPublicBusinessBySlug(slug);

  if (!business) {
    notFound();
  }

  return business;
}
