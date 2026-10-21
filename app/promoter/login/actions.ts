"use server";

import { universalLoginAction, universalLogoutAction } from "@/app/login/actions";

/** Legacy promoter login — delegates to universal login. */
export async function promoterLoginAction(formData: FormData) {
  return universalLoginAction(formData);
}

export async function promoterLogoutAction() {
  return universalLogoutAction();
}
