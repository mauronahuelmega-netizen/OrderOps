import LogoutButton from "@/components/admin/logout-button";
import AdminNavLinks from "@/components/admin/admin-nav-links";
import { requireAdminContext } from "@/lib/admin/context";

export default async function ProtectedAdminLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adminContext = await requireAdminContext();

  return (
    <main className="admin-page">
      <header className="admin-shell-header">
        <div className="admin-shell-brand">
        <div>
          <p className="catalog-eyebrow">OrderOps</p>
          <h1>Panel de administración</h1>
        </div>
          <div className="admin-header-meta">
            <span>{adminContext.user.email ?? adminContext.user.id}</span>
            <LogoutButton />
          </div>
        </div>

        <AdminNavLinks />
      </header>

      {children}
    </main>
  );
}
