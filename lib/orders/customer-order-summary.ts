/**
 * Pure customer-facing order summary from persisted order_items / snapshots.
 * No live catalog config. No WhatsApp markdown. No kitchen operational totals.
 */

import {
  buildDashboardOrderItemTree,
  type OrderItemLike
} from "@/lib/product-customization/order-dashboard";
import type {
  CustomizationSnapshot,
  CustomizationSnapshotV2
} from "@/lib/product-customization/order-types";
import { buildOrderDisplayRef } from "@/lib/orders/display-ref";

export type CustomerOrderSummaryOption = {
  name: string;
  /** V2 quantity-enabled only. Absent for V1 / non-qty options. */
  perUnitQuantity?: number;
};

export type CustomerOrderSummaryGroup = {
  name: string;
  options: CustomerOrderSummaryOption[];
};

export type CustomerOrderSummaryAdditional = {
  productName: string;
  quantity: number;
};

export type CustomerOrderSummaryRoot = {
  productName: string;
  quantity: number;
  groups: CustomerOrderSummaryGroup[];
  additionals: CustomerOrderSummaryAdditional[];
};

export type CustomerOrderDeliveryMethod = "delivery" | "pickup";

export type CustomerOrderSummary = {
  /** Bare short ref (e.g. 7DC3), without `#`. */
  orderRef: string;
  customerName: string;
  roots: CustomerOrderSummaryRoot[];
  notes: string | null;
  deliveryMethod: CustomerOrderDeliveryMethod;
  address: string | null;
};

export type CustomerOrderSummaryInput = {
  id: string;
  order_code?: string | null;
  customer_name: string;
  delivery_method: CustomerOrderDeliveryMethod | string;
  address?: string | null;
  notes?: string | null;
  order_items?: OrderItemLike[] | null;
};

function normalizeOptionQuantity(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 1) {
    return Math.floor(value);
  }

  return 1;
}

function mapGroupsFromSnapshot(snapshot: CustomizationSnapshot | null): CustomerOrderSummaryGroup[] {
  if (!snapshot) {
    return [];
  }

  return snapshot.groups
    .filter((group) => group.selected_options.length > 0)
    .slice()
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((group) => {
      const allowsOptionQuantity =
        snapshot.version === 2 &&
        Boolean((group as CustomizationSnapshotV2["groups"][number]).allows_option_quantity);

      const options: CustomerOrderSummaryOption[] = group.selected_options
        .slice()
        .sort((left, right) => left.sort_order - right.sort_order)
        .map((option) => {
          const name = option.option_name.trim();

          if (allowsOptionQuantity && "quantity" in option) {
            return {
              name,
              perUnitQuantity: normalizeOptionQuantity(option.quantity)
            };
          }

          return { name };
        })
        .filter((option) => option.name.length > 0);

      return {
        name: group.group_name.trim() || "Opciones",
        options
      };
    })
    .filter((group) => group.options.length > 0);
}

function resolveDeliveryMethod(value: string): CustomerOrderDeliveryMethod {
  return value === "pickup" ? "pickup" : "delivery";
}

export function buildCustomerOrderSummary(input: CustomerOrderSummaryInput): CustomerOrderSummary {
  const tree = buildDashboardOrderItemTree(input.order_items ?? []);

  const roots: CustomerOrderSummaryRoot[] = tree
    .map((node) => {
      const productName = node.item.product_name.trim();
      if (!productName) {
        return null;
      }

      const quantity =
        typeof node.item.quantity === "number" && Number.isFinite(node.item.quantity)
          ? Math.max(1, Math.floor(node.item.quantity))
          : 1;

      return {
        productName,
        quantity,
        groups: mapGroupsFromSnapshot(node.snapshot),
        additionals: node.children
          .map((child) => {
            const childName = child.product_name.trim();
            if (!childName) {
              return null;
            }

            const childQty =
              typeof child.quantity === "number" && Number.isFinite(child.quantity)
                ? Math.max(1, Math.floor(child.quantity))
                : 1;

            return {
              productName: childName,
              quantity: childQty
            };
          })
          .filter((child): child is CustomerOrderSummaryAdditional => child !== null)
      };
    })
    .filter((root): root is CustomerOrderSummaryRoot => root !== null);

  const notes = input.notes?.trim() || null;
  const address = input.address?.trim() || null;

  return {
    orderRef: buildOrderDisplayRef(input),
    customerName: input.customer_name.trim(),
    roots,
    notes,
    deliveryMethod: resolveDeliveryMethod(String(input.delivery_method)),
    address
  };
}

export function formatRootQuantityLabel(quantity: number, productName: string): string {
  return `${quantity}× ${productName.trim()}`;
}

function formatOptionLabel(option: CustomerOrderSummaryOption): string {
  if (typeof option.perUnitQuantity === "number") {
    return `${option.name} ×${option.perUnitQuantity} c/u`;
  }

  return option.name;
}

function formatGroupLine(group: CustomerOrderSummaryGroup): string {
  return `- ${group.name}: ${group.options.map(formatOptionLabel).join(" / ")}`;
}

function formatRootBlock(root: CustomerOrderSummaryRoot, boldRoot: boolean): string {
  const title = formatRootQuantityLabel(root.quantity, root.productName);
  const lines = [boldRoot ? `*${title}*` : title];

  for (const group of root.groups) {
    lines.push(formatGroupLine(group));
  }

  for (const additional of root.additionals) {
    lines.push(`- Adicional: ${additional.productName} ×${additional.quantity}`);
  }

  return lines.join("\n");
}

/** Product blocks only (roots + groups + Adicional). */
export function formatWhatsappCustomerOrderProducts(summary: CustomerOrderSummary): string {
  if (summary.roots.length === 0) {
    return "Pedido sin productos";
  }

  return summary.roots.map((root) => formatRootBlock(root, true)).join("\n\n");
}

export function formatPlainTextCustomerOrderProducts(summary: CustomerOrderSummary): string {
  if (summary.roots.length === 0) {
    return "Pedido sin productos";
  }

  return summary.roots.map((root) => formatRootBlock(root, false)).join("\n\n");
}

export function formatIndicacionesLine(notes: string | null): string | null {
  if (!notes?.trim()) {
    return null;
  }

  return `Indicaciones: ${notes.trim()}`;
}

export function formatDeliveryContextLines(summary: CustomerOrderSummary): string[] {
  const lines = [
    `Modalidad: ${summary.deliveryMethod === "pickup" ? "Retiro" : "Delivery"}`
  ];

  if (summary.deliveryMethod === "delivery" && summary.address) {
    lines.push(`Dirección: ${summary.address}`);
  }

  return lines;
}

/**
 * Full plain-text contact payload for Copiar resumen / Compartir.
 */
export function formatPlainTextCustomerOrderSummary(summary: CustomerOrderSummary): string {
  const parts: string[] = [
    `Pedido #${summary.orderRef}`,
    `Cliente: ${summary.customerName || "cliente"}`,
    "",
    formatPlainTextCustomerOrderProducts(summary)
  ];

  const notesLine = formatIndicacionesLine(summary.notes);
  if (notesLine) {
    parts.push("", notesLine);
  }

  parts.push("", ...formatDeliveryContextLines(summary));

  return parts.join("\n");
}
