import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SuperAdminBusiness = {
  id: string;
  name: string;
  slug: string;
  whatsapp_number: string;
  is_active: boolean;
  created_at: string;
};

export async function getSuperAdminBusinesses(): Promise<SuperAdminBusiness[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("id, name, slug, whatsapp_number, is_active, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load businesses: ${error.message}`);
  }

  return (data ?? []) as SuperAdminBusiness[];
}
