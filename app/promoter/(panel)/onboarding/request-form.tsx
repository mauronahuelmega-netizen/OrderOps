"use client";

import { useActionState } from "react";
import { requestOnboardingAction } from "./actions";
import styles from "@/components/commercial/onboarding-ui.module.css";

export function RequestAssistanceForm({ businessId }: { businessId: string }) {
  const [state, action, pending] = useActionState(requestOnboardingAction, {});
  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="business_id" value={businessId} />
      <button type="submit" disabled={pending}>
        {pending ? "Enviando solicitud…" : "Solicitar asistencia"}
      </button>
      {state.error ? <p className={styles.error} role="alert">{state.error}</p> : null}
      {state.success ? <p className={styles.message} role="status">{state.success}</p> : null}
    </form>
  );
}
