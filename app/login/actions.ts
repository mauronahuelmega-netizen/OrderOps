"use server";

import { redirect } from "next/navigation";
import { listAuthorizedAreas } from "@/lib/auth/list-authorized-areas";
import { LOGIN_PATH, loginPathWith } from "@/lib/auth/login-path";
import { resolveLoginDestination } from "@/lib/auth/resolve-login-destination";
import { sanitizeInternalNext } from "@/lib/auth/safe-next";
import { classifyAuthFailure } from "@/lib/commercial/promoters/promoter-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function loginError(
  code: "missing_credentials" | "invalid_credentials" | "auth_unavailable" | "no_access",
  next?: string | null
): never {
  redirect(loginPathWith({ error: code, next }));
}

export async function universalLoginAction(formData: FormData) {
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  const nextValue = formData.get("next");

  const email = typeof emailValue === "string" ? emailValue.trim() : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";
  const next = sanitizeInternalNext(typeof nextValue === "string" ? nextValue : null);

  if (!email || !password) {
    loginError("missing_credentials", next);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error || !data.user) {
    loginError(error ? classifyAuthFailure(error) : "invalid_credentials", next);
  }

  const areas = await listAuthorizedAreas(supabase, data.user.id);
  const destination = resolveLoginDestination({ areas, next });

  if (destination.kind === "none") {
    await supabase.auth.signOut();
    loginError("no_access", next);
  }

  if (destination.kind === "choose") {
    redirect(loginPathWith({ choose: true, next }));
  }

  redirect(destination.href);
}

export async function universalLogoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect(LOGIN_PATH);
}

export async function chooseAreaAction(formData: FormData) {
  const hrefValue = formData.get("href");
  const href = typeof hrefValue === "string" ? hrefValue : "";

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(loginPathWith({ error: "session" }));
  }

  const areas = await listAuthorizedAreas(supabase, user.id);
  if (areas.length === 0) {
    await supabase.auth.signOut();
    redirect(loginPathWith({ error: "no_access" }));
  }

  const match = areas.find((area) => area.href === href);
  if (!match) {
    redirect(loginPathWith({ choose: true }));
  }

  redirect(match.href);
}
