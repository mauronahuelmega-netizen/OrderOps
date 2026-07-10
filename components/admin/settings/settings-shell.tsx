import type { ReactNode } from "react";
import AdminPageHeader from "@/components/admin/admin-page-header";
import AdminPageLayout from "@/components/admin/admin-page-layout";
import SettingsNavigation, {
  type SettingsNavigationProps
} from "@/components/admin/settings/settings-navigation";
import styles from "./settings-shell.module.css";

export type SettingsShellProps = SettingsNavigationProps & {
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
  showNavigation?: boolean;
  anchorViewport?: boolean;
};

export default function SettingsShell({
  title,
  description,
  actions,
  children,
  canManagePublicSettings = false,
  canManageTeam = false,
  showNavigation = true,
  anchorViewport = false
}: SettingsShellProps) {
  return (
    <AdminPageLayout
      size="operational"
      className={anchorViewport ? styles.hubViewport : undefined}
      {...(anchorViewport ? { "data-settings-hub-root": "" } : {})}
    >
      <AdminPageHeader
        variant="operational"
        eyebrow="Configuración"
        title={title}
        description={description}
        actions={actions}
      />

      <div className={styles.frame}>
        {showNavigation ? (
          <div className={styles.nav}>
            <SettingsNavigation
              canManagePublicSettings={canManagePublicSettings}
              canManageTeam={canManageTeam}
            />
          </div>
        ) : null}

        <div className={styles.content}>{children ?? null}</div>
      </div>
    </AdminPageLayout>
  );
}
