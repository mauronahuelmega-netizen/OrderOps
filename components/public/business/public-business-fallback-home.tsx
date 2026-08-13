import Button from "@/components/ui/Button";
import styles from "./public-business-fallback-home.module.css";

export type PublicBusinessFallbackHomeProps = {
  businessName: string;
  logoUrl?: string | null;
  whatsappUrl?: string | null;
};

export default function PublicBusinessFallbackHome({
  businessName,
  logoUrl,
  whatsappUrl
}: PublicBusinessFallbackHomeProps) {
  const hasWhatsapp = typeof whatsappUrl === "string" && whatsappUrl.length > 0;
  const initial = businessName.trim().charAt(0).toUpperCase() || "?";

  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="public-fallback-title">
        {logoUrl ? (
          <img className={styles.logo} src={logoUrl} alt={businessName} />
        ) : (
          <div className={`${styles.logo} ${styles.logoPlaceholder}`} aria-hidden="true">
            {initial}
          </div>
        )}

        <p className={styles.businessName}>{businessName}</p>
        <p className={styles.eyebrow}>Pedido online</p>
        <h1 id="public-fallback-title" className={styles.title}>
          Estamos preparando el catálogo online
        </h1>
        <p className={styles.body}>
          {hasWhatsapp
            ? "Muy pronto vas a poder ver los productos y armar tu pedido desde acá. Mientras tanto, podés consultar directamente por WhatsApp."
            : "Muy pronto vas a poder ver los productos y armar tu pedido desde acá. Volvé a intentar más tarde."}
        </p>

        {hasWhatsapp ? (
          <div className={styles.actions}>
            <Button href={whatsappUrl} target="_blank" rel="noreferrer" variant="primary">
              Consultar por WhatsApp
            </Button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
