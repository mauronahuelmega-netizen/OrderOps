import PublicPresenceEditorShell from "@/components/admin/settings/public-presence-editor-shell";
import shellStyles from "@/components/admin/settings/public-presence-editor-shell.module.css";
import PublicSettingsForm from "@/components/admin/settings/public-settings-form";
import SettingsShell from "@/components/admin/settings/settings-shell";
import { requireAdminPermission } from "@/lib/admin/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminPublicLandingSettingsPage() {
  const adminContext = await requireAdminPermission("managePublicSettings");
  const supabase = await createSupabaseServerClient();
  const { data: business } = await supabase
    .from("businesses")
    .select(
      "name, logo_url, description, primary_color, cover_image_url, instagram_url, slug, catalog_hero_headline, catalog_hero_badge, catalog_hero_microcopy"
    )
    .eq("id", adminContext.businessId)
    .maybeSingle();

  if (!business) {
    throw new Error("No pudimos cargar la configuración pública del negocio.");
  }

  const publicLandingHref = business.slug ? `/b/${business.slug}` : null;
  const publicCatalogHref = business.slug ? `/b/${business.slug}/catalogo` : null;

  return (
    <SettingsShell
      title="Presencia pública"
      description="Configurá cómo se ve tu negocio en los canales públicos."
      canManagePublicSettings
      canManageTeam={adminContext.permissions.canManageTeam}
    >
      <PublicPresenceEditorShell
        activeSection="landing"
        title="Landing pública"
        description="Gestioná logo, portada, descripción, color de marca e Instagram."
        helperText="Estos ajustes forman parte de tu Presencia pública."
        actions={
          publicLandingHref ? (
            <a
              href={publicLandingHref}
              target="_blank"
              rel="noopener noreferrer"
              className={shellStyles.externalLink}
            >
              Ver landing pública
            </a>
          ) : null
        }
      >
        <PublicSettingsForm
          businessId={adminContext.businessId}
          businessName={business.name}
          publicLandingHref={publicLandingHref}
          publicCatalogHref={publicCatalogHref}
          initialValues={{
            logoUrl: business.logo_url,
            description: business.description,
            primaryColor: business.primary_color,
            coverImageUrl: business.cover_image_url,
            instagramUrl: business.instagram_url
          }}
          publishedCatalog={{
            headline: business.catalog_hero_headline,
            badge: business.catalog_hero_badge,
            microcopy: business.catalog_hero_microcopy
          }}
          publication={{
            slug: business.slug,
            publicUrl: publicLandingHref
          }}
        />
      </PublicPresenceEditorShell>
    </SettingsShell>
  );
}
