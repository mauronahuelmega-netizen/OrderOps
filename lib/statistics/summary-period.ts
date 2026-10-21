import type { PeriodInput, PeriodPreset, StatisticsRpcArgs } from './contracts';
import { parseDate } from './periods';
export const SUMMARY_PERIODS: ReadonlyArray<{value:PeriodPreset;label:string}> = [
  {value:'today',label:'Hoy'},{value:'yesterday',label:'Ayer'},{value:'this_week',label:'Esta semana'},
  {value:'this_month',label:'Este mes'},{value:'previous_month',label:'Mes anterior'},
  {value:'last_7_days',label:'Últimos 7 días'},{value:'last_30_days',label:'Últimos 30 días'},{value:'custom',label:'Personalizado'},
];
export const SUMMARY_QUICK_PERIODS = ['today','this_week','this_month'] as const;
export class SummaryPeriodError extends Error { constructor(){super('El período seleccionado no es válido.');} }
/** URL selects the preset/dates; only the backend resolves commercial dates, timezone and asOf. */
export function parseSummaryPeriod(search:string): PeriodInput {
  try {
    const params=new URLSearchParams(search.replace(/^\?/,''));
    for(const key of ['period','start','end']) if(params.getAll(key).length>1)throw new Error('duplicate');
    const preset=params.get('period')??'this_week';
    if(!SUMMARY_PERIODS.some(p=>p.value===preset))throw new Error('preset');
    if(preset!=='custom'){
      if(params.has('start')||params.has('end'))throw new Error('unexpected dates');
      return {preset:preset as PeriodPreset};
    }
    const startDate=parseDate(params.get('start')??''),endDate=parseDate(params.get('end')??'');
    if(startDate>endDate)throw new Error('order');
    return {preset:'custom',startDate,endDate};
  }catch{throw new SummaryPeriodError();}
}
export function serializeSummaryPeriod(period:PeriodInput,existingSearch=''):string {
  const p=new URLSearchParams(existingSearch.replace(/^\?/,''));
  for(const key of ['period','start','end'])p.delete(key);
  p.set('period',period.preset);
  if(period.preset==='custom'){p.set('start',period.startDate??'');p.set('end',period.endDate??'');}
  parseSummaryPeriod(p.toString());return p.toString();
}
export function summaryPeriodKey(period:PeriodInput):string {
  const p=parseSummaryPeriod(serializeSummaryPeriod(period));
  return JSON.stringify([p.preset,p.startDate??null,p.endDate??null]);
}
export function summaryRpcArgs(period:PeriodInput):StatisticsRpcArgs {
  const p=parseSummaryPeriod(serializeSummaryPeriod(period));
  return p.preset==='custom'?{p_period:p.preset,p_start_date:p.startDate,p_end_date:p.endDate}:{p_period:p.preset};
}
