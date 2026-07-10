import OperationsSettingsClient from "@/app/admin/(protected)/settings/operations/operations-settings-client";
import { requireAdminPermission } from "@/lib/admin/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminOperationsSettingsPage() {
  const adminContext = await requireAdminPermission("manageNotifications");
  const supabase = await createSupabaseServerClient();
  const { data: initialSettings } = await supabase
    .from("business_settings")
    .select("*")
    .eq("business_id", adminContext.businessId)
    .maybeSingle();

  return (
    <OperationsSettingsClient
      initialSettings={initialSettings}
      canManagePublicSettings={adminContext.permissions.canManagePublicSettings}
      canManageTeam={adminContext.permissions.canManageTeam}
    />
  );
}
