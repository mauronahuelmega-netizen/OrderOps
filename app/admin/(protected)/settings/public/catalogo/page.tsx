import AdminPageHeader from "@/components/admin/admin-page-header";
import AdminPageLayout from "@/components/admin/admin-page-layout";
import PublicCatalogSettingsForm from "@/components/admin/settings/public-catalog-settings-form";
import PublicSettingsNav from "@/components/admin/settings/public-settings-nav";
import Card from "@/components/ui/Card";
import { requireAdminPermission } from "@/lib/admin/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminPublicCatalogSettingsPage() {
  const adminContext = await requireAdminPermission("managePublicSettings");
  const supabase = await createSupabaseServerClient();
  const { data: business } = await supabase
    .from("businesses")
    .select(
      "name, catalog_hero_headline, catalog_hero_badge, catalog_hero_microcopy, cover_image_url, primary_color"
    )
    .eq("id", adminContext.businessId)
    .maybeSingle();

  if (!business) {
    throw new Error("No pudimos cargar la configuración del catálogo.");
  }

  return (
    <AdminPageLayout size="default">
      <AdminPageHeader
        eyebrow="Configuración pública"
        title="Catálogo"
        description="Definí los textos principales del hero del catálogo para orientar mejor a tus clientes."
      />

      <div className="admin-settings-public-page__nav">
        <PublicSettingsNav current="catalogo" />
      </div>

      <Card className="admin-form-card">
        <div className="admin-form-header">
          <h2>{business.name}</h2>
          <p>
            Editá el headline, el badge y el microcopy del hero. La portada y el color principal
            se siguen resolviendo desde la configuración general.
          </p>
        </div>

        <PublicCatalogSettingsForm
          initialValues={{
            headline: business.catalog_hero_headline,
            badge: business.catalog_hero_badge,
            microcopy: business.catalog_hero_microcopy
          }}
        />
      </Card>
    </AdminPageLayout>
  );
}
