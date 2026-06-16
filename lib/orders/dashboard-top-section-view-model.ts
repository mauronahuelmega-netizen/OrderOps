import type { AdminOrderDashboardItem } from "@/lib/orders/admin";
import {
  buildAdminOrdersAnalytics,
  getAnalyticsScopeCopy,
  resolveAnalyticsScopeKind,
  resolveDashboardTopSectionMetaStatus,
  type AdminOrdersAnalytics,
  type DashboardTopSectionScopeIndicator,
  type OperationalWindow
} from "@/lib/orders/analytics";
import {
  BUSINESS_INSIGHT_THRESHOLDS,
  OPERATIONAL_THRESHOLDS
} from "@/lib/orders/constants";
import {
  buildOperationalMetrics,
  formatOperationalMetricMinutes,
  type AdminOperationalMetrics
} from "@/lib/orders/metrics";
import { formatAdminOrderCurrency } from "@/lib/orders/presenter";
import {
  calculateSaturationIndex,
  type SaturationIndexResult
} from "@/lib/orders/saturation-metrics";

export type DashboardTopSectionTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

export type DashboardBusinessKpiId =
  | "revenue"
  | "averageTicket"
  | "activeOrders"
  | "topProduct";

export type DashboardOperationalKpiId =
  | "kitchenStatus"
  | "delayedOrders"
  | "averageTime"
  | "readyWaiting";

export type DashboardTopSectionInsightId =
  | "stalled-orders"
  | "delivery-dominance"
  | "pickup-dominance"
  | "ready-waiting"
  | "recent-peak"
  | "positive-operations";

export type DashboardTopSectionFutureActionKey =
  | "filter-delayed"
  | "filter-delivery"
  | "filter-pickup"
  | "filter-ready"
  | "focus-recent"
  | null;

export type DashboardTopSectionViewModelInput = {
  orders: AdminOrderDashboardItem[];
  operationalWindow: OperationalWindow;
  now: Date;
  liveLabel: string;
  realtimeStatus?: string;
  onlineCount: number;
  presenceLabel?: string;
};

export type DashboardTopSectionMeta = {
  title: "Panel del Negocio";
  sessionLabel: string;
  /** Realtime label for active session; mirrors `statusLabel` when present. */
  liveLabel: string;
  statusLabel: string | null;
  scopeIndicator: DashboardTopSectionScopeIndicator;
  showScopeDot: boolean;
  scopeAriaLabel: string;
  showPresence: boolean;
  presenceLabel: string | null;
};

export type DashboardStatusSummaryViewModel = {
  label: "Estado del negocio";
  healthLabel: string;
  tone: DashboardTopSectionTone;
  detail: string;
  revenueLabel: string;
  supportingSignals: string[];
};

export type DashboardTopSectionKpiViewModel = {
  id: DashboardBusinessKpiId | DashboardOperationalKpiId;
  label: string;
  value: string;
  detail?: string;
  tone: DashboardTopSectionTone;
  priority: "primary" | "secondary";
  iconKey?: string;
};

export type DashboardTopSectionInsightViewModel = {
  id: DashboardTopSectionInsightId;
  title: string;
  detail: string;
  tone: DashboardTopSectionTone;
  futureActionKey: DashboardTopSectionFutureActionKey;
  priority: number;
};

export type DashboardTopSectionViewModel = {
  meta: DashboardTopSectionMeta;
  statusSummary: DashboardStatusSummaryViewModel;
  businessKpis: DashboardTopSectionKpiViewModel[];
  operationalKpis: DashboardTopSectionKpiViewModel[];
  insights: DashboardTopSectionInsightViewModel[];
};

const { RECENT_PEAK_WINDOW_MINUTES, RECENT_PEAK_MIN_ORDERS } = BUSINESS_INSIGHT_THRESHOLDS;
const { DELIVERY_DOMINANCE_RATIO, PREPARATION_SLOW_MINUTES } = OPERATIONAL_THRESHOLDS;

type PresenterContext = {
  input: DashboardTopSectionViewModelInput;
  orders: AdminOrderDashboardItem[];
  commercial: AdminOrdersAnalytics;
  operational: AdminOperationalMetrics;
  saturation: SaturationIndexResult;
  sessionLabel: string;
  scopeCopy: ReturnType<typeof getAnalyticsScopeCopy>;
};

