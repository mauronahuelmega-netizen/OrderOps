"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { updateNotificationPreferencesAction } from "@/app/admin/(protected)/settings/notifications/actions";
import {
  canUseNewOrderBrowserNotification,
  normalizeNotificationPreferences,
  type NotificationPreferences
} from "@/lib/notifications/preferences";
import PushDeviceSettings from "@/components/admin/notifications/push-device-settings";
import { useBrowserNotificationPermission } from "@/components/admin/notifications/use-browser-notification-permission";
import styles from "./notification-settings.module.css";

type NotificationSettingsCardProps = {
  initialPreferences: NotificationPreferences;
  canManage: boolean;
};

type FeedbackState = {
  error?: string;
  success?: string;
};

type PreferenceKey = keyof NotificationPreferences;

type BrowserPermission = ReturnType<typeof useBrowserNotificationPermission>["permission"];

type StatusTone = "ready" | "pending" | "blocked" | "neutral";

const PREFERENCE_ITEMS: Array<{
  key: PreferenceKey;
  label: string;
  description: string;
}> = [
  {
    key: "new_order_browser_notifications_enabled",
    label: "Avisos del navegador",
    description: "Mostrar una notificación cuando llegue un pedido y estés usando otra pestaña."
  },
  {
    key: "new_order_sound_enabled",
    label: "Sonido",
    description: "Reproducir el aviso sonoro de OrderOps cuando llegue un pedido."
  },
  {
    key: "new_order_toast_enabled",
    label: "Toast en pantalla",
    description: "Mostrar un aviso visual cuando estés mirando el dashboard."
  },
  {
    key: "new_order_highlight_enabled",
    label: "Highlight del pedido",
    description: "Marcar visualmente los pedidos recién llegados."
  }
];

function getPermissionLabel(permission: BrowserPermission) {
  switch (permission) {
    case "granted":
      return "Permitido";
    case "denied":
      return "Bloqueado";
    case "default":
      return "Sin configurar";
    case "unsupported":
      return "No soportado";
    case "unknown":
    default:
      return "Verificando";
  }
}

