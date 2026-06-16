"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBusinessUserAction } from "@/app/super-admin/(protected)/actions";
import type { SuperAdminBusiness } from "@/lib/super-admin/businesses";
import type { ProfileRole } from "@/types/database";

type CreateBusinessUserFormProps = {
  businesses: SuperAdminBusiness[];
};

type ActionState = {
  error?: string;
  success?: boolean;
};

const initialState: ActionState = {};
const BUSINESS_ROLE_OPTIONS: Array<{
  value: Exclude<ProfileRole, "admin" | "super_admin">;
  label: string;
}> = [
  { value: "owner", label: "owner" },
  { value: "manager", label: "manager" },
  { value: "operator", label: "operator" },
  { value: "viewer", label: "viewer" }
];

export default function CreateBusinessUserForm({
  businesses
}: CreateBusinessUserFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    createBusinessUserAction,
    initialState
  );

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <form ref={formRef} action={formAction} className="admin-form-card">
      <div className="admin-form-header">
        <h2>Nuevo usuario del negocio</h2>
        <p>Crea un usuario y asignale un rol operativo dentro de un negocio existente.</p>
      </div>

      <label className="admin-field">
        <span>Email</span>
        <input name="email" type="email" autoComplete="email" disabled={isPending} required />
      </label>

      <label className="admin-field">
        <span>Contrasena</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          disabled={isPending}
          required
        />
      </label>

      <label className="admin-field">
        <span>Negocio</span>
        <select name="business_id" defaultValue="" disabled={isPending} required>
          <option value="" disabled>
            Selecciona un negocio
          </option>
          {businesses.map((business) => (
            <option key={business.id} value={business.id}>
              {business.name} ({business.slug})
            </option>
          ))}
        </select>
      </label>

      <label className="admin-field">
        <span>Rol</span>
        <select name="role" defaultValue="operator" disabled={isPending} required>
          {BUSINESS_ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {state.error ? <p className="admin-feedback admin-feedback--error">{state.error}</p> : null}
      {state.success ? (
        <p className="admin-feedback admin-feedback--success">Usuario creado.</p>
      ) : null}

      <button type="submit" className="admin-primary-button" disabled={isPending}>
        {isPending ? "Guardando..." : "Crear usuario"}
      </button>
    </form>
  );
}
