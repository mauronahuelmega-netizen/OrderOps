"use client";

import { useSyncExternalStore } from "react";

/** Canonical Products collection switch: cards below 900, table at 900+. */
export const PRODUCTS_DESKTOP_COLLECTION_QUERY = "(min-width: 900px)";

function subscribe(onStoreChange: () => void) {
  const media = window.matchMedia(PRODUCTS_DESKTOP_COLLECTION_QUERY);
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getSnapshot() {
  return window.matchMedia(PRODUCTS_DESKTOP_COLLECTION_QUERY).matches;
}

/** Mobile-first SSR / first hydration snapshot — must stay deterministic. */
function getServerSnapshot() {
  return false;
}

/**
 * True when the Products collection should render the desktop table.
 * Server and first hydration always resolve to mobile (false) to avoid mismatch.
 */
export function useProductsDesktopCollection() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
