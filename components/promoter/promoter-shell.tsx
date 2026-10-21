"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BookOpen,
  BriefcaseBusiness,
  ChevronDown,
  CircleUserRound,
  Coins,
  LayoutDashboard,
  LifeBuoy,
  ListTodo,
  LogOut,
  Menu,
  MessageSquareWarning,
  ReceiptText,
  Store,
  Target,
  UserRound,
  Wallet,
  X,
  type LucideIcon
} from "lucide-react";
import { promoterLogoutAction } from "@/app/promoter/login/actions";
import styles from "./promoter-panel.module.css";

type PromoterShellProps = {
  accountKey: string;
  legalName: string;
  statusLabel: string;
  separated: boolean;
  readOnly: boolean;
  children: ReactNode;
};

type NavGroups = { commercial: boolean; income: boolean };

const NAV_GROUPS_KEY_PREFIX = "orderops.promoter.nav-groups.v1.";

type NavLink = { href: string; label: string; icon: LucideIcon };
type Area = { href: string; label: string; icon: LucideIcon; match: (path: string) => boolean };

const HOME: Area = { href: "/promoter", label: "Inicio", icon: LayoutDashboard, match: (path) => path === "/promoter" };
const TASKS: Area = { href: "/promoter/tasks", label: "Tareas", icon: ListTodo, match: (path) => path.startsWith("/promoter/tasks") };
const UTILITIES: Area[] = [
  { href: "/promoter/onboarding", label: "Ayuda", icon: LifeBuoy, match: (path) => path.startsWith("/promoter/onboarding") },
  { href: "/promoter/resources", label: "Recursos", icon: BookOpen, match: (path) => path.startsWith("/promoter/resources") },
  { href: "/promoter/profile", label: "Mi perfil", icon: CircleUserRound, match: (path) => path.startsWith("/promoter/profile") }
];

const COMMERCIAL_LINKS: NavLink[] = [
  { href: "/promoter/opportunities", label: "Oportunidades", icon: Target },
  { href: "/promoter/businesses", label: "Mis comercios", icon: Store },
  { href: "/promoter/claims", label: "Reclamaciones", icon: MessageSquareWarning }
];

const INCOME_LINKS: NavLink[] = [
  { href: "/promoter/settlements?vista=comisiones", label: "Comisiones", icon: Coins },
  { href: "/promoter/settlements?vista=liquidaciones", label: "Liquidaciones", icon: ReceiptText }
];

function focusFromKeyboard(node: HTMLElement | null | undefined) {
  node?.focus({ focusVisible: true } as FocusOptions);
}

function accountStatusTone(label: string) {
  if (label === "Activo") return "active";
  if (label === "Pendiente de verificación") return "pending";
  if (label === "Suspendido" || label === "Desvinculado") return "restricted";
  return undefined;
}

function navGroupsKey(accountKey: string) {
  return `${NAV_GROUPS_KEY_PREFIX}${accountKey}`;
}

function readNavGroups(accountKey: string): NavGroups | null {
  if (!accountKey) return null;
  try {
    const raw = window.localStorage.getItem(navGroupsKey(accountKey));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const record = parsed as Record<string, unknown>;
    if (typeof record.commercial !== "boolean" || typeof record.income !== "boolean") return null;
    return { commercial: record.commercial, income: record.income };
  } catch {
    return null;
  }
}

function writeNavGroups(accountKey: string, groups: NavGroups) {
  if (!accountKey) return;
  try {
    window.localStorage.setItem(navGroupsKey(accountKey), JSON.stringify({ commercial: groups.commercial, income: groups.income }));
  } catch {
    // The in-memory choice still applies for this visit.
  }
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter((part) => part.length > 0);
  const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "");
  return letters.join("") || "P";
}

