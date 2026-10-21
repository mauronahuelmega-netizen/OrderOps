import styles from "@/components/marketing/demo-request-form.module.css";

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <h1>Privacidad de la demo</h1>
      <p className={styles.confirm}>
        Los datos del formulario se usan para responder una solicitud de demostración de OrderOps y para evitar envíos duplicados.
        No reemplazan un dictamen legal ni una política corporativa completa.
      </p>
    </main>
  );
}
