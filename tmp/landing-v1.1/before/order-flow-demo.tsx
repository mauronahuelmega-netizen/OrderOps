"use client";

import { useState, useSyncExternalStore } from "react";
import { ArrowRight, Check, Clock3, MapPin, PackageCheck, ShoppingBag } from "lucide-react";
import { illustrativeOrder, orderStages } from "./marketing-content";
import styles from "./order-flow-demo.module.css";

const subscribeToHydration = () => () => {};
const getHydratedSnapshot = () => true;
const getServerSnapshot = () => false;

export default function OrderFlowDemo() {
  const [activeStage, setActiveStage] = useState(0);
  const hydrated = useSyncExternalStore(subscribeToHydration, getHydratedSnapshot, getServerSnapshot);
  const stage = orderStages[activeStage];
  return <div className={styles.flow}>
    <div className={styles.transfer}><span><ShoppingBag size={17} aria-hidden="true" /> Catálogo</span><span className={styles.reference}>#{illustrativeOrder.reference}</span><ArrowRight size={22} aria-hidden="true" /><span><PackageCheck size={17} aria-hidden="true" /> OrderOps</span></div>
    <div className={styles.board} aria-label="Recorrido ilustrativo de un pedido">
      {orderStages.map((item, index) => <div key={item.key} className={`${styles.lane} ${index === activeStage ? styles.activeLane : ""}`} data-stage={item.key}><div className={styles.laneTitle}><span className={styles.dot} />{item.column}<span>{index === activeStage ? "1" : "0"}</span></div>{index === activeStage ? <div className={styles.orderCard} key={item.key}><div className={styles.cardHead}><strong>#{illustrativeOrder.reference}</strong><span>{item.label}</span></div><h3>{illustrativeOrder.customer} <span>· Retiro</span></h3><p>1 × BBQ Bacon<br /><span>Papas medianas · Bacon extra<br />Mayonesa · Sin cebolla</span><br />1 × Limonada</p><div className={styles.cardFoot}><strong>{illustrativeOrder.total}</strong>{index === 3 ? <Check size={16} aria-hidden="true" /> : <Clock3 size={15} aria-hidden="true" />}</div></div> : <div className={styles.emptyLane} aria-hidden="true"><span /><span /></div>}</div>)}
    </div>
    <div className={styles.mobileCard}><div className={styles.cardHead}><strong>#{illustrativeOrder.reference}</strong><span>{stage.label}</span></div><h3>{illustrativeOrder.customer} · Retiro</h3><p>1 × BBQ Bacon + papas medianas + bacon extra<br />Mayonesa · Sin cebolla<br />1 × Limonada</p><div className={styles.cardFoot}><strong>{illustrativeOrder.total}</strong><MapPin size={16} aria-hidden="true" /></div></div>
    <div className={styles.stageControls} role="group" aria-label="Explorar estados del pedido">{orderStages.map((item, index) => <button key={item.key} type="button" disabled={!hydrated} aria-pressed={activeStage === index} onClick={() => setActiveStage(index)} data-marketing-event="product_demo_interaction" data-scene={item.key}><span>{String(index + 1).padStart(2, "0")}</span>{item.label}</button>)}</div>
    <noscript><p className={styles.manualNote}>El negocio avanza el pedido por estas cuatro etapas. La exploración interactiva requiere JavaScript.</p></noscript>
    <p className={styles.stageDescription} aria-live="polite">{stage.description}</p>
    <p className={styles.manualNote}>Vos cambiás el estado. OrderOps mantiene la información organizada.</p>
  </div>;
}
