import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminCategory = {
  id: string;
  name: string;
  position: number | null;
  created_at: string;
};

export async function getAdminCategories(): Promise<AdminCategory[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, position, created_at")
    .order("position", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load categories: ${error.message}`);
  }

  return (data ?? []) as AdminCategory[];
}
