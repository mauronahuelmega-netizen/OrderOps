"use client";

import { usePushSubscription } from "@/components/admin/notifications/use-push-subscription";
import type { BrowserNotificationPermissionState } from "@/lib/notifications/preferences";

type PushDeviceSettingsProps = {
  canManage: boolean;
  isRequestingPermission: boolean;
  permission: BrowserNotificationPermissionState;
  requestPermission: () => Promise<BrowserNotificationPermissionState>;
};

function getPushStatusCopy(state: ReturnType<typeof usePushSubscription>["state"]) {
  switch (state) {
    case "unsupported":
      return {
        title: "No disponible",
        description: "Este navegador no soporta push web."
      };
    case "env_missing":
      return {
        title: "No configurado en este entorno",
        description: "Push no esta configurado en este entorno."
      };
    case "blocked":
      return {
        title: "Bloqueado",
        description: "Las notificaciones estan bloqueadas en este navegador."
      };
    case "configured":
      return {
        title: "Dispositivo preparado",
        description: "Este dispositivo esta preparado para push."
      };
    case "not_configured":
      return {
        title: "Sin preparar",
        description: "Este dispositivo todavia no esta preparado para push."
      };
    case "unknown":
    default:
      return {
        title: "Verificando",
        description: "Estamos revisando si este navegador puede preparar push."
      };
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
    <div className="admin-notification-settings-card__section">
      <div className="admin-notification-settings-card__section-header">
        <strong>Push del navegador</strong>
        <p>
          Prepara este dispositivo para recibir avisos futuros incluso cuando OrderOps no este
          abierto.
        </p>
      </div>

      <div className="admin-notification-settings-card__status">
        <strong>{statusCopy.title}</strong>
        <p>{statusCopy.description}</p>
      </div>

      <p className="admin-field-hint">
        Todavia no enviamos pedidos por push. Esta opcion prepara la base para una proxima fase.
      </p>

      {error ? <p className="admin-feedback admin-feedback--error">{error}</p> : null}

      <div className="admin-notification-settings-card__actions">
        {state === "not_configured" ? (
          <button
            type="button"
            className="admin-primary-button"
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
            className="admin-secondary-link admin-secondary-link--muted"
            onClick={() => {
              void unsubscribeDevice();
            }}
            disabled={isBusy}
          >
            Desactivar en este dispositivo
          </button>
        ) : null}
      </div>
    </div>
  );
}
