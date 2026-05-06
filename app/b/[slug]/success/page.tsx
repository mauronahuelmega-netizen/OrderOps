import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
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
      <Card className="success-panel">
        <p className="catalog-eyebrow">Pedido registrado</p>
        <div className="success-heading">
          <h1>Tu pedido fue recibido correctamente</h1>
          <p className="success-business-name">{business.name}</p>
        </div>
        <p className="success-copy">
          Ya registramos tu pedido. El siguiente paso es confirmarlo por WhatsApp
          para que el negocio pueda prepararlo.
        </p>
        {orderId ? (
          <div className="success-order-id">
            <span>Número de pedido</span>
            <strong>{orderId}</strong>
          </div>
        ) : null}
        <div className="success-actions">
          <Button
            className="success-link"
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            variant="accent"
          >
            Confirmar por WhatsApp
          </Button>
          <Button
            className="success-link"
            href={`/b/${slug}/catalogo`}
            variant="secondary"
          >
            Volver al catálogo
          </Button>
        </div>
      </Card>
    </main>
  );
}
