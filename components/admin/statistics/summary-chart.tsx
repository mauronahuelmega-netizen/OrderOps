'use client';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MetricKey } from '@/lib/statistics/series-contracts';
import { summaryChartGeometry, type SummaryView } from '@/lib/statistics/summary-chart';
import { ExactValueText, Variation } from './summary-panels';
import styles from './statistics.module.css';

export default function SummaryChart({ view, selectMetric, selectPoint }: { view: SummaryView; selectMetric: (key: MetricKey) => void; selectPoint: (key: string | null) => void }) {
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const plot = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => { const observer = new ResizeObserver(entries => { const measured = entries[0]?.contentRect.width; if (measured) setWidth(Math.round(measured)); });if (plot.current) observer.observe(plot.current);return () => observer.disconnect(); }, []);
  const geometry = summaryChartGeometry(view.series, ['sales', 'averageTicket'].includes(view.selectedMetric), width);
  const selected = view.series.find(p => p.key === view.selectedPointKey) ?? null;
  const tooltip = view.series.find(p => p.key === hoverKey) ?? selected;
  const activeIndex = view.series.findIndex(p => p.key === view.selectedPointKey);
  const hasValues = view.series.some(p => p.current?.metric.exactValue != null || p.previous?.metric.exactValue != null);
  const activeGeometry = geometry.points.find(p => p.key === tooltip?.key);
  const detail = (point: SummaryView['series'][number]) => <><strong>{point.label}</strong><p className={styles.interval}>{point.current?.interval.label ?? 'Intervalo actual sin observación'}</p><dl><div><dt><span className={styles.currentDot} />Actual</dt><dd>{point.current?.metric.valueText ?? 'No disponible'}</dd></div>{point.previous ? <div><dt><span className={styles.previousDash} />Anterior</dt><dd>{point.previous.metric.valueText}</dd></div> : null}<div><dt>Diferencia</dt><dd>{point.comparison.absoluteText ?? 'Sin comparación válida'}</dd></div></dl><Variation comparison={point.comparison} />{point.current?.metric.qualityText ? <p>{point.current.metric.qualityText}</p> : null}<p className={styles.interval}>{point.previous?.interval.label ? `Anterior: ${point.previous.interval.label}` : ''}</p></>;
  return <section className={`${styles.panel} ${styles.chart}`} aria-labelledby="sales-evolution-title" data-testid="summary-chart">
    <div className={styles.panelHeader}><h2 id="sales-evolution-title">Evolución del período</h2><label className={styles.srOnly} htmlFor="chart-metric">Indicador del gráfico</label><select id="chart-metric" value={view.selectedMetric} onChange={event => { setHoverKey(null); selectMetric(event.target.value as MetricKey); }}>{view.kpis.map(kpi => <option value={kpi.key} key={kpi.key}>{kpi.label}</option>)}</select></div>
    <div className={styles.plot} ref={plot} onMouseLeave={() => setHoverKey(null)}>
      {hasValues ? <svg viewBox={`0 0 ${geometry.width} ${geometry.height}`} role="img" aria-label={`Evolución de ${view.kpis.find(k => k.key === view.selectedMetric)!.label}. Usá el selector de intervalos para explorar los valores exactos.`}>
        {geometry.ticks.map((tick, n) => <g key={n}><line x1={geometry.left} x2={geometry.width - geometry.right} y1={tick.y} y2={tick.y} className={styles.gridLine} /><text x={geometry.left - 10} y={tick.y + 4} textAnchor="end" className={styles.axisText}>{tick.label.length > 16 ? `${n}/3 escala` : tick.label}</text></g>)}
        <path d={geometry.previousPath} className={styles.previousLine} /><path d={geometry.currentPath} className={styles.currentLine} />
        {geometry.points.map((point, n) => <g key={point.key}>{point.previousY !== null ? <circle cx={point.x} cy={point.previousY} r="3" className={styles.previousPoint} /> : null}{point.currentY !== null ? <circle cx={point.x} cy={point.currentY} r={point.key === view.selectedPointKey ? '6' : '3.5'} className={styles.currentPoint} /> : null}{(n === 0 || n === geometry.points.length - 1 || n % Math.max(1, Math.ceil(geometry.points.length / 4)) === 0) ? <text x={point.x} y={geometry.height - 12} textAnchor={n === 0 ? 'start' : n === geometry.points.length - 1 ? 'end' : 'middle'} className={styles.axisText}>{view.series[n].current?.interval.label.replace('Jornada comercial: ', '').slice(0, 10) ?? ''}</text> : null}<rect x={point.x - Math.min(16, (geometry.width - geometry.left) / Math.max(2, geometry.points.length) / 2)} y={geometry.top} width={Math.min(32, (geometry.width - geometry.left) / Math.max(2, geometry.points.length))} height={geometry.height - geometry.bottom - geometry.top} fill="transparent" onMouseEnter={() => setHoverKey(point.key)} onClick={() => selectPoint(point.key)} aria-hidden="true" /></g>)}
        {activeGeometry ? <line x1={activeGeometry.x} x2={activeGeometry.x} y1={geometry.top} y2={geometry.height - geometry.bottom} className={styles.guide} /> : null}
      </svg> : <p className={styles.noValues}>No hay valores conocidos para graficar este indicador.</p>}
      {tooltip ? <div className={styles.tooltip} role="tooltip">{detail(tooltip)}</div> : null}
    </div>
    <div className={styles.legend}><span><span className={styles.currentDot} />Período actual</span>{view.series.some(p => p.previous) ? <span><span className={styles.previousDash} />Período anterior comparable</span> : <span>Sin comparación válida para este indicador</span>}</div>
    <div className={styles.pointControls}><label htmlFor="chart-point">Explorar intervalo</label><div><button type="button" aria-label="Intervalo anterior" disabled={activeIndex <= 0} onClick={() => selectPoint(view.series[activeIndex - 1].key)}><ChevronLeft size={18} /></button><select id="chart-point" value={view.selectedPointKey ?? ''} onChange={event => { setHoverKey(null); selectPoint(event.target.value || null); }}><option value="">Todo el período</option>{view.series.map(point => <option key={point.key} value={point.key}>{point.label}</option>)}</select><button type="button" aria-label="Intervalo siguiente" disabled={activeIndex >= view.series.length - 1 || view.series.length === 0} onClick={() => selectPoint(view.series[activeIndex + 1].key)}><ChevronRight size={18} /></button></div></div>
    <div className={styles.pointDetail} data-testid="point-detail" aria-live="polite">{selected ? detail(selected) : <p>Elegí un intervalo del gráfico o del selector para ver su detalle.</p>}</div>
    <p className={styles.interval}>Las fechas corresponden a jornadas comerciales del negocio. Los huecos indican información no disponible.{hasValues ? <> Referencia máxima de escala: <ExactValueText value={geometry.maximumLabel} />.</> : null}</p>
  </section>;
}
