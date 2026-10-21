import type { Metric } from './contracts';
import type { MetricKey,PointComparison,StatisticsSeriesReadyResponse,SeriesInterval } from './series-contracts';
import { signedCents } from './money';
import { SUMMARY_PERIODS } from './summary-period';
export const SUMMARY_METRICS = ['sales','completedOrders','averageTicket','mainUnits'] as const;
const names:Record<MetricKey,string>={sales:'Ventas comerciales',completedOrders:'Pedidos completados',averageTicket:'Ticket promedio',mainUnits:'Unidades vendidas'};
/** Formatting only. Decimal strings never pass through Number or financial arithmetic. */
export function formatSummaryDecimal(value:string,money=false,signed=false):string {
  const n=signedCents(value),abs=n<0?-n:n,whole=(abs/BigInt(100)).toString().replace(/\B(?=(\d{3})+(?!\d))/g,'.');
  const fraction=(abs%BigInt(100)).toString().padStart(2,'0');
  return `${n<0?'-':signed&&n>0?'+':''}${money?'$ ':''}${whole}${fraction==='00'?'':','+fraction}`;
}
export function presentSummaryMetric(key:MetricKey,metric:Metric){
  return {key,label:names[key],exactValue:metric.value,valueText:metric.value===null?'No disponible':formatSummaryDecimal(metric.value,['sales','averageTicket'].includes(key)),
    quality:metric.quality,qualityText:metric.quality==='partial'?'Cobertura parcial':metric.quality==='unavailable'?'Datos insuficientes':null,
    knownCount:metric.knownCount,unknownCount:metric.unknownCount,reasons:[...metric.reasons],isKnownZero:metric.value!==null&&signedCents(metric.value)===BigInt(0)&&['exact','empty'].includes(metric.quality)};
}
export function presentSummaryComparison(key:MetricKey,comparison:PointComparison){
  if(!comparison.available||comparison.absolute===null)return {available:false,direction:'unavailable' as const,text:'Sin comparación válida',absoluteText:null,percentageText:null,reason:comparison.reason};
  const absolute=signedCents(comparison.absolute);
  const direction=absolute>0?'increase' as const:absolute<0?'decrease' as const:'unchanged' as const;
  const percentageText=comparison.percentage===null?'Sin variación porcentual calculable':`${formatSummaryDecimal(comparison.percentage,false,true)}%`;
  return {available:true,direction,text:direction==='unchanged'?'Sin variación':direction==='increase'?'Aumento':'Disminución',
    absoluteText:formatSummaryDecimal(comparison.absolute,['sales','averageTicket'].includes(key),true),percentageText,reason:comparison.percentageReason};
}
const dateLabel=(date:string)=>date.split('-').reverse().join('/');
const dateRange=(start:string,end:string)=>start===end?dateLabel(start):`${dateLabel(start)} – ${dateLabel(end)}`;
export function presentSummaryInterval(interval:SeriesInterval){
  return {key:interval.key,label:`Jornada comercial: ${dateRange(interval.startDate,interval.endDate)}`,
    observation:interval.observation,slices:interval.slices.map(s=>({...s}))};
}
/** Descriptive only; evidence is delivered metrics/deltas, never recomputed totals or opportunities. */
export function commercialReading(response:StatisticsSeriesReadyResponse,key:MetricKey,pointKey:string|null=null){
  const point=pointKey===null?null:response.series.points.find(p=>p.key===pointKey);
  if(pointKey!==null&&!point)throw new Error('Unknown point key');
  const metric=point?point.current?.metrics[key]??null:response.metrics[key];
  const comparison=point?point.comparisons[key]:response.series.totalComparisons[key];
  const previous=point?point.previous?.metrics[key]??null:response.previousMetrics?.[key]??null;
  const range=point?(point.current?.interval??point.previous!.interval):response.period;
  const valid=metric!==null&&previous!==null&&(metric.knownCount>0||previous.knownCount>0)&&comparison.available&&comparison.absolute!==null&&['exact','empty'].includes(metric.quality)&&['exact','empty'].includes(previous.quality);
  const presented=metric?presentSummaryMetric(key,metric):null;
  const evidence={metric:key,label:names[key],current:presented,previous:valid&&previous?presentSummaryMetric(key,previous):null,
    rangeLabel:dateRange(range.startDate,range.endDate),pointKey,asOf:response.series.snapshot.asOf,timezone:response.timezone,
    comparison:presentSummaryComparison(key,comparison)};
  if(!valid)return {state:'neutral' as const,observation:'No hay datos suficientes para una comparación válida de este indicador.',evidence,
    meaning:metric&&['partial','unavailable'].includes(metric.quality)?'La cobertura de los datos limita la lectura; el valor conocido no representa necesariamente el total completo.':'El indicador actual y la comparación temporal deben contar con evidencia válida.',
    suggestion:'Revisá la cobertura y el período seleccionado antes de sacar conclusiones.'};
  const singular=key==='averageTicket';
  const variation=presentSummaryComparison(key,comparison),term=variation.direction==='increase'?(singular?'aumentó':'aumentaron'):variation.direction==='decrease'?(singular?'disminuyó':'disminuyeron'):(singular?'se mantuvo sin variación':'se mantuvieron sin variación');
  const percent=comparison.percentage===null?'':` (${formatSummaryDecimal(comparison.percentage)}%)`;
  const meanings:Record<MetricKey,string>={sales:'El importe comercial informado',completedOrders:'La cantidad de pedidos finalizados',averageTicket:'El importe promedio por pedido finalizado',mainUnits:'La cantidad de unidades de productos principales'};
  const suggestions:Record<MetricKey,string>={sales:'Revisá qué productos aportaron ingresos en este período.',completedOrders:'Revisá cómo se distribuyeron los pedidos dentro del período.',averageTicket:'Revisá la composición de los pedidos y sus importes acordados.',mainUnits:'Revisá qué productos principales aportaron unidades en el período.'};
  return {state:'descriptive' as const,observation:`${names[key]} ${term}${percent} respecto del período equivalente anterior.`,evidence,
    meaning:`${meanings[key]} ${variation.direction==='increase'?'fue mayor':variation.direction==='decrease'?'fue menor':'fue igual'} en las observaciones comparables. Esta variación no explica sus causas.`,suggestion:suggestions[key]};
}
export function presentStatisticsSummary(response:StatisticsSeriesReadyResponse,selectedMetric:MetricKey='sales',selectedPointKey:string|null=null){
  if(!SUMMARY_METRICS.includes(selectedMetric))throw new Error('Unknown metric');
  if(selectedPointKey!==null&&!response.series.points.some(p=>p.key===selectedPointKey))throw new Error('Unknown point');
  const empty=response.metrics.completedOrders.value==='0'&&['exact','empty'].includes(response.metrics.completedOrders.quality)&&response.coverage.historicalWithoutDate===0;
  const dataPartial=Object.values(response.metrics).some(m=>['partial','unavailable'].includes(m.quality));
  return {dataState:empty?'empty' as const:dataPartial?'partial' as const:'complete' as const,temporalPartial:response.period.partial,
    period:{...response.period,label:SUMMARY_PERIODS.find(p=>p.value===response.period.preset)!.label,rangeLabel:dateRange(response.period.startDate,response.period.endDate)},
    selectedMetric,selectedPointKey,kpis:SUMMARY_METRICS.map(key=>({...presentSummaryMetric(key,response.metrics[key]),comparison:presentSummaryComparison(key,response.series.totalComparisons[key]),selected:key===selectedMetric})),
    // Each row carries the backend's explicit pair and intervals; never zip independent arrays.
    series:response.series.points.map(p=>({key:p.key,mapping:p.mapping,basis:p.basis,label:p.label,
      current:p.current?{interval:presentSummaryInterval(p.current.interval),metric:presentSummaryMetric(selectedMetric,p.current.metrics[selectedMetric])}:null,
      previous:p.previous&&p.comparisons[selectedMetric].available?{interval:presentSummaryInterval(p.previous.interval),metric:presentSummaryMetric(selectedMetric,p.previous.metrics[selectedMetric])}:null,
      comparison:presentSummaryComparison(selectedMetric,p.comparisons[selectedMetric]),alignment:{...p.alignment},selected:p.key===selectedPointKey})),
    reading:commercialReading(response,selectedMetric,selectedPointKey),
    notices:[...(dataPartial?[{kind:'quality',text:'Calidad de datos: algunos indicadores tienen cobertura limitada.'}]:[]),
      ...(response.coverage.historicalWithoutDate>0?[{kind:'historical',text:`Pedidos sin fecha confirmada: ${response.coverage.historicalWithoutDate}. Se presentan por separado y no se incorporan a los períodos.`}]:[]),
      ...(response.coverage.outsideSession>0?[{kind:'outside_session',text:`Fuera de sesión verificada: ${response.coverage.outsideSession} pedidos con fecha de finalización fiable.`}]:[]),
      ...(!response.series.totalAlignment.available?[{kind:'comparison',text:'Sin comparación válida para el período.'}]:[])],
    emptyMessage:empty?'Todavía no hay resultados para este período.':null};
}
