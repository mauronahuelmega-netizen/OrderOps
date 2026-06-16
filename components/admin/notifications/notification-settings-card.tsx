"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { updateNotificationPreferencesAction } from "@/app/admin/(protected)/settings/public/actions";
import {
  canUseNewOrderBrowserNotification,
  normalizeNotificationPreferences,
  type NotificationPreferences
} from "@/lib/notifications/preferences";
import PushDeviceSettings from "@/components/admin/notifications/push-device-settings";
import { useBrowserNotificationPermission } from "@/components/admin/notifications/use-browser-notification-permission";

type NotificationSettingsCardProps = {
  initialPreferences: NotificationPreferences;
  canManage: boolean;
};

type FeedbackState = {
  error?: string;
  success?: string;
};

type PreferenceKey = keyof NotificationPreferences;

const PREFERENCE_ITEMS: Array<{
  key: PreferenceKey;
  label: string;
  description: string;
}> = [
  {
    key: "new_order_browser_notifications_enabled",
    label: "Avisos del navegador",
    description: "Mostra una notificacion cuando llegue un pedido y estes usando otra pestana."
  },
  {
    key: "new_order_sound_enabled",
    label: "Sonido",
    description: "Reproduci el aviso sonoro de OrderOps cuando llegue un pedido."
  },
  {
    key: "new_order_toast_enabled",
    label: "Toast en pantalla",
    description: "Mostra un aviso visual cuando estes mirando el dashboard."
  },
  {
    key: "new_order_highlight_enabled",
    label: "Highlight del pedido",
    description: "Marca visualmente los pedidos recien llegados."
  }
];

function getPermissionLabel(permission: ReturnType<typeof useBrowserNotificationPermission>["permission"]) {
  switch (permission) {
    case "granted":
      return "permitido";
    case "denied":
      return "bloqueado";
    case "default":
      return "no configurado";
    case "unsupported":
      return "no soportado";
    case "unknown":
    default:
      return "verificando";
  }
}

