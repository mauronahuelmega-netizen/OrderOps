import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import CreateClientForm from "@/components/super-admin/create-client-form";

export default async function SuperAdminDashboardPage() {
  return (
    <div className="super-admin-onboarding">
      <section className="super-admin-onboarding-main">
        <CreateClientForm />
      </section>

      <section className="super-admin-onboarding-links">
        <Card className="admin-form-card super-admin-onboarding-card">
          <div className="admin-form-header">
            <h2>Gestionar negocios</h2>
            <p>Revisá estado, datos de contacto y acciones destructivas de cada tenant.</p>
          </div>

          <Button href="/super-admin/businesses" className="admin-secondary-link" variant="secondary">
            Ir a negocios
          </Button>
        </Card>

        <Card className="admin-form-card super-admin-onboarding-card">
          <div className="admin-form-header">
            <h2>Gestionar usuarios</h2>
            <p>Actualizá asignaciones y estado de los usuarios admin existentes.</p>
          </div>

          <Button href="/super-admin/users" className="admin-secondary-link" variant="secondary">
            Ir a usuarios
          </Button>
        </Card>
      </section>
    </div>
  );
}
