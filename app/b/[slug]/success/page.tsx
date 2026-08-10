import Button from "@/components/ui/Button";
import { requirePublicBusinessBySlug } from "@/lib/business/public";
import { buildPublicOrderWhatsappUrl } from "@/lib/whatsapp/public";
import type { CSSProperties } from "react";
import styles from "./success-page.module.css";

type SuccessPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    order_id?: string;
  }>;
};

export default async function SuccessPage({
  params,
  searchParams
}: SuccessPageProps) {
  const [{ slug }, { order_id: orderId }] = await Promise.all([params, searchParams]);
  const business = await requirePublicBusinessBySlug(slug);
  const whatsappUrl = buildPublicOrderWhatsappUrl({
    whatsappNumber: business.whatsapp_number,
    orderId
  });

  const businessStyles = {
    "--business-primary": business.primary_color ?? "var(--color-primary)",
    "--business-primary-foreground": "#ffffff"
  } as CSSProperties;

  return (
    <main className={styles.page} style={businessStyles}>
      <div className={styles.inner}>
        <section className={styles.panel} aria-labelledby="success-title">
          <p className={styles.eyebrow}>Pedido registrado</p>
          <div className={styles.heading}>
            <h1 id="success-title" className={styles.title}>
              Pedido recibido
            </h1>
            <p className={styles.business}>{business.name}</p>
          </div>
          <p className={styles.copy}>
            {orderId
              ? "Ya registramos tu pedido. Confirmalo por WhatsApp para que el negocio pueda prepararlo."
              : "Ya registramos tu pedido. Si necesitás confirmarlo, escribile al negocio por WhatsApp."}
          </p>
          {orderId ? (
            <div className={styles.orderRef}>
              <span className={styles.orderRefLabel}>Referencia del pedido</span>
              <p className={styles.orderRefValue}>{orderId}</p>
            </div>
          ) : null}
          <div className={styles.actions}>
            <Button
              className={styles.primaryCta}
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              variant="primary"
            >
              Confirmar por WhatsApp
            </Button>
            <Button
              className={styles.secondaryCta}
              href={`/b/${slug}/catalogo`}
              variant="secondary"
            >
              Volver al catálogo
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
