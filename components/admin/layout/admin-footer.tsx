import Link from "next/link";
import styles from "./admin-footer.module.css";

export type AdminFooterLink = {
  label: string;
  href: string;
};

export type AdminFooterProps = {
  brand?: string;
  tagline?: string;
  meta?: string;
  links?: AdminFooterLink[];
  variant?: "default" | "compact";
  className?: string;
};

const MOBILE_META = "Panel protegido · v1.0";

export function AdminFooter({
  brand,
  tagline = "Sistema operativo para pedidos",
  meta = "V1.0 · Panel protegido",
  links = [],
  variant = "default",
  className
}: AdminFooterProps) {
  const resolvedBrand = brand ?? `© ${new Date().getFullYear()} OrderOps`;
  const footerClassName = [
    styles.footer,
    variant === "compact" ? styles.footerCompact : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <footer className={footerClassName}>
      <div className={styles.inner}>
        <p className={styles.brandLine}>
          <span className={styles.brand}>{resolvedBrand}</span>
          <span className={styles.separator} aria-hidden="true">
            ·
          </span>
          <span className={styles.tagline}>{tagline}</span>
        </p>
        <div className={styles.trailing}>
          {links.length > 0 ? (
            <nav className={styles.links} aria-label="Enlaces del panel">
              {links.map((link) => (
                <Link key={link.href} href={link.href} className={styles.link}>
                  {link.label}
                </Link>
              ))}
            </nav>
          ) : null}
          <p className={styles.metaLine}>
            <span className={styles.metaDesktop}>{meta}</span>
            <span className={styles.metaMobile}>{MOBILE_META}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
