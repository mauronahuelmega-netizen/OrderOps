import type { AdminOrderWorkspaceData } from "@/lib/orders/workspace";
import styles from "./order-recommended-action-panel.module.css";

type AdminOrderStatus = AdminOrderWorkspaceData["status"];

export type BuildRecommendedOrderActionInput = {
  status: AdminOrderStatus;
  assignedTo?: string | null;
  currentUserId?: string | null;
  canUpdateOrders: boolean;
  orderResponsibilityEnabled?: boolean;
};

export type RecommendedOrderActionTone = "primary" | "neutral" | "success" | "warning";

export type RecommendedOrderAction = {
  tone: RecommendedOrderActionTone;
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaKind?: "claim" | "status-guidance" | "none";
};

const TONE_SURFACE_CLASS: Record<RecommendedOrderActionTone, string> = {
  primary: "order-recommended-action-panel--primary",
  neutral: "order-recommended-action-panel--neutral",
  success: "order-recommended-action-panel--success",
  warning: "order-recommended-action-panel--warning"
};

function hasAssignedOperator(assignedTo?: string | null) {
  return Boolean(assignedTo?.trim());
}

function isTerminalOrderStatus(status: AdminOrderStatus) {
  return status === "completed" || status === "cancelled";
}

function recommendedActionEyebrow(status: AdminOrderStatus) {
  return isTerminalOrderStatus(status) ? "Estado final" : "Próximo paso";
}

export function buildRecommendedOrderAction({
  status,
  assignedTo,
  canUpdateOrders,
  orderResponsibilityEnabled = true
}: BuildRecommendedOrderActionInput): RecommendedOrderAction {
  if (!canUpdateOrders) {
    return {
      tone: "neutral",
      eyebrow: recommendedActionEyebrow(status),
      title: "Modo lectura",
      description:
        "No tenés permisos para modificar este pedido. Podés revisar el contexto y el historial.",
      ctaKind: "none"
    };
  }

  if (status === "cancelled") {
    return {
      tone: "neutral",
      eyebrow: recommendedActionEyebrow(status),
      title: "Pedido cancelado",
      description: "Este pedido ya no requiere acción operativa.",
      ctaKind: "none"
    };
  }

  if (status === "completed") {
    return {
      tone: "success",
      eyebrow: recommendedActionEyebrow(status),
      title: "Pedido completado",
      description: "Este pedido ya fue cerrado correctamente.",
      ctaKind: "none"
    };
  }

  if (orderResponsibilityEnabled && status === "pending" && !hasAssignedOperator(assignedTo)) {
    return {
      tone: "primary",
      eyebrow: recommendedActionEyebrow(status),
      title: "Tomá el pedido",
      description: "Asignate este pedido para empezar a gestionarlo.",
      ctaKind: "claim"
    };
  }

  if (status === "pending") {
    return {
      tone: "warning",
      eyebrow: recommendedActionEyebrow(status),
      title: "Prepará el pedido",
      description: "Cuando cocina empiece, pasalo a Preparando.",
      ctaKind: "status-guidance"
    };
  }

  if (status === "preparing") {
    return {
      tone: "primary",
      eyebrow: recommendedActionEyebrow(status),
      title: "Marcá cuando esté listo",
      description: "Cuando salga de cocina, pasalo a Listo.",
      ctaKind: "status-guidance"
    };
  }

  if (status === "ready") {
    return {
      tone: "primary",
      eyebrow: recommendedActionEyebrow(status),
      title: "Cerrá la operación",
      description: "Al entregar o retirar, pasalo a Completado.",
      ctaKind: "status-guidance"
    };
  }

  return {
    tone: "neutral",
    eyebrow: recommendedActionEyebrow(status),
    title: "Revisá el pedido",
    description: "Usá los controles de estado para avanzar la operación.",
    ctaKind: "none"
  };
}

type OrderRecommendedActionPanelProps = {
  status: AdminOrderStatus;
  assignedTo?: string | null;
  currentUserId?: string | null;
  canUpdateOrders: boolean;
  orderResponsibilityEnabled?: boolean;
};

export default function OrderRecommendedActionPanel({
  status,
  assignedTo,
  currentUserId,
  canUpdateOrders,
  orderResponsibilityEnabled = true
}: OrderRecommendedActionPanelProps) {
  const recommendation = buildRecommendedOrderAction({
    status,
    assignedTo,
    currentUserId,
    canUpdateOrders,
    orderResponsibilityEnabled
  });

  const panelClassName = [
    "order-recommended-action-panel",
    TONE_SURFACE_CLASS[recommendation.tone],
    styles.panel
  ].join(" ");

  return (
    <section className={panelClassName} aria-label={recommendation.eyebrow}>
      <p className={styles.eyebrow}>{recommendation.eyebrow}</p>
      <h3 className={styles.title}>{recommendation.title}</h3>
      <p className={styles.description}>{recommendation.description}</p>
      {recommendation.ctaLabel ? (
        <p className={styles.hint}>{recommendation.ctaLabel}</p>
      ) : null}
    </section>
  );
}
