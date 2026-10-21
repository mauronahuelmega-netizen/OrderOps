import { ArrowDown, ArrowUp, Minus, Check, CircleDollarSign, Package, ReceiptText, ShoppingBag, Lightbulb, Info } from 'lucide-react';
import type { MetricKey } from '@/lib/statistics/series-contracts';
import type { SummaryView } from '@/lib/statistics/summary-chart';
import { Fragment } from 'react';
import styles from './statistics.module.css';

const icons = { sales: CircleDollarSign, completedOrders: ShoppingBag, averageTicket: ReceiptText, mainUnits: Package };
/** Preserve the exact text while permitting line breaks at thousands separators. */
export function ExactValueText({ value }: { value: string }) {
  const groups = value.split('.');
  return <>{groups.map((group, ordinal) => <Fragment key={ordinal}>{group}{ordinal < groups.length - 1 ? <>.<wbr /></> : null}</Fragment>)}</>;
}
export function Variation({ comparison }: { comparison: SummaryView['kpis'][number]['comparison'] }) {
  const Icon = comparison.direction === 'increase' ? ArrowUp : comparison.direction === 'decrease' ? ArrowDown : Minus;
  return <span className={styles.variation} data-direction={comparison.direction}><Icon size={15} aria-hidden="true" /><span>{comparison.available ? `${comparison.text}: ${comparison.percentageText ?? ''}` : comparison.text}</span></span>;
}
export function SummaryKpis({ view, select }: { view: SummaryView; select: (key: MetricKey) => void }) {
  const card = (kpi: SummaryView['kpis'][number], hero: boolean) => {
    const Icon = icons[kpi.key];
    return <button type="button" key={kpi.key} onClick={() => select(kpi.key)} aria-pressed={kpi.selected} className={`${styles.kpi} ${hero ? styles.hero : ''}`} data-kpi={kpi.key}>
      <span className={styles.kpiLabel}><Icon aria-hidden="true" size={hero ? 23 : 18} /><span>{kpi.label}</span><span className={styles.selectedMark}>{kpi.selected ? <><Check size={16} aria-hidden="true" /><span>Seleccionado</span></> : null}</span></span>
      <strong className={styles.value}><ExactValueText value={kpi.valueText} /></strong>
      <Variation comparison={kpi.comparison} />
      <span className={styles.kpiCaption}>{kpi.qualityText ?? (hero ? 'Importe comercial del período' : 'En el período seleccionado')}</span>
      {kpi.quality === 'partial' || kpi.quality === 'unavailable' ? <span className={styles.quality}>{kpi.knownCount} registros conocidos · {kpi.unknownCount} con información limitada</span> : null}
    </button>;
  };
  return <section aria-label="Indicadores del período" className={styles.kpis}>{card(view.kpis[0], true)}<div className={styles.secondary}>{view.kpis.slice(1).map(kpi => card(kpi, false))}</div></section>;
}
export function SummaryReading({ reading }: { reading: SummaryView['reading'] }) {
  return <aside className={`${styles.panel} ${styles.reading}`} aria-labelledby="commercial-reading-title" data-testid="commercial-reading">
    <h2 id="commercial-reading-title"><Lightbulb size={20} aria-hidden="true" />Lectura comercial</h2>
    <span className={styles.eyebrow}>Qué observamos</span><p className={styles.observation}>{reading.observation}</p>
    <div className={styles.evidence}><span className={styles.eyebrow}>Dato de referencia · {reading.evidence.label}</span><strong><ExactValueText value={reading.evidence.current?.valueText ?? 'No disponible'} /></strong><span>{reading.evidence.rangeLabel}</span>{reading.evidence.pointKey !== null ? <span>Punto seleccionado</span> : null}<small>Zona del negocio: {reading.evidence.timezone}</small></div>
    <span className={styles.eyebrow}>Qué significa</span><p>{reading.meaning}</p>
    <div className={styles.suggestion}><Info size={18} aria-hidden="true" /><div><strong>Qué podés revisar</strong><p>{reading.suggestion}</p></div></div>
  </aside>;
}
export function SummaryNotices({ view }: { view: SummaryView }) {
  if (!view.notices.length && !view.temporalPartial) return null;
  return <section aria-label="Información adicional" className={styles.notices}><h2>Información adicional</h2><div className={styles.noticeGrid}>
    {view.temporalPartial ? <article><Info size={18} aria-hidden="true" /><div><h3>Período en curso</h3><p>Los valores reflejan el corte de consulta, no una jornada cerrada.</p></div></article> : null}
    {view.notices.map(notice => <article key={notice.kind}><Info size={18} aria-hidden="true" /><div><h3>{notice.kind === 'historical' ? 'Pedidos sin fecha confirmada' : notice.kind === 'outside_session' ? 'Fuera de sesión verificada' : notice.kind === 'comparison' ? 'Sin comparación válida' : 'Calidad de datos'}</h3><p>{notice.text}</p><details><summary>Ver detalle</summary><p>{notice.kind === 'quality' ? 'Revisá las advertencias de cada indicador: un valor conocido parcial no equivale al total completo. Los importes desconocidos no se reemplazan por cero.' : notice.kind === 'historical' ? 'Estos pedidos no se atribuyen a fechas ni sesiones supuestas.' : notice.kind === 'outside_session' ? 'Se usa la fecha local fiable de finalización, sin asociarla retrospectivamente a una sesión cercana.' : 'Las ventanas de observación deben ser equivalentes y el indicador debe tener información suficiente.'}</p></details></div></article>)}
  </div></section>;
}
export function SummarySkeleton() {
  return <div className={styles.skeleton} role="status" aria-live="polite" aria-busy="true"><span>Cargando estadísticas…</span><div className={styles.skeletonKpis}><div /><div /><div /></div><div className={styles.skeletonPanels}><div /><div /></div></div>;
}
