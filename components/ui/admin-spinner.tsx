import styles from "./admin-spinner.module.css";

type AdminSpinnerProps = {
  label?: string;
};

export default function AdminSpinner({ label = "Cargando…" }: AdminSpinnerProps) {
  return (
    <div className={styles.root} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      {label ? <p className={styles.label}>{label}</p> : null}
    </div>
  );
}
