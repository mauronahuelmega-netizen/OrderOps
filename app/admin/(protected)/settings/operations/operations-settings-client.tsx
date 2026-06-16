"use client";

import { useActionState, useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleBusinessStatus } from "@/app/admin/(protected)/dashboard/actions";
import { updateScheduledSettings } from "@/app/admin/(protected)/settings/operations/actions";
import AdminPageHeader from "@/components/admin/admin-page-header";
import AdminPageLayout from "@/components/admin/admin-page-layout";
import PublicSettingsNav from "@/components/admin/settings/public-settings-nav";
import { useAdminBusinessSettings } from "@/components/admin/admin-shell";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import styles from "./operations-settings.module.css";

type OperationsSettingsClientProps = {
  canManagePublicSettings: boolean;
};

type FormActionState = {
  error?: string;
  success?: boolean;
};

const initialFormState: FormActionState = {};

const SUBSCRIPTION_MODES = [
  {
    key: "on_demand_mode_active" as const,
    label: "On-Demand",
    hint: "Pedidos para hoy con tienda abierta."
  },
  {
    key: "scheduled_mode_active" as const,
    label: "Scheduled",
    hint: "Pedidos con fecha futura programada."
  },
  {
    key: "kitchen_mode_active" as const,
    label: "Kitchen",
    hint: "Vista operativa de cocina en el admin."
  }
];

const WEEKDAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" }
] as const;

function toTimeInputValue(dbTime: string | undefined): string {
  if (!dbTime) {
    return "18:00";
  }

  return dbTime.slice(0, 5);
}

