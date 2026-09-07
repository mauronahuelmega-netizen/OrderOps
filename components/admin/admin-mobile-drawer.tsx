"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LogOut, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/admin/actions";
import AdminBrand from "@/components/admin/layout/admin-brand";
import AdminNavList from "@/components/admin/layout/admin-nav-list";
import AdminThemeToggle from "@/components/admin/layout/admin-theme-toggle";
import {
  getAdminNavItemsForRole,
  isAdminNavItemFeatureEnabled
} from "@/components/admin/admin-nav-config";
import { useAdminBusinessSettings } from "@/components/admin/admin-shell";
import type { ProfileRole } from "@/types/database";

type AdminMobileDrawerProps = {
  userLabel: string;
  logoUrl: string | null;
  name: string | null;
  role: ProfileRole;
};

/** Matches CSS close transition (~180ms) + small settle margin. */
const DRAWER_CLOSE_MS = 200;

const ADMIN_DRAWER_OPEN_CLASS = "admin-drawer-open";
export const ADMIN_MOBILE_DRAWER_ID = "admin-mobile-drawer";
export const ADMIN_MOBILE_DRAWER_TITLE_ID = "admin-mobile-drawer-title";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

type DrawerMotionState = "closed" | "open" | "closing";

function getUserInitial(userLabel: string) {
  return userLabel.trim().charAt(0).toUpperCase() || "U";
}

function getFocusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      element.tabIndex !== -1 &&
      element.getClientRects().length > 0
  );
}

