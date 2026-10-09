import { ChevronDown, Phone, Store, StickyNote } from "lucide-react";
import { illustrativeOrder } from "./marketing-content";
import styles from "./order-detail-preview.module.css";

export default function OrderDetailPreview() {
  return <details className={styles.detail} data-marketing-event="product_demo_interaction" data-scene="order-detail">
    <summary><span>Ver los detalles del pedido</span><span>#{illustrativeOrder.reference}<ChevronDown size={17} aria-hidden="true" /></span></summary>
    <div className={styles.body}>
      <div className={styles.customer}><span className={styles.label}>CLIENTE Y ENTREGA</span><h3>{illustrativeOrder.customer}</h3><p><Store size={15} aria-hidden="true" /> Retiro en el local</p><p><Phone size={15} aria-hidden="true" /> Teléfono registrado: 11 •••• ••••</p><div className={styles.note}><StickyNote size={15} aria-hidden="true" /><span>Nota: sin cebolla.</span></div></div>
      <div className={styles.items}><span className={styles.label}>PRODUCTOS Y PERSONALIZACIONES</span><ul>{illustrativeOrder.items.map(item => <li key={item.label}><div><strong>{item.label}</strong><span>{item.detail}</span></div><span>{item.price}</span></li>)}</ul><div className={styles.total}><span>Total</span><strong>{illustrativeOrder.total}</strong></div></div>
    </div>
  </details>;
}