export function buildDashboardTopSectionViewModel(
  input: DashboardTopSectionViewModelInput
): DashboardTopSectionViewModel {
  const orders = input.orders;
  const commercial = buildAdminOrdersAnalytics(orders);
  const operational = buildOperationalMetrics(orders, input.now);
  const saturation = calculateSaturationIndex(orders);
  const scopeCopy = getAnalyticsScopeCopy(resolveAnalyticsScopeKind(input.operationalWindow.source));
  const sessionLabel = scopeCopy.sessionLabel;

  const ctx: PresenterContext = {
    input,
    orders,
    commercial,
    operational,
    saturation,
    sessionLabel,
    scopeCopy
  };

  return {
    meta: buildMeta(input, sessionLabel),
    statusSummary: buildStatusSummary(ctx),
    businessKpis: buildBusinessKpis(ctx),
    operationalKpis: buildOperationalKpis(ctx),
    insights: buildTopSectionInsights(ctx)
  };
}

function buildMeta(
  input: DashboardTopSectionViewModelInput,
  sessionLabel: string
): DashboardTopSectionMeta {
  const showPresence = input.onlineCount > 1;
  const metaStatus = resolveDashboardTopSectionMetaStatus({
    source: input.operationalWindow.source,
    liveLabel: input.liveLabel
  });

  return {
    title: "Panel del Negocio",
    sessionLabel,
    liveLabel: metaStatus.statusLabel ?? "",
    statusLabel: metaStatus.statusLabel,
    scopeIndicator: metaStatus.scopeIndicator,
    showScopeDot: metaStatus.showScopeDot,
    scopeAriaLabel: metaStatus.scopeAriaLabel,
    showPresence,
    presenceLabel: showPresence ? `${input.onlineCount} online` : null
  };
}

function buildStatusSummary(ctx: PresenterContext): DashboardStatusSummaryViewModel {
  const { commercial, operational, saturation, scopeCopy } = ctx;
  const delayed = operational.stalledCount;
  const active = commercial.activeOrders;
  const revenueLabel = formatAdminOrderCurrency(commercial.revenue);
  const salesPrefix = scopeCopy.salesPrefix;

  let healthLabel: string;
  let tone: DashboardTopSectionTone;

  if (delayed > 0) {
    healthLabel = "Atención requerida";
    tone = delayed >= 3 ? "danger" : "warning";
  } else if (saturation.level === "bottleneck") {
    healthLabel = "Saturada";
    tone = "danger";
  } else if (saturation.level === "high_demand") {
    healthLabel = "Atención requerida";
    tone = "warning";
  } else if (active === 0) {
    healthLabel = "Sin actividad";
    tone = "neutral";
  } else {
    healthLabel = "Cocina fluida";
    tone = "success";
  }

  return {
    label: "Estado del negocio",
    healthLabel,
    tone,
    detail: `${salesPrefix}: ${revenueLabel}`,
    revenueLabel,
    supportingSignals: buildSupportingSignals(ctx)
  };
}

function buildSupportingSignals(ctx: PresenterContext): string[] {
  const signals: string[] = [];
  const { commercial, operational } = ctx;
  const readyCount = countReady(ctx.orders);

  if (operational.stalledCount === 0) {
    signals.push("Sin demoras");
  } else {
    signals.push(pluralizePedidos(operational.stalledCount) + " demorados");
  }

  if (commercial.activeOrders > 0) {
    signals.push(pluralizePedidos(commercial.activeOrders) + " activos");
  }

  if (readyCount > 0) {
    signals.push(pluralizePedidos(readyCount) + " listo" + (readyCount === 1 ? "" : "s"));
  }

  if (
    typeof operational.averagePreparationMinutes === "number" &&
    operational.averagePreparationMinutes > PREPARATION_SLOW_MINUTES
  ) {
    signals.push("Preparación lenta");
  }

  return signals.slice(0, 3);
}

function buildBusinessKpis(ctx: PresenterContext): DashboardTopSectionKpiViewModel[] {
  const { commercial, sessionLabel } = ctx;
  const ticket = formatAverageTicketKpi(commercial);
  const topProduct = formatTopProductKpi(commercial.topProduct);

  return [
    {
      id: "revenue",
      label: "Ventas",
      value: formatAdminOrderCurrency(commercial.revenue),
      detail: sessionLabel,
      tone: "neutral",
      priority: "primary",
      iconKey: "banknote"
    },
    {
      id: "averageTicket",
      label: "Ticket promedio",
      value: ticket.value,
      detail: "Por pedido",
      tone: ticket.tone,
      priority: "secondary",
      iconKey: "receipt"
    },
    {
      id: "activeOrders",
      label: "Pedidos activos",
      value: pluralizePedidos(commercial.activeOrders),
      detail: "Pendientes + preparación + listos",
      tone: "info",
      priority: "secondary",
      iconKey: "activity"
    },
    {
      id: "topProduct",
      label: "Más vendido",
      value: topProduct.value,
      detail: topProduct.detail,
      tone: topProduct.tone,
      priority: "secondary",
      iconKey: "star"
    }
  ];
}

