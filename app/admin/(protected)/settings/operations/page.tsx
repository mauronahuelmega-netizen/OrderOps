import OperationsSettingsClient from "@/app/admin/(protected)/settings/operations/operations-settings-client";
import { requireAdminContext } from "@/lib/admin/context";

export default async function AdminOperationsSettingsPage() {
  const adminContext = await requireAdminContext();

  return (
    <OperationsSettingsClient
      canManagePublicSettings={adminContext.permissions.canManagePublicSettings}
    />
  );
}
