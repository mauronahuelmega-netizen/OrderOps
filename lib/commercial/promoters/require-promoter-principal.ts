import "server-only";

import { forbidden, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PromoterSession = {
  ok?: boolean;
  promoter_id?: string;
  status?: string;
  legal_name?: string;
  public_code?: string;
  can_operate?: boolean;
};

export async function requirePromoterPrincipal(): Promise<PromoterSession> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data } = await supabase.rpc("promoter_session");
  const session = (data ?? null) as PromoterSession | null;
  if (!session || session.ok !== true) forbidden();
  return session;
}
