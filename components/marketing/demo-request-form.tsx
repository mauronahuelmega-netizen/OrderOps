"use client";

import { useState } from "react";
import { submitDemoRequest } from "@/app/demo/actions";
import styles from "./demo-request-form.module.css";

export default function DemoRequestForm() {
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className={styles.form}
      action={async (formData) => {
        const result = await submitDemoRequest(formData);
        setError(result?.error ?? null);
      }}
    >
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <label className={styles.field}>
        <span>Nombre del responsable</span>
        <input name="contactName" required autoComplete="name" />
      </label>
      <label className={styles.field}>
        <span>Nombre del comercio</span>
        <input name="tradeName" required />
      </label>
      <label className={styles.field}>
        <span>WhatsApp</span>
        <input name="whatsapp" required inputMode="tel" autoComplete="tel" />
      </label>
      <label className={styles.field}>
        <span>Rubro</span>
        <input name="tradeCategory" required />
      </label>
      <label className={styles.field}>
        <span>Correo electrónico</span>
        <input name="email" type="email" autoComplete="email" />
      </label>
      <label className={styles.field}>
        <span>Necesidades</span>
        <textarea name="needs" rows={4} />
      </label>
      <p className={styles.privacy}>
        Usamos estos datos para responder la solicitud de demo.{" "}
        <a href="/privacidad">Política de privacidad</a>
      </p>
      {error ? <p className={styles.error}>{error}</p> : null}
      <div className={styles.actions}>
        <button type="submit">Enviar solicitud</button>
      </div>
    </form>
  );
}
