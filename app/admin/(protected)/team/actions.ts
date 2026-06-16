"use server";

import { revalidatePath } from "next/cache";
import { getActionErrorMessage, logActionFailure } from "@/lib/admin/action-errors";
import { requireAdminPermission } from "@/lib/admin/context";
import {
  createBusinessTeamMember,
  isManageableTeamRole,
  updateBusinessTeamMemberRole
} from "@/lib/admin/team";

type TeamActionState = {
  error?: string;
  success?: boolean;
};

export async function createTeamMemberAction(
  _prevState: TeamActionState,
  formData: FormData
) {
  const adminContext = await requireAdminPermission("manageTeam");
  const email = getTrimmedString(formData.get("email")).toLowerCase();
  const password = getTrimmedString(formData.get("password"));
  const role = getTrimmedString(formData.get("role"));

  if (!email) {
    return { error: "Ingresa un email." };
  }

  if (!password) {
    return { error: "Ingresa una contrasena temporal." };
  }

  if (!isManageableTeamRole(role)) {
    return { error: "Solo podes crear manager, operator o viewer." };
  }

  try {
    await createBusinessTeamMember({
      businessId: adminContext.businessId,
      email,
      password,
      role
    });
  } catch (error) {
    logActionFailure("team.createMember", error, {
      businessId: adminContext.businessId,
      email,
      role
    });
    return { error: getActionErrorMessage(error, "No pudimos crear el usuario interno.") };
  }

  revalidatePath("/admin/team");
  return { success: true };
}

export async function updateTeamMemberRoleAction(
  _prevState: TeamActionState,
  formData: FormData
) {
  const adminContext = await requireAdminPermission("manageTeam");
  const userId = getTrimmedString(formData.get("user_id"));
  const role = getTrimmedString(formData.get("role"));

  if (!userId) {
    return { error: "Falta identificar el usuario." };
  }

  if (!isManageableTeamRole(role)) {
    return { error: "Solo podes asignar manager, operator o viewer." };
  }

  try {
    await updateBusinessTeamMemberRole({
      businessId: adminContext.businessId,
      actorUserId: adminContext.user.id,
      targetUserId: userId,
      nextRole: role
    });
  } catch (error) {
    logActionFailure("team.updateRole", error, {
      businessId: adminContext.businessId,
      userId,
      role
    });
    return { error: getActionErrorMessage(error, "No pudimos actualizar el rol.") };
  }

  revalidatePath("/admin/team");
  return { success: true };
}

function getTrimmedString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}
