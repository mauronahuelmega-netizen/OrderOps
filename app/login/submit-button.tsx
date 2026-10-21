"use client";

import { useFormStatus } from "react-dom";
import styles from "./login.module.css";

export function LoginSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.submit} disabled={pending} aria-busy={pending}>
      {pending ? "Ingresando…" : "Ingresar"}
    </button>
  );
}
