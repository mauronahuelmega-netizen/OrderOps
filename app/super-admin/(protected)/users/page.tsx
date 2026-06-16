import UserManagementPanel from "@/components/super-admin/user-management-panel";
import { getSuperAdminBusinesses } from "@/lib/super-admin/businesses";
import { requireSuperAdmin } from "@/lib/super-admin/context";
import { getSuperAdminAdminUsers } from "@/lib/super-admin/users";

export default async function SuperAdminUsersPage() {
  const [context, businesses, users] = await Promise.all([
    requireSuperAdmin(),
    getSuperAdminBusinesses(),
    getSuperAdminAdminUsers()
  ]);

  return (
    <section className="admin-form-card super-admin-route-section">
      <div className="admin-form-header">
        <h2>Usuarios del negocio</h2>
        <p>Se muestran usuarios del negocio. Los super admin quedan fuera de esta vista.</p>
      </div>

      {users.length > 0 ? (
        <UserManagementPanel
          businesses={businesses}
          users={users}
          currentUserId={context.user.id}
        />
      ) : (
        <div className="admin-empty-state">
          <h2>No hay usuarios del negocio todavia</h2>
          <p>Crea un cliente o agrega un usuario para empezar a asignar roles operativos.</p>
        </div>
      )}
    </section>
  );
}
