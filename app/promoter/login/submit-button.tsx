"use client";

import { useFormStatus } from "react-dom";
import styles from "./promoter-login.module.css";

export function PromoterLoginSubmit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.submit} disabled={pending} aria-busy={pending}>
      {pending ? "Ingresando…" : "Iniciar sesión"}
    </button>
  );
}
