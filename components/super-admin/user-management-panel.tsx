"use client";

import { useMemo, useState } from "react";
import EditUserForm from "@/components/super-admin/edit-user-form";
import type { SuperAdminBusiness } from "@/lib/super-admin/businesses";
import type { SuperAdminUser } from "@/lib/super-admin/users";

type UserManagementPanelProps = {
  businesses: SuperAdminBusiness[];
  users: SuperAdminUser[];
  currentUserId: string;
};

export default function UserManagementPanel({
  businesses,
  users,
  currentUserId
}: UserManagementPanelProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [selectedUserId, users]
  );

  return (
    <>
      <div className="super-admin-users-list">
        {users.map((user) => (
          <article key={user.id} className="super-admin-user-row">
            <div className="super-admin-user-copy">
              <div className="admin-order-row">
                <h2>{user.email}</h2>
                <span
                  className={`admin-status-badge ${
                    user.is_disabled
                      ? "admin-status-badge--cancelled"
                      : "admin-status-badge--completed"
                  }`}
                >
                  {user.is_disabled ? "Desactivado" : "Activo"}
                </span>
              </div>

              <div className="admin-order-meta">
                <span>{user.business_name ?? "Sin negocio"}</span>
              </div>
            </div>

            <button
              type="button"
              className="admin-secondary-link"
              onClick={() => setSelectedUserId(user.id)}
            >
              Gestionar
            </button>
          </article>
        ))}
      </div>

      {selectedUser ? (
        <div
          className="super-admin-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="super-admin-user-modal-title"
        >
          <div className="super-admin-modal">
            <div className="super-admin-modal-header">
              <div>
                <p className="catalog-eyebrow">Gestión de usuario</p>
                <h2 id="super-admin-user-modal-title">{selectedUser.email}</h2>
              </div>

              <button
                type="button"
                className="admin-secondary-link"
                onClick={() => setSelectedUserId(null)}
              >
                Cerrar
              </button>
            </div>

            <EditUserForm
              businesses={businesses}
              user={selectedUser}
              currentUserId={currentUserId}
              onClose={() => setSelectedUserId(null)}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
