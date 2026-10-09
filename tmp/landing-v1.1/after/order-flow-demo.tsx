"use client";
import { useState, useSyncExternalStore } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { illustrativeOrder, illustrativeContextOrders, orderStages, getIllustrativeStageCount } from './marketing-content';
import MarketingOrderCard from './marketing-order-card';
import styles from './order-flow-demo.module.css';
const subscribe = () => () => { };
const clientSnapshot = () => true;
const serverSnapshot = () => false;
const actions = ['Preparar', 'Marcar listo', 'Completar', 'Volver a empezar'];
export default function OrderFlowDemo() {
    const [activeStage, setActiveStage] = useState(0);
    const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
    const stage = orderStages[activeStage];
    const context = illustrativeContextOrders.find(o => o.stage === stage.key) ?? illustrativeContextOrders[0];
    return <div className={styles.flow}><div className={styles.overview}><span>Pedidos del ejemplo</span><strong>#{illustrativeOrder.reference} · Del catálogo a tu operación</strong></div>
    <ol className={styles.stageSummary} aria-label="Etapas del pedido">{orderStages.map((s, i) => <li key={s.key} aria-current={activeStage === i ? 'step' : undefined}><span>{String(i + 1).padStart(2, '0')}</span><strong>{s.label}</strong><b>{getIllustrativeStageCount(s.key, stage.key)}</b></li>)}</ol>
    <div className={styles.board} aria-label="Tablero ilustrativo de pedidos">{orderStages.map((s, i) => <div key={s.key} className={[styles.lane, i === activeStage ? styles.activeLane : ''].join(' ')} data-stage={s.key}><div className={styles.laneTitle}>{s.column}<span>{getIllustrativeStageCount(s.key, stage.key)}</span></div>{i === activeStage ? <div key={stage.key} className={styles.arrival}><MarketingOrderCard stage={stage.key}/></div> : null}{illustrativeContextOrders.filter(o => o.stage === s.key).map(o => <div className={styles.contextCard} key={o.reference}><strong>#{o.reference} · {o.customer}</strong><span>{o.method} · {o.summary}</span><b>{o.total}</b></div>)}{getIllustrativeStageCount(s.key, stage.key) === 0 ? <p className={styles.empty}>Sin pedidos en esta etapa</p> : null}</div>)}</div>
    <div className={styles.focusedBoard}><div className={styles.laneTitle}>{stage.column}<span>{getIllustrativeStageCount(stage.key, stage.key)}</span></div><div key={stage.key} className={styles.arrival}><MarketingOrderCard stage={stage.key}/></div><div className={styles.contextRow}><span>También en el tablero</span><strong>#{context.reference} · {context.customer}</strong><small>{orderStages.find(s => s.key === context.stage)!.label} · {context.method}</small></div></div>
    <div className={styles.interaction}><p>Probá avanzar este pedido del ejemplo.<span>Vos cambiás el estado.</span></p><button type="button" disabled={!hydrated} onClick={() => setActiveStage(current => (current + 1) % orderStages.length)} data-marketing-event="product_demo_interaction" data-scene={stage.key}>{actions[activeStage]}{activeStage === 3 ? <RotateCcw size={16} aria-hidden="true"/> : <ArrowRight size={16} aria-hidden="true"/>}</button></div>
    <p className={styles.stageDescription} aria-live="polite">{stage.label}: {stage.description}</p><noscript><p className={styles.manualNote}>El negocio avanza el pedido por Pendiente, Preparando, Listo y Completado. Para probar la progresión, habilitá JavaScript.</p></noscript></div>;
}
