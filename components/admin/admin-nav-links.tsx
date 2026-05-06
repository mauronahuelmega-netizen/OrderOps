"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin/dashboard", label: "Pedidos" },
  { href: "/admin/products", label: "Productos" },
  { href: "/admin/settings/public", label: "Configuración pública" }
];

export default function AdminNavLinks() {
  const pathname = usePathname();

  return (
    <nav className="admin-nav" aria-label="Navegacion admin">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`admin-nav-link${isActive ? " admin-nav-link--active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