export default function AdminMobileDrawer({
  userLabel,
  logoUrl,
  name,
  role
}: AdminMobileDrawerProps) {
  const pathname = usePathname();
  const { settings, loading } = useAdminBusinessSettings();
  /** Portal remains mounted while open or closing (exit animation). */
  const [isRendered, setIsRendered] = useState(false);
  const [motionState, setMotionState] = useState<DrawerMotionState>("closed");
  const [isMounted, setIsMounted] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerPanelRef = useRef<HTMLElement>(null);
  const wasOpenRef = useRef(false);
  const closeTimeoutRef = useRef<number | null>(null);
  const openFrameRef = useRef<number | null>(null);
  const visibleItems = getAdminNavItemsForRole(role).filter((item) =>
    isAdminNavItemFeatureEnabled(item, settings, loading)
  );

  const isInteractive = isRendered && motionState === "open";
  /** Expanded while portal is mounted (including enter `closed` and exit `closing`). */
  const isExpanded = isRendered;

  const clearMotionTimers = useCallback(() => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    if (openFrameRef.current !== null) {
      window.cancelAnimationFrame(openFrameRef.current);
      openFrameRef.current = null;
    }
  }, []);

  const finishClose = useCallback(() => {
    clearMotionTimers();
    setIsRendered(false);
    setMotionState("closed");
  }, [clearMotionTimers]);

  const closeDrawer = useCallback(() => {
    if (!isRendered || motionState === "closing") {
      return;
    }

    clearMotionTimers();
    setMotionState("closing");
    closeTimeoutRef.current = window.setTimeout(() => {
      finishClose();
    }, DRAWER_CLOSE_MS);
  }, [clearMotionTimers, finishClose, isRendered, motionState]);

  const openDrawer = useCallback(() => {
    clearMotionTimers();

    if (isRendered && motionState === "closing") {
      setMotionState("open");
      return;
    }

    if (isRendered && motionState === "open") {
      return;
    }

    setIsRendered(true);
    setMotionState("closed");
    openFrameRef.current = window.requestAnimationFrame(() => {
      openFrameRef.current = window.requestAnimationFrame(() => {
        setMotionState("open");
        openFrameRef.current = null;
      });
    });
  }, [clearMotionTimers, isRendered, motionState]);

  useEffect(() => {
    setIsMounted(true);

    return () => {
      clearMotionTimers();
      document.documentElement.classList.remove(ADMIN_DRAWER_OPEN_CLASS);
      document.body.classList.remove(ADMIN_DRAWER_OPEN_CLASS);
    };
  }, [clearMotionTimers]);

  useEffect(() => {
    if (!isRendered) {
      return;
    }

    closeDrawer();
    // Pathname-driven close only; closeDrawer identity changes with motion state.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional pathname gate
  }, [pathname]);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (!isRendered) {
      root.classList.remove(ADMIN_DRAWER_OPEN_CLASS);
      body.classList.remove(ADMIN_DRAWER_OPEN_CLASS);
      return undefined;
    }

    root.classList.add(ADMIN_DRAWER_OPEN_CLASS);
    body.classList.add(ADMIN_DRAWER_OPEN_CLASS);

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDrawer();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      root.classList.remove(ADMIN_DRAWER_OPEN_CLASS);
      body.classList.remove(ADMIN_DRAWER_OPEN_CLASS);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [closeDrawer, isRendered]);

  useEffect(() => {
    if (!isInteractive) {
      if (wasOpenRef.current && !isRendered) {
        requestAnimationFrame(() => {
          menuButtonRef.current?.focus();
        });
      }

      if (!isRendered) {
        wasOpenRef.current = false;
      }

      return undefined;
    }

    wasOpenRef.current = true;

    requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab") {
        return;
      }

      const drawer = drawerPanelRef.current;

      if (!drawer) {
        return;
      }

      const focusableElements = getFocusableElements(drawer);

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (activeElement === firstElement || !drawer.contains(activeElement)) {
          event.preventDefault();
          lastElement.focus();
        }

        return;
      }

      if (activeElement === lastElement || !drawer.contains(activeElement)) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleTab, true);

    return () => {
      document.removeEventListener("keydown", handleTab, true);
    };
  }, [isInteractive, isRendered]);

  const drawerPortal =
    isMounted && isRendered
      ? createPortal(
          <div className="admin-mobile-drawer-portal" data-state={motionState}>
            <button
              type="button"
              className="admin-mobile-drawer-overlay"
              aria-label="Cerrar menú de administración"
              tabIndex={motionState === "closing" ? -1 : undefined}
              onClick={closeDrawer}
            />

            <aside
              ref={drawerPanelRef}
              id={ADMIN_MOBILE_DRAWER_ID}
              className="admin-mobile-drawer"
              role="dialog"
              aria-modal="true"
              aria-labelledby={ADMIN_MOBILE_DRAWER_TITLE_ID}
              inert={motionState === "closing"}
            >
              <div className="admin-mobile-drawer__header">
                <AdminBrand
                  logoUrl={logoUrl}
                  name={name}
                  variant="drawer"
                  headingId={ADMIN_MOBILE_DRAWER_TITLE_ID}
                />

                <button
                  ref={closeButtonRef}
                  type="button"
                  className="admin-mobile-drawer__close"
                  aria-label="Cerrar menú de administración"
                  onClick={closeDrawer}
                >
                  <span className="admin-mobile-drawer__close-line" />
                  <span className="admin-mobile-drawer__close-line" />
                </button>
              </div>

              <AdminNavList
                items={visibleItems}
                variant="drawer"
                onNavigate={closeDrawer}
              />

              <div className="admin-mobile-drawer__footer">
                <div className="admin-mobile-drawer__account">
                  <div className="admin-mobile-drawer__avatar" aria-hidden="true">
                    {getUserInitial(userLabel)}
                  </div>
                  <p className="admin-mobile-drawer__user-label" title={userLabel}>
                    {userLabel}
                  </p>
                </div>
                <div className="admin-mobile-drawer__theme-toggle">
                  <AdminThemeToggle layout="drawer" />
                </div>
                <div className="admin-mobile-drawer__logout">
                  <form action={logoutAction} className="admin-mobile-drawer__logout-form">
                    <button type="submit" className="admin-mobile-drawer__logout-button">
                      <span className="admin-mobile-drawer__logout-icon" aria-hidden="true">
                        <LogOut strokeWidth={1.75} />
                      </span>
                      <span className="admin-mobile-drawer__logout-label">Cerrar sesión</span>
                    </button>
                  </form>
                </div>
              </div>
            </aside>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        ref={menuButtonRef}
        type="button"
        className="admin-mobile-menu-button"
        aria-label="Abrir menú de administración"
        aria-expanded={isExpanded}
        aria-controls={ADMIN_MOBILE_DRAWER_ID}
        aria-haspopup="dialog"
        onClick={openDrawer}
      >
        <span className="admin-mobile-menu-button__icon" aria-hidden="true">
          <Menu strokeWidth={1.75} />
        </span>
      </button>
      {drawerPortal}
    </>
  );
}
