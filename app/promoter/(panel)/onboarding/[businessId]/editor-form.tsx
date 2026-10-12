"use client";

import { useActionState } from "react";
import { savePromoterCatalogAction } from "../actions";
import styles from "@/components/commercial/onboarding-ui.module.css";

export function PromoterProductEditor({
  businessId,
  productId,
  name,
  description
}: {
  businessId: string;
  productId: string;
  name: string;
  description: string;
}) {
  const [state, action, pending] = useActionState(savePromoterCatalogAction, {});
  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="business_id" value={businessId} />
      <input type="hidden" name="product_id" value={productId} />
      <label>
        Nombre
        <input name="name" defaultValue={name} required />
      </label>
      <label>
        Descripción
        <textarea name="description" defaultValue={description} />
      </label>
      <button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar contenido"}
      </button>
      {state.error ? <p className={styles.error} role="alert">{state.error}</p> : null}
      {state.success ? <p className={styles.message} role="status">{state.success}</p> : null}
    </form>
  );
}
