"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { updateTeamMemberRoleAction } from "@/app/admin/(protected)/team/actions";
import type { ProfileRole } from "@/types/database";
import styles from "./team-settings.module.css";

type TeamMemberRoleFormProps = {
  member: {
    id: string;
    role: ProfileRole;
  };
};

type ActionState = {
  error?: string;
  success?: boolean;
};

const initialState: ActionState = {};
type TeamRoleOption = "manager" | "operator" | "viewer";

const TEAM_ROLE_OPTIONS = [
  { value: "manager", label: "manager" },
  { value: "operator", label: "operator" },
  { value: "viewer", label: "viewer" }
] as const;

export default function TeamMemberRoleForm({ member }: TeamMemberRoleFormProps) {
  const router = useRouter();
  const selectId = useId();
  const [role, setRole] = useState<TeamRoleOption>(member.role as TeamRoleOption);
  const [state, formAction, isPending] = useActionState(updateTeamMemberRoleAction, initialState);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <form action={formAction} className={styles.roleForm}>
      <input type="hidden" name="user_id" value={member.id} />

      <div className={styles.roleFormFields}>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor={selectId}>
            Rol
          </label>
          <select
            id={selectId}
            name="role"
            value={role}
            className={styles.select}
            disabled={isPending}
            onChange={(event) => setRole(event.target.value as TeamRoleOption)}
          >
            {TEAM_ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className={styles.primaryButton} disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar rol"}
        </button>
      </div>

      <div className={styles.inlineFeedback} aria-live="polite">
        {state.error ? (
          <p className={`${styles.feedback} ${styles.feedbackError}`}>{state.error}</p>
        ) : null}
        {state.success ? (
          <p className={`${styles.feedback} ${styles.feedbackSuccess}`}>Rol actualizado.</p>
        ) : null}
      </div>
    </form>
  );
}
