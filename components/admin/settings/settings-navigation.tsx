"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Globe,
  LayoutGrid,
  Settings2,
  Users,
  type LucideIcon
} from "lucide-react";
import styles from "./settings-navigation.module.css";

type SettingsNavKey =
  | "resumen"
  | "presencia-publica"
  | "operaciones"
  | "notificaciones"
  | "equipo";

export type SettingsNavigationProps = {
  canManagePublicSettings?: boolean;
  canManageTeam?: boolean;
};

type SettingsNavItem = {
  key: SettingsNavKey;
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  requiresPublic?: boolean;
  requiresTeam?: boolean;
};

const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  {
    key: "resumen",
    href: "/admin/settings",
    label: "Resumen",
    description: "Vista general de configuración",
    icon: LayoutGrid
  },
  {
    key: "presencia-publica",
    href: "/admin/settings/public",
    label: "Presencia pública",
    description: "Configurá cómo te encuentran tus clientes",
    icon: Globe,
    requiresPublic: true
  },
  {
    key: "operaciones",
    href: "/admin/settings/operations",
    label: "Operación",
    description: "Reglas y modo de trabajo",
    icon: Settings2
  },
  {
    key: "notificaciones",
    href: "/admin/settings/notifications",
    label: "Notificaciones",
    description: "Avisos y alertas del panel",
    icon: Bell
  },
  {
    key: "equipo",
    href: "/admin/settings/team",
    label: "Equipo",
    description: "Accesos al panel interno",
    icon: Users,
    requiresTeam: true
  }
];

function getActiveKey(pathname: string): SettingsNavKey {
  if (
    pathname.startsWith("/admin/settings/team") ||
    pathname === "/admin/team" ||
    pathname.startsWith("/admin/team/")
  ) {
    return "equipo";
  }

  if (pathname.startsWith("/admin/settings/notifications")) {
    return "notificaciones";
  }

  if (pathname.startsWith("/admin/settings/operations")) {
    return "operaciones";
  }

  if (pathname.startsWith("/admin/settings/public")) {
    return "presencia-publica";
  }

  if (pathname === "/admin/settings") {
    return "resumen";
  }

  if (pathname.startsWith("/admin/settings")) {
    return "resumen";
  }

  return "resumen";
}

export default function SettingsNavigation({
  canManagePublicSettings = false,
  canManageTeam = false
}: SettingsNavigationProps) {
  const pathname = usePathname();
  const activeKey = getActiveKey(pathname);

  const visibleItems = SETTINGS_NAV_ITEMS.filter((item) => {
    if (item.requiresPublic && !canManagePublicSettings) {
      return false;
    }

    if (item.requiresTeam && !canManageTeam) {
      return false;
    }

    return true;
  });

  return (
    <nav className={styles.nav} aria-label="Secciones de configuración">
      <div className={styles.panel}>
        <p className={styles.panelTitle}>Configuración</p>

        <div className={styles.scroller}>
          <ul className={styles.list}>
            {visibleItems.map((item) => {
              const isActive = activeKey === item.key;
              const Icon = item.icon;

              return (
                <li key={item.key} className={styles.listItem}>
                  <Link
                    href={item.href}
                    className={`${styles.item}${isActive ? ` ${styles.itemActive}` : ""}`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className={styles.itemIcon} aria-hidden="true">
                      <Icon strokeWidth={2} size={18} />
                    </span>

                    <span className={styles.itemCopy}>
                      <span className={styles.itemTitle}>{item.label}</span>
                      <span className={styles.itemDescription}>{item.description}</span>
                    </span>

                    <span className={styles.settingsNavBadge} aria-hidden="true" />
                    <span className={styles.settingsNavMeta} aria-hidden="true" />
                    <span className={styles.settingsNavStatus} aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}
