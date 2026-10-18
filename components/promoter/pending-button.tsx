"use client";

import { useFormStatus } from "react-dom";

export function PendingButton({ children, disabled, pendingLabel = "Guardando…" }: {
  children: string;
  disabled?: boolean;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={disabled || pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}
