"use client";

import { memo, type ComponentProps, type KeyboardEvent } from "react";
import OrderCard from "@/components/admin/orders/order-card";
import type { AdminOrderDashboardItem } from "@/lib/orders/admin";
import type { DashboardBoardGroupedOrder } from "@/lib/orders/dashboard-board-view-model";
import { buildLaneSectionId } from "@/lib/orders/lane-navigation-scanning";
import type { OrderRiskAssessment } from "@/lib/orders/risk-detection";
import kanbanStyles from "./dashboard-kanban.module.css";

type OrderCardQuickActionsProps = ComponentProps<typeof OrderCard>;

export type DashboardKanbanGroup = DashboardBoardGroupedOrder;

export interface DashboardKanbanBoardProps {
  groupedOrders: DashboardKanbanGroup[];
  currentUserId: string;
  onlineOperators: Array<{ userId: string; name: string }>;
  orderRiskAssessmentMap: Map<string, OrderRiskAssessment>;
  newArrivalOrderIds: string[];
  canUpdateOrders: boolean;
  now: Date;
  onOpen: (order: AdminOrderDashboardItem) => void;
  onCardKeyDown: (event: KeyboardEvent<HTMLElement>, orderId: string) => void;
  onOptimisticStatusChange?: OrderCardQuickActionsProps["onOptimisticStatusChange"];
  onOptimisticStatusRollback?: OrderCardQuickActionsProps["onOptimisticStatusRollback"];
  onOptimisticStatusSettled?: OrderCardQuickActionsProps["onOptimisticStatusSettled"];
  isOrderStatusPending?: (orderId: string) => boolean;
  emptyLaneLabel?: string;
  isSearchEmpty?: boolean;
  isEmptyBoard?: boolean;
}

function DashboardKanbanBoardComponent({
  groupedOrders,
  currentUserId,
  onlineOperators,
  orderRiskAssessmentMap,
  newArrivalOrderIds,
  canUpdateOrders,
  now,
  onOpen,
  onCardKeyDown,
  onOptimisticStatusChange,
  onOptimisticStatusRollback,
  onOptimisticStatusSettled,
  isOrderStatusPending,
  emptyLaneLabel = "Sin pedidos",
  isSearchEmpty = false,
  isEmptyBoard = false
}: DashboardKanbanBoardProps) {
  const newArrivalOrderIdSet = new Set(newArrivalOrderIds);

  return (
    <div
      className={kanbanStyles.boardWrapper}
      data-lane-count={groupedOrders.length}
      data-search-empty={isSearchEmpty ? "true" : "false"}
      data-empty-board={isEmptyBoard ? "true" : "false"}
    >
      {groupedOrders.map((group) => (
        <section
          key={group.status}
          id={buildLaneSectionId(group.status)}
          className={[
            kanbanStyles.lane,
            group.laneKind === "secondary" ? kanbanStyles.laneSecondary : null
          ]
            .filter(Boolean)
            .join(" ")}
          data-lane-kind={group.laneKind}
          data-lane-status={group.status}
          data-lane-empty={group.isEmpty ? "true" : "false"}
          data-lane-persistent={group.isPersistentLane ? "true" : "false"}
        >
          <div className={kanbanStyles.laneHeader}>
            <div className={kanbanStyles.laneTitleContainer}>
              <h2 className={kanbanStyles.laneTitle}>{group.label}</h2>
            </div>
            <span className={kanbanStyles.laneCount}>{group.orders.length}</span>
          </div>
          <div className={kanbanStyles.laneBody}>
            {group.orders.length > 0 ? (
              group.orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  currentUserId={currentUserId}
                  onlineOperators={onlineOperators}
                  riskAssessment={orderRiskAssessmentMap.get(order.id)}
                  isNewArrival={newArrivalOrderIdSet.has(order.id)}
                  canUpdateOrders={canUpdateOrders}
                  isOrderStatusPending={isOrderStatusPending}
                  now={now}
                  onOpen={onOpen}
                  onCardKeyDown={onCardKeyDown}
                  onOptimisticStatusChange={onOptimisticStatusChange}
                  onOptimisticStatusRollback={onOptimisticStatusRollback}
                  onOptimisticStatusSettled={onOptimisticStatusSettled}
                  showStatusBadge={false}
                />
              ))
            ) : (
              <p className={kanbanStyles.emptyLaneState}>{emptyLaneLabel}</p>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

const DashboardKanbanBoard = memo(DashboardKanbanBoardComponent);

export default DashboardKanbanBoard;
