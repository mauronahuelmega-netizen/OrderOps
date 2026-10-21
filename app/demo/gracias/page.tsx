import styles from "@/components/marketing/demo-request-form.module.css";

export default function DemoThanksPage() {
  return (
    <main className={styles.page}>
      <h1>Solicitud recibida</h1>
      <p className={styles.confirm}>El equipo comercial va a revisar el pedido. Esta página no muestra datos de otros comercios.</p>
    </main>
  );
}
