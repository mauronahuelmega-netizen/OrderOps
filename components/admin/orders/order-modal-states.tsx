import { OrderModalWorkspaceSkeleton } from "./order-modal-skeleton";
import styles from "./admin-order-modal.module.css";

export function OrderModalLoadingState() {
  return <OrderModalWorkspaceSkeleton />;
}

type OrderModalErrorStateProps = {
  message: string;
};

export function OrderModalErrorState({ message }: OrderModalErrorStateProps) {
  return (
    <div
      className={`${styles["admin-order-modal-state"]} ${styles["admin-order-modal-state--error"]}`}
    >
      <h3>No pudimos abrir el pedido</h3>
      <p>{message}</p>
    </div>
  );
}
