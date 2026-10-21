"use server";

import { redirect } from "next/navigation";
import { resolvePostLoginPath } from "@/lib/commercial/auth/resolve-post-login-path";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function loginAction(formData: FormData) {
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");

  const email = typeof emailValue === "string" ? emailValue.trim() : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";

  if (!email || !password) {
    redirect("/admin/login?error=missing_credentials");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error || !data.user) {
    redirect("/admin/login?error=invalid_credentials");
  }

  redirect(await resolvePostLoginPath(supabase, data.user.id));
}
