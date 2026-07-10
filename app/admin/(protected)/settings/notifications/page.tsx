import NotificationSettingsCard from "@/components/admin/notifications/notification-settings-card";
import SettingsShell from "@/components/admin/settings/settings-shell";
import { requireAdminPermission } from "@/lib/admin/context";

export default async function AdminNotificationsSettingsPage() {
  const adminContext = await requireAdminPermission("manageNotifications");

  return (
    <SettingsShell
      title="Notificaciones"
      description="Configurá cómo el panel avisa los cambios importantes durante la operación."
      canManagePublicSettings={adminContext.permissions.canManagePublicSettings}
      canManageTeam={adminContext.permissions.canManageTeam}
    >
      <NotificationSettingsCard
        initialPreferences={adminContext.profile.notificationPreferences}
        canManage={adminContext.permissions.canManageNotifications}
      />
    </SettingsShell>
  );
}
