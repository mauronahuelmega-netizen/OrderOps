"use client";

import { usePushSubscription } from "@/components/admin/notifications/use-push-subscription";
import styles from "@/components/admin/notifications/notification-settings.module.css";
import type { BrowserNotificationPermissionState } from "@/lib/notifications/preferences";

type PushDeviceSettingsProps = {
  canManage: boolean;
  isRequestingPermission: boolean;
  permission: BrowserNotificationPermissionState;
  requestPermission: () => Promise<BrowserNotificationPermissionState>;
};

type PushState = ReturnType<typeof usePushSubscription>["state"];

function getPushStatusCopy(state: PushState) {
  switch (state) {
    case "unsupported":
      return {
        title: "No disponible",
        description: "Este navegador no soporta push web."
      };
    case "env_missing":
      return {
        title: "No configurado en este entorno",
        description: "Push no está configurado en este entorno."
      };
    case "blocked":
      return {
        title: "Bloqueado",
        description: "Las notificaciones están bloqueadas en este navegador."
      };
    case "configured":
      return {
        title: "Dispositivo preparado",
        description: "Este dispositivo está preparado para push."
      };
    case "not_configured":
      return {
        title: "Sin preparar",
        description: "Este dispositivo todavía no está preparado para push."
      };
    case "unknown":
    default:
      return {
        title: "Verificando",
        description: "Estamos revisando si este navegador puede preparar push."
      };
  }
}

function getPushStatusPillClass(state: PushState) {
  switch (state) {
    case "configured":
      return `${styles.statusPill} ${styles.statusPillReady}`;
    case "not_configured":
      return `${styles.statusPill} ${styles.statusPillPending}`;
    case "blocked":
      return `${styles.statusPill} ${styles.statusPillBlocked}`;
    case "unsupported":
    case "env_missing":
    case "unknown":
    default:
      return `${styles.statusPill} ${styles.statusPillNeutral}`;
  }
}

export default function PushDeviceSettings({
  canManage,
  isRequestingPermission,
  permission,
  requestPermission
}: PushDeviceSettingsProps) {
  const { error, isPending, prepareDevice, state, unsubscribeDevice } = usePushSubscription({
    permission,
    requestPermission
  });
  const statusCopy = getPushStatusCopy(state);
  const isBusy = isPending || isRequestingPermission;

  if (!canManage) {
    return null;
  }

  return (
    <div className={styles.deviceBlock}>
      <div className={styles.deviceStatusText}>
        <span className={styles.deviceStatusTitle}>Push del navegador</span>
        <p className={styles.deviceStatusDescription}>
          Prepará este dispositivo para recibir avisos futuros incluso cuando OrderOps no esté
          abierto.
        </p>
      </div>

      <div className={styles.deviceStatus}>
        <span className={getPushStatusPillClass(state)}>{statusCopy.title}</span>
        <div className={styles.deviceStatusText}>
          <p className={styles.deviceStatusDescription}>{statusCopy.description}</p>
        </div>
      </div>

      <p className={styles.deviceHint}>
        Todavía no enviamos pedidos por push. Esta opción prepara la base para una próxima fase.
      </p>

      <div className={styles.inlineFeedback} aria-live="polite">
        {error ? <p className={`${styles.feedback} ${styles.feedbackError}`}>{error}</p> : null}
      </div>

      {state === "not_configured" || state === "configured" ? (
        <div className={styles.actionsRow}>
          {state === "not_configured" ? (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => {
                void prepareDevice();
              }}
              disabled={isBusy}
            >
              Preparar este dispositivo
            </button>
          ) : null}

          {state === "configured" ? (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => {
                void unsubscribeDevice();
              }}
              disabled={isBusy}
            >
              Desactivar en este dispositivo
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
