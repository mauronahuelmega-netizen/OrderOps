"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createTeamMemberAction } from "@/app/admin/(protected)/team/actions";

type ActionState = {
  error?: string;
  success?: boolean;
};

const initialState: ActionState = {};

const TEAM_ROLE_OPTIONS = [
  { value: "manager", label: "manager" },
  { value: "operator", label: "operator" },
  { value: "viewer", label: "viewer" }
] as const;

export default function CreateTeamMemberForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(createTeamMemberAction, initialState);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <form ref={formRef} action={formAction} className="admin-form-card">
      <div className="admin-form-header">
        <h2>Nuevo usuario interno</h2>
        <p>
          Crea un usuario operativo para tu negocio. Compartile esta contrasena temporal
          y pedile que la cambie luego.
        </p>
      </div>

      <label className="admin-field">
        <span>Email</span>
        <input name="email" type="email" autoComplete="email" disabled={isPending} required />
      </label>

      <label className="admin-field">
        <span>Contrasena temporal</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          disabled={isPending}
          required
        />
      </label>

      <label className="admin-field">
        <span>Rol</span>
        <select name="role" defaultValue="operator" disabled={isPending} required>
          {TEAM_ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <p className="admin-field-hint">
        En esta fase solo podes crear manager, operator o viewer. Owner y transfer de
        ownership quedan fuera del alcance.
      </p>

      {state.error ? <p className="admin-feedback admin-feedback--error">{state.error}</p> : null}
      {state.success ? (
        <p className="admin-feedback admin-feedback--success">Usuario creado.</p>
      ) : null}

      <button type="submit" className="admin-primary-button" disabled={isPending}>
        {isPending ? "Creando..." : "Crear usuario"}
      </button>
    </form>
  );
}
