import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type SuperAdminUser = {
  id: string;
  email: string;
  business_id: string | null;
  business_name: string | null;
  role: "admin" | "super_admin";
  is_disabled: boolean;
};

export async function getSuperAdminUsers(): Promise<SuperAdminUser[]> {
  const supabase = createSupabaseServiceClient();

  const [{ data: usersData, error: usersError }, { data: profiles, error: profilesError }] =
    await Promise.all([
      supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      supabase
        .from("profiles")
        .select(
          `
            id,
            business_id,
            role,
            businesses (
              name
            )
          `
        )
    ]);

  if (usersError) {
    throw new Error(`Failed to load auth users: ${usersError.message}`);
  }

  if (profilesError) {
    throw new Error(`Failed to load profiles: ${profilesError.message}`);
  }

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [
      profile.id,
      {
        business_id: profile.business_id as string | null,
        role: profile.role as "admin" | "super_admin",
        business_name: Array.isArray(profile.businesses)
          ? (profile.businesses[0]?.name ?? null)
          : ((profile.businesses as { name?: string } | null)?.name ?? null)
      }
    ])
  );

  return (usersData.users ?? [])
    .map((user) => {
      const profile = profileMap.get(user.id);

      if (!profile) {
        return null;
      }

      return {
        id: user.id,
        email: user.email ?? "",
        business_id: profile.business_id,
        business_name: profile.business_name,
        role: profile.role,
        is_disabled: Boolean(user.banned_until)
      } satisfies SuperAdminUser;
    })
    .filter((user): user is SuperAdminUser => Boolean(user));
}

export async function getSuperAdminAdminUsers() {
  const users = await getSuperAdminUsers();
  return users.filter((user) => user.role === "admin");
}
