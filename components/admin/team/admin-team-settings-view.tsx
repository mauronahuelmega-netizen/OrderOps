import SettingsShell from "@/components/admin/settings/settings-shell";
import CreateTeamMemberForm from "@/components/admin/team/create-team-member-form";
import TeamMemberRoleForm from "@/components/admin/team/team-member-role-form";
import { requireAdminPermission } from "@/lib/admin/context";
import { getBusinessTeamMembers } from "@/lib/admin/team";
import type { ProfileRole } from "@/types/database";
import styles from "./team-settings.module.css";

const ROLE_LABELS: Record<ProfileRole, string> = {
  super_admin: "super admin",
  owner: "owner",
  admin: "admin",
  manager: "manager",
  operator: "operator",
  viewer: "viewer"
};

const ELEVATED_ROLES: ProfileRole[] = ["owner", "admin", "super_admin"];

function getRoleChipClass(role: ProfileRole) {
  if (ELEVATED_ROLES.includes(role)) {
    return `${styles.roleChip} ${styles.roleChipAdmin}`;
  }

  if (role === "manager") {
    return `${styles.roleChip} ${styles.roleChipManager}`;
  }

  return styles.roleChip;
}

export default async function AdminTeamSettingsView() {
  const adminContext = await requireAdminPermission("manageTeam");
  const teamMembers = await getBusinessTeamMembers(adminContext.businessId);

  const totalMembers = teamMembers.length;
  const managerCount = teamMembers.filter((member) => member.role === "manager").length;
  const operatorCount = teamMembers.filter((member) => member.role === "operator").length;
  const viewerCount = teamMembers.filter((member) => member.role === "viewer").length;

  const currentRole = adminContext.profile.role;
  const currentEmail =
    teamMembers.find((member) => member.id === adminContext.user.id)?.email ?? null;

  return (
    <SettingsShell
      title="Equipo"
      description="Administrá las personas y permisos del panel."
      canManagePublicSettings={adminContext.permissions.canManagePublicSettings}
      canManageTeam={adminContext.permissions.canManageTeam}
    >
      <div className={styles.layout}>
        <section className={styles.summary} aria-labelledby="team-summary-title">
          <div className={styles.summaryHeader}>
            <h2 id="team-summary-title" className={styles.summaryTitle}>
              Resumen del equipo
            </h2>
            <p className={styles.summaryDescription}>
              Gestioná quién puede entrar al panel y qué nivel de acceso tiene cada persona.
            </p>
          </div>

          <div className={styles.statGrid}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{totalMembers}</span>
              <span className={styles.statLabel}>Usuarios internos</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{managerCount}</span>
              <span className={styles.statLabel}>Managers</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{operatorCount}</span>
              <span className={styles.statLabel}>Operators</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{viewerCount}</span>
              <span className={styles.statLabel}>Viewers</span>
            </div>
          </div>

          <p className={styles.summaryMeta}>
            <span>
              Tu usuario: <strong>{currentEmail ?? "sesión actual"}</strong> ·{" "}
              {ROLE_LABELS[currentRole] ?? currentRole}
            </span>
            <span>Podés gestionar roles de manager, operator y viewer.</span>
          </p>
        </section>

        <section className={styles.card} aria-labelledby="team-members-title">
          <div className={styles.cardHeader}>
            <h2 id="team-members-title" className={styles.cardTitle}>
              Usuarios internos
            </h2>
            <p className={styles.cardDescription}>
              Revisá el rol operativo de cada persona y ajustá su acceso sin salir del panel.
            </p>
          </div>

          {teamMembers.length > 0 ? (
            <div className={styles.userList}>
              {teamMembers.map((member) => {
                const isCurrentUser = member.id === adminContext.user.id;
                const isEditable =
                  !isCurrentUser && ["manager", "operator", "viewer"].includes(member.role);
                const createdLabel = formatTeamCreatedAt(member.created_at);

                return (
                  <article key={member.id} className={styles.userRow}>
                    <div className={styles.userMain}>
                      <div className={styles.userHeadline}>
                        <h3 className={styles.userEmail}>
                          {member.email || "Usuario sin email visible"}
                        </h3>
                        <span className={getRoleChipClass(member.role)}>
                          {ROLE_LABELS[member.role] ?? member.role}
                        </span>
                      </div>

                      <p className={styles.userMeta}>
                        <span>Creado {createdLabel}</span>
                        {isCurrentUser ? <span>Tu usuario actual</span> : null}
                      </p>

                      {!isEditable ? (
                        <p className={styles.userNote}>
                          {isCurrentUser
                            ? "No podés bajarte el rol desde esta pantalla."
                            : "Este rol se mantiene fijo en esta fase y no se edita desde Equipo."}
                        </p>
                      ) : null}
                    </div>

                    <div className={styles.userControls}>
                      {isEditable ? <TeamMemberRoleForm member={member} /> : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p className={styles.emptyStateTitle}>Todavía no hay usuarios internos</p>
              <p className={styles.emptyStateText}>
                Creá el primer manager, operator o viewer para empezar el QA multiusuario.
              </p>
            </div>
          )}
        </section>

        <CreateTeamMemberForm />
      </div>
    </SettingsShell>
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
