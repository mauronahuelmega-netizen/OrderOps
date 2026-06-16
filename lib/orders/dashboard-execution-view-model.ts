export type DashboardExecutionFilterId =
  | "all"
  | "pending"
  | "preparing"
  | "ready"
  | "delivery"
  | "pickup";

/** @deprecated Prefer DashboardExecutionFilterId — kept for container compatibility. */
export type OrdersFilter = DashboardExecutionFilterId;

export type DashboardExecutionFilterOption = {
  value: DashboardExecutionFilterId;
  label: string;
};

export const DASHBOARD_EXECUTION_FILTER_OPTIONS: DashboardExecutionFilterOption[] = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendientes" },
  { value: "preparing", label: "Preparando" },
  { value: "ready", label: "Listos" },
  { value: "delivery", label: "Delivery" },
  { value: "pickup", label: "Retiro" }
];

export const DASHBOARD_EXECUTION_FILTER_LABELS: Record<DashboardExecutionFilterId, string> = {
  all: "Todos",
  pending: "Pendientes",
  preparing: "Preparando",
  ready: "Listos",
  delivery: "Delivery",
  pickup: "Retiro"
};

const VALID_DASHBOARD_EXECUTION_FILTERS = new Set<DashboardExecutionFilterId>(
  DASHBOARD_EXECUTION_FILTER_OPTIONS.map((filter) => filter.value)
);

export function resolveDashboardExecutionFilter(
  value: string | null | undefined
): DashboardExecutionFilterId {
  if (value && VALID_DASHBOARD_EXECUTION_FILTERS.has(value as DashboardExecutionFilterId)) {
    return value as DashboardExecutionFilterId;
  }

  return "all";
}

export type DashboardExecutionSessionActionKind = "open" | "close";

export type DashboardExecutionSyncState =
  | "synced"
  | "syncing"
  | "offline"
  | "stale"
  | "error";

export type DashboardExecutionSyncIcon = "refresh-ccw" | "refresh-off";

export type DashboardExecutionToolbarViewModel = {
  title: string;
  filters: DashboardExecutionFilterOption[];
  activeFilter: DashboardExecutionFilterId;
  /** Kept for future scope/journey uses. T4.2 intentionally does not render it in the toolbar title cluster. */
  scopeLabel: string;
  showSessionControls: boolean;
  sessionStatusLabel: string;
  sessionPrimaryActionLabel: string | null;
  sessionPrimaryActionKind: DashboardExecutionSessionActionKind | null;
  sessionPrimaryActionPendingLabel: string | null;
  syncState: DashboardExecutionSyncState;
  syncIcon: DashboardExecutionSyncIcon;
  operationalSyncAriaLabel: string;
  operationalSyncTitle: string;
  isOperationalSyncing: boolean;
  isStoreSessionPending: boolean;
  canManageStoreSession: boolean;
  storeSessionError: string | null;
  searchPlaceholder: string;
  searchAriaLabel: string;
  searchSectionAriaLabel: string;
  clearSearchAriaLabel: string;
  filtersAriaLabel: string;
};

const SESSION_INACTIVE_LABEL = "Sin sesi\u00f3n activa";

export const DASHBOARD_EXECUTION_SEARCH_PLACEHOLDER =
  "Buscar por cliente, estado o situaci\u00f3n...";
export const DASHBOARD_EXECUTION_SEARCH_ARIA_LABEL =
  "Buscar por cliente, estado o situaci\u00f3n";
export const DASHBOARD_EXECUTION_SEARCH_SECTION_ARIA_LABEL = "B\u00fasqueda operacional";
export const DASHBOARD_EXECUTION_CLEAR_SEARCH_ARIA_LABEL = "Limpiar b\u00fasqueda";
export const DASHBOARD_EXECUTION_FILTERS_ARIA_LABEL = "Filtros de pedidos";

