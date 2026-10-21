import "server-only";

import { forbidden, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CommercialSession = {
  ok?: boolean;
  kind?: string;
  roles?: string[];
};

export async function requireCommercialPrincipal(): Promise<CommercialSession> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data } = await supabase.rpc("commercial_session");
  const session = (data ?? null) as CommercialSession | null;
  const roles = Array.isArray(session?.roles) ? session.roles : [];
  const allowed = session?.ok === true && session.kind === "internal" && (roles.includes("commercial") || roles.includes("superadmin"));
  if (!allowed) forbidden();
  return session ?? { ok: false };
}
