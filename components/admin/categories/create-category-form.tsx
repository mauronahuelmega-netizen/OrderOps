"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createCategoryAction } from "@/app/admin/(protected)/categories/actions";

type ActionState = {
  error?: string;
  success?: boolean;
};

const initialState: ActionState = {};

export default function CreateCategoryForm({
  embedded = false
}: {
  embedded?: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [state, formAction, isPending] = useActionState(createCategoryAction, initialState);

  useEffect(() => {
    if (state.success) {
      setName("");
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <form action={formAction} className={embedded ? "admin-embedded-form" : "admin-form-card"}>
      {!embedded ? (
        <div className="admin-form-header">
          <h2>Nueva categoría</h2>
          <p>Creá una categoría simple para organizar tu catálogo.</p>
        </div>
      ) : null}

      <label className="admin-field">
        <span>Nombre</span>
        <input
          name="name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={isPending}
          required
        />
      </label>

      {state.error ? <p className="admin-feedback admin-feedback--error">{state.error}</p> : null}
      {state.success ? (
        <p className="admin-feedback admin-feedback--success">Categoría creada.</p>
      ) : null}

      <button type="submit" className="admin-primary-button" disabled={isPending}>
        {isPending ? "Guardando..." : "Crear categoría"}
      </button>
    </form>
  );
}
