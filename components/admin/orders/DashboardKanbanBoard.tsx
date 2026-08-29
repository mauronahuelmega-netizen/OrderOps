"use client";

import {
  memo,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type KeyboardEvent
} from "react";
import OrderCard from "@/components/admin/orders/order-card";
import type { AdminOrderDashboardItem } from "@/lib/orders/admin";
import type { DashboardBoardGroupedOrder } from "@/lib/orders/dashboard-board-view-model";
import { buildLaneSectionId } from "@/lib/orders/lane-navigation-scanning";
import type { OrderRiskAssessment } from "@/lib/orders/risk-detection";
import kanbanStyles from "./dashboard-kanban.module.css";

type OrderCardQuickActionsProps = ComponentProps<typeof OrderCard>;

export type DashboardKanbanGroup = DashboardBoardGroupedOrder;

export type DashboardKanbanLaneWindow = "primary" | "terminal";

const PRIMARY_LANE_STATUSES = [
  "pending",
  "preparing",
  "ready",
  "completed"
] as const satisfies ReadonlyArray<AdminOrderDashboardItem["status"]>;

const TERMINAL_LANE_STATUSES = [
  "preparing",
  "ready",
  "completed",
  "cancelled"
] as const satisfies ReadonlyArray<AdminOrderDashboardItem["status"]>;

const WIDE_KANBAN_MEDIA_QUERY = "(min-width: 1200px)";
const MOBILE_STACKED_MEDIA_QUERY = "(max-width: 767px)";

const MOBILE_TERMINAL_ORDERS_PREVIEW_LIMIT = 5;

const MOBILE_TERMINAL_ORDER_STATUSES = new Set<AdminOrderDashboardItem["status"]>([
  "completed",
  "cancelled"
]);

