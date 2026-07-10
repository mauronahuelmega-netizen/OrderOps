import PublicPresenceSummary from "@/components/admin/settings/public-presence-summary";
import SettingsShell from "@/components/admin/settings/settings-shell";
import { requireAdminPermission } from "@/lib/admin/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminPublicSettingsOverviewPage() {
  const adminContext = await requireAdminPermission("manageNotifications");
  const canManagePublicSettings = adminContext.permissions.canManagePublicSettings;

  if (!canManagePublicSettings) {
    return (
      <SettingsShell
        title="Presencia pública"
        description="Revisá cómo está configurada la presencia online que ven tus clientes."
        canManagePublicSettings={canManagePublicSettings}
        canManageTeam={adminContext.permissions.canManageTeam}
      >
        <p>No tenés permiso para editar la presencia pública de este negocio.</p>
      </SettingsShell>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: business } = await supabase
    .from("businesses")
    .select(
      "slug, logo_url, description, primary_color, cover_image_url, instagram_url, catalog_hero_headline, catalog_hero_badge, catalog_hero_microcopy"
    )
    .eq("id", adminContext.businessId)
    .maybeSingle();

  if (!business) {
    throw new Error("No pudimos cargar la configuración de presencia pública.");
  }

  const publicLandingHref = business.slug ? `/b/${business.slug}` : null;
  const publicCatalogHref = business.slug ? `/b/${business.slug}/catalogo` : null;

  return (
    <SettingsShell
      title="Presencia pública"
      description="Revisá cómo está configurada la presencia online que ven tus clientes."
      canManagePublicSettings={canManagePublicSettings}
      canManageTeam={adminContext.permissions.canManageTeam}
    >
      <PublicPresenceSummary
        publicLandingHref={publicLandingHref}
        publicCatalogHref={publicCatalogHref}
        identity={{
          logoUrl: business.logo_url,
          coverImageUrl: business.cover_image_url,
          primaryColor: business.primary_color
        }}
        landing={{
          description: business.description,
          instagramUrl: business.instagram_url
        }}
        catalog={{
          headline: business.catalog_hero_headline,
          badge: business.catalog_hero_badge,
          microcopy: business.catalog_hero_microcopy
        }}
        publication={{
          slug: business.slug,
          publicUrl: publicLandingHref
        }}
      />
    </SettingsShell>
  );
}
