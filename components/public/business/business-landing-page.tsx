import type { CSSProperties } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import type { PublicBusiness } from "@/lib/business/public";

type BusinessLandingPageProps = {
  business: PublicBusiness;
  slug: string;
};

export default function BusinessLandingPage({
  business,
  slug
}: BusinessLandingPageProps) {
  const whatsappHref = buildBusinessWhatsappUrl(business.whatsapp_number);
  const businessStyles = getBusinessBrandStyles(business.primary_color);
  const description =
    business.description?.trim() || "Hacé tu pedido online y confirmalo por WhatsApp.";

  return (
    <main className="business-landing-page" style={businessStyles}>
      <section className="business-landing-hero">
        <div className="business-landing-shell business-landing-hero-layout">
          <div className="business-landing-brand-block">
            {business.logo_url ? (
              <img
                className="business-landing-logo"
                src={business.logo_url}
                alt={business.name}
              />
            ) : (
              <div className="business-landing-logo business-landing-logo--placeholder">
                {business.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="business-landing-copy">
              <p className="business-landing-eyebrow">Pedido online</p>
              <h1>{business.name}</h1>
              <p className="business-landing-lead">{description}</p>
            </div>

            <div className="business-landing-actions">
              <Button href={`/b/${slug}/catalogo`} variant="primary">
                Ver catálogo
              </Button>
              <Button
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                variant="secondary"
              >
                Consultar por WhatsApp
              </Button>
            </div>

            {business.instagram_url ? (
              <a
                className="business-landing-instagram"
                href={business.instagram_url}
                target="_blank"
                rel="noreferrer"
              >
                Instagram
              </a>
            ) : null}
          </div>

          <Card className="business-landing-showcase">
            {business.cover_image_url ? (
              <div className="business-landing-cover">
                <img src={business.cover_image_url} alt={`Portada de ${business.name}`} />
              </div>
            ) : (
              <div className="business-landing-cover business-landing-cover--placeholder">
                <span>{business.name}</span>
              </div>
            )}

            <div className="business-landing-summary-card">
              <div className="business-landing-summary-item">
                <strong>Pedido claro</strong>
                <p>Elegí productos, completá tus datos y enviá un pedido ordenado.</p>
              </div>
              <div className="business-landing-summary-item">
                <strong>Confirmación directa</strong>
                <p>El último paso sigue siendo una confirmación simple por WhatsApp.</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="business-landing-section">
        <div className="business-landing-shell business-landing-section-stack">
          <div className="business-landing-section-heading">
            <p className="business-landing-eyebrow">Cómo funciona</p>
            <h2>Hacé tu pedido en pocos pasos</h2>
          </div>

          <div className="business-landing-grid">
            <Card className="business-landing-step-card">
              <span className="business-landing-step-number">01</span>
              <h3>Elegí productos</h3>
              <p>Recorré el catálogo y agregá lo que necesitás al pedido.</p>
            </Card>

            <Card className="business-landing-step-card">
              <span className="business-landing-step-number">02</span>
              <h3>Completá tus datos</h3>
              <p>Indicá cómo querés recibir el pedido y la fecha que te sirve.</p>
            </Card>

            <Card className="business-landing-step-card">
              <span className="business-landing-step-number">03</span>
              <h3>Confirmá por WhatsApp</h3>
              <p>El negocio recibe un pedido claro y puede continuar la confirmación.</p>
            </Card>
          </div>
        </div>
      </section>

      <section className="business-landing-section business-landing-section--muted">
        <div className="business-landing-shell business-landing-section-stack">
          <div className="business-landing-section-heading">
            <p className="business-landing-eyebrow">Pedido sin vueltas</p>
            <h2>Más claro para vos y más simple para el negocio</h2>
          </div>

          <div className="business-landing-grid">
            <Card className="business-landing-info-card">
              <h3>Pedido claro</h3>
              <p>Sin mensajes desordenados ni pedidos armados a mano por partes.</p>
            </Card>

            <Card className="business-landing-info-card">
              <h3>Confirmación directa</h3>
              <p>El cierre sigue pasando por WhatsApp, de forma simple y familiar.</p>
            </Card>

            <Card className="business-landing-info-card">
              <h3>Catálogo fácil de usar</h3>
              <p>Todo queda listo para elegir productos y avanzar sin fricción.</p>
            </Card>
          </div>
        </div>
      </section>

      <section className="business-landing-section business-landing-section--cta">
        <div className="business-landing-shell">
          <Card className="business-landing-cta-card">
            <div className="business-landing-section-heading">
              <p className="business-landing-eyebrow">Listo para pedir</p>
              <h2>Entrá al catálogo y armá tu pedido</h2>
              <p>
                Elegí productos, completá tus datos y terminá la confirmación por
                WhatsApp.
              </p>
            </div>

            <div className="business-landing-actions business-landing-actions--cta">
              <Button href={`/b/${slug}/catalogo`} variant="primary">
                Ver catálogo
              </Button>
              <Button
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                variant="ghost"
              >
                Consultar por WhatsApp
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}

function buildBusinessWhatsappUrl(whatsappNumber: string) {
  const cleanedNumber = whatsappNumber.replace(/[^\d]/g, "");
  const message = encodeURIComponent("Hola, quiero hacer una consulta sobre el catálogo.");

  return `https://wa.me/${cleanedNumber}?text=${message}`;
}

function getBusinessBrandStyles(primaryColor: string | null): CSSProperties {
  return {
    "--business-primary": primaryColor ?? "var(--color-primary)"
  } as CSSProperties;
}
