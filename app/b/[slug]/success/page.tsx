import Link from "next/link";
import { requirePublicBusinessBySlug } from "@/lib/business/public";
import { buildPublicOrderWhatsappUrl } from "@/lib/whatsapp/public";

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

  return (
    <main className="success-page">
      <section className="success-panel">
        <p className="catalog-eyebrow">Pedido registrado</p>
        <h1>{business.name}</h1>
        <p className="success-copy">
          Tu pedido fue registrado correctamente.
        </p>
        {orderId ? (
          <div className="success-order-id">
            <span>Numero de pedido</span>
            <strong>{orderId}</strong>
          </div>
        ) : null}
        <div className="success-actions">
          <a
            className="success-link success-link--whatsapp"
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
          >
            Enviar por WhatsApp
          </a>
          <Link className="success-link" href={`/b/${slug}`}>
            Volver al catalogo
          </Link>
        </div>
      </section>
    </main>
  );
}