function buildOperationalKpis(ctx: PresenterContext): DashboardTopSectionKpiViewModel[] {
  const kitchen = resolveKitchenStatus(ctx.saturation, ctx.commercial.activeOrders);
  const delayed = ctx.operational.stalledCount;
  const avgPrep = ctx.operational.averagePreparationMinutes;
  const readyCount = countReady(ctx.orders);

  return [
    {
      id: "kitchenStatus",
      label: "Estado de cocina",
      value: kitchen.value,
      detail: kitchen.detail,
      tone: kitchen.tone,
      priority: "primary",
      iconKey: "chef"
    },
    {
      id: "delayedOrders",
      label: "Pedidos demorados",
      value: delayed === 0 ? "Sin demoras" : pluralizePedidos(delayed),
      detail:
        delayed === 0 ? "Dentro del ritmo esperado" : "Superan umbral de inactividad",
      tone: delayed === 0 ? "success" : delayed >= 3 ? "danger" : "warning",
      priority: "secondary",
      iconKey: "clock"
    },
    {
      id: "averageTime",
      label: "Tiempo promedio",
      value: formatOperationalMetricMinutes(avgPrep),
      detail: "Preparación",
      tone: resolvePreparationTone(avgPrep),
      priority: "secondary",
      iconKey: "timer"
    },
    {
      id: "readyWaiting",
      label: "Listos esperando salida",
      value: readyCount === 0 ? "Sin pedidos listos" : pluralizePedidos(readyCount),
      detail: "En ready",
      tone: readyCount >= 2 ? "warning" : readyCount === 1 ? "info" : "success",
      priority: "secondary",
      iconKey: "package-ready"
    }
  ];
}

function buildTopSectionInsights(ctx: PresenterContext): DashboardTopSectionInsightViewModel[] {
  const candidates: DashboardTopSectionInsightViewModel[] = [];
  const { operational, orders, input, scopeCopy } = ctx;
  const readyCount = countReady(orders);
  const deliveryDominanceTitle = scopeCopy.deliveryDominanceTitle;
  const pickupDominanceTitle = scopeCopy.pickupDominanceTitle;

  if (operational.stalledCount > 0) {
    candidates.push({
      id: "stalled-orders",
      title: "Revisar demorados",
      detail: formatNeedsReviewDetail(operational.stalledCount),
      tone: "warning",
      futureActionKey: "filter-delayed",
      priority: 10
    });
  }

  if (readyCount >= 2) {
    candidates.push({
      id: "ready-waiting",
      title: "Pedidos listos",
      detail: formatReadyWaitingInsightDetail(readyCount),
      tone: "warning",
      futureActionKey: "filter-ready",
      priority: 20
    });
  }

  const recentCount = countOrdersCreatedWithin(orders, input.now, RECENT_PEAK_WINDOW_MINUTES);
  if (recentCount >= RECENT_PEAK_MIN_ORDERS) {
    candidates.push({
      id: "recent-peak",
      title: "Pico reciente",
      detail: `${recentCount} pedidos en los últimos ${RECENT_PEAK_WINDOW_MINUTES} min`,
      tone: "info",
      futureActionKey: "focus-recent",
      priority: 30
    });
  }

  const mix = getNonCancelledDeliveryMix(orders);
  if (mix.total > 0) {
    const deliveryRatio = mix.delivery / mix.total;
    const pickupRatio = mix.pickup / mix.total;

    if (deliveryRatio >= DELIVERY_DOMINANCE_RATIO) {
      candidates.push({
        id: "delivery-dominance",
        title: deliveryDominanceTitle,
        detail: `${mix.delivery} de ${mix.total} pedidos`,
        tone: "info",
        futureActionKey: "filter-delivery",
        priority: 40
      });
    } else if (pickupRatio >= DELIVERY_DOMINANCE_RATIO) {
      candidates.push({
        id: "pickup-dominance",
        title: pickupDominanceTitle,
        detail: `${mix.pickup} de ${mix.total} pedidos`,
        tone: "info",
        futureActionKey: "filter-pickup",
        priority: 50
      });
    }
  }

  candidates.sort((left, right) => left.priority - right.priority);

  const selected = candidates.slice(0, 4);

  if (selected.length === 0) {
    return [buildPositiveInsight(ctx)];
  }

  return selected;
}

