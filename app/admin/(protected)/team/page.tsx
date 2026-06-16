import AdminPageHeader from "@/components/admin/admin-page-header";
import AdminPageLayout from "@/components/admin/admin-page-layout";
import CreateTeamMemberForm from "@/components/admin/team/create-team-member-form";
import TeamMemberRoleForm from "@/components/admin/team/team-member-role-form";
import { requireAdminPermission } from "@/lib/admin/context";
import { getBusinessTeamMembers } from "@/lib/admin/team";

export default async function AdminTeamPage() {
  const adminContext = await requireAdminPermission("manageTeam");
  const teamMembers = await getBusinessTeamMembers(adminContext.businessId);

  return (
    <AdminPageLayout size="wide">
      <AdminPageHeader
        eyebrow="Equipo"
        title="Equipo"
        description="Gestiona los usuarios internos de tu negocio."
      />

      <div className="admin-team-layout">
        <CreateTeamMemberForm />

        <section className="admin-form-card">
          <div className="admin-form-header">
            <h2>Usuarios internos</h2>
            <p>Revisa el rol operativo de cada persona sin salir del admin del negocio.</p>
          </div>

          {teamMembers.length > 0 ? (
            <div className="admin-team-list">
              {teamMembers.map((member) => {
                const isCurrentUser = member.id === adminContext.user.id;
                const isEditable = !isCurrentUser && ["manager", "operator", "viewer"].includes(member.role);
                const createdLabel = formatTeamCreatedAt(member.created_at);

                return (
                  <article key={member.id} className="admin-team-row">
                    <div className="admin-team-row__copy">
                      <div className="admin-team-row__headline">
                        <h3>{member.email || "Usuario sin email visible"}</h3>
                        <span className="admin-team-role-chip">{member.role}</span>
                      </div>

                      <div className="admin-team-row__meta">
                        <span>Creado {createdLabel}</span>
                        {isCurrentUser ? <span>Tu usuario actual</span> : null}
                      </div>

                      {!isEditable ? (
                        <p className="admin-team-row__note">
                          {isCurrentUser
                            ? "No podes bajarte el rol desde esta pantalla."
                            : "Este rol se mantiene fijo en esta fase y no se edita desde Equipo."}
                        </p>
                      ) : null}
                    </div>

                    <div className="admin-team-row__controls">
                      {isEditable ? <TeamMemberRoleForm member={member} /> : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="admin-empty-state">
              <h2>Todavia no hay usuarios internos</h2>
              <p>Crea el primer manager, operator o viewer para empezar el QA multiusuario.</p>
            </div>
          )}
        </section>
      </div>
    </AdminPageLayout>
  );
}

function formatTeamCreatedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "recientemente";
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium"
  }).format(date);
}
