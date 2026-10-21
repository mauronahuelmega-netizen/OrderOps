"use server";

import { universalLogoutAction } from "@/app/login/actions";

export async function logoutAction() {
  return universalLogoutAction();
}
