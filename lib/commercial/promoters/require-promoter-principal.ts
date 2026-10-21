import "server-only";

import { forbidden, redirect } from "next/navigation";
import { buildLoginRedirect } from "@/lib/auth/build-login-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  decidePromoterAccess,
  type PromoterAccessDecision
} from "@/lib/commercial/promoters/promoter-access";

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
  const { data } = user ? await supabase.rpc("promoter_session") : { data: null };
  const session = (data ?? null) as PromoterSession | null;
  const decision: PromoterAccessDecision = decidePromoterAccess({
    hasUser: Boolean(user),
    sessionOk: session?.ok === true
  });
  if (decision === "login") redirect(await buildLoginRedirect());
  if (decision === "forbidden" || !session) forbidden();
  return session;
}
