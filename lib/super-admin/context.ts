import { forbidden, redirect } from "next/navigation";
import "server-only";

import { buildLoginRedirect } from "@/lib/auth/build-login-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SuperAdminContext = {
  user: {
    id: string;
    email?: string;
  };
  profile: {
    business_id: string | null;
    role: "super_admin";
  };
};

export async function getSuperAdminContext(): Promise<SuperAdminContext | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "super_admin") {
    return null;
  }

  return {
    user: {
      id: user.id,
      email: user.email
    },
    profile: {
      business_id: profile.business_id,
      role: "super_admin"
    }
  };
}

export async function requireSuperAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(await buildLoginRedirect());
  }

  const context = await getSuperAdminContext();
  if (!context) {
    forbidden();
  }

  return context;
}
