"use client";

import OperationalSearch from "@/components/admin/orders/operational-search";
import Button from "@/components/ui/Button";
import type {
  DashboardExecutionFilterId,
  DashboardExecutionToolbarViewModel
} from "@/lib/orders/dashboard-execution-view-model";
import {
  BOARD_OPERATIONAL_SEARCH_ARIA_LABEL,
  BOARD_OPERATIONAL_SEARCH_PLACEHOLDER
} from "@/lib/orders/natural-search";
import { RefreshCcw, RefreshCwOff } from "lucide-react";
import dashboardStyles from "./admin-dashboard-orders.module.css";
import toolbarStyles from "./dashboard-toolbar.module.css";

export type DashboardOrdersFilter = DashboardExecutionFilterId;

export interface DashboardToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  viewModel: DashboardExecutionToolbarViewModel;
  reviewModeHint?: string | null;
  onFilterSelect: (filter: DashboardExecutionFilterId) => void;
  onOpenStoreSession: () => void;
  onCloseStoreSession: () => void;
  onManualOperationalResync: () => void;
  canCreateManualOrder?: boolean;
  onCreateManualOrder?: () => void;
  manualOrderDisabledReason?: string | null;
  showManualOrderButton?: boolean;
  isKanbanBoardVisible?: boolean;
}

export default function DashboardToolbar({
  searchQuery,
  onSearchChange,
  viewModel,
  reviewModeHint,
  onFilterSelect,
  onOpenStoreSession,
  onCloseStoreSession,
  onManualOperationalResync,
  canCreateManualOrder = false,
  onCreateManualOrder,
  manualOrderDisabledReason,
  showManualOrderButton = false,
  isKanbanBoardVisible = false
}: DashboardToolbarProps) {
  const sessionPrimaryActionLabel =
    viewModel.sessionPrimaryActionPendingLabel ?? viewModel.sessionPrimaryActionLabel;
  const sessionPrimaryActionHandler =
    viewModel.sessionPrimaryActionKind === "close"
      ? onCloseStoreSession
      : viewModel.sessionPrimaryActionKind === "open"
        ? onOpenStoreSession
        : undefined;
  const activeFilterLabel =
    viewModel.filters.find((filter) => filter.value === viewModel.activeFilter)?.label ??
    viewModel.activeFilter;
  const showDesktopActiveFilterBanner = viewModel.activeFilter !== "all";

  return (
    <div
      className={`${dashboardStyles["admin-orders-controls"]} ${dashboardStyles["admin-orders-controls--compact"]}`}
    >
      <section
        className={toolbarStyles.toolbar}
        data-kanban-board={isKanbanBoardVisible ? "true" : "false"}
      >
        <div className={toolbarStyles.operationalRow}>
          <div className={toolbarStyles.titleCluster}>
            <h2 className={toolbarStyles.title}>{viewModel.title}</h2>
          </div>

          {viewModel.showSessionControls ? (
            <div className={toolbarStyles.sessionCluster}>
              <div className={toolbarStyles.sessionStatusGroup}>
                <span className={toolbarStyles.sessionStatus}>{viewModel.sessionStatusLabel}</span>
                {reviewModeHint ? (
                  <span className={toolbarStyles.reviewModeHint}>{reviewModeHint}</span>
                ) : null}
              </div>
              {sessionPrimaryActionLabel && sessionPrimaryActionHandler ? (
                <Button
                  type="button"
                  variant="secondary"
                  className={`${toolbarStyles.sessionButton}${
                    viewModel.sessionPrimaryActionKind === "close"
                      ? ` ${toolbarStyles.sessionButtonDanger}`
                      : ""
                  }`}
                  onClick={sessionPrimaryActionHandler}
                  disabled={viewModel.isStoreSessionPending}
                >
                  {sessionPrimaryActionLabel}
                </Button>
              ) : null}
              {showManualOrderButton && onCreateManualOrder ? (
                <Button
                  type="button"
                  variant="secondary"
                  className={toolbarStyles.manualOrderButton}
                  onClick={onCreateManualOrder}
                  disabled={!canCreateManualOrder}
                  aria-label="Crear nuevo pedido manual"
                  title={
                    !canCreateManualOrder
                      ? (manualOrderDisabledReason ?? "Abrí una sesión activa para crear pedidos.")
                      : undefined
                  }
                >
                  <span className={toolbarStyles.manualOrderButtonLabelDesktop}>Nuevo pedido</span>
                  <span className={toolbarStyles.manualOrderButtonLabelMobile}>+ Pedido</span>
                </Button>
              ) : null}
              <button
                type="button"
                className={toolbarStyles.syncButton}
                onClick={onManualOperationalResync}
                disabled={viewModel.isOperationalSyncing}
                aria-label={viewModel.operationalSyncAriaLabel}
                title={viewModel.operationalSyncTitle}
                data-sync-state={viewModel.syncState}
              >
                <span className={toolbarStyles.syncStatusDot} aria-hidden="true" />
                {viewModel.syncIcon === "refresh-off" ? (
                  <RefreshCwOff aria-hidden="true" className={toolbarStyles.syncIcon} size={15} />
                ) : (
                  <RefreshCcw
                    aria-hidden="true"
                    className={`${toolbarStyles.syncIcon}${
                      viewModel.syncState === "syncing" ? ` ${toolbarStyles.syncIconSpinning}` : ""
                    }`}
                    size={15}
                  />
                )}
              </button>
            </div>
          ) : null}
        </div>

        <div className={toolbarStyles.viewControlsRow}>
          <div
            className={toolbarStyles.filterCluster}
            role="group"
            aria-label={viewModel.filtersAriaLabel}
          >
            {viewModel.filters.map((filter) => {
              const isActive = viewModel.activeFilter === filter.value;

              return (
                <Button
                  key={filter.value}
                  type="button"
                  variant={isActive ? "primary" : "ghost"}
                  className={`${toolbarStyles.filterButton}${
                    isActive ? ` ${toolbarStyles.filterButtonActive}` : ""
                  }`}
                  onClick={() => onFilterSelect(filter.value)}
                  aria-pressed={isActive}
                >
                  {filter.label}
                </Button>
              );
            })}
          </div>

          <div className={toolbarStyles.searchCluster}>
            <OperationalSearch
              value={searchQuery}
              onChange={onSearchChange}
              placeholder={BOARD_OPERATIONAL_SEARCH_PLACEHOLDER}
              searchAriaLabel={BOARD_OPERATIONAL_SEARCH_ARIA_LABEL}
              sectionAriaLabel={viewModel.searchSectionAriaLabel}
              clearAriaLabel={viewModel.clearSearchAriaLabel}
            />
          </div>
        </div>

        {showDesktopActiveFilterBanner ? (
          <div className={toolbarStyles.activeFilterBanner}>
            <span className={toolbarStyles.activeFilterBannerLabel}>
              Vista filtrada: {activeFilterLabel}
            </span>
            <Button
              type="button"
              variant="ghost"
              className={toolbarStyles.activeFilterBannerAction}
              onClick={() => onFilterSelect("all")}
            >
              Volver a Todos
            </Button>
          </div>
        ) : null}

        {viewModel.storeSessionError ? (
          <p className={toolbarStyles.sessionError} role="alert">
            {viewModel.storeSessionError}
          </p>
        ) : null}
      </section>
    </div>
  );
}