function getPermissionDescription(permission: BrowserPermission) {
  switch (permission) {
    case "granted":
      return "Este navegador puede mostrar avisos de nuevos pedidos.";
    case "denied":
      return "Está bloqueado. Habilitalo desde la configuración del navegador.";
    case "default":
      return "Todavía no diste permiso a este navegador.";
    case "unsupported":
      return "Este navegador no soporta notificaciones.";
    case "unknown":
    default:
      return "Estamos verificando el estado del navegador.";
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

  const activeCount = useMemo(
    () => PREFERENCE_ITEMS.reduce((total, item) => total + (preferences[item.key] ? 1 : 0), 0),
    [preferences]
  );

  const status = useMemo<{ title: string; description: string; tone: StatusTone }>(() => {
    if (!canManage) {
      return {
        title: "Solo lectura",
        description: "Tu rol no puede cambiar estos avisos operativos.",
        tone: "neutral"
      };
    }

    if (permission === "unsupported") {
      return {
        title: "No disponible",
        description: "Este navegador no soporta notificaciones.",
        tone: "neutral"
      };
    }

    if (permission === "denied") {
      return {
        title: "Bloqueadas",
        description:
          "Las notificaciones están bloqueadas en este navegador. Podés habilitarlas desde la configuración del navegador.",
        tone: "blocked"
      };
    }

    if (permission === "granted" && preferences.new_order_browser_notifications_enabled) {
      return {
        title: "Notificaciones activadas",
        description: "Recibirás avisos de nuevos pedidos aunque estés usando otra pestaña.",
        tone: "ready"
      };
    }

    if (permission === "granted" && !preferences.new_order_browser_notifications_enabled) {
      return {
        title: "Notificaciones pausadas",
        description:
          "El navegador ya tiene permiso, pero los avisos de nuevos pedidos están desactivados.",
        tone: "pending"
      };
    }

    return {
      title: "No configuradas",
      description: "Todavía no activaste notificaciones en este navegador.",
      tone: "pending"
    };
  }, [canManage, permission, preferences.new_order_browser_notifications_enabled]);

  const statusPillClass = getStatusPillClass(status.tone);
  const saveState: "saving" | "saved" | "idle" = isPending
    ? "saving"
    : feedback.success
      ? "saved"
      : "idle";

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
    <div className={styles.layout}>
      <section className={styles.summary} aria-labelledby="notif-summary-title">
        <div className={styles.summaryHeader}>
          <h2 id="notif-summary-title" className={styles.summaryTitle}>
            Resumen de notificaciones
          </h2>
          <p className={styles.summaryDescription}>
            Definí qué avisos recibe tu equipo durante la operación diaria.
          </p>
        </div>

        <div className={styles.statGrid}>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {activeCount} de {PREFERENCE_ITEMS.length}
            </span>
            <span className={styles.statLabel}>Avisos activos</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{getPermissionLabel(permission)}</span>
            <span className={styles.statLabel}>Permiso del navegador</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{browserCanNotify ? "Activa" : "Pausada"}</span>
            <span className={styles.statLabel}>Notificación de pedidos</span>
          </div>
        </div>

        <p className={styles.summaryStatus}>
          <span className={statusPillClass}>{status.title}</span>
          <span>{status.description}</span>
        </p>

        <p className={styles.autosaveHint}>Los cambios se guardan automáticamente.</p>
      </section>

      <section className={styles.card} aria-labelledby="notif-prefs-title">
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderText}>
            <h2 id="notif-prefs-title" className={styles.cardTitle}>
              Avisos de nuevos pedidos
            </h2>
            <p className={styles.cardDescription}>
              Elegí cómo querés enterarte cuando entra un pedido nuevo.
            </p>
          </div>

          {saveState === "saving" ? (
            <span className={`${styles.savePill} ${styles.savePillActive}`}>Guardando…</span>
          ) : null}
          {saveState === "saved" ? (
            <span className={`${styles.savePill} ${styles.savePillSaved}`}>Guardado</span>
          ) : null}
        </div>

        <div className={styles.switchList}>
          {PREFERENCE_ITEMS.map((item) => {
            const checked = preferences[item.key];
            const disabled =
              !canManage ||
              isBusy ||
              (item.key === "new_order_browser_notifications_enabled" &&
                permission === "unsupported");

            return (
              <label
                key={item.key}
                className={`${styles.switchRow} ${disabled ? styles.switchRowDisabled : ""}`}
              >
                <div className={styles.switchCopy}>
                  <span className={styles.switchLabel}>{item.label}</span>
                  <span className={styles.switchDescription}>{item.description}</span>
                </div>
                <span className={styles.switch}>
                  <input
                    type="checkbox"
                    className={styles.switchInput}
                    checked={checked}
                    disabled={disabled}
                    onChange={(event) => {
                      void handleToggle(item.key, event.currentTarget.checked);
                    }}
                  />
                  <span className={styles.switchTrack} aria-hidden="true">
                    <span className={styles.switchThumb} />
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        <div className={styles.inlineFeedback} aria-live="polite">
          {feedback.error ? (
            <p className={`${styles.feedback} ${styles.feedbackError}`}>{feedback.error}</p>
          ) : null}
          {feedback.success ? (
            <p className={`${styles.feedback} ${styles.feedbackSuccess}`}>{feedback.success}</p>
          ) : null}
        </div>
      </section>

      <section className={styles.card} aria-labelledby="notif-device-title">
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderText}>
            <h2 id="notif-device-title" className={styles.cardTitle}>
              Dispositivo y permisos
            </h2>
            <p className={styles.cardDescription}>
              Controlá qué puede hacer este navegador y preparalo para recibir avisos.
            </p>
          </div>
        </div>

        <div className={styles.deviceBlock}>
          <div className={styles.deviceStatus}>
            <span className={getStatusPillClass(getPermissionTone(permission))}>
              {getPermissionLabel(permission)}
            </span>
            <div className={styles.deviceStatusText}>
              <span className={styles.deviceStatusTitle}>Permiso del navegador</span>
              <p className={styles.deviceStatusDescription}>
                {getPermissionDescription(permission)}
              </p>
            </div>
          </div>

          {canManage && permission === "default" ? (
            <div className={styles.actionsRow}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleEnableBrowserNotifications}
                disabled={isBusy}
              >
                Activar notificaciones
              </button>
            </div>
          ) : null}
        </div>

        <PushDeviceSettings
          canManage={canManage}
          isRequestingPermission={isRequesting}
          permission={permission}
          requestPermission={requestPermission}
        />
      </section>

      <section className={styles.helpCard} aria-labelledby="notif-help-title">
        <h2 id="notif-help-title" className={styles.helpTitle}>
          Qué recibe tu equipo
        </h2>
        <ul className={styles.helpList}>
          <li>Los avisos operativos se configuran por persona con acceso al panel.</li>
          <li>Los avisos del navegador dependen del permiso de este dispositivo.</li>
          <li>Sonido, toast y highlight funcionan mientras el panel está abierto.</li>
        </ul>
      </section>
    </div>
  );
}

function getStatusPillClass(tone: StatusTone) {
  switch (tone) {
    case "ready":
      return `${styles.statusPill} ${styles.statusPillReady}`;
    case "pending":
      return `${styles.statusPill} ${styles.statusPillPending}`;
    case "blocked":
      return `${styles.statusPill} ${styles.statusPillBlocked}`;
    case "neutral":
    default:
      return `${styles.statusPill} ${styles.statusPillNeutral}`;
  }
}

function getPermissionTone(permission: BrowserPermission): StatusTone {
  switch (permission) {
    case "granted":
      return "ready";
    case "denied":
      return "blocked";
    case "default":
      return "pending";
    case "unsupported":
    case "unknown":
    default:
      return "neutral";
  }
}
