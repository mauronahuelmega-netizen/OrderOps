"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  CookingPot,
  Package,
  Settings,
  Users,
  type LucideIcon
} from "lucide-react";
import { isAdminNavItemActive, type AdminNavItem } from "@/components/admin/admin-nav-config";
import sidebarStyles from "./admin-sidebar.module.css";

type AdminNavListProps = {
  items: AdminNavItem[];
  variant: "sidebar" | "drawer";
  onNavigate?: () => void;
};

const ADMIN_NAV_ICONS: Record<string, LucideIcon> = {
  "/admin/dashboard": ClipboardList,
  "/admin/kitchen": CookingPot,
  "/admin/products": Package,
  "/admin/team": Users,
  "/admin/settings/public": Settings
};

function getDrawerLinkClassName(isActive: boolean): string {
  return [
    "admin-mobile-drawer__link",
    isActive ? "admin-mobile-drawer__link--active" : ""
  ]
    .filter(Boolean)
    .join(" ");
}

export default function AdminNavList({ items, variant, onNavigate }: AdminNavListProps) {
  const pathname = usePathname();

  if (variant === "sidebar") {
    return (
      <nav className={sidebarStyles.sidebarNav} aria-label="Navegación de administración">
        {items.map((item) => {
          const isActive = isAdminNavItemActive(pathname, item);
          const SidebarIcon = ADMIN_NAV_ICONS[item.href];

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${sidebarStyles.navLink}${
                isActive ? ` ${sidebarStyles.navLinkActive}` : ""
              }`}
              aria-current={isActive ? "page" : undefined}
              onClick={onNavigate}
            >
              <div className={sidebarStyles.navIcon} aria-hidden="true">
                {SidebarIcon ? <SidebarIcon strokeWidth={1.8} /> : null}
              </div>
              <span className={sidebarStyles.navText}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="admin-mobile-drawer__nav" aria-label="Navegación de administración">
      {items.map((item) => {
        const isActive = isAdminNavItemActive(pathname, item);
        const DrawerIcon = ADMIN_NAV_ICONS[item.href];

        return (
          <Link
            key={item.href}
            href={item.href}
            className={getDrawerLinkClassName(isActive)}
            aria-current={isActive ? "page" : undefined}
            onClick={onNavigate}
          >
            <span className="admin-mobile-drawer__link-icon" aria-hidden="true">
              {DrawerIcon ? <DrawerIcon strokeWidth={1.8} /> : null}
            </span>
            <span className="admin-mobile-drawer__link-text">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