export default function NotificationSettingsCard({
  initialPreferences,
  canManage
}: NotificationSettingsCardProps) {
  const { isRequesting, permission, requestPermission } = useBrowserNotificationPermission();
  const [isPending, startTransition] = useTransition();
  const [preferences, setPreferences] = useState(() =>
    normalizeNotificationPreferences(initialPreferences)
  );
  const [feedback, setFeedback] = useState<FeedbackState>({});

  useEffect(() => {
    setPreferences(normalizeNotificationPreferences(initialPreferences));
  }, [initialPreferences]);

  const isBusy = isPending || isRequesting;
  const browserCanNotify = canUseNewOrderBrowserNotification(preferences, permission);
  const statusCopy = useMemo(() => {
    if (!canManage) {
      return {
        title: "Solo lectura",
        description: "Tu rol no puede cambiar estos avisos operativos."
      };
    }

    if (permission === "unsupported") {
      return {
        title: "No disponible",
        description: "Este navegador no soporta notificaciones."
      };
    }

    if (permission === "denied") {
      return {
        title: "Bloqueadas",
        description:
          "Las notificaciones estan bloqueadas en este navegador. Podes habilitarlas desde la configuracion del navegador."
      };
    }

    if (permission === "granted" && preferences.new_order_browser_notifications_enabled) {
      return {
        title: "Notificaciones activadas",
        description: "Recibiras avisos de nuevos pedidos aunque estes usando otra pestana."
      };
    }

    if (permission === "granted" && !preferences.new_order_browser_notifications_enabled) {
      return {
        title: "Notificaciones pausadas",
        description:
          "El navegador ya tiene permiso, pero los avisos de nuevos pedidos estan desactivados."
      };
    }

    return {
      title: "No configuradas",
      description: "Todavia no activaste notificaciones en este navegador."
    };
  }, [canManage, permission, preferences.new_order_browser_notifications_enabled]);

  const persistPreferences = (patch: {
    newOrderBrowserNotificationsEnabled?: boolean;
    newOrderSoundEnabled?: boolean;
    newOrderToastEnabled?: boolean;
    newOrderHighlightEnabled?: boolean;
  }) => {
    startTransition(async () => {
      const result = await updateNotificationPreferencesAction(patch);

      if (result?.error) {
        setFeedback({ error: result.error });
        return;
      }

      if (result?.preferences) {
        setPreferences(normalizeNotificationPreferences(result.preferences));
      }

      setFeedback({ success: result?.message ?? "Preferencias actualizadas." });
    });
  };

  const handleEnableBrowserNotifications = async () => {
    setFeedback({});

    const nextPermission = await requestPermission();

    if (nextPermission !== "granted") {
      if (nextPermission === "denied") {
        setFeedback({
          error: "Las notificaciones quedaron bloqueadas en este navegador."
        });
      }

      return;
    }

    persistPreferences({
      newOrderBrowserNotificationsEnabled: true
    });
  };

  const handleToggle = async (key: PreferenceKey, checked: boolean) => {
    setFeedback({});

    if (key === "new_order_browser_notifications_enabled" && checked) {
      await handleEnableBrowserNotifications();
      return;
    }

    persistPreferences({
      ...(key === "new_order_browser_notifications_enabled"
        ? { newOrderBrowserNotificationsEnabled: checked }
        : {}),
      ...(key === "new_order_sound_enabled" ? { newOrderSoundEnabled: checked } : {}),
      ...(key === "new_order_toast_enabled" ? { newOrderToastEnabled: checked } : {}),
      ...(key === "new_order_highlight_enabled" ? { newOrderHighlightEnabled: checked } : {})
    });
  };

  return (
    <section className="admin-form-card admin-notification-settings-card">
      <div className="admin-form-header">
        <h2>Notificaciones operativas</h2>
        <p>Recibi avisos de nuevos pedidos aunque estes usando otra pestana.</p>
      </div>

      <div className="admin-notification-settings-card__status">
        <strong>{statusCopy.title}</strong>
        <p>{statusCopy.description}</p>
      </div>

      <div className="admin-notification-settings-card__meta">
        <span>Permiso del navegador: {getPermissionLabel(permission)}</span>
        <span>Preferencia actual: {browserCanNotify ? "activa" : "pausada"}</span>
      </div>

      {canManage && permission === "default" ? (
        <div className="admin-notification-settings-card__actions">
          <button
            type="button"
            className="admin-primary-button"
            onClick={handleEnableBrowserNotifications}
            disabled={isBusy}
          >
            Activar notificaciones
          </button>
        </div>
      ) : null}

      <div className="admin-notification-settings-card__section">
        <div className="admin-notification-settings-card__section-header">
          <strong>Nuevos pedidos</strong>
        </div>

        <div className="admin-notification-settings-card__list">
          {PREFERENCE_ITEMS.map((item) => {
            const checked = preferences[item.key];
            const disabled =
              !canManage ||
              isBusy ||
              (item.key === "new_order_browser_notifications_enabled" &&
                permission === "unsupported");

            return (
              <label key={item.key} className="admin-notification-settings-card__item">
                <div className="admin-notification-settings-card__copy">
                  <span>{item.label}</span>
                  <small>{item.description}</small>
                </div>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={(event) => {
                    void handleToggle(item.key, event.currentTarget.checked);
                  }}
                />
              </label>
            );
          })}
        </div>
      </div>

      <PushDeviceSettings
        canManage={canManage}
        isRequestingPermission={isRequesting}
        permission={permission}
        requestPermission={requestPermission}
      />

      {feedback.error ? <p className="admin-feedback admin-feedback--error">{feedback.error}</p> : null}
      {feedback.success ? (
        <p className="admin-feedback admin-feedback--success">{feedback.success}</p>
      ) : null}
    </section>
  );
}
