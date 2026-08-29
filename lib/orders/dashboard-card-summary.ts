import {
  buildDashboardOrderItemTree,
  type OrderItemLike
} from "@/lib/product-customization/order-dashboard";

export type DashboardOrderCardSummaryItem = OrderItemLike;

export type DashboardOrderCardSummary = {
  itemCount: number;
  itemSummary: string;
};

function buildRootLinesSummary(
  rootLines: Array<{ product_name: string; quantity: number }>
): string {
  if (rootLines.length === 0) {
    return "Pedido sin items resumidos";
  }

  const visibleItems = rootLines
    .slice(0, 2)
    .map((item) => `${item.quantity}x ${item.product_name}`);
  const hiddenRootLineCount = rootLines.length - visibleItems.length;

  if (hiddenRootLineCount > 0) {
    visibleItems.push(`+${hiddenRootLineCount} mas`);
  }

  return visibleItems.join(" · ");
}

/**
 * Dashboard OrderCard compact count/summary — root product lines only.
 * Parent-linked upsell children are excluded; aligns with buildDashboardOrderItemTree.
 */
export function buildDashboardOrderCardSummary(
  items: DashboardOrderCardSummaryItem[] | null | undefined
): DashboardOrderCardSummary {
  const rootLines = buildDashboardOrderItemTree(items ?? [])
    .map((node) => node.item)
    .filter((item) => item.product_name.trim().length > 0)
    .map((item) => ({
      product_name: item.product_name.trim(),
      quantity: item.quantity
    }));

  const itemCount = rootLines.reduce((total, item) => total + item.quantity, 0);
  const itemSummary = buildRootLinesSummary(rootLines);

  return {
    itemCount,
    itemSummary
  };
}
