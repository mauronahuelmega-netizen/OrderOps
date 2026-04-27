"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClientAction } from "@/app/super-admin/(protected)/actions";

type ActionState = {
  error?: string;
  success?: boolean;
};

const initialState: ActionState = {};

export default function CreateClientForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(createClientAction, initialState);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <form ref={formRef} action={formAction} className="admin-form-card">
      <div className="admin-form-header">
        <h2>Crear nuevo cliente</h2>
        <p>Crea el negocio y su usuario admin en un unico paso.</p>
      </div>

      <div className="admin-product-grid">
        <label className="admin-field">
          <span>Nombre del negocio</span>
          <input name="name" type="text" disabled={isPending} required />
        </label>

        <label className="admin-field">
          <span>Slug del negocio</span>
          <input name="slug" type="text" disabled={isPending} required />
        </label>
      </div>

      <label className="admin-field">
        <span>WhatsApp del negocio</span>
        <input name="whatsapp_number" type="text" disabled={isPending} required />
      </label>

      <div className="admin-product-grid">
        <label className="admin-field">
          <span>Email del usuario admin</span>
          <input name="email" type="email" autoComplete="email" disabled={isPending} required />
        </label>

        <label className="admin-field">
          <span>Password del usuario admin</span>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            disabled={isPending}
            required
          />
        </label>
      </div>

      {state.error ? <p className="admin-feedback admin-feedback--error">{state.error}</p> : null}
      {state.success ? (
        <p className="admin-feedback admin-feedback--success">
          Cliente creado correctamente.
        </p>
      ) : null}

      <button type="submit" className="admin-primary-button" disabled={isPending}>
        {isPending ? "Creando..." : "Crear cliente"}
      </button>
    </form>
  );
}