function subscribeWideKanban(onStoreChange: () => void): () => void {
  const mediaQuery = window.matchMedia(WIDE_KANBAN_MEDIA_QUERY);
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function getWideKanbanSnapshot(): boolean {
  return window.matchMedia(WIDE_KANBAN_MEDIA_QUERY).matches;
}

function getWideKanbanServerSnapshot(): boolean {
  return false;
}

function subscribeMobileStacked(onStoreChange: () => void): () => void {
  const mediaQuery = window.matchMedia(MOBILE_STACKED_MEDIA_QUERY);
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function getMobileStackedSnapshot(): boolean {
  return window.matchMedia(MOBILE_STACKED_MEDIA_QUERY).matches;
}

function getMobileStackedServerSnapshot(): boolean {
  return false;
}

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
  orderResponsibilityEnabled?: boolean;
}

function selectLaneWindowGroups(
  groupedOrders: DashboardKanbanGroup[],
  laneWindow: DashboardKanbanLaneWindow
): DashboardKanbanGroup[] {
  const statuses =
    laneWindow === "terminal" ? TERMINAL_LANE_STATUSES : PRIMARY_LANE_STATUSES;

  return statuses
    .map((status) => groupedOrders.find((group) => group.status === status))
    .filter((group): group is DashboardKanbanGroup => group !== undefined);
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
  isEmptyBoard = false,
  orderResponsibilityEnabled = true
}: DashboardKanbanBoardProps) {
  const newArrivalOrderIdSet = new Set(newArrivalOrderIds);
  const isWideKanban = useSyncExternalStore(
    subscribeWideKanban,
    getWideKanbanSnapshot,
    getWideKanbanServerSnapshot
  );
  const isMobileStacked = useSyncExternalStore(
    subscribeMobileStacked,
    getMobileStackedSnapshot,
    getMobileStackedServerSnapshot
  );

  const [laneWindow, setLaneWindow] = useState<DashboardKanbanLaneWindow>("primary");
  const [expandedTerminalSections, setExpandedTerminalSections] = useState<
    Record<string, boolean>
  >({
    completed: false,
    cancelled: false
  });

  const hasActiveSearch = emptyLaneLabel === "Sin resultados" || Boolean(isSearchEmpty);

  const cancelledGroup = useMemo(
    () => groupedOrders.find((group) => group.status === "cancelled"),
    [groupedOrders]
  );
  const cancelledCount = cancelledGroup?.orders.length ?? 0;
  const hasCancelledGroup = Boolean(cancelledGroup);

  useEffect(() => {
    if (laneWindow === "terminal" && !hasCancelledGroup) {
      setLaneWindow("primary");
    }
  }, [hasCancelledGroup, laneWindow]);

  const usesLanePager = isWideKanban && hasCancelledGroup;
  const effectiveLaneWindow: DashboardKanbanLaneWindow =
    usesLanePager && laneWindow === "terminal" ? "terminal" : "primary";

  const visibleGroups = useMemo(() => {
    if (!isWideKanban) {
      return groupedOrders;
    }

    return selectLaneWindowGroups(groupedOrders, effectiveLaneWindow);
  }, [effectiveLaneWindow, groupedOrders, isWideKanban]);

  const showTerminalPager = usesLanePager && effectiveLaneWindow === "primary";
  const showPrimaryPager = usesLanePager && effectiveLaneWindow === "terminal";

  return (
    <div
      className={kanbanStyles.boardShell}
      data-lane-window={effectiveLaneWindow}
      data-has-lane-pager={usesLanePager ? "true" : "false"}
      data-wide-kanban={isWideKanban ? "true" : "false"}
    >
      {usesLanePager ? (
        <div
          className={kanbanStyles.lanePagerRow}
          data-align={effectiveLaneWindow === "terminal" ? "start" : "end"}
        >
          {showPrimaryPager ? (
            <button
              type="button"
              className={kanbanStyles.lanePager}
              onClick={() => setLaneWindow("primary")}
            >
              <span className={kanbanStyles.lanePagerArrow} aria-hidden="true">
                ←
              </span>
              Pendientes
            </button>
          ) : null}

          {showTerminalPager ? (
            <button
              type="button"
              className={kanbanStyles.lanePager}
              onClick={() => setLaneWindow("terminal")}
            >
              Cancelados
              <span className={kanbanStyles.lanePagerCount}>{cancelledCount}</span>
              <span className={kanbanStyles.lanePagerArrow} aria-hidden="true">
                →
              </span>
            </button>
          ) : null}
        </div>
      ) : null}

      <div
        className={kanbanStyles.boardWrapper}
        data-lane-count={visibleGroups.length}
        data-lane-window={effectiveLaneWindow}
        data-search-empty={isSearchEmpty ? "true" : "false"}
        data-empty-board={isEmptyBoard ? "true" : "false"}
      >
        {visibleGroups.map((group) => {
          const isTerminalStatus = MOBILE_TERMINAL_ORDER_STATUSES.has(group.status);
          const isExpanded = expandedTerminalSections[group.status] === true;
          const shouldApplyMobileTerminalCap =
            isMobileStacked &&
            !hasActiveSearch &&
            isTerminalStatus &&
            group.orders.length > MOBILE_TERMINAL_ORDERS_PREVIEW_LIMIT;

          const visibleOrders =
            shouldApplyMobileTerminalCap && !isExpanded
              ? group.orders.slice(0, MOBILE_TERMINAL_ORDERS_PREVIEW_LIMIT)
              : group.orders;

          const hiddenCount = group.orders.length - MOBILE_TERMINAL_ORDERS_PREVIEW_LIMIT;

          return (
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
                  <>
                    {visibleOrders.map((order) => (
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
                        orderResponsibilityEnabled={orderResponsibilityEnabled}
                      />
                    ))}
                    {shouldApplyMobileTerminalCap ? (
                      <button
                        type="button"
                        className={kanbanStyles.mobileTerminalDisclosure}
                        aria-expanded={isExpanded}
                        onClick={() =>
                          setExpandedTerminalSections((current) => ({
                            ...current,
                            [group.status]: !current[group.status]
                          }))
                        }
                      >
                        {isExpanded ? "Mostrar menos" : `Mostrar ${hiddenCount} más`}
                      </button>
                    ) : null}
                  </>
                ) : (
                  <p className={kanbanStyles.emptyLaneState}>{emptyLaneLabel}</p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

const DashboardKanbanBoard = memo(DashboardKanbanBoardComponent);

export default DashboardKanbanBoard;
