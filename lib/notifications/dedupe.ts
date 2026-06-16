const NOTIFICATION_DEDUPE_KEY = "orderops:new-order-browser-notifications";
const NOTIFICATION_DEDUPE_TTL_MS = 1000 * 60 * 60 * 12;

type NotificationDedupeStore = Record<string, number>;

function readDedupeStore(): NotificationDedupeStore {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(NOTIFICATION_DEDUPE_KEY);

    if (!rawValue) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue) as NotificationDedupeStore | null;

    if (!parsedValue || typeof parsedValue !== "object" || Array.isArray(parsedValue)) {
      return {};
    }

    return parsedValue;
  } catch {
    return {};
  }
}

function writeDedupeStore(store: NotificationDedupeStore) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(NOTIFICATION_DEDUPE_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage failures. Notifications stay best-effort.
  }
}

function pruneDedupeStore(store: NotificationDedupeStore, now: number) {
  return Object.fromEntries(
    Object.entries(store).filter(([, timestamp]) => now - timestamp < NOTIFICATION_DEDUPE_TTL_MS)
  );
}

export function claimBrowserNotification(orderId: string, now = Date.now()) {
  const dedupeStore = pruneDedupeStore(readDedupeStore(), now);

  if (dedupeStore[orderId]) {
    writeDedupeStore(dedupeStore);
    return false;
  }

  dedupeStore[orderId] = now;
  writeDedupeStore(dedupeStore);
  return true;
}
