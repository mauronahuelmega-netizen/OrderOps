import BusinessManagementPanel from "@/components/super-admin/business-management-panel";
import { getSuperAdminBusinesses } from "@/lib/super-admin/businesses";

export default async function SuperAdminBusinessesPage() {
  const businesses = await getSuperAdminBusinesses();

  return (
    <section className="admin-form-card super-admin-route-section">
      <div className="admin-form-header">
        <h2>Negocios</h2>
        <p>Gestiona negocios existentes sin sobrecargar la vista principal.</p>
      </div>

      {businesses.length > 0 ? (
        <BusinessManagementPanel businesses={businesses} />
      ) : (
        <div className="admin-empty-state">
          <h2>No hay negocios todavia</h2>
          <p>Crea el primer cliente desde la vista principal de super admin.</p>
        </div>
      )}
    </section>
  );
}
