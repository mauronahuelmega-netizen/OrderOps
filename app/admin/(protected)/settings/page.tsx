import SettingsHubIndex, {
  type SettingsHubIndexSection
} from "@/components/admin/settings/settings-hub-index";
import SettingsShell from "@/components/admin/settings/settings-shell";
import hubStyles from "@/components/admin/settings/settings-shell.module.css";
import { requireAdminPermission } from "@/lib/admin/context";

export default async function AdminSettingsPage() {
  const adminContext = await requireAdminPermission("manageNotifications");
  const { canManagePublicSettings, canManageTeam } = adminContext.permissions;
  const notificationsActive =
    adminContext.profile.newOrderBrowserNotificationsEnabled ||
    adminContext.profile.newOrderSoundEnabled ||
    adminContext.profile.newOrderToastEnabled ||
    adminContext.profile.newOrderHighlightEnabled;

  const sections: SettingsHubIndexSection[] = [];

  if (canManagePublicSettings) {
    sections.push({
      id: "public-presence",
      title: "Presencia pública",
      description: "Landing, catálogo y branding público.",
      items: [
        {
          title: "Presencia pública",
          description: "Landing, catálogo y branding público.",
          href: "/admin/settings/public",
          actionLabel: "Configurar"
        }
      ]
    });
  }

  sections.push({
    id: "operations",
    title: "Operación",
    description: "Ajustá cómo trabaja el negocio durante la toma de pedidos.",
    items: [
      {
        title: "Operaciones",
        description: "Modo de trabajo, reglas y comportamiento del negocio.",
        href: "/admin/settings/operations",
        actionLabel: "Configurar"
      },
      {
        title: "Notificaciones",
        description: "Avisos del navegador, sonido, toast y highlight de pedidos.",
        href: "/admin/settings/notifications",
        actionLabel: "Configurar",
        status: notificationsActive ? "Activas" : "No configuradas"
      }
    ]
  });

  if (canManageTeam) {
    sections.push({
      id: "administration",
      title: "Administración",
      description: "Gestioná accesos y configuración interna.",
      items: [
        {
          title: "Equipo",
          description: "Personas con acceso al panel interno.",
          href: "/admin/settings/team",
          actionLabel: "Administrar"
        }
      ]
    });
  }

  return (
    <SettingsShell
      title="Resumen de configuración"
      description="Ajustá la operación, la presencia pública y el equipo de tu negocio."
      canManagePublicSettings={canManagePublicSettings}
      canManageTeam={canManageTeam}
      anchorViewport
    >
      <p className={hubStyles.hubNavHint}>
        También podés navegar usando el panel lateral.
      </p>
      <SettingsHubIndex sections={sections} />
    </SettingsShell>
  );
}
