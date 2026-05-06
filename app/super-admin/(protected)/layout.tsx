import LogoutButton from "@/components/admin/logout-button";
import SuperAdminNav from "@/components/super-admin/super-admin-nav";
import { requireSuperAdmin } from "@/lib/super-admin/context";

export default async function ProtectedSuperAdminLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = await requireSuperAdmin();

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="catalog-eyebrow">Super Admin</p>
          <h1>Control general</h1>
        </div>
        <div className="admin-header-meta">
          <span>{context.user.email ?? context.user.id}</span>
          <LogoutButton />
        </div>
      </header>

      <div className="super-admin-shell">
        <SuperAdminNav />
        {children}
      </div>
    </main>
  );
}
