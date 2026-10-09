import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, Check, CheckCheck, ChevronRight, Layers2, MessageCircle, Plus, Utensils, CakeSlice, ChefHat, PackageCheck } from "lucide-react";
import MarketingHeader, { MarketingBrand } from "./marketing-header";
import MarketingJourney from "./marketing-journey";
import MarketingAction from "./marketing-action";
import ProductPreview, { OrderTicket } from "./product-preview";
import ProductStory from "./product-story";
import OrderFlowDemo from "./order-flow-demo";
import ContactPreview from "./contact-preview";
import OrderDetailPreview from "./order-detail-preview";
import { faqs, illustrativeOrder } from "./marketing-content";
import { marketingConfig } from "./marketing-config";
import styles from "./marketing-landing.module.css";

export default function MarketingLanding() {
  return <div className={styles.page} id="inicio" data-marketing-event="landing_view">
    <a className={styles.skipLink} href="#contenido">Saltar al contenido</a>
    <MarketingHeader />
    <main id="contenido" tabIndex={-1}>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={`${styles.shell} ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span className={styles.signal} /> MENOS IDA Y VUELTA. MÁS PEDIDOS.</p>
            <h1 id="hero-title">Dejá de tomar<br />pedidos.<br /><span>Empezá a<br />recibirlos.</span></h1>
            <p className={styles.heroLead}>Tu cliente completa el pedido en tu catálogo. Vos lo recibís claro, con productos, opciones y datos reunidos.</p>
            <div className={styles.heroActions}><MarketingAction location="hero" /><a href="#como-funciona" className={styles.textAction}>Ver cómo funciona <ArrowDown size={16} aria-hidden="true" /></a></div>
            <p className={styles.heroAssurance}><Check size={14} aria-hidden="true" /> Por suscripción. 0% de comisión por pedido.</p>
            {!marketingConfig.whatsappNumber ? <p className={styles.contactPending}>El contacto para demos todavía no está habilitado.</p> : null}
          </div>
          <ProductPreview />
        </div>
        <div className={`${styles.shell} ${styles.heroBottom}`}><span>EL PEDIDO CLARO. DESDE EL PRINCIPIO.</span><a href="#como-funciona">Conocé el recorrido <ArrowDown size={14} aria-hidden="true" /></a></div>
      </section>

      <section id="como-funciona" className={styles.stepsSection} aria-labelledby="steps-title">
        <div className={styles.shell}><div className={styles.sectionTop}><p className={styles.eyebrow}>01 / ASÍ FUNCIONA</p><span className={styles.marginNote}>Del lado del cliente.<br />Del lado de tu negocio.</span></div><h2 id="steps-title">Del catálogo<br />a tu operación.</h2>
          <MarketingJourney />
        </div>
      </section>

      <section className={styles.problemSection} aria-labelledby="problem-title"><div className={`${styles.shell} ${styles.problemGrid}`}>
        <div className={styles.sectionCopy}><p className={styles.eyebrow}>LA CONVERSACIÓN NO ES EL PEDIDO</p><h2 id="problem-title">WhatsApp funciona<br />muy bien para hablar.</h2><p className={styles.emphasis}>No tanto para organizar pedidos.</p><p>“¿Con qué papas?” “¿Le sumás algo?” “¿Era para retirar?”<br />La información está. Pero repartida entre mensajes.</p><p>Dejá que el catálogo reúna los detalles.<br /><strong>Y usá el chat para seguir hablando.</strong></p></div>
        <div className={styles.comparison}><p className={styles.comparisonCaption}>El mismo pedido. Dos formas de recibirlo.</p><div className={styles.chat}><div className={styles.chatHeading}><MessageCircle size={17} aria-hidden="true" /><span>Cuando el pedido se arma en el chat</span></div><div className={styles.bubble}>Hola! Una BBQ Bacon</div><div className={`${styles.bubble} ${styles.reply}`}>¿Con qué papas?</div><div className={styles.bubble}>Medianas, con mayonesa</div><div className={styles.bubble}>Y bacon extra. Sin cebolla 🙏</div><div className={`${styles.bubble} ${styles.reply}`}>¿Algo para tomar?</div><div className={styles.bubble}>Una limonada. Paso a retirar</div><p>6 mensajes. Un pedido por reconstruir.</p></div><div className={styles.comparisonArrow}><ArrowRight size={18} aria-hidden="true" /><span>El cliente completa el catálogo</span></div><div className={styles.structured}><span className={styles.structuredLabel}><CheckCheck size={17} aria-hidden="true" /> Pedido registrado desde el catálogo</span><OrderTicket /><span className={styles.structuredNote}>Los detalles, juntos.<br />Desde el primer momento.</span></div></div>
      </div></section>

      <section id="producto" className={styles.productSection} aria-labelledby="product-title"><div className={styles.shell}>
        <div className={styles.sectionTop}><p className={styles.eyebrow}>02 / TU CATÁLOGO</p><span className={styles.marginNote}>Compartís un enlace.<br />Recibís un pedido completo.</span></div>
        <div className={styles.sectionHeading}><h2 id="product-title">Preparado para<br />la forma en que vendés.</h2><p>Tu marca y tus productos, con opciones claras para tus clientes. Menos preguntas para armar cada pedido.</p></div>
        <ProductStory />
        <div className={styles.productNotes}><span><Check size={15} aria-hidden="true" /> Opciones claras</span><span><Check size={15} aria-hidden="true" /> Extras con precio</span><span><Check size={15} aria-hidden="true" /> Complementarios configurados</span></div>
        <p className={styles.smallNote}>La personalización se habilita y configura según tu negocio.</p>
      </div></section>

      <section className={styles.operationsSection} aria-labelledby="operation-title"><div className={styles.shell}>
        <div className={styles.sectionTop}><p className={styles.eyebrow}>03 / TU OPERACIÓN</p><span className={styles.marginNote}>El pedido llega.<br />El trabajo empieza.</span></div>
        <div className={styles.sectionHeading}><h2 id="operation-title">Que ningún pedido<br />quede en el camino.</h2><p>Sabé qué acaba de entrar, qué estás preparando y qué está listo. Cada pedido con su información y su lugar.</p></div>
        <OrderFlowDemo />
        <OrderDetailPreview />
        <div className={styles.operationDetails}><div><span>UN PEDIDO, UNA REFERENCIA</span><strong>#{illustrativeOrder.reference}</strong></div><p>Los productos y datos del cliente, juntos en el detalle.</p></div>
      </div></section>

      <section className={styles.communicationSection} aria-labelledby="communication-title"><div className={`${styles.shell} ${styles.communicationGrid}`}>
        <ContactPreview />
        <div className={styles.sectionCopy}><p className={styles.eyebrow}>EL CHAT SIGUE SIENDO TUYO</p><h2 id="communication-title">Seguí hablando<br />con tus clientes.</h2><p className={styles.emphasis}>Sin empezar cada mensaje desde cero.</p><p>Avisá que recibiste el pedido, que está en preparación o que ya está listo. Elegís el mensaje, abrís WhatsApp y lo enviás.</p><div className={styles.messageList}><span><Check size={15} aria-hidden="true" /> Pedido recibido</span><span><Check size={15} aria-hidden="true" /> Avisar preparación</span><span><Check size={15} aria-hidden="true" /> Listo para retirar / delivery</span><span><Check size={15} aria-hidden="true" /> Confirmar dirección</span><span><Check size={15} aria-hidden="true" /> En camino</span><span><Check size={15} aria-hidden="true" /> Enviar resumen</span></div><p className={styles.smallNote}>Mensajes disponibles según el estado y la modalidad del pedido. Se envían manualmente desde WhatsApp.</p></div>
      </div></section>

      <section className={styles.benefitsSection} aria-labelledby="benefits-title"><div className={styles.shell}>
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>MÁS ESPACIO PARA HACER TU TRABAJO</p><h2 id="benefits-title">Menos caos.<br /><span>Más control.</span></h2></div></div>
        <div className={styles.benefits}>
<article><span>01</span><h3>Menos ida y vuelta.</h3><div className={styles.selectionVisual}><span><Check size={14} aria-hidden="true" /> Papas: Medianas</span><span><Check size={14} aria-hidden="true" /> Retiro en el local</span></div><p>El cliente completa opciones y datos desde el catálogo.</p></article>
<article><span>02</span><h3>Todo en un pedido.</h3><div className={styles.referenceVisual}><strong>#{illustrativeOrder.reference}</strong><div><span>Productos</span><span>Entrega</span><span>Contacto</span><span>Notas</span></div></div><p>Productos, entrega, contacto y notas juntos.</p></article>
<article><span>03</span><h3>Trabajo a la vista.</h3><div className={styles.statesVisual}><span>Pendiente</span><span>Preparando</span><span>Listo</span><span>Completado</span></div><p>Pendiente. Preparando. Listo. Completado.</p></article></div>
<div className={styles.businessTypes}><span><Utensils size={19} aria-hidden="true" /> Hamburgueserías</span><span><CakeSlice size={19} aria-hidden="true" /> Pastelerías</span><span><ChefHat size={19} aria-hidden="true" /> Catering</span><span><PackageCheck size={19} aria-hidden="true" /> Negocios por encargo</span></div>
        <p className={styles.fitNote}>Conversemos sobre cómo encaja OrderOps en tu negocio.</p>
      </div></section>

      <section id="precios" className={styles.pricingSection} aria-labelledby="pricing-title" data-marketing-event="pricing_view"><div className={`${styles.shell} ${styles.pricingGrid}`}>
        <div><p className={styles.eyebrow}>UN MODELO SIMPLE</p><h2 id="pricing-title">Tu operación crece.<br />La comisión no.</h2><p>Pagás tu suscripción.<br />No un porcentaje de tus ventas.</p><span className={styles.pricingNote}>Conocé las condiciones para tu negocio en la demo.</span></div><div className={styles.commission}><span>COMISIÓN POR PEDIDO</span><strong>0<span>%</span></strong><p>El valor está en ordenar tu operación.</p></div>
      </div></section>

      <section id="faq" className={styles.faqSection} aria-labelledby="faq-title"><div className={`${styles.shell} ${styles.faqGrid}`}>
        <div><p className={styles.eyebrow}>ANTES DE DAR EL PRÓXIMO PASO</p><h2 id="faq-title">Las preguntas<br />más importantes.</h2><p>El producto claro.<br />También antes de empezar.</p></div><div className={styles.faqList}>{faqs.map((faq, index) => <details key={faq.question} data-marketing-event="faq_interaction" data-question={`faq-${index + 1}`}><summary>{faq.question}<Plus size={18} aria-hidden="true" /></summary><p>{faq.answer}</p></details>)}</div>
      </div></section>

      <section id="demo" className={styles.demoSection} aria-labelledby="demo-title"><div className={styles.shell}>
        <p className={styles.eyebrow}>EL PEDIDO CLARO. LA OPERACIÓN EN ORDEN.</p><h2 id="demo-title">Tus pedidos pueden llegar<br /><span>así de claros.</span></h2><p>Mirá cómo funcionaría OrderOps en tu negocio.</p><div className={styles.demoActions}><MarketingAction location="closing" /><MarketingAction kind="whatsapp" location="closing" /></div>
        {!marketingConfig.whatsappNumber ? <p id="commercial-contact-note" className={styles.contactNote}>El contacto comercial todavía no está habilitado para demos y consultas.</p> : null}
        <div className={styles.demoRule}><span /> <Layers2 size={24} aria-hidden="true" /> <span /></div>
      </div></section>
    </main>
    <footer className={styles.footer}><div className={`${styles.shell} ${styles.footerTop}`}><div><MarketingBrand /><p>El pedido claro. La operación en orden.</p></div><nav aria-label="Navegación del pie"><a href="#producto">Producto <ChevronRight size={13} aria-hidden="true" /></a><a href="#como-funciona">Cómo funciona <ChevronRight size={13} aria-hidden="true" /></a><a href="#precios">Precios <ChevronRight size={13} aria-hidden="true" /></a><a href="#faq">FAQ <ChevronRight size={13} aria-hidden="true" /></a><Link href="/admin/login" data-marketing-event="login_click" data-location="footer">Iniciar sesión <ArrowUpRight size={13} aria-hidden="true" /></Link>{marketingConfig.legalLinks.map(link => <a key={link.href} href={link.href}>{link.label}</a>)}</nav></div><div className={`${styles.shell} ${styles.footerBottom}`}><span>© OrderOps</span><span>Pedidos. Personas. Operación.</span></div></footer>
  </div>;
}
