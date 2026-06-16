import type { AdminOrderDashboardItem } from "@/lib/orders/admin";
import { SATURATION_THRESHOLDS } from "@/lib/orders/constants";

export type SaturationLevel = "fluid" | "high_demand" | "bottleneck";

export type SaturationTone = "success" | "attention" | "danger" | "neutral";

export type SaturationIndexResult = {
  loadPercent: number;
  preparingCount: number;
  level: SaturationLevel;
  tone: SaturationTone;
  label: string;
};

const { IDEAL_KITCHEN_CAPACITY, FLUID_MAX_PERCENT, HIGH_DEMAND_MAX_PERCENT, BASE_PREP_MINUTES } =
  SATURATION_THRESHOLDS;

export function calculateSaturationIndex(
  orders: readonly AdminOrderDashboardItem[]
): SaturationIndexResult {
  const preparingCount = orders.filter((order) => order.status === "preparing").length;
  const idealCapacityMinutes = IDEAL_KITCHEN_CAPACITY * BASE_PREP_MINUTES;
  const currentLoadMinutes = preparingCount * BASE_PREP_MINUTES;
  const loadPercent =
    idealCapacityMinutes > 0
      ? Math.round((currentLoadMinutes / idealCapacityMinutes) * 100)
      : 0;
  const level = resolveSaturationLevel(loadPercent);
  const tone = resolveSaturationTone(level);

  return {
    loadPercent,
    preparingCount,
    level,
    tone,
    label: formatSaturationLabel(level, loadPercent)
  };
}

export function formatSaturationLabel(level: SaturationLevel, loadPercent: number) {
  switch (level) {
    case "fluid":
      return "Cocina fluida";
    case "high_demand":
      return loadPercent >= 100 ? "Alta demanda" : `Alta demanda (${loadPercent}%)`;
    case "bottleneck":
      return "Saturacion / Cuello de botella";
    default:
      return "Cocina fluida";
  }
}

function resolveSaturationLevel(loadPercent: number): SaturationLevel {
  if (loadPercent > HIGH_DEMAND_MAX_PERCENT) {
    return "bottleneck";
  }

  if (loadPercent >= FLUID_MAX_PERCENT) {
    return "high_demand";
  }

  return "fluid";
}

function resolveSaturationTone(level: SaturationLevel): SaturationTone {
  switch (level) {
    case "high_demand":
      return "attention";
    case "bottleneck":
      return "danger";
    default:
      return "success";
  }
}
