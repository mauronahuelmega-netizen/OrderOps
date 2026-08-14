"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LockKeyhole, Store, X } from "lucide-react";
import ThemeToggle from "@/components/public/catalog/theme-toggle";
import PublicStorageImage from "@/components/public/catalog/public-storage-image";
import { usePublicOverlayScrollLock } from "@/components/public/catalog/public-overlay-scroll-lock";
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
  icon: typeof Store;
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
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuSheetRef = useRef<HTMLDivElement | null>(null);
  const menuCloseButtonRef = useRef<HTMLButtonElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [themePreference, setThemePreference] = useState<ThemePreference>("system");
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>("light");
  usePublicOverlayScrollLock(isMenuOpen);
  const isBusinessOpen = business.on_demand_mode_active;

  const resolvedTheme: ResolvedTheme =
    themePreference === "system" ? systemTheme : themePreference;

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setIsMenuOpen(false);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = menuSheetRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements?.length) {
        event.preventDefault();
        menuSheetRef.current?.focus();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const focusFrame = window.requestAnimationFrame(() => {
      menuCloseButtonRef.current?.focus();
    });
    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleKeyDown, true);
      menuButtonRef.current?.focus();
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

  // MVP catalog-first: no visible "Home" nav item (long landing out of primary path).
  // Brand href remains `/b/${slug}` → ready redirect / not-ready fallback via page.tsx.
  const navigationItems: PublicNavItem[] = [
    {
      href: `/b/${slug}/catalogo`,
      label: "Catálogo",
      description: "Ver productos y hacer pedido",
      isActive: pathname === `/b/${slug}/catalogo`,
      icon: Store
    }
  ];

  return (
    <>
      <header
        className={`public-business-header ${styles.header} ${
          isCheckoutRoute ? styles.headerCheckout : ""
        }`}
        style={headerStyles}
        data-checkout-static={isCheckoutRoute ? "true" : "false"}
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
              <strong className="public-business-header__brand-name">
                <span className="public-business-header__brand-name-text">{business.name}</span>
                <span
                  className={`public-business-header__business-status public-business-header__business-status--${
                    isBusinessOpen ? "open" : "closed"
                  }`}
                  aria-label={isBusinessOpen ? "Abierto" : "Cerrado"}
                >
                  <span aria-hidden="true" />
                  {isBusinessOpen ? null : <em>Cerrado</em>}
                </span>
              </strong>
            </div>
          </Link>

          <button
            ref={menuButtonRef}
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
        style={headerStyles}
        role="presentation"
        aria-hidden={!isMenuOpen}
      >
        <button
          type="button"
          className="public-business-header__overlay"
          aria-label="Cerrar menú"
          tabIndex={-1}
          onClick={() => setIsMenuOpen(false)}
        />

        <div
          ref={menuSheetRef}
          id="public-business-header-sheet"
          className="public-business-header__sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="public-business-header-sheet-title"
          tabIndex={-1}
        >
          <div className="public-business-header__sheet-header">
            <h2 id="public-business-header-sheet-title" className="public-business-header__sheet-title">
              Menú
            </h2>

            <button
              ref={menuCloseButtonRef}
              type="button"
              className="public-business-header__sheet-close"
              aria-label="Cerrar menú"
              onClick={() => setIsMenuOpen(false)}
            >
              <X aria-hidden="true" focusable="false" />
            </button>
          </div>

          <div className="public-business-header__sheet-stack">
            <section className="public-business-header__section" aria-label="Navegación principal">
              <nav className="public-business-header__nav" aria-label="Navegación pública">
                {navigationItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`public-business-header__link public-business-header__link--with-icon${
                        item.isActive ? " public-business-header__link--active" : ""
                      }`}
                    >
                      <Icon className="public-business-header__link-icon" aria-hidden="true" focusable="false" />
                      <span className="public-business-header__link-copy">
                        <strong>{item.label}</strong>
                        <small>{item.description}</small>
                      </span>
                      {item.isActive ? (
                        <span className="public-business-header__link-indicator" aria-hidden="true" />
                      ) : null}
                    </Link>
                  );
                })}
              </nav>
            </section>

            <div className="public-business-header__sheet-utilities">
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
                <div className="public-business-header__preferences-surface">
                  <div className="public-business-header__preferences-copy public-business-header__preferences-copy--inline">
                    <span className="public-business-header__preferences-title">Modo visual</span>
                    <p>Claro / Oscuro</p>
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
                  className="public-business-header__link public-business-header__link--secondary public-business-header__link--with-icon"
                >
                  <LockKeyhole className="public-business-header__link-icon" aria-hidden="true" focusable="false" />
                  <span className="public-business-header__link-copy">
                    <strong>Staff</strong>
                    <small>Acceso interno para administrar pedidos y catálogo</small>
                  </span>
                </Link>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
