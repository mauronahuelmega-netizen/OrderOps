"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBusinessAction } from "@/app/super-admin/(protected)/actions";

type ActionState = {
  error?: string;
  success?: boolean;
};

const initialState: ActionState = {};

export default function CreateBusinessForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(createBusinessAction, initialState);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <form ref={formRef} action={formAction} className="admin-form-card">
      <div className="admin-form-header">
        <h2>Nuevo negocio</h2>
        <p>Crea un negocio nuevo y dejalo disponible para onboarding.</p>
      </div>

      <label className="admin-field">
        <span>Nombre</span>
        <input name="name" type="text" disabled={isPending} required />
      </label>

      <label className="admin-field">
        <span>Slug</span>
        <input name="slug" type="text" disabled={isPending} required />
      </label>

      <label className="admin-field">
        <span>WhatsApp</span>
        <input name="whatsapp_number" type="text" disabled={isPending} required />
      </label>

      {state.error ? <p className="admin-feedback admin-feedback--error">{state.error}</p> : null}
      {state.success ? (
        <p className="admin-feedback admin-feedback--success">Negocio creado.</p>
      ) : null}

      <button type="submit" className="admin-primary-button" disabled={isPending}>
        {isPending ? "Guardando..." : "Crear negocio"}
      </button>
    </form>
  );
}
