import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./public-presence-editor-shell.module.css";

export type PublicPresenceEditorSection = "landing" | "catalog";

export type PublicPresenceEditorShellProps = {
  title: string;
  description: string;
  activeSection: PublicPresenceEditorSection;
  actions?: ReactNode;
  statusLabel?: string;
  helperText?: string;
  children: ReactNode;
};

const SECTION_LINKS: Array<{
  key: PublicPresenceEditorSection;
  href: string;
  label: string;
}> = [
  {
    key: "landing",
    href: "/admin/settings/public/landing",
    label: "Landing pública"
  },
  {
    key: "catalog",
    href: "/admin/settings/public/catalogo",
    label: "Catálogo público"
  }
];

export default function PublicPresenceEditorShell({
  title,
  description,
  activeSection,
  actions,
  statusLabel,
  helperText,
  children
}: PublicPresenceEditorShellProps) {
  return (
    <section className={styles.shell} aria-labelledby="public-presence-module-heading">
      <header className={styles.moduleHeader}>
        <div className={styles.moduleCopy}>
          <p className={styles.moduleEyebrow}>Módulo</p>
          <h2 id="public-presence-module-heading" className={styles.moduleTitle}>
            Presencia pública
          </h2>
          <p className={styles.moduleDescription}>
            Configurá cómo se ve tu negocio en los canales públicos.
          </p>
        </div>

        <nav className={styles.resourceNav} aria-label="Secciones de presencia pública">
          <ul className={styles.resourceNavList}>
            {SECTION_LINKS.map((link) => {
              const isActive = activeSection === link.key;

              return (
                <li key={link.key} className={styles.resourceNavItem}>
                  <Link
                    href={link.href}
                    className={`${styles.resourceNavLink}${isActive ? ` ${styles.resourceNavLinkActive}` : ""}`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className={styles.resourceNavLabel}>{link.label}</span>
                    <span className={styles.publicPresenceResourceBadge} aria-hidden="true" />
                    <span className={styles.publicPresenceResourceMeta} aria-hidden="true" />
                    <span className={styles.publicPresenceResourceStatus} aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <div className={styles.divider} role="presentation" />

      <header className={styles.sectionHeader}>
        <div className={styles.sectionCopy}>
          {statusLabel ? (
            <span className={styles.sectionStatus}>{statusLabel}</span>
          ) : null}
          <h3 className={styles.sectionTitle}>{title}</h3>
          <p className={styles.sectionDescription}>{description}</p>
          {helperText ? <p className={styles.sectionHelper}>{helperText}</p> : null}
        </div>
        {actions ? <div className={styles.sectionActions}>{actions}</div> : null}
      </header>

      <div className={styles.body}>{children}</div>
    </section>
  );
}
