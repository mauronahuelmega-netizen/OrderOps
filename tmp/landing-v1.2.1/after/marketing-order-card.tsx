import { illustrativeOrder, orderStages, type MarketingStage } from './marketing-content';
import styles from './marketing-order-card.module.css';
export default function MarketingOrderCard({ stage = 'pending', compact = false }: {
    stage?: MarketingStage;
    compact?: boolean;
}) {
    return <div className={[styles.card, compact ? styles.compact : ''].join(' ')} data-stage={stage}><div className={styles.head}><strong>#{illustrativeOrder.reference} <span>· {illustrativeOrder.customer}</span></strong><span className={styles.status}>{orderStages.find(s => s.key === stage)!.label}</span></div><span className={styles.method}>{illustrativeOrder.method}</span><p className={styles.products}>1 × {illustrativeOrder.product}<span>Papas medianas · {illustrativeOrder.selections.extra}<br />{illustrativeOrder.selections.sauce} · {illustrativeOrder.note}</span>1 × Limonada</p><div className={styles.foot}><strong>{illustrativeOrder.total}</strong><span>2 productos</span></div></div>;
}
