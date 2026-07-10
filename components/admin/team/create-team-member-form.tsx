"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createTeamMemberAction } from "@/app/admin/(protected)/team/actions";
import styles from "./team-settings.module.css";

type ActionState = {
  error?: string;
  success?: boolean;
};

const initialState: ActionState = {};

const TEAM_ROLE_OPTIONS = [
  { value: "manager", label: "manager" },
  { value: "operator", label: "operator" },
  { value: "viewer", label: "viewer" }
] as const;

export default function CreateTeamMemberForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(createTeamMemberAction, initialState);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className={`${styles.card} ${styles.cardSecondary}`}
      aria-labelledby="team-create-title"
    >
      <div className={styles.cardHeader}>
        <h2 id="team-create-title" className={`${styles.cardTitle} ${styles.cardTitleCompact}`}>
          Nuevo usuario interno
        </h2>
        <p className={styles.cardDescription}>
          Creá un acceso operativo para tu negocio. Compartí la contraseña temporal y pedile que la
          cambie luego.
        </p>
      </div>

      <div className={styles.createGrid}>
        <div className={styles.createFields}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Email</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              className={styles.input}
              disabled={isPending}
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Contraseña temporal</span>
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              className={styles.input}
              minLength={8}
              disabled={isPending}
              required
            />
          </label>
        </div>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Rol</span>
          <select
            name="role"
            defaultValue="operator"
            className={styles.select}
            disabled={isPending}
            required
          >
            {TEAM_ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <p className={styles.fieldHint}>
          En esta fase podés crear manager, operator o viewer. Owner y transferencia de ownership
          quedan fuera de alcance.
        </p>
      </div>

      <div className={styles.inlineFeedback} aria-live="polite">
        {state.error ? (
          <p className={`${styles.feedback} ${styles.feedbackError}`}>{state.error}</p>
        ) : null}
        {state.success ? (
          <p className={`${styles.feedback} ${styles.feedbackSuccess}`}>Usuario creado.</p>
        ) : null}
      </div>

      <div className={styles.actionsRow}>
        <button type="submit" className={styles.primaryButton} disabled={isPending}>
          {isPending ? "Creando..." : "Crear usuario"}
        </button>
      </div>
    </form>
  );
}
