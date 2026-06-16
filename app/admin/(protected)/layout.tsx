import "../../../components/admin/admin-shell.css";
import "../../../components/admin/admin-header.css";
import "../../../components/admin/admin-mobile-drawer.css";
import "../../../components/admin/admin-page-layout.css";
import "../../../components/admin/admin-page-header.css";
import "../../../components/admin/admin-toast.css";
import "../../../components/admin/settings/public-settings.css";
import AdminToastProvider from "@/components/admin/admin-toast-provider";
import AdminShell from "@/components/admin/admin-shell";
import { requireAdminContext } from "@/lib/admin/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProtectedAdminLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adminContext = await requireAdminContext();
  const supabase = await createSupabaseServerClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("name, logo_url")
    .eq("id", adminContext.businessId)
    .maybeSingle();

  return (
    <AdminToastProvider>
      <AdminShell
        businessId={adminContext.businessId}
        userLabel={adminContext.user.email ?? adminContext.user.id}
        businessBrand={{
          name: business?.name ?? null,
          logoUrl: business?.logo_url ?? null
        }}
        role={adminContext.profile.role}
      >
        {children}
      </AdminShell>
    </AdminToastProvider>
  );
}
