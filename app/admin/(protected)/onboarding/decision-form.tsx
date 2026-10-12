"use client";

import { useActionState } from "react";
import { decideOnboardingAction } from "./actions";
import styles from "@/components/commercial/onboarding-ui.module.css";

export function OnboardingDecisionForm({
  grantId,
  decision,
  label
}: {
  grantId: string;
  decision: "approve" | "reject" | "revoke";
  label: string;
}) {
  const [state, action, pending] = useActionState(decideOnboardingAction, {});
  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="grant_id" value={grantId} />
      <input type="hidden" name="decision" value={decision} />
      <button type="submit" disabled={pending}>
        {pending ? "Guardando…" : label}
      </button>
      {state.error ? <p className={styles.error} role="alert">{state.error}</p> : null}
      {state.success ? <p className={styles.message} role="status">{state.success}</p> : null}
    </form>
  );
}
