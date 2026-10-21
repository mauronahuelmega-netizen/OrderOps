import DemoRequestForm from "@/components/marketing/demo-request-form";
import styles from "@/components/marketing/demo-request-form.module.css";

export default function DemoPage() {
  return (
    <main className={styles.page}>
      <h1>Solicitar demo</h1>
      <p className={styles.intro}>Contanos sobre el comercio. No hace falta crear una cuenta.</p>
      <DemoRequestForm />
    </main>
  );
}
