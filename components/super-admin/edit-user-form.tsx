"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteBusinessUserAction,
  updateBusinessUserAction
} from "@/app/super-admin/(protected)/actions";
import type { SuperAdminBusiness } from "@/lib/super-admin/businesses";
import type { SuperAdminUser } from "@/lib/super-admin/users";

type EditUserFormProps = {
  businesses: SuperAdminBusiness[];
  user: SuperAdminUser;
  currentUserId: string;
  allowRoleChange?: boolean;
  onClose?: () => void;
};

type ActionState = {
  error?: string;
  success?: boolean;
};

const initialState: ActionState = {};

export default function EditUserForm({
  businesses,
  user,
  currentUserId,
  allowRoleChange = false,
  onClose
}: EditUserFormProps) {
  const router = useRouter();
  const [role, setRole] = useState<"admin" | "super_admin">(user.role);
  const [businessId, setBusinessId] = useState(user.business_id ?? "");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [state, formAction, isPending] = useActionState(updateBusinessUserAction, initialState);
  const [deleteState, deleteFormAction, isDeletePending] = useActionState(
    deleteBusinessUserAction,
    initialState
  );

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  useEffect(() => {
    if (deleteState.success) {
      router.refresh();
      onClose?.();
    }
  }, [deleteState.success, onClose, router]);

  return (
    <div className="super-admin-user-form">
      <form action={formAction} className="super-admin-user-form-section">
        <input type="hidden" name="user_id" value={user.id} />

        <div className="admin-field">
          <span>Email</span>
          <div className="super-admin-readonly">{user.email}</div>
        </div>

        <div className="admin-product-grid">
          {allowRoleChange ? (
            <label className="admin-field">
              <span>Rol</span>
              <select
                name="role"
                value={role}
                disabled={isPending}
                onChange={(event) => setRole(event.target.value as "admin" | "super_admin")}
              >
                <option value="admin">admin</option>
                <option value="super_admin">super_admin</option>
              </select>
            </label>
          ) : (
            <input type="hidden" name="role" value="admin" />
          )}

          <label className="admin-field">
            <span>Negocio</span>
            <select
              name="business_id"
              value={role === "super_admin" ? "" : businessId}
              disabled={isPending || role === "super_admin"}
              onChange={(event) => setBusinessId(event.target.value)}
              required={role === "admin"}
            >
              <option value="" disabled={role === "admin"}>
                {role === "super_admin" ? "No aplica" : "Selecciona un negocio"}
              </option>
              {businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name} ({business.slug})
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="admin-toggle">
          <input
            name="is_disabled"
            type="checkbox"
            defaultChecked={user.is_disabled}
            disabled={isPending}
          />
          <span>Usuario desactivado</span>
        </label>

        <div className="admin-product-actions">
          <button type="submit" className="admin-primary-button" disabled={isPending}>
            {isPending ? "Guardando..." : "Guardar usuario"}
          </button>
          {onClose ? (
            <button type="button" className="admin-secondary-link" onClick={onClose}>
              Cerrar
            </button>
          ) : null}
        </div>

        <div className="admin-inline-feedback">
          {state.error ? <p className="admin-feedback admin-feedback--error">{state.error}</p> : null}
          {state.success ? (
            <p className="admin-feedback admin-feedback--success">Usuario actualizado.</p>
          ) : null}
        </div>
      </form>

      <div className="super-admin-danger-zone">
        <div className="admin-form-header">
          <h3>Eliminar usuario</h3>
          <p>Esta accion no se puede deshacer.</p>
        </div>

        <form action={deleteFormAction} className="super-admin-danger-form">
          <input type="hidden" name="user_id" value={user.id} />

          <label className="admin-field">
            <span>Escribe el email para confirmar</span>
            <input
              name="confirm_email"
              type="text"
              value={deleteConfirmation}
              disabled={isDeletePending || user.id === currentUserId}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              placeholder={user.email}
            />
          </label>

          <div className="admin-product-actions">
            <button
              type="submit"
              className="admin-danger-button"
              disabled={
                isDeletePending ||
                user.id === currentUserId ||
                deleteConfirmation.trim().toLowerCase() !== user.email.trim().toLowerCase()
              }
            >
              {isDeletePending ? "Eliminando..." : "Eliminar usuario"}
            </button>
          </div>

          <div className="admin-inline-feedback">
            {user.id === currentUserId ? (
              <p className="admin-feedback admin-feedback--error">
                No puedes eliminar tu propio usuario.
              </p>
            ) : null}
            {deleteState.error ? (
              <p className="admin-feedback admin-feedback--error">{deleteState.error}</p>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
