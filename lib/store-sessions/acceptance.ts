/**
 * Pure helper: effective public order acceptance must match what create_order
 * enforces via business_settings.on_demand_mode_active, while remaining
 * coherent with an open store session when that table exists.
 */
export function computeOrderAcceptanceActive(input: {
  onDemandModeActive: boolean;
  hasOpenStoreSession: boolean | null;
}): boolean {
  if (!input.onDemandModeActive) {
    return false;
  }

  // Table missing / unknown → column is the RPC-compatible source of truth.
  if (input.hasOpenStoreSession === null) {
    return true;
  }

  return input.hasOpenStoreSession;
}
