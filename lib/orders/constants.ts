/**
 * Umbrales operativos y de SLA compartidos por la capa de analíticas del dashboard.
 * Fuente única de verdad — evitar duplicar números mágicos en builders individuales.
 */

export const SLA_THRESHOLDS = {
  /** Porcentaje del tiempo esperado antes de alerta (ej. mix delivery 70%). */
  WARNING_PERCENTAGE: 0.7,
  /** Minutos sin movimiento considerados estancamiento operativo (prep lenta / SLA). */
  STAGNANT_MINUTES: 25,
  /** Tiempo de preparación base esperado por defecto (Fase 9.2 SLA Tracker). */
  DEFAULT_PREP_TIME_MINUTES: 15,
  /** Minutos restantes antes de la promesa para marcar un pedido en riesgo. */
  PROMISE_AT_RISK_MINUTES: 15
} as const;

export const SATURATION_THRESHOLDS = {
  /** Capacidad ideal de pedidos simultáneos en cocina (temporal hasta configuración tenant). */
  IDEAL_KITCHEN_CAPACITY: 5,
  /** Porcentaje de carga bajo el cual la cocina se considera fluida. */
  FLUID_MAX_PERCENT: 80,
  /** Porcentaje de carga máximo antes de saturación/cuello de botella. */
  HIGH_DEMAND_MAX_PERCENT: 100,
  BASE_PREP_MINUTES: SLA_THRESHOLDS.DEFAULT_PREP_TIME_MINUTES
} as const;

export const OPERATIONAL_THRESHOLDS = {
  STALLED_INACTIVE_MINUTES: 20,
  PREPARATION_SLOW_MINUTES: SLA_THRESHOLDS.STAGNANT_MINUTES,
  DELIVERY_DOMINANCE_RATIO: SLA_THRESHOLDS.WARNING_PERCENTAGE,
  INACTIVE_RISK_MINUTES: SLA_THRESHOLDS.DEFAULT_PREP_TIME_MINUTES,
  QUIET_ACTIVE_ORDERS_MAX: 2
} as const;

export const RISK_DETECTION_THRESHOLDS = {
  STALLED_INACTIVE_MINUTES: OPERATIONAL_THRESHOLDS.STALLED_INACTIVE_MINUTES,
  PREPARATION_SLOW_FALLBACK_MINUTES: SLA_THRESHOLDS.STAGNANT_MINUTES,
  RECENT_CHANGE_WINDOW_MINUTES: 60,
  MANY_CHANGES_THRESHOLD: 4,
  REASSIGNMENT_ACTIVITY_THRESHOLD: 3,
  ATTENTION_SCORE_MIN: 25
} as const;

export const BUSINESS_INSIGHT_THRESHOLDS = {
  HIGH_TICKET_RATIO: 1.4,
  FREQUENT_CUSTOMER_MIN_ORDERS: 5,
  RECENT_PEAK_WINDOW_MINUTES: 10,
  RECENT_PEAK_MIN_ORDERS: 3,
  SLOW_RHYTHM_MINUTES: 35,
  SALES_MOMENTUM_MIN_COMPLETED: 5,
  MAX_INSIGHTS: 4
} as const;

export const OPERATIONAL_SUMMARY_THRESHOLDS = {
  RELEVANT_CANCELLATIONS_MIN_COUNT: 2,
  RELEVANT_CANCELLATIONS_RATIO: 0.2,
  MAX_SUMMARIES: 5,
  EARLY_DAY_HOUR: 11
} as const;

export const OPERATIONAL_FEED_THRESHOLDS = {
  MAX_FEED_ITEMS: 6,
  NEW_ORDERS_BURST_WINDOW_MINUTES: 10,
  NEW_ORDERS_BURST_THRESHOLD: 3,
  COMPLETED_GROUP_WINDOW_MINUTES: 60,
  COMPLETED_GROUP_THRESHOLD: 2,
  ASSIGNMENT_GROUP_WINDOW_MINUTES: 90,
  ASSIGNMENT_GROUP_THRESHOLD: 2,
  REGRESSIVE_WINDOW_MINUTES: 180,
  RECENT_ACTIVITY_FALLBACK_LIMIT: 3
} as const;

export const ACTIVITY_THRESHOLDS = {
  RECENT_WINDOW_MS: 24 * 60 * 60 * 1000,
  MAX_ITEMS: 6
} as const;
