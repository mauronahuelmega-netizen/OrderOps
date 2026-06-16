import OperatorPresencePill from "@/components/admin/orders/operator-presence-pill";
import styles from "./admin-order-modal.module.css";

type OrderModalWorkspaceToolbarProps = {
  loading?: boolean;
  orderPresenceLabel?: string | null;
  orderPresenceNames?: string[];
};

function BackgroundHydrationStatus() {
  return (
    <span className="sr-only" role="status" aria-live="polite">
      Actualizando pedido
    </span>
  );
}

export default function OrderModalWorkspaceToolbar({
  loading = false,
  orderPresenceLabel,
  orderPresenceNames = []
}: OrderModalWorkspaceToolbarProps) {
  if (loading) {
    if (!orderPresenceLabel) {
      return <BackgroundHydrationStatus />;
    }

    return (
      <>
        <BackgroundHydrationStatus />
        <div
          className={`${styles["admin-order-modal-workstation-toolbar"]} ${styles["admin-order-modal-workstation-toolbar--presence"]}`}
        >
          <OperatorPresencePill
            label={orderPresenceLabel}
            names={orderPresenceNames}
            tone="contextual"
            ariaLabel={orderPresenceLabel}
          />
        </div>
      </>
    );
  }

  if (!orderPresenceLabel) {
    return null;
  }

  return (
    <div
      className={`${styles["admin-order-modal-workstation-toolbar"]} ${styles["admin-order-modal-workstation-toolbar--presence"]}`}
    >
      <OperatorPresencePill
        label={orderPresenceLabel}
        names={orderPresenceNames}
        tone="contextual"
        ariaLabel={orderPresenceLabel}
      />
    </div>
  );
}
