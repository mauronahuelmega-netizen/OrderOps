import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AdminContext = {
  businessId: string;
  businessSlug: string | null;
  user: {
    id: string;
    email?: string;
  };
};

export async function getAdminContext(): Promise<AdminContext | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `
        business_id,
        businesses (
          slug
        )
      `
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.business_id) {
    return null;
  }

  return {
    businessId: profile.business_id,
    businessSlug: Array.isArray(profile.businesses)
      ? (profile.businesses[0]?.slug ?? null)
      : ((profile.businesses as { slug?: string } | null)?.slug ?? null),
    user: {
      id: user.id,
      email: user.email
    }
  };
}

export async function requireAdminContext(): Promise<AdminContext> {
  const adminContext = await getAdminContext();

  if (!adminContext) {
    redirect("/admin/login");
  }

  return adminContext;
}
