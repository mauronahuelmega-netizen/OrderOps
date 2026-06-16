import AdminPageHeader from "@/components/admin/admin-page-header";
import AdminPageLayout from "@/components/admin/admin-page-layout";
import PublicSettingsForm from "@/components/admin/settings/public-settings-form";
import PublicSettingsNav from "@/components/admin/settings/public-settings-nav";
import Card from "@/components/ui/Card";
import { requireAdminPermission } from "@/lib/admin/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminPublicLandingSettingsPage() {
  const adminContext = await requireAdminPermission("managePublicSettings");
  const supabase = await createSupabaseServerClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("name, logo_url, description, primary_color, cover_image_url, instagram_url")
    .eq("id", adminContext.businessId)
    .maybeSingle();

  if (!business) {
    throw new Error("No pudimos cargar la configuración pública del negocio.");
  }

  return (
    <AdminPageLayout size="default">
      <AdminPageHeader
        eyebrow="Configuración pública"
        title="Landing"
        description="Gestioná la identidad pública de tu negocio: logo, portada, presentación, color e Instagram."
      />

      <div className="admin-settings-public-page__nav">
        <PublicSettingsNav current="landing" />
      </div>

      <Card className="admin-form-card">
        <div className="admin-form-header">
          <h2>{business.name}</h2>
          <p>Gestioná logo, portada, presentación del negocio, color de marca e Instagram.</p>
        </div>

        <PublicSettingsForm
          businessId={adminContext.businessId}
          initialValues={{
            logoUrl: business.logo_url,
            description: business.description,
            primaryColor: business.primary_color,
            coverImageUrl: business.cover_image_url,
            instagramUrl: business.instagram_url
          }}
        />
      </Card>
    </AdminPageLayout>
  );
}
