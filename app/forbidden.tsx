import styles from "./forbidden.module.css";

export default function ForbiddenPage() {
  return (
    <main className={styles.page}>
      <h1>Acceso denegado</h1>
      <p>Esta cuenta no puede abrir esta sección.</p>
    </main>
  );
}
