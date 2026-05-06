"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PublicBusiness } from "@/lib/business/public";

type PublicBusinessHeaderProps = {
  business: PublicBusiness;
  slug: string;
};

type PublicNavItem = {
  href: string;
  label: string;
  isActive: boolean;
};

export default function PublicBusinessHeader({
  business,
  slug
}: PublicBusinessHeaderProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  const headerStyles = {
    "--business-primary": business.primary_color ?? "var(--color-primary)",
    "--business-primary-foreground": "#ffffff",
    "--business-primary-soft": "color-mix(in srgb, var(--business-primary) 12%, transparent)"
  } as CSSProperties;

  const navigationItems: PublicNavItem[] = [
    {
      href: `/b/${slug}`,
      label: "Home",
      isActive: pathname === `/b/${slug}`
    },
    {
      href: `/b/${slug}/catalogo`,
      label: "Catálogo",
      isActive: pathname === `/b/${slug}/catalogo`
    }
  ];

  return (
    <>
      <header className="public-business-header" style={headerStyles}>
        <div className="public-business-header__inner">
          <Link href={`/b/${slug}`} className="public-business-header__brand">
            {business.logo_url ? (
              <img
                className="public-business-header__logo"
                src={business.logo_url}
                alt={`${business.name} logo`}
              />
            ) : (
              <div className="public-business-header__logo public-business-header__logo--placeholder">
                {business.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="public-business-header__brand-copy">
              <span className="public-business-header__brand-kicker">Pedido online</span>
              <strong>{business.name}</strong>
            </div>
          </Link>

          <button
            type="button"
            className={`public-business-header__menu-button${
              isMenuOpen ? " public-business-header__menu-button--open" : ""
            }`}
            aria-expanded={isMenuOpen}
            aria-controls="public-business-header-sheet"
            aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {isMenuOpen ? (
        <div className="public-business-header__portal" role="presentation">
          <button
            type="button"
            className="public-business-header__overlay"
            aria-label="Cerrar menú"
            onClick={() => setIsMenuOpen(false)}
          />

          <div
            id="public-business-header-sheet"
            className="public-business-header__sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Navegación pública"
          >
            <div className="public-business-header__sheet-header">
              <div className="public-business-header__sheet-brand">
                {business.logo_url ? (
                  <img
                    className="public-business-header__logo"
                    src={business.logo_url}
                    alt={`${business.name} logo`}
                  />
                ) : (
                  <div className="public-business-header__logo public-business-header__logo--placeholder">
                    {business.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="public-business-header__brand-copy">
                  <span className="public-business-header__brand-kicker">Navegación</span>
                  <strong>{business.name}</strong>
                </div>
              </div>

              <button
                type="button"
                className="public-business-header__sheet-close"
                aria-label="Cerrar menú"
                onClick={() => setIsMenuOpen(false)}
              >
                Cerrar
              </button>
            </div>

            <nav className="public-business-header__nav" aria-label="Navegación pública">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`public-business-header__link${
                    item.isActive ? " public-business-header__link--active" : ""
                  }`}
                >
                  <span>{item.label}</span>
                  {item.isActive ? (
                    <span className="public-business-header__link-indicator" aria-hidden="true" />
                  ) : null}
                </Link>
              ))}

              <div className="public-business-header__separator" />

              <Link href="/admin/login" className="public-business-header__link">
                <span>Staff</span>
              </Link>
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
