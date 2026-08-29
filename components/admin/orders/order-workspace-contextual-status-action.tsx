"use client";

import Button from "@/components/ui/Button";
import statusStyles from "./order-workspace-status-section.module.css";

type OrderWorkspaceContextualStatusActionProps = {
  label: string;
  isPending: boolean;
  onAction: () => void;
  /** Visual placement owner — CSS shows only one at a time. */
  placement: "inline" | "persistent";
};

/**
 * Presentational contextual status CTA.
 * Does not own mutation lifecycle — parent supplies pending + submit.
 */
export default function OrderWorkspaceContextualStatusAction({
  label,
  isPending,
  onAction,
  placement
}: OrderWorkspaceContextualStatusActionProps) {
  return (
    <Button
      type="button"
      className={`admin-primary-button ${statusStyles.contextualAction} ${
        placement === "inline"
          ? statusStyles.contextualActionInline
          : statusStyles.contextualActionPersistent
      }`}
      disabled={isPending}
      aria-busy={isPending}
      data-contextual-status-placement={placement}
      onClick={onAction}
    >
      {isPending ? "Actualizando…" : label}
    </Button>
  );
}
