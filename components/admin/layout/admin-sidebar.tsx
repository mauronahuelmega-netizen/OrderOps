"use client";

import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/admin/actions";
import AdminBrand from "@/components/admin/layout/admin-brand";
import AdminNavList from "@/components/admin/layout/admin-nav-list";
import AdminThemeToggle from "@/components/admin/layout/admin-theme-toggle";
import { useAdminBusinessSettings } from "@/components/admin/admin-shell";
import {
  getAdminNavItemsForRole,
  isAdminNavItemFeatureEnabled
} from "@/components/admin/admin-nav-config";
import type { ProfileRole } from "@/types/database";
import styles from "./admin-sidebar.module.css";

type AdminSidebarProps = {
  role: ProfileRole;
  logoUrl: string | null;
  name: string | null;
  userLabel: string;
  logoutButton?: ReactNode;
};

function getUserInitial(userLabel: string) {
  return userLabel.trim().charAt(0).toUpperCase() || "U";
}

export default function AdminSidebar({
  role,
  logoUrl,
  name,
  userLabel,
  logoutButton
}: AdminSidebarProps) {
  const { settings, loading } = useAdminBusinessSettings();
  const visibleItems = getAdminNavItemsForRole(role).filter((item) =>
    isAdminNavItemFeatureEnabled(item, settings, loading)
  );

  return (
    <aside className={styles.sidebar} aria-label="Navegacion lateral del admin">
      <div className={styles.sidebarTop}>
        <div className={styles.sidebarBrand}>
          <AdminBrand logoUrl={logoUrl} name={name} variant="sidebar" />
        </div>
        <div className={styles.sidebarNavHost}>
          <AdminNavList items={visibleItems} variant="sidebar" />
        </div>
      </div>

      <div className={styles.sidebarFooter}>
        <div className={styles.accountBlock}>
          <div className={styles.userFooter}>
            <div className={styles.userAvatar} aria-hidden="true">
              {getUserInitial(userLabel)}
            </div>
            <span className={styles.userInfo} title={userLabel}>
              {userLabel}
            </span>
          </div>

          <AdminThemeToggle />

          {logoutButton ?? (
            <form action={logoutAction} className={styles.logoutForm}>
              <button type="submit" className={styles.logoutButton}>
                <span className={styles.logoutIcon} aria-hidden="true">
                  <LogOut strokeWidth={1.75} />
                </span>
                <span className={styles.userInfo}>Cerrar sesión</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </aside>
  );
}
