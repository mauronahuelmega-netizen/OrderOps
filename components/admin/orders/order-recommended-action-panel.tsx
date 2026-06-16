import type { AdminOrderWorkspaceData } from "@/lib/orders/workspace";
import styles from "./order-recommended-action-panel.module.css";

type AdminOrderStatus = AdminOrderWorkspaceData["status"];

export type BuildRecommendedOrderActionInput = {
  status: AdminOrderStatus;
  assignedTo?: string | null;
  currentUserId?: string | null;
  canUpdateOrders: boolean;
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

export function buildRecommendedOrderAction({
  status,
  assignedTo,
  canUpdateOrders
}: BuildRecommendedOrderActionInput): RecommendedOrderAction {
  if (!canUpdateOrders) {
    return {
      tone: "neutral",
      eyebrow: "Acción recomendada",
      title: "Modo lectura",
      description:
        "No tenés permisos para modificar este pedido. Podés revisar el contexto y el historial.",
      ctaKind: "none"
    };
  }

  if (status === "cancelled") {
    return {
      tone: "neutral",
      eyebrow: "Acción recomendada",
      title: "Pedido cancelado",
      description: "Este pedido ya no requiere acción operativa.",
      ctaKind: "none"
    };
  }

  if (status === "completed") {
    return {
      tone: "success",
      eyebrow: "Acción recomendada",
      title: "Pedido completado",
      description: "Este pedido ya fue cerrado correctamente.",
      ctaKind: "none"
    };
  }

  if (status === "pending" && !hasAssignedOperator(assignedTo)) {
    return {
      tone: "primary",
      eyebrow: "Acción recomendada",
      title: "Tomá el pedido",
      description: "Asignate este pedido para empezar a gestionarlo.",
      ctaLabel: 'Usá el botón "Tomar pedido" debajo.',
      ctaKind: "claim"
    };
  }

  if (status === "pending") {
    return {
      tone: "warning",
      eyebrow: "Acción recomendada",
      title: "Prepará el pedido",
      description: "Cuando el equipo empiece a trabajar, cambiá el estado a Preparando.",
      ctaLabel: "Usá el selector de estado debajo.",
      ctaKind: "status-guidance"
    };
  }

  if (status === "preparing") {
    return {
      tone: "primary",
      eyebrow: "Acción recomendada",
      title: "Marcá cuando esté listo",
      description: "Cuando el pedido salga de cocina, cambiá el estado a Listo.",
      ctaLabel: "Usá el selector de estado debajo.",
      ctaKind: "status-guidance"
    };
  }

  if (status === "ready") {
    return {
      tone: "primary",
      eyebrow: "Acción recomendada",
      title: "Cerrá la operación",
      description: "Cuando el pedido se entregue o retire, cambialo a Completado.",
      ctaLabel: "Usá el selector de estado debajo.",
      ctaKind: "status-guidance"
    };
  }

  return {
    tone: "neutral",
    eyebrow: "Acción recomendada",
    title: "Revisá el pedido",
    description: "Usá los controles debajo para gestionar este pedido.",
    ctaKind: "none"
  };
}

type OrderRecommendedActionPanelProps = {
  status: AdminOrderStatus;
  assignedTo?: string | null;
  currentUserId?: string | null;
  canUpdateOrders: boolean;
};

export default function OrderRecommendedActionPanel({
  status,
  assignedTo,
  currentUserId,
  canUpdateOrders
}: OrderRecommendedActionPanelProps) {
  const recommendation = buildRecommendedOrderAction({
    status,
    assignedTo,
    currentUserId,
    canUpdateOrders
  });

  const panelClassName = [
    "order-recommended-action-panel",
    TONE_SURFACE_CLASS[recommendation.tone],
    styles.panel
  ].join(" ");

  return (
    <section className={panelClassName} aria-label="Acción recomendada">
      <p className={styles.eyebrow}>{recommendation.eyebrow}</p>
      <h3 className={styles.title}>{recommendation.title}</h3>
      <p className={styles.description}>{recommendation.description}</p>
      {recommendation.ctaLabel ? (
        <p className={styles.hint}>{recommendation.ctaLabel}</p>
      ) : null}
    </section>
  );
}
