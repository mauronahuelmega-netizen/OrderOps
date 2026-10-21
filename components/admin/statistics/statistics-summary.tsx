'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import { BarChart3, AlertTriangle, CalendarDays, RotateCcw } from 'lucide-react';
import type { PeriodInput, PeriodPreset } from '@/lib/statistics/contracts';
import type { MetricKey } from '@/lib/statistics/series-contracts';
import { SUMMARY_PERIODS, SUMMARY_QUICK_PERIODS, parseSummaryPeriod, serializeSummaryPeriod, summaryPeriodKey } from '@/lib/statistics/summary-period';
import { SummaryQueryController } from '@/lib/statistics/summary-query';
import { presentStatisticsSummary } from '@/lib/statistics/summary-presenter';
import { summaryFailure, type SummaryResult, type SummaryScope } from '@/lib/statistics/summary-transport';
import SummaryChart from './summary-chart';
import { SummaryKpis, SummaryReading, SummaryNotices, SummarySkeleton } from './summary-panels';
import styles from './statistics.module.css';

async function loadSummary(search: string): Promise<SummaryResult> {
  try {
    const response = await fetch(`/admin/statistics/query?${search}`, { credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(30000) });
    const value = await response.json();
    if (value?.ok === true && response.ok) return value;
    if (value?.ok === false && typeof value.code === 'string' && ['unauthenticated', 'forbidden', 'invalid_period', 'timeout', 'query_failed', 'invalid_response', 'series_unavailable'].includes(value.code)) return summaryFailure(value.code);
    return summaryFailure(response.status === 401 ? 'unauthenticated' : response.status === 403 ? 'forbidden' : 'query_failed');
  } catch (error) { return summaryFailure(error instanceof Error && error.name === 'TimeoutError' ? 'timeout' : 'query_failed'); }
}
export default function StatisticsSummary({ scope }: { scope: SummaryScope }) {
  const params = useSearchParams();
  const search = params.toString();
  const [controller] = useState(() => new SummaryQueryController(scope, loadSummary));
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const [customOpen, setCustomOpen] = useState(false);
  const [formError, setFormError] = useState('');
  let period: PeriodInput | null = null;
  try { period = parseSummaryPeriod(search); } catch { /* Query controller presents explicit URL error. */ }
  useEffect(() => { void controller.query(search); }, [controller, search]);
  // Pending requests belong to this component only; unsubscription prevents unmounted renders.
  // Do not dispose during React strict-mode effect replay, which would defeat pending deduplication.
  const choosePeriod = (next: PeriodInput) => {
    const nextSearch = serializeSummaryPeriod(next, window.location.search);
    void controller.query(nextSearch); // Clear old KPI immediately, before URL propagation.
    window.history.pushState(null, '', `${window.location.pathname}?${nextSearch}`);
    setCustomOpen(false); setFormError('');
  };
  const chooseMetric = (metric: MetricKey) => { controller.selectPoint(null); controller.selectMetric(metric); };
  // Also cover back/forward URL changes before the effect runs: never render old facts under new filters.
  const readyForUrl = state.status === 'ready' && period !== null && state.periodKey === summaryPeriodKey(period);
  const view = readyForUrl && state.status === 'ready' && state.data.status === 'ready' ? presentStatisticsSummary(state.data, state.selectedMetric, state.selectedPointKey) : null;
  return <div className={styles.root} data-testid="statistics-summary"><div className={styles.content}>
    <header className={styles.header}><div><span className={styles.overline}>Tu negocio, en perspectiva</span><h1>Estadísticas</h1><p>Entendé cómo está funcionando tu negocio</p></div><div className={styles.filters}>
      <div className={styles.quick} aria-label="Períodos rápidos">{SUMMARY_QUICK_PERIODS.map(value => <button type="button" key={value} aria-pressed={period?.preset === value} onClick={() => choosePeriod({ preset: value })}>{SUMMARY_PERIODS.find(p => p.value === value)!.label}</button>)}</div>
      <div className={styles.periodSelect}><CalendarDays size={17} aria-hidden="true" /><label className={styles.srOnly} htmlFor="summary-period">Período de estadísticas</label><select id="summary-period" value={customOpen ? 'custom' : period?.preset ?? ''} onChange={event => { const value = event.target.value as PeriodPreset; if (value === 'custom') setCustomOpen(true); else choosePeriod({ preset: value }); }}>
        {period === null ? <option value="">Período inválido</option> : null}{SUMMARY_PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
      </select></div>
      {period?.preset === 'custom' && !customOpen ? <button type="button" className={styles.textButton} onClick={() => setCustomOpen(true)}>Editar fechas</button> : null}
    </div></header>
    <nav aria-label="Secciones de estadísticas" className={styles.tabs}><span aria-current="page">Resumen</span><span aria-disabled="true">Productos <small>Próximamente</small></span><span aria-disabled="true">Oportunidades <small>Próximamente</small></span></nav>
    {customOpen ? <form className={styles.customForm} onSubmit={event => { event.preventDefault(); const fields = new FormData(event.currentTarget); try { choosePeriod(parseSummaryPeriod(new URLSearchParams({ period: 'custom', start: String(fields.get('start')), end: String(fields.get('end')) }).toString())); } catch { setFormError('Ingresá fechas válidas, con inicio anterior o igual al final.'); } }}>
      <label>Desde<input name="start" type="date" required defaultValue={period?.startDate} /></label><label>Hasta<input name="end" type="date" required defaultValue={period?.endDate} /></label><button type="submit" className={styles.primary}>Aplicar rango</button><button type="button" onClick={() => { setCustomOpen(false); setFormError(''); }}>Cancelar</button>{formError ? <p role="alert">{formError}</p> : null}
    </form> : null}
    {view ? <><div className={styles.periodContext}><span>{view.period.label} · {view.period.rangeLabel}</span><button type="button" className={styles.textButton} onClick={() => { void controller.query(search, true); }}><RotateCcw size={14} aria-hidden="true" />Actualizar</button></div>
      <SummaryKpis view={view} select={chooseMetric} />
      {view.dataState === 'empty' ? <section className={styles.empty} role="status"><BarChart3 size={32} aria-hidden="true" /><h2>{view.emptyMessage}</h2><p>No encontramos pedidos completados con datos suficientes en las fechas seleccionadas.</p><button type="button" onClick={() => document.getElementById('summary-period')?.focus()} className={styles.primary}>Cambiar período</button></section> : <div className={styles.panels}><SummaryChart key={`${state.status === 'ready' ? state.periodKey : ''}:${state.selectedMetric}`} view={view} selectMetric={chooseMetric} selectPoint={key => controller.selectPoint(key)} /><SummaryReading reading={view.reading} /></div>}
      <SummaryNotices view={view} />
    </> : state.status === 'error' ? <section className={styles.error} role="alert"><AlertTriangle size={32} aria-hidden="true" /><h2>No pudimos actualizar las estadísticas</h2><p>{state.error.message}</p>{state.error.retryable ? <button type="button" className={styles.primary} onClick={() => { void controller.query(search, true); }}>Volver a intentar</button> : null}</section>
      : readyForUrl ? <section className={styles.empty} role="status"><CalendarDays size={30} aria-hidden="true" /><h2>Configuración requerida</h2><p>Configurá la zona horaria del negocio antes de consultar Estadísticas.</p></section> : <SummarySkeleton />}
  </div></div>;
}