function buildPositiveOperationsInsightCopy(input: {
  nonCancelledOrdersCount: number;
  activeOrdersCount: number;
  operational: AdminOperationalMetrics;
}): {
  title: string;
  detail: string;
  tone: DashboardTopSectionTone;
} {
  if (input.nonCancelledOrdersCount === 0) {
    return {
      title: "Sin actividad operativa",
      detail: "Todavía no hay pedidos en curso",
      tone: "neutral"
    };
  }

  if (input.activeOrdersCount === 0) {
    return {
      title: "Operación tranquila",
      detail: "Sin pedidos activos",
      tone: "success"
    };
  }

  let detail = "Sin demoras";

  if (
    typeof input.operational.averagePreparationMinutes === "number" &&
    input.operational.averagePreparationMinutes <= PREPARATION_SLOW_MINUTES
  ) {
    detail = "Sin preparación lenta";
  } else if (input.operational.stalledCount === 0) {
    detail = "Sin demoras";
  } else {
    detail = "Operación estable";
  }

  return {
    title: "Buen ritmo operativo",
    detail,
    tone: "success"
  };
}

function buildPositiveInsight(ctx: PresenterContext): DashboardTopSectionInsightViewModel {
  const { commercial, operational } = ctx;
  const copy = buildPositiveOperationsInsightCopy({
    nonCancelledOrdersCount: commercial.validOrdersCount,
    activeOrdersCount: commercial.activeOrders,
    operational
  });

  return {
    id: "positive-operations",
    title: copy.title,
    detail: copy.detail,
    tone: copy.tone,
    futureActionKey: null,
    priority: 90
  };
}

function resolveKitchenStatus(saturation: SaturationIndexResult, activeCount: number) {
  if (activeCount === 0 && saturation.preparingCount === 0) {
    return {
      value: "Sin actividad",
      detail: "Sin pedidos en cocina",
      tone: "neutral" as const
    };
  }

  switch (saturation.level) {
    case "bottleneck":
      return {
        value: "Saturada",
        detail: "Carga elevada",
        tone: "danger" as const
      };
    case "high_demand":
      return {
        value: "Atención requerida",
        detail: "Alta demanda",
        tone: "warning" as const
      };
    case "fluid":
    default:
      return {
        value: "Cocina fluida",
        detail: "Ritmo estable",
        tone: "success" as const
      };
  }
}

function formatAverageTicketKpi(commercial: AdminOrdersAnalytics) {
  if (commercial.validOrdersCount === 0) {
    return { value: "Sin datos", tone: "neutral" as const };
  }

  return {
    value: formatAdminOrderCurrency(commercial.averageTicket),
    tone: "neutral" as const
  };
}

function formatTopProductKpi(topProduct: AdminOrdersAnalytics["topProduct"]) {
  if (!topProduct) {
    return { value: "Sin ventas todavía", detail: undefined, tone: "neutral" as const };
  }

  const detail =
    topProduct.quantity === 1 ? "1 unidad" : `${topProduct.quantity} unidades`;

  return {
    value: topProduct.name,
    detail,
    tone: "neutral" as const
  };
}

function resolvePreparationTone(value: number | null): DashboardTopSectionTone {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "neutral";
  }

  if (value > PREPARATION_SLOW_MINUTES) {
    return "warning";
  }

  return "neutral";
}

function countReady(orders: readonly AdminOrderDashboardItem[]) {
  return orders.filter((order) => order.status === "ready").length;
}

function pluralizePedidos(count: number) {
  if (count === 1) {
    return "1 pedido";
  }

  return `${count} pedidos`;
}

function formatNeedsReviewDetail(count: number) {
  return count === 1
    ? "1 pedido necesita revisión"
    : `${count} pedidos necesitan revisión`;
}

function formatReadyWaitingInsightDetail(count: number) {
  return count === 1 ? "1 pedido espera salida" : `${count} pedidos esperan salida`;
}

function countOrdersCreatedWithin(
  orders: readonly AdminOrderDashboardItem[],
  now: Date,
  windowMinutes: number
) {
  return orders.filter((order) => isWithinMinutes(order.created_at, now, windowMinutes)).length;
}

function isWithinMinutes(timestamp: string, now: Date, thresholdMinutes: number) {
  const createdAt = new Date(timestamp);

  if (Number.isNaN(createdAt.getTime())) {
    return false;
  }

  const diffMinutes = (now.getTime() - createdAt.getTime()) / 60000;
  return diffMinutes >= 0 && diffMinutes <= thresholdMinutes;
}

function getNonCancelledDeliveryMix(orders: readonly AdminOrderDashboardItem[]) {
  let delivery = 0;
  let pickup = 0;

  for (const order of orders) {
    if (order.status === "cancelled") {
      continue;
    }

    if (order.delivery_method === "delivery") {
      delivery += 1;
    } else if (order.delivery_method === "pickup") {
      pickup += 1;
    }
  }

  return { delivery, pickup, total: delivery + pickup };
}
