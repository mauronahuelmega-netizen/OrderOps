"use client";

import type { MouseEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import {
  buildOrderOperationalSummary,
  formatAdminDeliveryMethod,
  formatAdminOrderCurrency,
  formatAdminOrderDate
} from "@/lib/orders/presenter";
import type { AdminOrderWorkspaceData } from "@/lib/orders/workspace";
import OrderCustomerDeliveryInfo from "@/components/admin/orders/order-customer-delivery-info";
import styles from "./order-workspace-overview.module.css";

type OrderWorkspaceOverviewProps = {
  order: AdminOrderWorkspaceData;
  detailHref?: string;
  dashboardHref?: string;
  variant?: "modal" | "page" | "workstation";
  assignmentLabel?: string | null;
};

export default function OrderWorkspaceOverview({
  order,
  detailHref,
  dashboardHref,
  variant = "modal",
  assignmentLabel
}: OrderWorkspaceOverviewProps) {
  const router = useRouter();
  const operationalSummary = buildOrderOperationalSummary(
    order.customer_name,
    order.notes,
    (order.order_items ?? []).map((item) => ({
      product_name: item.product_name,
      quantity: item.quantity
    }))
  );
  const deliveryLabel = formatAdminDeliveryMethod(order.delivery_method);
  const isPage = variant === "page";
  const isWorkstation = variant === "workstation";
  const heroTitle =
    operationalSummary.itemSummary === "Pedido sin items resumidos"
      ? `${deliveryLabel} · ${operationalSummary.itemCount || "Pedido"}`
      : operationalSummary.itemSummary;

  const handleDetailNavigation = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!detailHref) {
      return;
    }

    event.preventDefault();

    if (dashboardHref) {
      router.replace(dashboardHref, { scroll: false });
    }

    router.push(detailHref, { scroll: false });
  };

  const rootClassName = [
    styles["admin-order-workspace-overview"],
    isPage ? styles["admin-order-workspace-overview--page"] : null,
    isWorkstation ? styles["admin-order-workspace-overview--workstation"] : null
  ]
    .filter(Boolean)
    .join(" ");

  if (isWorkstation) {
    return (
      <div className={rootClassName}>
        <OrderCustomerDeliveryInfo
          deliveryMethodLabel={deliveryLabel}
          customerName={order.customer_name}
          phoneLabel={order.phone?.trim() || "Sin telefono"}
          address={order.delivery_method === "delivery" ? order.address : null}
        />
      </div>
    );
  }

  return (
    <div className={rootClassName}>
      <div className={styles["admin-order-workspace-overview__header"]}>
        <div className={styles["admin-order-workspace-overview__copy"]}>
          <p className={styles["admin-order-workspace-overview__eyebrow"]}>
            {deliveryLabel}
            {` · ${formatAdminOrderDate(order.delivery_date)}`}
          </p>
          <h3>{heroTitle}</h3>
          {operationalSummary.hasNotes ? (
            <p className={styles["admin-order-workspace-overview__meta"]}>
              <span>Con notas</span>
            </p>
          ) : null}
          {assignmentLabel ? (
            <p className={styles["admin-order-workspace-overview__assignment"]}>{assignmentLabel}</p>
          ) : null}
        </div>

        <div className={styles["admin-order-workspace-overview__status"]}>
          <Badge status={order.status} />
          <div className={styles["admin-order-workspace-overview__status-total"]}>
            <span>Total</span>
            <strong>{formatAdminOrderCurrency(order.total_price)}</strong>
            {!isPage ? (
              <Link
                href={detailHref ?? `/admin/orders/${order.id}`}
                className={`${styles["admin-order-workspace-overview__detail-link"]} admin-ghost-link`}
                onClick={handleDetailNavigation}
              >
                Ver detalle completo
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
