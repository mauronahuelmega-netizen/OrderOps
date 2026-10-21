"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  classifyAuthFailure,
  PROMOTER_LOGIN_PATH,
  safePromoterNext
} from "@/lib/commercial/promoters/promoter-access";

function loginError(
  code: "missing_credentials" | "invalid_credentials" | "not_promoter" | "auth_unavailable"
): never {
  redirect(`${PROMOTER_LOGIN_PATH}?error=${code}`);
}

export async function promoterLoginAction(formData: FormData) {
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  const email = typeof emailValue === "string" ? emailValue.trim() : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";

  if (!email || !password) loginError("missing_credentials");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) loginError(classifyAuthFailure(error));

  const { data } = await supabase.rpc("promoter_session");
  const session = (data ?? null) as { ok?: boolean } | null;
  if (session?.ok !== true) loginError("not_promoter");

  const nextValue = formData.get("next");
  redirect(safePromoterNext(typeof nextValue === "string" ? nextValue : null));
}

export async function promoterLogoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect(PROMOTER_LOGIN_PATH);
}
