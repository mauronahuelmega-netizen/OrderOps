import Link from "next/link";

type PublicSettingsNavProps = {
  current: "overview" | "landing" | "catalogo" | "operaciones";
};

const ITEMS = [
  { key: "overview", href: "/admin/settings/public", label: "Resumen" },
  { key: "landing", href: "/admin/settings/public/landing", label: "Landing" },
  { key: "catalogo", href: "/admin/settings/public/catalogo", label: "Catálogo" },
  { key: "operaciones", href: "/admin/settings/operations", label: "Operaciones" }
] as const;

export default function PublicSettingsNav({ current }: PublicSettingsNavProps) {
  return (
    <nav
      className="admin-context-nav admin-settings-public-nav"
      aria-label="Secciones de configuración"
    >
      <div className="admin-context-nav__list">
        {ITEMS.map((item) => {
          const isActive = current === item.key;

          return (
            <Link
              key={item.key}
              href={item.href}
              className={`admin-context-nav__link admin-settings-public-nav__link${
                isActive
                  ? " admin-context-nav__link--active admin-settings-public-nav__link--active"
                  : ""
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