export default function OperationsSettingsClient({
  canManagePublicSettings
}: OperationsSettingsClientProps) {
  const router = useRouter();
  const { settings, loading } = useAdminBusinessSettings();
  const [onDemandModeActive, setOnDemandModeActive] = useState(false);
  const [storeActionError, setStoreActionError] = useState<string | null>(null);
  const [isStorePending, startStoreTransition] = useTransition();
  const [formState, formAction, isFormPending] = useActionState(
    updateScheduledSettings,
    initialFormState
  );

  const [minLeadTimeHours, setMinLeadTimeHours] = useState("24");
  const [maxDaysInAdvance, setMaxDaysInAdvance] = useState("30");
  const [cutoffTime, setCutoffTime] = useState("18:00");
  const [inactiveDays, setInactiveDays] = useState<number[]>([]);

  useEffect(() => {
    if (!settings) {
      return;
    }

    setOnDemandModeActive(settings.on_demand_mode_active);
    setMinLeadTimeHours(String(settings.scheduled_min_lead_time_hours));
    setMaxDaysInAdvance(String(settings.scheduled_max_days_in_advance));
    setCutoffTime(toTimeInputValue(settings.scheduled_cutoff_time));
    setInactiveDays(settings.inactive_working_days ?? []);
  }, [settings]);

  useEffect(() => {
    if (formState.success) {
      router.refresh();
    }
  }, [formState.success, router]);

  const handleToggleStore = useCallback(
    (nextActive: boolean) => {
      if (!canManagePublicSettings || isStorePending) {
        return;
      }

      setStoreActionError(null);
      startStoreTransition(async () => {
        const result = await toggleBusinessStatus(nextActive);

        if (result.error) {
          setStoreActionError(result.error);
          return;
        }

        setOnDemandModeActive(nextActive);
        router.refresh();
      });
    },
    [canManagePublicSettings, isStorePending, router]
  );

  const toggleInactiveDay = useCallback((day: number, checked: boolean) => {
    setInactiveDays((current) => {
      if (checked) {
        return current.includes(day) ? current : [...current, day].sort((a, b) => a - b);
      }

      return current.filter((value) => value !== day);
    });
  }, []);

  if (loading || !settings) {
    return (
      <AdminPageLayout size="default">
        <AdminPageHeader
          eyebrow="Configuración"
          title="Operaciones"
          description="Cargando reglas operativas del negocio…"
        />
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout size="default">
      <AdminPageHeader
        eyebrow="Configuración"
        title="Operaciones"
        description="Consulta los modos contratados, controla la tienda On-Demand y ajusta las reglas del modo programado."
      />

      {canManagePublicSettings ? (
        <div className="admin-settings-public-page__nav">
          <PublicSettingsNav current="operaciones" />
        </div>
      ) : null}

      <div className={styles.page}>
        <div className={styles.sections}>
          <section className={styles.section} aria-labelledby="operations-subscription-heading">
            <div className={styles.sectionHeader}>
              <h2 id="operations-subscription-heading" className={styles.sectionTitle}>
                Suscripción de modos
              </h2>
              <p className={styles.sectionDescription}>
                Activación gestionada por Super Admin. Solo lectura para el tenant.
              </p>
            </div>

            <div className={styles.modeGrid}>
              {SUBSCRIPTION_MODES.map((mode) => {
                const isActive = settings[mode.key];

                return (
                  <article key={mode.key} className={styles.modeCard}>
                    <p className={styles.modeLabel}>{mode.label}</p>
                    <span
                      className={`${styles.badge} ${isActive ? styles.badgeActive : styles.badgeInactive}`}
                    >
                      {isActive ? "Activo" : "Inactivo"}
                    </span>
                    <p className={styles.modeHint}>{mode.hint}</p>
                  </article>
                );
              })}
            </div>
          </section>

          <section className={styles.section} aria-labelledby="operations-on-demand-heading">
            <div className={styles.sectionHeader}>
              <h2 id="operations-on-demand-heading" className={styles.sectionTitle}>
                On-Demand
              </h2>
              <p className={styles.sectionDescription}>
                Abre o cierra la tienda para recibir pedidos del día sin fecha futura.
              </p>
            </div>

            <div className={styles.storeStatus}>
              <p className={styles.storeStatusText}>
                Estado actual:{" "}
                <strong>{onDemandModeActive ? "Tienda abierta" : "Tienda cerrada"}</strong>
              </p>
            </div>

            {canManagePublicSettings ? (
              <div className={styles.actionsRow}>
                <Button
                  type="button"
                  variant="primary"
                  disabled={isStorePending || onDemandModeActive}
                  onClick={() => handleToggleStore(true)}
                >
                  {isStorePending ? "Procesando…" : "Abrir tienda"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isStorePending || !onDemandModeActive}
                  onClick={() => handleToggleStore(false)}
                >
                  {isStorePending ? "Procesando…" : "Cerrar tienda"}
                </Button>
              </div>
            ) : (
              <p className={`${styles.feedback} ${styles.feedbackInfo}`}>
                No tienes permisos para cambiar el estado de la tienda.
              </p>
            )}

            {storeActionError ? (
              <p className={`${styles.feedback} ${styles.feedbackError}`} role="alert">
                {storeActionError}
              </p>
            ) : null}
          </section>

          <section className={styles.section} aria-labelledby="operations-scheduled-heading">
            <div className={styles.sectionHeader}>
              <h2 id="operations-scheduled-heading" className={styles.sectionTitle}>
                Scheduled Mode
              </h2>
              <p className={styles.sectionDescription}>
                Reglas operativas para pedidos con entrega programada.
              </p>
            </div>

            {!settings.scheduled_mode_active ? (
              <p className={`${styles.feedback} ${styles.feedbackInfo}`}>
                El modo programado no está activo en tu suscripción. Contacta al Super Admin para
                habilitarlo.
              </p>
            ) : canManagePublicSettings ? (
              <form action={formAction} className={styles.form}>
                <div className={styles.formGrid}>
                  <Input
                    type="number"
                    name="scheduled_min_lead_time_hours"
                    label="Horas mínimas de anticipación"
                    min={0}
                    step={1}
                    value={minLeadTimeHours}
                    onChange={(event) => setMinLeadTimeHours(event.target.value)}
                    helperText="Tiempo mínimo entre el pedido y la entrega programada."
                    required
                  />

                  <Input
                    type="number"
                    name="scheduled_max_days_in_advance"
                    label="Días máximos de anticipación"
                    min={1}
                    step={1}
                    value={maxDaysInAdvance}
                    onChange={(event) => setMaxDaysInAdvance(event.target.value)}
                    helperText="Ventana máxima permitida para elegir una fecha futura."
                    required
                  />

                  <div className={styles.formGridFull}>
                    <Input
                      type="time"
                      name="scheduled_cutoff_time"
                      label="Hora límite de corte"
                      value={cutoffTime}
                      onChange={(event) => setCutoffTime(event.target.value)}
                      helperText="Después de esta hora no se aceptan pedidos para el día siguiente."
                      required
                    />
                  </div>

                  <div className={styles.formGridFull}>
                    <fieldset className={styles.weekdayFieldset}>
                      <legend className={styles.weekdayLegend}>Días sin operación física</legend>
                      <div className={styles.weekdayGrid}>
                        {WEEKDAYS.map((weekday) => (
                          <label key={weekday.value} className={styles.weekdayOption}>
                            <input
                              type="checkbox"
                              name="inactive_working_days"
                              value={String(weekday.value)}
                              checked={inactiveDays.includes(weekday.value)}
                              onChange={(event) =>
                                toggleInactiveDay(weekday.value, event.target.checked)
                              }
                            />
                            <span>{weekday.label}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  </div>
                </div>

                <div className={styles.formActions}>
                  <Button type="submit" variant="primary" disabled={isFormPending}>
                    {isFormPending ? "Guardando…" : "Guardar reglas programadas"}
                  </Button>

                  {formState.error ? (
                    <p className={`${styles.feedback} ${styles.feedbackError}`} role="alert">
                      {formState.error}
                    </p>
                  ) : null}

                  {formState.success ? (
                    <p className={`${styles.feedback} ${styles.feedbackSuccess}`} role="status">
                      Reglas programadas guardadas.
                    </p>
                  ) : null}
                </div>
              </form>
            ) : (
              <p className={`${styles.feedback} ${styles.feedbackInfo}`}>
                No tienes permisos para editar las reglas programadas.
              </p>
            )}
          </section>
        </div>
      </div>
    </AdminPageLayout>
  );
}
