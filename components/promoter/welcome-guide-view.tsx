import { CheckCircle2 } from "lucide-react";

type Step = { label: string; done: boolean };

export function WelcomeGuideView({
  className,
  completedClassName,
  headerRowClassName,
  titleGroupClassName,
  statusBadgeClassName,
  checkIconClassName,
  noteClassName,
  readOk,
  visible,
  writeError,
  pending,
  buttonLabel,
  steps,
  onPress
}: {
  className?: string;
  completedClassName?: string;
  headerRowClassName?: string;
  titleGroupClassName?: string;
  statusBadgeClassName?: string;
  checkIconClassName?: string;
  noteClassName?: string;
  readOk: boolean;
  visible: boolean;
  writeError: boolean;
  pending: boolean;
  buttonLabel: string;
  steps: Step[];
  onPress: () => void;
}) {
  const doneCount = steps.filter((step) => step.done).length;
  const allDone = steps.length > 0 && doneCount === steps.length;
  const rootClassName = [className, allDone ? completedClassName : undefined].filter(Boolean).join(" ") || undefined;

  return (
    <div className={rootClassName} data-guide-completed={allDone ? "true" : "false"}>
      <div className={headerRowClassName}>
        <div className={titleGroupClassName}>
          {allDone ? <CheckCircle2 className={checkIconClassName} aria-hidden="true" /> : null}
          <h2>Primeros pasos</h2>
          {allDone ? (
            <span className={statusBadgeClassName}>Incorporación completada</span>
          ) : null}
        </div>
        {readOk ? (
          <button type="button" disabled={pending} onClick={onPress}>
            {buttonLabel}
          </button>
        ) : null}
      </div>
      {!allDone ? (
        <p className={noteClassName}>Revisá lo que ya tenés listo para empezar a trabajar.</p>
      ) : null}
      {!readOk ? (
        <p className={noteClassName} role="alert">No se pudo confirmar el cierre de esta guía.</p>
      ) : null}
      {writeError ? (
        <p className={noteClassName} role="alert">No se pudo guardar el cierre de esta guía.</p>
      ) : null}
      {visible ? (
        <details>
          <summary>
            {doneCount} de {steps.length} pasos listos. Ver pasos de incorporación
          </summary>
          <ul>
            {steps.map((step) => (
              <li key={step.label}>{step.done ? "Listo" : "Pendiente"} · {step.label}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

export function welcomeGuideButtonLabel(dismissed: boolean) {
  return dismissed ? "Mostrar la guía" : "Cerrar la guía";
}

export function welcomeGuideVisible(readOk: boolean, dismissed: boolean) {
  return !readOk || !dismissed;
}
