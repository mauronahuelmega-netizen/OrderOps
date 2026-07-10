import PublicCatalogSettingsForm from "@/components/admin/settings/public-catalog-settings-form";
import PublicPresenceEditorShell from "@/components/admin/settings/public-presence-editor-shell";
import shellStyles from "@/components/admin/settings/public-presence-editor-shell.module.css";
import SettingsShell from "@/components/admin/settings/settings-shell";
import { requireAdminPermission } from "@/lib/admin/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminPublicCatalogSettingsPage() {
  const adminContext = await requireAdminPermission("managePublicSettings");
  const supabase = await createSupabaseServerClient();
  const { data: business } = await supabase
    .from("businesses")
    .select(
      "name, slug, logo_url, description, instagram_url, primary_color, cover_image_url, catalog_hero_headline, catalog_hero_badge, catalog_hero_microcopy"
    )
    .eq("id", adminContext.businessId)
    .maybeSingle();

  if (!business) {
    throw new Error("No pudimos cargar la configuración del catálogo.");
  }

  const publicCatalogHref = business.slug ? `/b/${business.slug}/catalogo` : null;
  const publicLandingHref = business.slug ? `/b/${business.slug}` : null;

  return (
    <SettingsShell
      title="Presencia pública"
      description="Configurá cómo se ve tu negocio en los canales públicos."
      canManagePublicSettings
      canManageTeam={adminContext.permissions.canManageTeam}
    >
      <PublicPresenceEditorShell
        activeSection="catalog"
        title="Catálogo público"
        description="Editá el headline, el badge y el microcopy del hero del catálogo."
        helperText="Estos ajustes forman parte de tu Presencia pública."
        actions={
          publicCatalogHref ? (
            <a
              href={publicCatalogHref}
              target="_blank"
              rel="noopener noreferrer"
              className={shellStyles.externalLink}
            >
              Ver catálogo público
            </a>
          ) : null
        }
      >
        <PublicCatalogSettingsForm
          businessName={business.name}
          publicLandingHref={publicLandingHref}
          initialValues={{
            headline: business.catalog_hero_headline,
            badge: business.catalog_hero_badge,
            microcopy: business.catalog_hero_microcopy
          }}
          publishedPresence={{
            logoUrl: business.logo_url,
            coverImageUrl: business.cover_image_url,
            primaryColor: business.primary_color,
            description: business.description,
            instagramUrl: business.instagram_url
          }}
          publication={{
            slug: business.slug,
            publicUrl: publicCatalogHref
          }}
        />
      </PublicPresenceEditorShell>
    </SettingsShell>
  );
}