export function PromoterShell({ accountKey, legalName, statusLabel, separated, readOnly, children }: PromoterShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();
  const locationKey = `${pathname}?${searchKey}`;
  const commercial = pathname.startsWith("/promoter/opportunities") || pathname.startsWith("/promoter/businesses") || pathname.startsWith("/promoter/claims");
  const income = pathname.startsWith("/promoter/settlements");
  const liquidaciones = searchParams.get("vista") === "liquidaciones" || searchParams.has("notice");
  const routeGroup = commercial ? "commercial" : income ? "income" : null;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const routeSeed = useRef<NavGroups | null>(null);
  if (!routeSeed.current) {
    routeSeed.current = { commercial: routeGroup === "commercial", income: routeGroup === "income" };
  }
  const [groups, setGroups] = useState<NavGroups>(routeSeed.current);
  const groupsHydrated = useRef(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const asideRef = useRef<HTMLElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const drawerWasOpen = useRef(false);
  const drawerOpenRef = useRef(false);
  const commercialOpen = groups.commercial;
  const incomeOpen = groups.income;
  const groupOpenRef = useRef({ commercial: commercialOpen, income: incomeOpen });
  groupOpenRef.current = { commercial: commercialOpen, income: incomeOpen };
  drawerOpenRef.current = drawerOpen;

  useLayoutEffect(() => {
    const stored = readNavGroups(accountKey);
    const next = stored ?? routeSeed.current ?? { commercial: false, income: false };
    if (!stored) writeNavGroups(accountKey, next);
    groupsHydrated.current = true;
    setGroups(next);
  }, [accountKey]);

  useEffect(() => {
    setDrawerOpen(false);
    setAccountOpen(false);
  }, [locationKey]);

  useEffect(() => {
    if (!drawerOpen) {
      if (drawerWasOpen.current) focusFromKeyboard(menuButtonRef.current);
      drawerWasOpen.current = false;
      return;
    }
    drawerWasOpen.current = true;
    const media = window.matchMedia("(max-width: 800px)");
    if (!media.matches) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const aside = asideRef.current;
    const focusable = aside
      ? [...aside.querySelectorAll<HTMLElement>("a, button")].filter((node) => !node.hasAttribute("disabled") && node.getClientRects().length > 0)
      : [];
    (focusable.find((node) => node.closest("nav")) ?? focusable[0])?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDrawerOpen(false);
        return;
      }
      if (event.key !== "Tab" || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (!accountOpen) return;
    function onPointer(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node) || accountRef.current?.contains(target)) return;
      setAccountOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [accountOpen]);

  useEffect(() => {
    function collapseGroup(group: "commercial" | "income") {
      setGroups((current) => {
        const next = { ...current, [group]: false };
        if (groupsHydrated.current) writeNavGroups(accountKey, next);
        return next;
      });
    }
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape" || drawerOpenRef.current) return;
      const active = document.activeElement;
      if (!(active instanceof HTMLElement)) return;
      if (accountRef.current?.contains(active)) {
        event.preventDefault();
        focusFromKeyboard(accountButtonRef.current);
        setAccountOpen(false);
        return;
      }
      const group = active.closest<HTMLElement>("[data-nav-group]");
      const name = group?.getAttribute("data-nav-group");
      if (!group || (name !== "commercial" && name !== "income") || !groupOpenRef.current[name]) return;
      event.preventDefault();
      focusFromKeyboard(group.querySelector("button"));
      collapseGroup(name);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [accountKey, locationKey]);

  function toggleGroup(group: "commercial" | "income") {
    setGroups((current) => {
      const next = { ...current, [group]: !current[group] };
      if (groupsHydrated.current) writeNavGroups(accountKey, next);
      return next;
    });
  }

  const crumbs = breadcrumb(pathname, income, liquidaciones);

  return (
    <div className={styles.frame} data-promoter-shell="">
      {drawerOpen ? <button type="button" className={styles.backdrop} aria-label="Cerrar menú" onClick={() => setDrawerOpen(false)} /> : null}
      <aside ref={asideRef} className={drawerOpen ? styles.sidebarOpen : styles.sidebar} aria-label="Portal de promotores">
        <div className={styles.brand}>
          <div className={styles.brandMark}>
            <p className={styles.identity}>OrderOps</p>
            <p className={styles.brandSub}>PANEL DE PROMOTORES</p>
          </div>
          <button type="button" className={styles.drawerClose} aria-label="Cerrar" onClick={() => setDrawerOpen(false)}>
            <X className={styles.icon} aria-hidden="true" />
          </button>
        </div>
        <nav className={styles.nav}>
          <div className={styles.navPrimary}>
            <AreaLink area={HOME} pathname={pathname} />
            <NavGroup
              groupKey="commercial"
              label="Comercial"
              icon={BriefcaseBusiness}
              links={COMMERCIAL_LINKS}
              pathname={pathname}
              income={false}
              liquidaciones={liquidaciones}
              expanded={!separated && commercialOpen}
              hidden={separated}
              onToggle={() => toggleGroup("commercial")}
            />
            <AreaLink area={TASKS} pathname={pathname} />
            <NavGroup
              groupKey="income"
              label="Ingresos"
              icon={Wallet}
              links={INCOME_LINKS}
              pathname={pathname}
              income
              liquidaciones={liquidaciones}
              expanded={!separated && incomeOpen}
              hidden={separated}
              onToggle={() => toggleGroup("income")}
            />
          </div>
          <div className={styles.navUtility}>
            {UTILITIES.map((area) => <AreaLink key={area.href} area={area} pathname={pathname} />)}
          </div>
        </nav>
      </aside>
      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <button
            ref={menuButtonRef}
            type="button"
            className={styles.menuButton}
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen((value) => !value)}
          >
            <Menu className={styles.icon} aria-hidden="true" />
            Menú
          </button>
          <nav className={styles.crumbs} aria-label="Ubicación">
            {crumbs.map((crumb, index) => (
              <span key={crumb} className={styles.crumb}>
                {index > 0 ? <span className={styles.crumbSep} aria-hidden="true">/</span> : null}
                {crumb}
              </span>
            ))}
          </nav>
          <div className={styles.account} ref={accountRef}>
            <button
              ref={accountButtonRef}
              type="button"
              className={styles.accountButton}
              aria-expanded={accountOpen}
              aria-haspopup="true"
              aria-label={`Cuenta de ${legalName}`}
              onClick={() => setAccountOpen((value) => !value)}
            >
              <span className={styles.avatar} aria-hidden="true">{initials(legalName)}</span>
              <span className={styles.accountName}>{legalName}</span>
              <ChevronDown className={styles.accountChevron} aria-hidden="true" />
            </button>
            {accountOpen ? (
              <div className={styles.accountMenu}>
                <div className={styles.accountIdentity}>
                  <span className={styles.avatar} aria-hidden="true">{initials(legalName)}</span>
                  <div className={styles.accountCopy}>
                    <p className={styles.accountTitle}>{legalName}</p>
                    <p className={styles.accountStatus} data-tone={accountStatusTone(statusLabel)}>{statusLabel}</p>
                  </div>
                </div>
                <Link href="/promoter/profile" className={styles.accountProfile} onClick={() => setAccountOpen(false)}>
                  <UserRound className={styles.accountActionIcon} aria-hidden="true" />
                  Ver perfil
                </Link>
                <form action={promoterLogoutAction}>
                  <button type="submit" className={styles.accountLogout}>
                    <LogOut className={styles.accountActionIcon} aria-hidden="true" />
                    Cerrar sesión
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        </header>
        <main className={styles.main}>
          {separated ? (
            <section className={styles.card}>
              <h1>Acceso revocado</h1>
              <p>Tu cuenta fue desvinculada. El panel no muestra la cartera ni permite operar.</p>
              <p className={styles.muted}>Contactá al administrador de OrderOps para revisar el acceso. El historial económico no se borra desde esta pantalla.</p>
            </section>
          ) : (
            <>
              {readOnly ? (
                <p className={styles.muted}>Esta cuenta consulta el panel. Las acciones de operación quedan deshabilitadas hasta que la cuenta esté activa.</p>
              ) : null}
              {children}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function breadcrumb(pathname: string, income: boolean, liquidaciones: boolean) {
  if (pathname === "/promoter") return ["Inicio"];
  if (pathname.startsWith("/promoter/opportunities")) return ["Comercial", "Oportunidades"];
  if (pathname.startsWith("/promoter/businesses")) return ["Comercial", "Mis comercios"];
  if (pathname.startsWith("/promoter/claims")) return ["Comercial", "Reclamaciones"];
  if (pathname.startsWith("/promoter/tasks")) return ["Tareas"];
  if (income) return ["Ingresos", liquidaciones ? "Liquidaciones" : "Comisiones"];
  if (pathname.startsWith("/promoter/onboarding")) return ["Ayuda"];
  if (pathname.startsWith("/promoter/resources")) return ["Recursos"];
  if (pathname.startsWith("/promoter/profile")) return ["Mi perfil"];
  return ["Portal"];
}

function AreaLink({
  area,
  pathname
}: {
  area: Area;
  pathname: string;
}) {
  const active = area.match(pathname);
  const Icon = area.icon;
  return (
    <Link href={area.href} aria-current={active ? "page" : undefined} className={active ? styles.navCurrent : undefined}>
      <Icon className={styles.icon} aria-hidden="true" />
      <span className={styles.navLabel}>{area.label}</span>
    </Link>
  );
}

function NavGroup({
  groupKey,
  label,
  icon: Icon,
  links,
  pathname,
  income,
  liquidaciones,
  expanded,
  hidden,
  onToggle
}: {
  groupKey: "commercial" | "income";
  label: string;
  icon: typeof BriefcaseBusiness;
  links: NavLink[];
  pathname: string;
  income: boolean;
  liquidaciones: boolean;
  expanded: boolean;
  hidden: boolean;
  onToggle: () => void;
}) {
  const menuId = useId();
  return (
    <div className={styles.group} data-nav-group={groupKey}>
      <div className={styles.groupRow}>
        <button
          type="button"
          className={styles.groupButton}
          aria-expanded={hidden ? undefined : expanded}
          aria-controls={hidden ? undefined : menuId}
          onClick={hidden ? undefined : onToggle}
        >
          <Icon className={styles.icon} aria-hidden="true" />
          <span className={styles.navLabel}>{label}</span>
          {hidden ? null : <ChevronDown className={styles.chevronIcon} aria-hidden="true" />}
        </button>
      </div>
      {expanded ? (
        <nav id={menuId} className={styles.subnav} aria-label={label}>
          {links.map((link) => {
            const active = income
              ? pathname.startsWith("/promoter/settlements") && (link.label === "Liquidaciones" ? liquidaciones : !liquidaciones)
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
            const ChildIcon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-label={link.label}
                aria-current={active ? "page" : undefined}
                className={active ? `${styles.subLink} ${styles.navCurrent}` : styles.subLink}
              >
                <ChildIcon className={styles.subIcon} aria-hidden="true" />
                <span className={styles.navLabel}>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
