"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/public/catalog/theme-toggle";
import PublicStorageImage from "@/components/public/catalog/public-storage-image";
import { dispatchPublicHeaderHidden } from "@/components/public/business/public-header-visibility";
import { useHideOnScroll } from "@/components/public/business/use-hide-on-scroll";
import type { PublicBusiness } from "@/lib/business/public";
import styles from "./public-business-header.module.css";

type PublicBusinessHeaderProps = {
  business: PublicBusiness;
  slug: string;
};

type PublicNavItem = {
  href: string;
  label: string;
  description: string;
  isActive: boolean;
};

type ThemePreference = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

const THEME_STORAGE_KEY = "orderops-public-theme";
const THEME_CHANGE_EVENT = "orderops-public-theme-change";

export default function PublicBusinessHeader({
  business,
  slug
}: PublicBusinessHeaderProps) {
  const pathname = usePathname();
  const isCheckoutRoute = /\/b\/[^/]+\/checkout\/?$/.test(pathname);
  const headerRef = useRef<HTMLElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [themePreference, setThemePreference] = useState<ThemePreference>("system");
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>("light");
  const headerHidden = useHideOnScroll({ disabled: isMenuOpen || isCheckoutRoute });

  const resolvedTheme: ResolvedTheme =
    themePreference === "system" ? systemTheme : themePreference;

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const headerEl = headerRef.current;
    const headerOffsetPx = headerEl?.offsetHeight ?? 78;
    dispatchPublicHeaderHidden({
      hidden: headerHidden && !isMenuOpen,
      headerOffsetPx
    });
  }, [headerHidden, isMenuOpen]);

  useEffect(() => {
    return () => {
      dispatchPublicHeaderHidden({ hidden: false, headerOffsetPx: 78 });
    };
  }, []);

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

  useEffect(() => {
    const storedPreference = window.localStorage.getItem(THEME_STORAGE_KEY);

    if (storedPreference === "light" || storedPreference === "dark") {
      setThemePreference(storedPreference);
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemTheme = () => {
      setSystemTheme(mediaQuery.matches ? "dark" : "light");
    };

    syncSystemTheme();
    mediaQuery.addEventListener("change", syncSystemTheme);

    return () => {
      mediaQuery.removeEventListener("change", syncSystemTheme);
    };
  }, []);

  useEffect(() => {
    if (themePreference === "system") {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      window.localStorage.setItem(THEME_STORAGE_KEY, themePreference);
    }
  }, [themePreference]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-catalog-theme", resolvedTheme);
    window.dispatchEvent(
      new CustomEvent(THEME_CHANGE_EVENT, {
        detail: {
          resolvedTheme,
          themePreference
        }
      })
    );
  }, [resolvedTheme, themePreference]);

  const headerStyles = {
    "--business-primary": business.primary_color ?? "var(--color-primary)",
    "--business-primary-foreground": "#ffffff",
    "--business-primary-soft": "color-mix(in srgb, var(--business-primary) 12%, transparent)"
  } as CSSProperties;

  const navigationItems: PublicNavItem[] = [
    {
      href: `/b/${slug}`,
      label: "Home",
      description: "Inicio del negocio",
      isActive: pathname === `/b/${slug}`
    },
    {
      href: `/b/${slug}/catalogo`,
      label: "Catálogo",
      description: "Ver productos y hacer pedido",
      isActive: pathname === `/b/${slug}/catalogo`
    }
  ];

  return (
    <>
      <header
        ref={headerRef}
        className={`public-business-header ${styles.header} ${
          isCheckoutRoute ? styles.headerCheckout : ""
        } ${
          headerHidden && !isMenuOpen ? styles.headerHidden : styles.headerVisible
        }`}
        style={headerStyles}
        data-header-hidden={headerHidden && !isMenuOpen ? "true" : "false"}
        data-checkout-static={isCheckoutRoute ? "true" : "false"}
        aria-hidden={headerHidden && !isMenuOpen ? true : undefined}
      >
        <div className="public-business-header__inner">
          <Link href={`/b/${slug}`} className="public-business-header__brand">
            {business.logo_url ? (
              <div className="public-business-header__logo-frame">
                <PublicStorageImage
                  className="public-business-header__logo"
                  src={business.logo_url}
                  alt={`${business.name} logo`}
                  width={64}
                  height={64}
                  sizes="64px"
                />
              </div>
            ) : (
              <div className="public-business-header__logo-frame public-business-header__logo-frame--placeholder">
                <div className="public-business-header__logo public-business-header__logo--placeholder">
                  {business.name.charAt(0).toUpperCase()}
                </div>
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

      <div
        className={`public-business-header__portal${
          isMenuOpen ? " public-business-header__portal--open" : ""
        }`}
        role="presentation"
        aria-hidden={!isMenuOpen}
      >
        <button
          type="button"
          className="public-business-header__overlay"
          aria-label="Cerrar menú"
          tabIndex={isMenuOpen ? 0 : -1}
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
                <div className="public-business-header__logo-frame">
                  <PublicStorageImage
                    className="public-business-header__logo"
                    src={business.logo_url}
                    alt={`${business.name} logo`}
                    width={64}
                    height={64}
                    sizes="64px"
                  />
                </div>
              ) : (
                <div className="public-business-header__logo-frame public-business-header__logo-frame--placeholder">
                  <div className="public-business-header__logo public-business-header__logo--placeholder">
                    {business.name.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}

              <div className="public-business-header__brand-copy">
                <span className="public-business-header__brand-kicker">Pedido online</span>
                <strong>{business.name}</strong>
              </div>
            </div>

            <button
              type="button"
              className="public-business-header__sheet-close"
              aria-label="Cerrar menú"
              onClick={() => setIsMenuOpen(false)}
            >
              <span />
              <span />
            </button>
          </div>

          <div className="public-business-header__sheet-stack">
            <section className="public-business-header__section" aria-label="Navegación principal">
              <nav className="public-business-header__nav" aria-label="Navegación pública">
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`public-business-header__link${
                      item.isActive ? " public-business-header__link--active" : ""
                    }`}
                  >
                    <span className="public-business-header__link-copy">
                      <strong>{item.label}</strong>
                      <small>{item.description}</small>
                    </span>
                    {item.isActive ? (
                      <span className="public-business-header__link-indicator" aria-hidden="true" />
                    ) : null}
                  </Link>
                ))}
              </nav>
            </section>

            {business.instagram_url ? (
              <section className="public-business-header__section" aria-label="Redes">
                <a
                  href={business.instagram_url}
                  target="_blank"
                  rel="noreferrer"
                  className="public-business-header__link public-business-header__link--secondary"
                >
                  <span className="public-business-header__link-copy">
                    <strong>Instagram</strong>
                    <small>Ver novedades y contenido del negocio</small>
                  </span>
                </a>
              </section>
            ) : null}

            <section className="public-business-header__section" aria-label="Preferencias">
              <div className="public-business-header__preferences-copy">
                <span className="public-business-header__preferences-title">Preferencias</span>
                <p>Ajustá cómo querés ver el catálogo.</p>
              </div>

              <div className="public-business-header__preferences-surface">
                <div className="public-business-header__preferences-copy public-business-header__preferences-copy--inline">
                  <span className="public-business-header__preferences-title">Modo visual</span>
                  <p>Elegí entre claro y oscuro.</p>
                </div>

                <ThemeToggle
                  theme={resolvedTheme}
                  onToggle={() =>
                    setThemePreference((currentPreference) => {
                      const currentTheme =
                        currentPreference === "system" ? systemTheme : currentPreference;
                      return currentTheme === "dark" ? "light" : "dark";
                    })
                  }
                />
              </div>
            </section>

            <section
              className="public-business-header__section public-business-header__section--footer"
              aria-label="Acceso interno"
            >
              <div className="public-business-header__separator" />

              <Link
                href="/admin/login"
                className="public-business-header__link public-business-header__link--secondary"
              >
                <span className="public-business-header__link-copy">
                  <strong>Staff</strong>
                  <small>Acceso interno para administrar pedidos y catálogo</small>
                </span>
              </Link>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
