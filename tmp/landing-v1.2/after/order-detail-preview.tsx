import { ChevronDown, Phone, Store, StickyNote } from "lucide-react";
import { illustrativeOrder } from "./marketing-content";
import styles from "./order-detail-preview.module.css";

export default function OrderDetailPreview() {
  return <details className={styles.detail} data-marketing-event="product_demo_interaction" data-scene="order-detail">
    <summary><span>Ver los detalles del pedido</span><span>#{illustrativeOrder.reference}<ChevronDown size={17} aria-hidden="true" /></span></summary>
    <div className={styles.body}>
      <div className={styles.customer}><span className={styles.label}>CLIENTE</span><h3>{illustrativeOrder.customer}</h3><span className={styles.deliveryLabel}>ENTREGA</span><p><Store size={15} aria-hidden="true" /> Retiro en el local</p><p><Phone size={15} aria-hidden="true" /> Teléfono registrado: 11 •••• ••••</p><div className={styles.note}><StickyNote size={15} aria-hidden="true" /><span>Indicaciones: {illustrativeOrder.note}.</span></div></div>
      <div className={styles.items}><span className={styles.label}>PRODUCTOS Y PERSONALIZACIONES</span><div className={styles.productBlock}><div className={styles.itemHeading}><strong>1 × {illustrativeOrder.product}</strong><strong>{illustrativeOrder.productSubtotal}</strong></div><dl className={styles.groups}><div><dt>Papas</dt><dd>{illustrativeOrder.selections.potatoes}</dd></div><div><dt>Extras</dt><dd>{illustrativeOrder.selections.extra}</dd></div><div><dt>Salsa</dt><dd>{illustrativeOrder.selections.sauce}</dd></div></dl><div className={styles.additional}><span>ADICIONAL</span><div className={styles.itemHeading}><strong>1 × Limonada</strong><strong>$2.500</strong></div></div></div><div className={styles.total}><span>Total</span><strong>{illustrativeOrder.total}</strong></div></div>
    </div>
  </details>;
}
