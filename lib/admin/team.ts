import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { ProfileRole } from "@/types/database";

export type ManageableTeamRole = "manager" | "operator" | "viewer";

export type BusinessTeamMember = {
  id: string;
  email: string;
  role: ProfileRole;
  business_id: string | null;
  created_at: string;
};

const MANAGEABLE_TEAM_ROLES = ["manager", "operator", "viewer"] as const;

const TEAM_ROLE_ORDER: Record<ProfileRole, number> = {
  owner: 0,
  admin: 1,
  manager: 2,
  operator: 3,
  viewer: 4,
  super_admin: 5
};

export function isManageableTeamRole(role: string): role is ManageableTeamRole {
  return MANAGEABLE_TEAM_ROLES.includes(role as ManageableTeamRole);
}

export function getManageableTeamRoles() {
  return [...MANAGEABLE_TEAM_ROLES];
}

export async function getBusinessTeamMembers(
  businessId: string
): Promise<BusinessTeamMember[]> {
  const serviceSupabase = createSupabaseServiceClient();
  const [{ data: profiles, error: profilesError }, { data: usersData, error: usersError }] =
    await Promise.all([
      serviceSupabase
        .from("profiles")
        .select("id, business_id, role, created_at")
        .eq("business_id", businessId),
      serviceSupabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
    ]);

  if (profilesError) {
    throw new Error(profilesError.message || "No pudimos cargar el equipo del negocio.");
  }

  if (usersError) {
    throw new Error(usersError.message || "No pudimos cargar los usuarios autenticados.");
  }

  const emailByUserId = new Map(
    (usersData.users ?? []).map((user) => [user.id, normalizeEmail(user.email)] as const)
  );

  return (profiles ?? [])
    .map((profile) => ({
      id: profile.id,
      email: emailByUserId.get(profile.id) ?? "",
      role: profile.role as ProfileRole,
      business_id: profile.business_id,
      created_at: profile.created_at
    }))
    .sort((a, b) => {
      const roleDelta = TEAM_ROLE_ORDER[a.role] - TEAM_ROLE_ORDER[b.role];

      if (roleDelta !== 0) {
        return roleDelta;
      }

      return a.created_at.localeCompare(b.created_at);
    });
}

export async function createBusinessTeamMember({
  businessId,
  email,
  password,
  role
}: {
  businessId: string;
  email: string;
  password: string;
  role: ManageableTeamRole;
}) {
  if (!businessId) {
    throw new Error("Falta identificar el negocio.");
  }

  if (!isValidEmail(email)) {
    throw new Error("Ingresa un email valido.");
  }

  if (password.trim().length < 8) {
    throw new Error("La contrasena temporal debe tener al menos 8 caracteres.");
  }

  if (!isManageableTeamRole(role)) {
    throw new Error("Rol invalido para esta fase.");
  }

  const serviceSupabase = createSupabaseServiceClient();
  const normalizedEmail = normalizeEmail(email);
  const { data, error } = await serviceSupabase.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true
  });

  if (error || !data.user) {
    if (error?.message?.toLowerCase().includes("already")) {
      throw new Error("Ya existe un usuario con ese email.");
    }

    throw new Error("No pudimos crear el usuario interno.");
  }

  const { error: profileError } = await serviceSupabase.from("profiles").insert({
    id: data.user.id,
    business_id: businessId,
    role
  });

  if (profileError) {
    await serviceSupabase.auth.admin.deleteUser(data.user.id);
    throw new Error(profileError.message || "No pudimos vincular el usuario al negocio.");
  }
}

export async function updateBusinessTeamMemberRole({
  businessId,
  actorUserId,
  targetUserId,
  nextRole
}: {
  businessId: string;
  actorUserId: string;
  targetUserId: string;
  nextRole: ManageableTeamRole;
}) {
  if (!businessId) {
    throw new Error("Falta identificar el negocio.");
  }

  if (!targetUserId) {
    throw new Error("Falta identificar el usuario.");
  }

  if (actorUserId === targetUserId) {
    throw new Error("No podes bajarte el rol desde esta pantalla.");
  }

  if (!isManageableTeamRole(nextRole)) {
    throw new Error("Rol invalido para esta fase.");
  }

  const serviceSupabase = createSupabaseServiceClient();
  const { data: targetProfile, error: targetProfileError } = await serviceSupabase
    .from("profiles")
    .select("id, business_id, role")
    .eq("id", targetUserId)
    .maybeSingle();

  if (targetProfileError) {
    throw new Error(targetProfileError.message || "No pudimos cargar el usuario.");
  }

  if (!targetProfile || targetProfile.business_id !== businessId) {
    throw new Error("Ese usuario no pertenece a tu negocio.");
  }

  if (["owner", "admin", "super_admin"].includes(targetProfile.role)) {
    throw new Error("Ese rol no se puede editar desde Equipo.");
  }

  if (targetProfile.role === nextRole) {
    return;
  }

  const { error: updateError } = await serviceSupabase
    .from("profiles")
    .update({ role: nextRole })
    .eq("id", targetUserId)
    .eq("business_id", businessId);

  if (updateError) {
    throw new Error(updateError.message || "No pudimos actualizar el rol del usuario.");
  }
}

function normalizeEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}
