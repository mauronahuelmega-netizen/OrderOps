import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PublicBusiness = {
  id: string;
  name: string;
  slug: string;
  whatsapp_number: string;
  logo_url: string | null;
};

export async function getPublicBusinessBySlug(slug: string): Promise<PublicBusiness | null> {
  const normalizedSlug = slug.trim().toLowerCase();

  if (!normalizedSlug) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("businesses")
    .select("id, name, slug, whatsapp_number, logo_url")
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
