"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/super-admin", label: "Crear cliente" },
  { href: "/super-admin/businesses", label: "Negocios" },
  { href: "/super-admin/users", label: "Usuarios" }
];

export default function SuperAdminNav() {
  const pathname = usePathname();

  return (
    <nav className="super-admin-nav" aria-label="Navegacion super admin">
      {navItems.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`super-admin-nav-link${isActive ? " super-admin-nav-link--active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
