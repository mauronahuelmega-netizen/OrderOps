"use server";

import { universalLoginAction } from "@/app/login/actions";

/** Legacy admin login action — delegates to universal login. */
export async function loginAction(formData: FormData) {
  return universalLoginAction(formData);
}
