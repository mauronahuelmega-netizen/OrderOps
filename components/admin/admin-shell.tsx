"use client";

import {
  createContext,
  useContext,
  type ReactNode
} from "react";
import AdminTopbar from "@/components/admin/admin-topbar";
import { AdminFooter } from "@/components/admin/layout/admin-footer";
import AdminSidebar from "@/components/admin/layout/admin-sidebar";
import { useBusinessSettings } from "@/lib/business/use-business-settings";
import type { Database, ProfileRole } from "@/types/database";

export type AdminBusinessBrand = {
  name: string | null;
  logoUrl: string | null;
};

export type BusinessSettingsRow =
  Database["public"]["Tables"]["business_settings"]["Row"];

type AdminBusinessSettingsContextValue = {
  settings: BusinessSettingsRow | null;
  loading: boolean;
  error: Error | null;
};

const AdminBusinessSettingsContext =
  createContext<AdminBusinessSettingsContextValue | null>(null);

export function useAdminBusinessSettings(): AdminBusinessSettingsContextValue {
  const context = useContext(AdminBusinessSettingsContext);

  if (!context) {
    throw new Error("useAdminBusinessSettings must be used within AdminShell.");
  }

  return context;
}

type AdminShellProps = {
  businessId: string;
  children: ReactNode;
  userLabel: string;
  businessBrand: AdminBusinessBrand;
  role: ProfileRole;
};

export default function AdminShell({
  businessId,
  children,
  userLabel,
  businessBrand,
  role
}: AdminShellProps) {
  const { settings, loading, error } = useBusinessSettings({ businessId });

  if (loading) {
    return (
      <div className="admin-shell admin-shell--loading">
        <div
          className="admin-shell__loading"
          aria-busy="true"
          aria-live="polite"
          role="status"
        >
          <div className="admin-shell__loading-spinner" aria-hidden="true" />
          <p className="admin-shell__loading-title">Cargando panel</p>
          <p className="admin-shell__loading-subtitle">Un momento…</p>
        </div>
      </div>
    );
  }

  return (
    <AdminBusinessSettingsContext.Provider
      value={{
        settings,
        loading: false,
        error
      }}
    >
      <div className="admin-shell">
        <div className="admin-shell__sidebar-rail">
          <AdminSidebar
            role={role}
            logoUrl={businessBrand.logoUrl}
            name={businessBrand.name}
            userLabel={userLabel}
          />
        </div>
        <div className="admin-shell__column">
          <AdminTopbar userLabel={userLabel} businessBrand={businessBrand} role={role} />
          <main className="admin-shell__main">
            <div className="admin-shell__page-container">
              {children}
              <AdminFooter variant="compact" />
            </div>
          </main>
        </div>
      </div>
    </AdminBusinessSettingsContext.Provider>
  );
}
