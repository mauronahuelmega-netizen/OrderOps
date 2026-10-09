import { ArrowRight, Check, ShoppingBag, ClipboardList, Layers2 } from 'lucide-react';
import { illustrativeOrder } from './marketing-content';
import styles from './marketing-journey.module.css';
export default function MarketingJourney() {
    return <div className={styles.journey}>
    <article><div className={styles.head}><ShoppingBag size={22} aria-hidden="true"/><span>01</span></div><h3>Tu cliente arma el pedido.</h3><p>Elige productos, opciones y completa sus datos desde tu catálogo.</p><div className={styles.fragment}><strong>{illustrativeOrder.product}</strong><span><Check size={13} aria-hidden="true"/> Papas: Medianas</span><span><Check size={13} aria-hidden="true"/> Extra: Bacon</span><small>Retiro en el local</small></div><ArrowRight className={styles.connector} size={20} aria-hidden="true"/></article>
    <article><div className={styles.head}><ClipboardList size={22} aria-hidden="true"/><span>02</span></div><h3>Recibís la información clara.</h3><p>El pedido queda registrado con una referencia. Después, el cliente puede confirmarlo por WhatsApp.</p><div className={[styles.fragment, styles.registered].join(' ')}><small>PEDIDO REGISTRADO</small><strong>#{illustrativeOrder.reference}</strong><span>Alex · Retiro</span><small>Productos + opciones + contacto</small></div><ArrowRight className={styles.connector} size={20} aria-hidden="true"/></article>
    <article><div className={styles.head}><Layers2 size={22} aria-hidden="true"/><span>03</span></div><h3>Vos gestionás el trabajo.</h3><p>Lo seguís desde Pendiente hasta Completado.</p><div className={styles.fragment}><div className={styles.lane}><span />Pendientes <b>1</b></div><strong>#{illustrativeOrder.reference} <small>· Alex</small></strong><span>Un pedido, con su lugar.</span></div></article></div>;
}
