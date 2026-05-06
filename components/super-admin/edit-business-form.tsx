"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteBusinessAction,
  updateBusinessAction
} from "@/app/super-admin/(protected)/actions";
import type { SuperAdminBusiness } from "@/lib/super-admin/businesses";

type EditBusinessFormProps = {
  business: SuperAdminBusiness;
};

type ActionState = {
  error?: string;
  success?: boolean;
};

const initialState: ActionState = {};

export default function EditBusinessForm({ business }: EditBusinessFormProps) {
  const router = useRouter();
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [state, formAction, isPending] = useActionState(updateBusinessAction, initialState);
  const [deleteState, deleteFormAction, isDeletePending] = useActionState(
    deleteBusinessAction,
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
    }
  }, [deleteState.success, router]);

  return (
    <div className="super-admin-business-card">
      <form action={formAction} className="super-admin-business-form">
        <input type="hidden" name="business_id" value={business.id} />

        <div className="admin-product-header">
          <h2>{business.name}</h2>
          <label className="admin-toggle">
            <input
              name="is_active"
              type="checkbox"
              defaultChecked={business.is_active}
              disabled={isPending}
            />
            <span>{business.is_active ? "Activo" : "Inactivo"}</span>
          </label>
        </div>

        <div className="admin-product-grid">
          <label className="admin-field">
            <span>Nombre</span>
            <input
              name="name"
              type="text"
              defaultValue={business.name}
              disabled={isPending}
              required
            />
          </label>

          <label className="admin-field">
            <span>Slug</span>
            <input
              name="slug"
              type="text"
              defaultValue={business.slug}
              disabled={isPending}
              required
            />
          </label>
        </div>

        <label className="admin-field">
          <span>WhatsApp</span>
          <input
            name="whatsapp_number"
            type="text"
            defaultValue={business.whatsapp_number}
            disabled={isPending}
            required
          />
        </label>

        <div className="admin-product-actions">
          <button type="submit" className="admin-primary-button" disabled={isPending}>
            {isPending ? "Guardando..." : "Guardar negocio"}
          </button>
        </div>

        <div className="admin-inline-feedback">
          {state.error ? <p className="admin-feedback admin-feedback--error">{state.error}</p> : null}
          {state.success ? (
            <p className="admin-feedback admin-feedback--success">Negocio actualizado.</p>
          ) : null}
        </div>
      </form>

      <div className="super-admin-danger-zone">
        <div className="admin-form-header">
          <h3>Eliminar negocio</h3>
          <p>Esta acción no se puede deshacer.</p>
        </div>

        <form action={deleteFormAction} className="super-admin-danger-form">
          <input type="hidden" name="business_id" value={business.id} />

          <label className="admin-field">
            <span>Escribí el slug para confirmar</span>
            <input
              name="confirm_slug"
              type="text"
              value={deleteConfirmation}
              disabled={isDeletePending}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              placeholder={business.slug}
            />
          </label>

          <div className="admin-product-actions">
            <button
              type="submit"
              className="admin-danger-button"
              disabled={isDeletePending || deleteConfirmation.trim().toLowerCase() !== business.slug}
            >
              {isDeletePending ? "Eliminando..." : "Eliminar negocio"}
            </button>
          </div>

          <div className="admin-inline-feedback">
            {deleteState.error ? (
              <p className="admin-feedback admin-feedback--error">{deleteState.error}</p>
            ) : null}
            {deleteState.success ? (
              <p className="admin-feedback admin-feedback--success">Negocio eliminado.</p>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
