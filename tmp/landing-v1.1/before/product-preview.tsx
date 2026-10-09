import Image from "next/image";
import { ArrowRight, Check, ChevronDown, Clock3, Layers2, Plus, ShoppingBag } from "lucide-react";
import { illustrativeOrder } from "./marketing-content";
import styles from "./product-preview.module.css";

export function OrderTicket() {
  return <div className={styles.ticket}>
    <div className={styles.ticketHead}><span className={styles.orderRef}>#{illustrativeOrder.reference}</span><span className={styles.pending}>Pendiente</span></div>
    <strong className={styles.customer}>{illustrativeOrder.customer} <span>· Retiro</span></strong>
    <p className={styles.ticketProducts}>1 × {illustrativeOrder.product}<br /><span>Papas medianas · Bacon extra</span><br />1 × Limonada</p>
    <div className={styles.ticketFoot}><strong>{illustrativeOrder.total}</strong><span><Clock3 size={12} aria-hidden="true" /> Recién recibido</span></div>
  </div>;
}

export function CatalogPreview() {
  return <div className={styles.phone} aria-label="Vista ilustrativa del catálogo mobile">
    <div className={styles.phoneTop}><span>9:41</span><span className={styles.phoneIsland} /><span>•••</span></div>
    <div className={styles.catalogHead}><span className={styles.restaurantMark}>cb.</span><div><strong>{illustrativeOrder.business}</strong><span>Hechas a nuestra manera.</span></div><ShoppingBag size={18} aria-hidden="true" /></div>
    <div className={styles.catalogCover}><span>BUEN PAN.<br />BUENA BURGER.</span><Image src="/marketing/burger.svg" alt="Ilustración de una hamburguesa BBQ Bacon" width={360} height={280} unoptimized priority /></div>
    <div className={styles.catalogBody}>
      <p className={styles.catalogWelcome}>Tu próxima favorita está acá.</p>
      <div className={styles.catalogCategories}><span>Burgers</span><span>Acompañamientos</span><span>Bebidas</span></div>
      <div className={styles.productPhoto}><Image src="/marketing/burger.svg" alt="" width={360} height={280} unoptimized /><span>La favorita de la casa</span></div>
      <div className={styles.productHeading}><div><strong>{illustrativeOrder.product}</strong><p>Doble carne, cheddar, bacon y BBQ.</p></div><span className={styles.addIcon}><Plus size={17} aria-hidden="true" /></span></div>
      <strong className={styles.productPrice}>{illustrativeOrder.basePrice}</strong>
      <div className={styles.catalogBar}><span><ShoppingBag size={15} aria-hidden="true" /> Tu pedido <small>2</small></span><strong>{illustrativeOrder.total} <ArrowRight size={14} aria-hidden="true" /></strong></div>
    </div>
  </div>;
}

export function DashboardPreview() {
  return <div className={styles.dashboard} aria-label="Vista ilustrativa del panel de pedidos de OrderOps">
    <aside className={styles.sidebar} aria-hidden="true"><Layers2 size={22} /><span className={styles.sidebarActive}>▦</span><ShoppingBag size={18} /><span>☷</span><span>⚙</span><span className={styles.avatar}>A</span></aside>
    <div className={styles.dashboardMain}>
      <div className={styles.dashboardTop}><span><span className={styles.storeDot} /> Negocio abierto</span><span>Casa Burger <ChevronDown size={12} aria-hidden="true" /></span></div>
      <div className={styles.dashboardHeading}><div><span className={styles.dashboardEyebrow}>TU OPERACIÓN, EN ORDEN</span><h3>Pedidos</h3></div><span className={styles.newOrder}>+ Nuevo pedido</span></div>
      <div className={styles.dashboardSummary}><span><strong>04</strong> En operación</span><span><strong>02</strong> Preparando</span><span><strong>01</strong> Listo</span></div>
      <div className={styles.board}>
        <div className={styles.lane}><div className={styles.laneHeading}><i className={styles.pendingDot} />Pendientes <span>1</span></div><OrderTicket /><div className={styles.lanePlaceholder}>Los nuevos pedidos llegan acá</div></div>
        <div className={styles.lane}><div className={styles.laneHeading}><i className={styles.preparingDot} />Preparando <span>2</span></div><div className={styles.ghostOrder}><strong>#K7M4Q9</strong><p>Sam · Delivery</p><span>2 × Clásica</span><small>$24.000</small></div><div className={styles.ghostOrder}><strong>#N8R3W6</strong><p>Dani · Retiro</p><span>1 × Doble cheddar</span><small>$14.000</small></div></div>
        <div className={styles.lane}><div className={styles.laneHeading}><i className={styles.readyDot} />Listos <span>1</span></div><div className={styles.ghostOrder}><strong>#P5T2X8</strong><p>Cris · Retiro</p><span>1 × Veggie</span><small>$12.500 <Check size={13} aria-hidden="true" /></small></div></div>
      </div>
      <div className={styles.dashboardBottom}><span>Información clara. Trabajo organizado.</span><span>OrderOps</span></div>
    </div>
  </div>;
}

export default function ProductPreview() {
  return <figure className={styles.heroFigure}>
    <div className={styles.heroStage}><div className={styles.orbit} aria-hidden="true" /><div className={styles.dashboardPosition}><DashboardPreview /></div><div className={styles.phonePosition}><CatalogPreview /></div><div className={styles.arrival}><span className={styles.arrivalCheck}><Check size={16} aria-hidden="true" /></span><div><strong>Pedido registrado</strong><span>#{illustrativeOrder.reference} · Todo en un lugar</span></div></div></div>
    <figcaption className={styles.figureCaption}><span className={styles.captionLine} /> Del catálogo de tu negocio a tu panel.<span className={styles.exampleNote}>Vistas ilustrativas</span></figcaption>
  </figure>;
}
