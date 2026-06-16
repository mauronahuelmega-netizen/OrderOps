import Link from "next/link";
import AdminPageHeader from "@/components/admin/admin-page-header";
import AdminPageLayout from "@/components/admin/admin-page-layout";
import NotificationSettingsCard from "@/components/admin/notifications/notification-settings-card";
import PublicSettingsNav from "@/components/admin/settings/public-settings-nav";
import Card from "@/components/ui/Card";
import { requireAdminPermission } from "@/lib/admin/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminPublicSettingsOverviewPage() {
  const adminContext = await requireAdminPermission("manageNotifications");
  const canManagePublicSettings = adminContext.permissions.canManagePublicSettings;
  let businessName: string | null = null;

  if (canManagePublicSettings) {
    const supabase = await createSupabaseServerClient();
    const { data: business } = await supabase
      .from("businesses")
      .select("name")
      .eq("id", adminContext.businessId)
      .maybeSingle();

    if (!business) {
      throw new Error("No pudimos cargar la configuracion del negocio.");
    }

    businessName = business.name;
  }

  return (
    <AdminPageLayout size="default">
      <AdminPageHeader
        eyebrow="Configuracion"
        title="Resumen"
        description="Ajusta la presencia publica del negocio y prepara los avisos operativos del navegador."
      />

      {canManagePublicSettings ? (
        <div className="admin-settings-public-page__nav">
          <PublicSettingsNav current="overview" />
        </div>
      ) : null}

      <div className="admin-settings-public-overview">
        <NotificationSettingsCard
          initialPreferences={adminContext.profile.notificationPreferences}
          canManage={adminContext.permissions.canManageNotifications}
        />

        {canManagePublicSettings && businessName ? (
          <>
            <Card className="admin-form-card admin-settings-public-overview-card">
              <div className="admin-form-header">
                <h2>Landing publica</h2>
                <p>
                  Logo, portada, descripcion general, color principal e Instagram de{" "}
                  {businessName}.
                </p>
              </div>

              <Link
                href="/admin/settings/public/landing"
                className="admin-secondary-link admin-settings-public-overview-link"
              >
                Editar landing
              </Link>
            </Card>

            <Card className="admin-form-card admin-settings-public-overview-card">
              <div className="admin-form-header">
                <h2>Catalogo publico</h2>
                <p>
                  Headline, badge y microcopy especificos del hero del catalogo, sin mezclarlo con
                  la descripcion general.
                </p>
              </div>

              <Link
                href="/admin/settings/public/catalogo"
                className="admin-secondary-link admin-settings-public-overview-link"
              >
                Editar catalogo
              </Link>
            </Card>
          </>
        ) : null}
      </div>
    </AdminPageLayout>
  );
}
