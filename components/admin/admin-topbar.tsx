import "./admin-topbar.css";
import type { AdminBusinessBrand } from "@/components/admin/admin-shell";
import AdminBrand from "@/components/admin/layout/admin-brand";
import AdminMobileDrawer from "@/components/admin/admin-mobile-drawer";
import type { ProfileRole } from "@/types/database";

type AdminTopbarProps = {
  userLabel: string;
  businessBrand: AdminBusinessBrand;
  role: ProfileRole;
};

export default function AdminTopbar({ userLabel, businessBrand, role }: AdminTopbarProps) {
  return (
    <header className="admin-shell__header admin-shell__topbar admin-header admin-topbar">
      <div className="admin-header__inner admin-topbar__inner">
        <div className="admin-topbar__brand">
          <AdminBrand
            logoUrl={businessBrand.logoUrl}
            name={businessBrand.name}
            variant="topbar"
          />
        </div>

        <div className="admin-topbar__menu-action admin-header__mobile-action">
          <AdminMobileDrawer
            userLabel={userLabel}
            logoUrl={businessBrand.logoUrl}
            name={businessBrand.name}
            role={role}
          />
        </div>
      </div>
    </header>
  );
}
