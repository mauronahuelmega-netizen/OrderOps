import Link from "next/link";
import CreateClientForm from "@/components/super-admin/create-client-form";

export default async function SuperAdminDashboardPage() {
  return (
    <div className="super-admin-onboarding">
      <section className="super-admin-onboarding-main">
        <CreateClientForm />
      </section>

      <section className="super-admin-onboarding-links">
        <article className="admin-form-card">
          <div className="admin-form-header">
            <h2>Gestionar negocios</h2>
            <p>Revisa estado, datos de contacto y acciones destructivas de cada tenant.</p>
          </div>

          <Link href="/super-admin/businesses" className="admin-secondary-link">
            Ir a negocios
          </Link>
        </article>

        <article className="admin-form-card">
          <div className="admin-form-header">
            <h2>Gestionar usuarios</h2>
            <p>Actualiza asignaciones y estado de los usuarios admin existentes.</p>
          </div>

          <Link href="/super-admin/users" className="admin-secondary-link">
            Ir a usuarios
          </Link>
        </article>
      </section>
    </div>
  );
}
