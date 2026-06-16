"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updateTeamMemberRoleAction } from "@/app/admin/(protected)/team/actions";
import type { ProfileRole } from "@/types/database";

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
  const [role, setRole] = useState<TeamRoleOption>(member.role as TeamRoleOption);
  const [state, formAction, isPending] = useActionState(updateTeamMemberRoleAction, initialState);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <form action={formAction} className="admin-team-row__form">
      <input type="hidden" name="user_id" value={member.id} />

      <label className="admin-field">
        <span>Rol</span>
        <select
          name="role"
          value={role}
          disabled={isPending}
          onChange={(event) => setRole(event.target.value as TeamRoleOption)}
        >
          {TEAM_ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className="admin-team-row__actions">
        <button type="submit" className="admin-primary-button" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar rol"}
        </button>
      </div>

      <div className="admin-inline-feedback">
        {state.error ? <p className="admin-feedback admin-feedback--error">{state.error}</p> : null}
        {state.success ? (
          <p className="admin-feedback admin-feedback--success">Rol actualizado.</p>
        ) : null}
      </div>
    </form>
  );
}
