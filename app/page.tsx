import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

const problems = [
  "Mensajes larguísimos que mezclan productos, cantidades y notas.",
  "Errores al pasar pedidos a mano o confirmar por partes.",
  "Falta de orden para saber qué entra, qué sigue y qué ya está listo."
];

const solutionSteps = [
  {
    title: "Catálogo simple",
    description: "Cada negocio muestra sus productos en un catálogo claro y mobile-first."
  },
  {
    title: "Pedido ordenado",
    description: "El cliente arma su carrito y envía un pedido con datos completos."
  },
  {
    title: "Dashboard operativo",
    description: "El negocio recibe todo en un panel claro para gestionar el día."
  }
];

const benefits = [
  {
    title: "Menos errores",
    description: "Cada pedido llega con productos, cantidades y datos del cliente más claros."
  },
  {
    title: "Más velocidad",
    description: "El negocio deja de reconstruir mensajes y puede responder con más foco."
  },
  {
    title: "Mejor experiencia",
    description: "El cliente ve el catálogo, arma el pedido y entiende mejor qué envió."
  },
  {
    title: "Todo organizado",
    description: "Los pedidos quedan ordenados en un dashboard en lugar de perderse en el chat."
  }
];

export default function HomePage() {
  return (
    <main className="landing-page">
      <header className="landing-header">
        <div className="landing-shell landing-header-inner">
          <div className="landing-brand">
            <span className="landing-brand-mark">O</span>
            <strong>OrderOps</strong>
          </div>

          <Button href="/admin/login" variant="ghost">
            Ingresar
          </Button>
        </div>
      </header>

      <section className="landing-section landing-hero">
        <div className="landing-shell landing-hero-layout">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow">Pedidos más claros</p>
            <h1>Dejá de perder pedidos en WhatsApp</h1>
            <p className="landing-lead">
              OrderOps convierte mensajes caóticos en pedidos claros.
            </p>

            <div className="landing-hero-points">
              <span>Catálogo listo para compartir</span>
              <span>Pedido claro para el cliente</span>
              <span>Dashboard simple para operar</span>
            </div>

            <div className="landing-actions">
              <Button href="#demo" variant="primary">
                Probar demo
              </Button>
              <Button href="#cta" variant="secondary">
                Crear mi catálogo
              </Button>
            </div>

            <p className="landing-trust-note">
              Ideal para negocios que hoy venden por WhatsApp y necesitan más orden sin sumar complejidad.
            </p>
          </div>

          <Card className="landing-hero-card">
            <div className="landing-hero-card-stack">
              <div className="landing-mini-card landing-mini-card--phone">
                <div className="landing-mini-header">
                  <span>Catálogo</span>
                  <span>Cliente</span>
                </div>

                <div className="landing-mini-search">
                  <span>Buscar producto</span>
                </div>

                <div className="landing-mini-product">
                  <div className="landing-mini-thumb" />
                  <div>
                    <strong>Torta clásica</strong>
                    <span>$42.000 · Agregar</span>
                  </div>
                </div>

                <div className="landing-mini-product">
                  <div className="landing-mini-thumb" />
                  <div>
                    <strong>Box dulce</strong>
                    <span>$18.500 · Agregar</span>
                  </div>
                </div>

                <div className="landing-mini-footer">
                  <strong>2 productos</strong>
                  <span>Continuar</span>
                </div>
              </div>

              <div className="landing-mini-card landing-mini-card--dashboard">
                <div className="landing-mini-header">
                  <span>Pedidos</span>
                  <span>Negocio</span>
                </div>

                <div className="landing-mini-order landing-mini-order--highlight">
                  <div>
                    <strong>María Gómez</strong>
                    <span>Entrega 12/05 · Torta + Box</span>
                  </div>
                  <span className="landing-mini-pill">Pendiente</span>
                </div>

                <div className="landing-mini-order">
                  <strong>Retiro confirmado</strong>
                  <span>$60.500</span>
                </div>

                <div className="landing-mini-order">
                  <strong>WhatsApp listo</strong>
                  <span>Responder</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section id="problem" className="landing-section">
        <div className="landing-shell landing-section-stack">
          <div className="landing-section-heading">
            <p className="landing-eyebrow">Problema</p>
            <h2>WhatsApp sirve para vender, pero no para ordenar la operación</h2>
          </div>

          <div className="landing-card-grid">
            {problems.map((problem) => (
              <Card key={problem} className="landing-info-card landing-info-card--problem">
                <p>{problem}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--muted">
        <div className="landing-shell landing-section-stack">
          <div className="landing-section-heading">
            <p className="landing-eyebrow">Solución</p>
            <h2>Un flujo simple para vender mejor y operar con menos caos</h2>
          </div>

          <div className="landing-card-grid">
            {solutionSteps.map((step, index) => (
              <Card key={step.title} className="landing-info-card">
                <span className="landing-step-index">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-shell landing-section-stack">
          <div className="landing-section-heading">
            <p className="landing-eyebrow">Beneficios</p>
            <h2>Menos fricción para el negocio, más claridad para cada pedido</h2>
          </div>

          <div className="landing-benefits-grid">
            {benefits.map((benefit) => (
              <Card key={benefit.title} className="landing-benefit-card">
                <strong>{benefit.title}</strong>
                <p>{benefit.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="demo" className="landing-section">
        <div className="landing-shell landing-demo-layout">
          <div className="landing-section-heading">
            <p className="landing-eyebrow">Demo visual</p>
            <h2>Del catálogo al dashboard, sin pasos confusos</h2>
            <p className="landing-section-copy">
              El cliente elige productos, envía un pedido claro y el negocio lo recibe listo para gestionar.
            </p>
          </div>

          <div className="landing-demo-grid">
            <Card className="landing-demo-card">
              <div className="landing-demo-card-header">
                <h3>Vista del cliente</h3>
                <span>Catálogo + carrito</span>
              </div>

              <div className="landing-demo-surface">
                <div className="landing-demo-line landing-demo-line--short" />

                <div className="landing-demo-product-row">
                  <div className="landing-demo-thumb" />
                  <div className="landing-demo-copy">
                    <span className="landing-demo-line" />
                    <span className="landing-demo-line landing-demo-line--short" />
                  </div>
                  <span className="landing-demo-pill landing-demo-pill--accent" />
                </div>

                <div className="landing-demo-product-row">
                  <div className="landing-demo-thumb" />
                  <div className="landing-demo-copy">
                    <span className="landing-demo-line" />
                    <span className="landing-demo-line landing-demo-line--short" />
                  </div>
                  <span className="landing-demo-pill landing-demo-pill--accent" />
                </div>

                <div className="landing-demo-cta-row">
                  <strong>Total $60.500</strong>
                  <span>Continuar</span>
                </div>
              </div>
            </Card>

            <Card className="landing-demo-card">
              <div className="landing-demo-card-header">
                <h3>Vista del negocio</h3>
                <span>Pedidos + seguimiento</span>
              </div>

              <div className="landing-demo-surface">
                <div className="landing-demo-order-row">
                  <div className="landing-demo-copy">
                    <span className="landing-demo-line landing-demo-line--short" />
                    <span className="landing-demo-line landing-demo-line--shorter" />
                  </div>
                  <span className="landing-demo-pill" />
                </div>

                <div className="landing-demo-order-row">
                  <div className="landing-demo-copy">
                    <span className="landing-demo-line" />
                    <span className="landing-demo-line landing-demo-line--short" />
                  </div>
                  <span className="landing-demo-price">$60.500</span>
                </div>

                <div className="landing-demo-order-row">
                  <div className="landing-demo-copy">
                    <span className="landing-demo-line" />
                    <span className="landing-demo-line landing-demo-line--shorter" />
                  </div>
                  <span className="landing-demo-price">WhatsApp</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section id="cta" className="landing-section landing-section--cta">
        <div className="landing-shell">
          <Card className="landing-cta-card">
            <div className="landing-section-heading landing-section-heading--centered">
              <p className="landing-eyebrow">CTA</p>
              <h2>Ordená tu negocio hoy</h2>
              <p className="landing-section-copy">
                Empezá con una estructura más clara para vender, responder y preparar pedidos sin caos.
              </p>
            </div>

            <div className="landing-actions landing-actions--centered">
              <Button href="/admin/login" variant="accent">
                Empezar ahora
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
