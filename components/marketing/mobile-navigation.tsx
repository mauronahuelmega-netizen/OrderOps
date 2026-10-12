"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowUpRight, Menu } from "lucide-react";
import styles from "./marketing-landing.module.css";

type Props = { links: ReadonlyArray<{ href: string; label: string }> };

export default function MobileNavigation({ links }: Props) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  return <details ref={menuRef} className={styles.mobileMenu} onKeyDown={event => {
    if (event.key === "Escape" && menuRef.current?.open) {
      menuRef.current.open = false;
      menuRef.current.querySelector("summary")?.focus();
    }
  }}>
    <summary aria-label="Menú de navegación"><Menu size={22} aria-hidden="true" /></summary>
    <nav aria-label="Navegación mobile" onClick={event => {
      if ((event.target as Element).closest("a") && menuRef.current) menuRef.current.open = false;
    }}>{links.map(link => <a key={link.href} href={link.href}>{link.label}</a>)}<Link href="/admin/login" data-marketing-event="login_click" data-location="mobile-menu">Iniciar sesión <ArrowUpRight size={14} aria-hidden="true" /></Link></nav>
  </details>;
}
