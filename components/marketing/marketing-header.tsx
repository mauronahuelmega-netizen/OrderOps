import Link from "next/link";
import { ArrowUpRight, Layers2 } from "lucide-react";
import MarketingAction from "./marketing-action";
import MobileNavigation from "./mobile-navigation";
import styles from "./marketing-landing.module.css";

const links = [{ href: "#producto", label: "Producto" }, { href: "#como-funciona", label: "Cómo funciona" }, { href: "#precios", label: "Precios" }, { href: "#faq", label: "FAQ" }];

export function MarketingBrand() {
  return <a href="#inicio" className={styles.brand} aria-label="OrderOps, volver al inicio"><span className={styles.brandMark}><Layers2 size={22} strokeWidth={2.4} aria-hidden="true" /></span>Order<span className={styles.brandSuffix}>Ops</span></a>;
}

export default function MarketingHeader() {
  return <header className={styles.header}>
    <div className={`${styles.shell} ${styles.headerInner}`}>
      <MarketingBrand />
      <nav className={styles.desktopNav} aria-label="Navegación principal">{links.map(link => <a key={link.href} href={link.href}>{link.label}</a>)}</nav>
      <div className={styles.headerActions}>
        <Link href="/admin/login" className={styles.login} data-marketing-event="login_click" data-location="header">Iniciar sesión <ArrowUpRight size={14} aria-hidden="true" /></Link>
        <MarketingAction compact location="header" />
        <MobileNavigation links={links} />
      </div>
    </div>
  </header>;
}
