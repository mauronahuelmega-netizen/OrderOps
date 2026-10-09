import Image from "next/image";
import { Check, ChevronDown, Layers2, Plus, ShoppingBag } from "lucide-react";
import MarketingOrderCard from "./marketing-order-card";
import { illustrativeOrder, illustrativeContextOrders } from "./marketing-content";
import styles from "./product-preview.module.css";

export function OrderTicket() { return <MarketingOrderCard />; }

export function CatalogPreview() {
  return <div className={styles.phone} aria-label="Vista ilustrativa del catálogo mobile">
    <div className={styles.phoneTop}><span>9:41</span><span className={styles.phoneIsland} /><span>•••</span></div>
    <div className={styles.catalogHead}><span className={styles.restaurantMark}>cb.</span><div><strong>{illustrativeOrder.business}</strong><span>Hechas a nuestra manera.</span></div><ShoppingBag size={18} aria-hidden="true" /></div>
    <div className={styles.catalogCover}><span>BUEN PAN.<br />BUENA BURGER.</span><Image src="/marketing/burger.svg" alt="Ilustración de una hamburguesa BBQ Bacon" width={360} height={280} unoptimized priority /></div>
    <div className={styles.catalogBody}>
      <p className={styles.catalogWelcome}>Tu próxima favorita está acá.</p>
      <div className={styles.catalogCategories}><span>Burgers</span><span>Acompañamientos</span><span>Bebidas</span></div>
      <div className={styles.catalogCard}><div className={styles.productPhoto}><Image src="/marketing/burger.svg" alt="" width={360} height={280} unoptimized /><span>La favorita de la casa</span></div>
      <div className={styles.productHeading}><div><strong>{illustrativeOrder.product}</strong><p>Doble carne, cheddar, bacon y BBQ.</p></div></div>
      <div className={styles.productFooter}><strong className={styles.productPrice}>{illustrativeOrder.basePrice}</strong><span className={styles.addIcon}><Plus size={17} aria-hidden="true" /></span></div></div>
      <div className={styles.catalogFab} aria-label="Pedido ilustrativo con dos productos"><ShoppingBag size={19} aria-hidden="true" /><small>2</small></div>
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
        <div className={styles.lane}><div className={styles.laneHeading}><i className={styles.pendingDot} />Pendientes <span>1</span></div><MarketingOrderCard compact /><div className={styles.lanePlaceholder}>Los nuevos pedidos llegan acá</div></div>
        <div className={styles.lane}><div className={styles.laneHeading}><i className={styles.preparingDot} />Preparando <span>2</span></div>{illustrativeContextOrders.filter(order => order.stage === "preparing").map(order => <div className={styles.ghostOrder} key={order.reference}><strong>#{order.reference} · {order.customer}</strong><p>{order.method}</p><span>{order.summary}</span><small>{order.total}</small></div>)}</div>
<div className={styles.lane}><div className={styles.laneHeading}><i className={styles.readyDot} />Listos <span>1</span></div>{illustrativeContextOrders.filter(order => order.stage === "ready").map(order => <div className={styles.ghostOrder} key={order.reference}><strong>#{order.reference} · {order.customer}</strong><p>{order.method}</p><span>{order.summary}</span><small>{order.total}</small></div>)}</div>
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
