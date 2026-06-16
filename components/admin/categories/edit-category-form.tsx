"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { updateCategoryAction } from "@/app/admin/(protected)/categories/actions";
import categoryLayoutStyles from "@/components/admin/categories/categories-layout.module.css";

type EditCategoryFormProps = {
  categoryId: string;
  initialName: string;
};

type ActionState = {
  error?: string;
  success?: boolean;
};

const initialState: ActionState = {};

export default function EditCategoryForm({
  categoryId,
  initialName
}: EditCategoryFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [state, formAction, isPending] = useActionState(updateCategoryAction, initialState);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <form action={formAction} className={categoryLayoutStyles.row}>
      <input type="hidden" name="category_id" value={categoryId} />

      <label className="admin-field admin-field--inline">
        <span className="sr-only">Nombre de categoría</span>
        <input
          name="name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={isPending}
          required
        />
      </label>

      <Button type="submit" className="admin-secondary-link" disabled={isPending} variant="secondary">
        {isPending ? "Guardando..." : "Guardar"}
      </Button>

      <div className="admin-inline-feedback">
        {state.error ? <p className="admin-feedback admin-feedback--error">{state.error}</p> : null}
        {state.success ? (
          <p className="admin-feedback admin-feedback--success">Actualizada.</p>
        ) : null}
      </div>
    </form>
  );
}
