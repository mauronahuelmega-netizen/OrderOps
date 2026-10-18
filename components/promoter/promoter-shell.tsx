"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { promoterLogoutAction } from "@/app/promoter/login/actions";
import styles from "./promoter-panel.module.css";

type PromoterShellProps = {
  legalName: string;
  statusLabel: string;
  separated: boolean;
  children: ReactNode;
};

const AREAS = [
  { href: "/promoter", label: "Inicio", match: (path: string) => path === "/promoter" },
  {
    href: "/promoter/opportunities",
    label: "Comercial",
    match: (path: string) =>
      path.startsWith("/promoter/opportunities") ||
      path.startsWith("/promoter/businesses") ||
      path.startsWith("/promoter/claims")
  },
  { href: "/promoter/tasks", label: "Tareas", match: (path: string) => path.startsWith("/promoter/tasks") },
  { href: "/promoter/settlements", label: "Ingresos", match: (path: string) => path.startsWith("/promoter/settlements") },
  { href: "/promoter/onboarding", label: "Asistencia", match: (path: string) => path.startsWith("/promoter/onboarding") },
  { href: "/promoter/resources", label: "Recursos", match: (path: string) => path.startsWith("/promoter/resources") },
  { href: "/promoter/profile", label: "Perfil", match: (path: string) => path.startsWith("/promoter/profile") }
] as const;

const COMMERCIAL_LINKS = [
  { href: "/promoter/opportunities", label: "Oportunidades" },
  { href: "/promoter/businesses", label: "Cartera" },
  { href: "/promoter/claims", label: "Reclamaciones" }
] as const;

export function PromoterShell({ legalName, statusLabel, separated, children }: PromoterShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const commercial = AREAS[1].match(pathname);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className={collapsed ? styles.frameCollapsed : styles.frame}>
      <button type="button" className={styles.menuButton} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        Menú
      </button>
      {open ? <button type="button" className={styles.backdrop} aria-label="Cerrar menú" onClick={() => setOpen(false)} /> : null}
      <aside className={open ? styles.sidebarOpen : styles.sidebar} aria-label="Portal de promotores">
        <p className={styles.identity}>{legalName}</p>
        <p className={styles.muted}>{statusLabel}</p>
        <button type="button" className={styles.collapseButton} onClick={() => setCollapsed((value) => !value)}>
          {collapsed ? "Expandir" : "Plegar"}
        </button>
        <nav className={styles.nav}>
          {AREAS.map((area) => {
            const active = area.match(pathname);
            return (
              <Link key={area.href} href={area.href} aria-current={active ? "page" : undefined} className={active ? styles.navActive : undefined}>
                {area.label}
              </Link>
            );
          })}
        </nav>
        {commercial && !separated ? (
          <nav className={styles.subnav} aria-label="Comercial">
            {COMMERCIAL_LINKS.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined} className={active ? styles.navActive : undefined}>
                  {link.label}
                </Link>
              );
            })}
          </nav>
        ) : null}
        <form action={promoterLogoutAction}>
          <button type="submit">Cerrar sesión</button>
        </form>
      </aside>
      <main className={styles.main}>
        {separated ? (
          <section className={styles.card}>
            <h1>Acceso revocado</h1>
            <p>Tu cuenta fue desvinculada. El panel no muestra la cartera ni permite operar.</p>
            <p className={styles.muted}>Contactá al administrador de OrderOps para revisar el acceso. El historial económico no se borra desde esta pantalla.</p>
          </section>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