export function buildDashboardExecutionToolbarViewModel(input: {
  activeFilter: DashboardExecutionFilterId;
  operationalWindowLabel: string;
  hasActiveStoreSession: boolean;
  canManageStoreSession: boolean;
  businessId?: string;
  isStoreSessionPending: boolean;
  pendingStoreSessionAction: "opening" | "closing" | null;
  storeSessionError: string | null;
  isOnline: boolean;
  isOperationalSyncing: boolean;
  operationalSyncError: string | null;
  isOperationalSyncStale: boolean;
}): DashboardExecutionToolbarViewModel {
  const showSessionControls = Boolean(input.canManageStoreSession || input.businessId);
  let sessionStatusLabel = input.operationalWindowLabel;
  let sessionPrimaryActionLabel: string | null = null;
  let sessionPrimaryActionKind: DashboardExecutionSessionActionKind | null = null;
  let sessionPrimaryActionPendingLabel: string | null = null;

  if (input.hasActiveStoreSession) {
    sessionStatusLabel = input.operationalWindowLabel;

    if (input.canManageStoreSession) {
      sessionPrimaryActionKind = "close";
      sessionPrimaryActionLabel = "Cerrar sesi\u00f3n";
      sessionPrimaryActionPendingLabel =
        input.pendingStoreSessionAction === "closing" ? "Cerrando..." : null;
    }
  } else if (input.canManageStoreSession) {
    sessionStatusLabel = SESSION_INACTIVE_LABEL;
    sessionPrimaryActionKind = "open";
    sessionPrimaryActionLabel = "Abrir sesi\u00f3n";
    sessionPrimaryActionPendingLabel =
      input.pendingStoreSessionAction === "opening" ? "Abriendo..." : null;
  } else {
    sessionStatusLabel = input.operationalWindowLabel;
  }

  const syncPresentation = buildDashboardExecutionSyncPresentation({
    isOnline: input.isOnline,
    isOperationalSyncing: input.isOperationalSyncing,
    operationalSyncError: input.operationalSyncError,
    isOperationalSyncStale: input.isOperationalSyncStale
  });

  return {
    title: "Pedidos en curso",
    filters: DASHBOARD_EXECUTION_FILTER_OPTIONS,
    activeFilter: input.activeFilter,
    scopeLabel: input.operationalWindowLabel,
    showSessionControls,
    sessionStatusLabel,
    sessionPrimaryActionLabel,
    sessionPrimaryActionKind,
    sessionPrimaryActionPendingLabel,
    ...syncPresentation,
    isStoreSessionPending: input.isStoreSessionPending,
    canManageStoreSession: input.canManageStoreSession,
    storeSessionError: input.storeSessionError,
    searchPlaceholder: DASHBOARD_EXECUTION_SEARCH_PLACEHOLDER,
    searchAriaLabel: DASHBOARD_EXECUTION_SEARCH_ARIA_LABEL,
    searchSectionAriaLabel: DASHBOARD_EXECUTION_SEARCH_SECTION_ARIA_LABEL,
    clearSearchAriaLabel: DASHBOARD_EXECUTION_CLEAR_SEARCH_ARIA_LABEL,
    filtersAriaLabel: DASHBOARD_EXECUTION_FILTERS_ARIA_LABEL
  };
}

function buildDashboardExecutionSyncPresentation(input: {
  isOnline: boolean;
  isOperationalSyncing: boolean;
  operationalSyncError: string | null;
  isOperationalSyncStale: boolean;
}): Pick<
  DashboardExecutionToolbarViewModel,
  | "syncState"
  | "syncIcon"
  | "operationalSyncAriaLabel"
  | "operationalSyncTitle"
  | "isOperationalSyncing"
> {
  // Priority: offline → syncing → error → stale → synced (T4.6/T4.7 operational sync).
  let syncState: DashboardExecutionSyncState;

  if (!input.isOnline) {
    syncState = "offline";
  } else if (input.isOperationalSyncing) {
    syncState = "syncing";
  } else if (input.operationalSyncError) {
    syncState = "error";
  } else if (input.isOperationalSyncStale) {
    syncState = "stale";
  } else {
    syncState = "synced";
  }

  const syncIcon: DashboardExecutionSyncIcon =
    syncState === "offline" || syncState === "error" || syncState === "stale"
      ? "refresh-off"
      : "refresh-ccw";

  const operationalSyncAriaLabel =
    syncState === "syncing"
      ? "Sincronizando sesi\u00f3n y pedidos"
      : syncState === "offline"
        ? "Sin conexi\u00f3n. Volv\u00e9 a conectarte para sincronizar."
        : syncState === "stale"
          ? "El estado operativo no fue verificado recientemente. Hac\u00e9 click para actualizar."
          : syncState === "error"
            ? "No se pudo actualizar el estado operativo. Hac\u00e9 click para reintentar."
            : "Estado operativo actualizado. Hac\u00e9 click para sincronizar sesi\u00f3n y pedidos.";

  const operationalSyncTitle =
    syncState === "syncing"
      ? "Sincronizando sesi\u00f3n y pedidos..."
      : operationalSyncAriaLabel;

  return {
    syncState,
    syncIcon,
    operationalSyncAriaLabel,
    operationalSyncTitle,
    isOperationalSyncing: input.isOperationalSyncing
  };
}
