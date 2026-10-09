import Image from "next/image";
import { Check, Plus, ArrowRight } from "lucide-react";
import { illustrativeOrder } from "./marketing-content";
import styles from "./product-story.module.css";

export default function ProductStory() {
  return <div className={styles.story}>
    <div className={styles.product}><div className={styles.productImage}><Image src="/marketing/burger.svg" alt="Hamburguesa de ejemplo con bacon y cheddar" width={360} height={280} unoptimized /><span>01 / ELEGÍ TU PRODUCTO</span></div><div className={styles.productTitle}><strong>{illustrativeOrder.product}</strong><span>{illustrativeOrder.basePrice}</span></div><p>Doble carne, cheddar, bacon crocante y salsa BBQ.</p><div className={styles.brandNote}><span>cb.</span> Tu marca. Tus productos. Tu catálogo.</div></div>
    <div className={styles.options}>
      <div className={styles.optionsHeading}><span>02 / HACELO A TU GUSTO</span><h3>Los detalles también cuentan.</h3><p>Opciones claras, desde el primer pedido.</p></div>
      <details open className={styles.optionGroup} data-marketing-event="product_demo_interaction" data-scene="options"><summary>Papas <span>Obligatorio</span><Plus size={15} aria-hidden="true" /></summary><div className={styles.optionRows}><div>Chicas <span>Incluidas</span></div><div className={styles.selected}><span><Check size={13} aria-hidden="true" /> Medianas</span><strong>+ $950</strong></div><div>Grandes <span>+ $1.500</span></div></div></details>
      <details className={styles.optionGroup} data-marketing-event="product_demo_interaction" data-scene="extras"><summary>Extras y salsas <Plus size={15} aria-hidden="true" /></summary><div className={styles.optionRows}><div className={styles.selected}><span><Check size={13} aria-hidden="true" /> Bacon extra</span><strong>+ $1.000</strong></div><div>Mayonesa <span>Sin cargo</span></div><div>Nota del pedido <span>Sin cebolla</span></div></div></details>
      <details className={styles.optionGroup} data-marketing-event="product_demo_interaction" data-scene="complements"><summary>Sumá una bebida <Plus size={15} aria-hidden="true" /></summary><div className={styles.upsell}><Image src="/marketing/lemonade.svg" alt="Limonada ilustrada" width={64} height={78} unoptimized /><div><strong>Limonada</strong><span>Un adicional para completar el pedido.</span></div><strong>$2.500</strong></div></details>
      <div className={styles.total}><span>Tu pedido, con todos los detalles</span><strong>{illustrativeOrder.total}<ArrowRight size={18} aria-hidden="true" /></strong></div>
    </div>
  </div>;
}
