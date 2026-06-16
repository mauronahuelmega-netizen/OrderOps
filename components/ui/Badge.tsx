import type { HTMLAttributes } from "react";
import type { OrderStatus } from "@/types/database";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendiente",
  preparing: "Preparando",
  ready: "Listo",
  completed: "Completado",
  cancelled: "Cancelado"
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  status: OrderStatus;
};

export default function Badge({ status, className, ...props }: BadgeProps) {
  const statusClass = status.replace("_", "-");
  const classes = ["ui-badge", `ui-badge--${statusClass}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} {...props}>
      {STATUS_LABELS[status]}
    </span>
  );
}
