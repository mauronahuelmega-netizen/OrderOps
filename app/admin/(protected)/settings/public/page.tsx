import Card from "@/components/ui/Card";
import PublicSettingsForm from "@/components/admin/settings/public-settings-form";
import { requireAdminContext } from "@/lib/admin/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminPublicSettingsPage() {
  const adminContext = await requireAdminContext();
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
    <div className="admin-settings-public-page">
      <header className="admin-section-header">
        <div>
          <p className="catalog-eyebrow">Mi negocio</p>
          <h1>Configuración pública</h1>
          <p className="admin-section-copy">
            Definí la información básica que se mostrará en la landing y el catálogo.
          </p>
        </div>
      </header>

      <Card className="admin-form-card">
        <div className="admin-form-header">
          <h2>{business.name}</h2>
          <p>
            Editá la descripción pública, el color principal, Instagram y la URL de
            portada.
          </p>
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
    </div>
  );
}
