"use client";

import { useMemo, useState } from "react";
import EditBusinessForm from "@/components/super-admin/edit-business-form";
import type { SuperAdminBusiness } from "@/lib/super-admin/businesses";

type BusinessManagementPanelProps = {
  businesses: SuperAdminBusiness[];
};

export default function BusinessManagementPanel({
  businesses
}: BusinessManagementPanelProps) {
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);

  const selectedBusiness = useMemo(
    () => businesses.find((business) => business.id === selectedBusinessId) ?? null,
    [businesses, selectedBusinessId]
  );

  return (
    <>
      <div className="super-admin-compact-list">
        {businesses.map((business) => (
          <article key={business.id} className="super-admin-compact-card">
            <div className="super-admin-compact-copy">
              <div className="admin-order-row">
                <h2>{business.name}</h2>
                <span
                  className={`admin-status-badge ${
                    business.is_active
                      ? "admin-status-badge--completed"
                      : "admin-status-badge--cancelled"
                  }`}
                >
                  {business.is_active ? "Activo" : "Inactivo"}
                </span>
              </div>

              <div className="admin-order-meta">
                <span>{business.slug}</span>
                <span>{business.whatsapp_number}</span>
              </div>
            </div>

            <button
              type="button"
              className="admin-secondary-link"
              onClick={() => setSelectedBusinessId(business.id)}
            >
              Gestionar
            </button>
          </article>
        ))}
      </div>

      {selectedBusiness ? (
        <div
          className="super-admin-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="super-admin-business-modal-title"
        >
          <div className="super-admin-modal">
            <div className="super-admin-modal-header">
              <div>
                <p className="catalog-eyebrow">Gestión de negocio</p>
                <h2 id="super-admin-business-modal-title">{selectedBusiness.name}</h2>
              </div>

              <button
                type="button"
                className="admin-secondary-link"
                onClick={() => setSelectedBusinessId(null)}
              >
                Cerrar
              </button>
            </div>

            <EditBusinessForm business={selectedBusiness} />
          </div>
        </div>
      ) : null}
    </>
  );
}
