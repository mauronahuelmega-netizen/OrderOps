import type { Indicators, Metric, StatisticsReadClient, StatisticsRpcArgs } from './contracts';
import type { AlignmentReason, ComparativeSeries, SeriesInterval, SeriesPoint, StatisticsSeriesResponse } from './series-contracts';
import { decodeStatisticsResponse, readStatistics } from './read';
import { cents, roundedDivide, decimal } from './money';
import { parseDate } from './periods';
import { dateOffset, equalExposure, instantMicros, secondsMicros, seriesDelta } from './series-temporal';

export class StatisticsSeriesReadError extends Error {
  constructor(public readonly code: 'series_unavailable' | 'invalid_response') {
    super(code === 'series_unavailable' ? 'La serie comparativa todavía no está disponible.' : 'No pudimos validar la serie estadística.');
  }
}
const keys = ['sales','completedOrders','averageTicket','mainUnits'] as const;
const reasons: AlignmentReason[] = ['root_comparison_unavailable','missing_counterpart','duration_mismatch','ambiguous_wall_time','nonexistent_wall_time','interval_out_of_range','timezone_changed','unverified_session','metric_quality','empty_average'];
const qualityReasons = ['missing_completion','missing_timezone','unverified_session','missing_agreement','unresolved_breakdown','agreement_changed_after_completion','missing_composition','missing_identity','missing_category','incomplete_comparable','source_conflict'];
function must(condition: unknown): asserts condition { if (!condition) throw new StatisticsSeriesReadError('invalid_response'); }
function obj(value: unknown): Record<string, unknown> { must(typeof value === 'object' && value !== null && !Array.isArray(value)); return value as Record<string,unknown>; }
function str(value: unknown): asserts value is string { must(typeof value === 'string' && value.length > 0 && value.length <= 200); }
function count(value: unknown): asserts value is number { must(typeof value === 'number' && Number.isSafeInteger(value) && value >= 0); }
function arr(value: unknown): unknown[] { must(Array.isArray(value)); return value; }
function exactFields(value: Record<string,unknown>, fields: string[], optional: string[] = []) {
  must(fields.every(k => Object.hasOwn(value,k)) && Object.keys(value).every(k => fields.includes(k) || optional.includes(k)));
}
function alignment(value: unknown): { available: boolean; reason: AlignmentReason | null } {
  const a = obj(value); exactFields(a,['available','reason']);
  must(typeof a.available === 'boolean' && (a.reason === null || reasons.includes(a.reason as AlignmentReason)));
  must(a.available === (a.reason === null));
  return a as unknown as { available: boolean; reason: AlignmentReason | null };
}
function metricGroup(value: unknown): Indicators {
  const group = obj(value); exactFields(group,[...keys]);
  for (const key of keys) {
    const m = obj(group[key]); exactFields(m,['value','quality','reasons','knownCount','unknownCount']);
    count(m.knownCount); count(m.unknownCount);
    must(arr(m.reasons).every(r => qualityReasons.includes(String(r))));
    must(['exact','partial','unavailable','empty'].includes(String(m.quality)));
    if (m.value !== null) { str(m.value); cents(m.value); if (key === 'mainUnits' || key === 'completedOrders') must(/^(0|[1-9]\d*)$/.test(m.value)); }
    if (key !== 'averageTicket') {
      const expected = m.unknownCount > 0 ? (m.knownCount > 0 ? 'partial' : 'unavailable') : (m.knownCount > 0 ? 'exact' : 'empty');
      must(m.quality === expected);
      if (m.knownCount > 0 || m.quality === 'empty') must(m.value !== null); else must(m.value === null);
      if (m.quality === 'empty') must(cents(m.value as string) === BigInt(0));
    } else {
      if (m.quality === 'exact') must(m.value !== null && m.unknownCount === 0 && m.knownCount > 0);
      else must((m.quality === 'empty' || m.quality === 'unavailable') && m.value === null);
    }
  }
  const result = group as unknown as Indicators;
  const n = result.completedOrders.knownCount;
  must(result.sales.knownCount + result.sales.unknownCount === n + result.completedOrders.unknownCount);
  must(result.mainUnits.knownCount + result.mainUnits.unknownCount === n + result.completedOrders.unknownCount);
  must(result.averageTicket.knownCount === result.sales.knownCount && result.averageTicket.unknownCount === result.sales.unknownCount);
  if (result.completedOrders.value !== null) must(BigInt(result.completedOrders.value) === BigInt(n));
  if (result.averageTicket.quality === 'exact') must(result.averageTicket.value === decimal(roundedDivide(cents(result.sales.value!),BigInt(n))));
  return result;
}
function interval(value: unknown, range: { startDate: string; endDate: string }, asOf: bigint, seen: Set<string>): SeriesInterval {
  const i = obj(value); exactFields(i,['key','startDate','endDate','slices','observation']);
  str(i.key); must(!seen.has(i.key)); seen.add(i.key);
  str(i.startDate); str(i.endDate); parseDate(i.startDate); parseDate(i.endDate);
  must(i.startDate <= i.endDate && i.startDate >= range.startDate && i.endDate <= range.endDate);
  must(i.observation === 'closed' || i.observation === 'partial');
  const lanes = new Map<string,bigint>();
  for (const value of arr(i.slices)) {
    const s = obj(value); exactFields(s,['sessionId','timezone','commercialDate','start','end','endInclusive'],['endCommercialDate']);
    must(s.sessionId === null || (typeof s.sessionId === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(s.sessionId)));
    str(s.timezone); new Intl.DateTimeFormat('en',{timeZone:s.timezone});
    str(s.commercialDate); parseDate(s.commercialDate);
    const endDate = s.endCommercialDate ?? s.commercialDate; str(endDate); parseDate(endDate);
    must(s.commercialDate >= i.startDate && endDate <= i.endDate && s.commercialDate <= endDate);
    str(s.start); str(s.end); must(typeof s.endInclusive === 'boolean');
    const lo = instantMicros(s.start), hi = instantMicros(s.end);
    must(lo <= hi && (lo < hi || s.endInclusive) && hi <= asOf);
    const lane = `${s.sessionId}:${s.commercialDate}:${s.timezone}`;
    const previousEnd = lanes.get(lane); if (previousEnd !== undefined) must(lo >= previousEnd);
    lanes.set(lane,hi);
  }
  return i as unknown as SeriesInterval;
}
function comparisons(value: unknown, current: Indicators | null, previous: Indicators | null, a: { available: boolean; reason: AlignmentReason | null }) {
  const group = obj(value); exactFields(group,[...keys]);
  for (const key of keys) {
    const c = obj(group[key]); exactFields(c,['available','reason','absolute','percentage','percentageReason']);
    const expected = seriesDelta(current?.[key] ?? null,previous?.[key] ?? null,a.available,a.reason);
    for (const field of Object.keys(expected) as Array<keyof typeof expected>) must(c[field] === expected[field]);
  }
}

export function decodeStatisticsSeriesResponse(value: unknown, businessId: string): StatisticsSeriesResponse {
  const base = decodeStatisticsResponse(value,businessId);
  if (base.status !== 'ready') { must(!Object.hasOwn(obj(value),'series')); return base; }
  if (!Object.hasOwn(obj(value),'series')) throw new StatisticsSeriesReadError('series_unavailable');
  try {
    const s = obj(obj(value).series);
    exactFields(s,['version','snapshot','resolution','resolutionReason','previousRange','coverage','totalAlignment','totalComparisons','points']);
    must(s.version === 'statistics.series.v1');
    const snapshot = obj(s.snapshot); exactFields(snapshot,['revision','asOf']);
    must(snapshot.revision === base.revision && snapshot.asOf === base.period.asOf);
    const asOf = instantMicros(base.period.asOf);
    metricGroup(base.metrics); if (base.previousMetrics) metricGroup(base.previousMetrics);
    must(['hour','day','week','month'].includes(String(s.resolution)));
    must(s.resolutionReason === null || s.resolutionReason === 'point_limit' || s.resolutionReason === 'unverifiable_hour_exposure');
    must(base.comparison.available === (s.previousRange !== null));
    if (s.previousRange !== null) {
      const r = obj(s.previousRange); exactFields(r,['startDate','endDate']);
      must(r.startDate === base.period.comparable?.startDate && r.endDate === base.period.comparable?.endDate);
    }
    const coverage = obj(s.coverage); exactFields(coverage,['historicalWithoutDate','scope']);
    must(coverage.scope === 'global_unassigned' && coverage.historicalWithoutDate === base.coverage.historicalWithoutDate);
    const points = arr(s.points); must(points.length > 0 && points.length <= 200);
    const pointKeys = new Set<string>(), intervalKeys = new Set<string>();
    const decoded: SeriesPoint[] = [];
    for (const raw of points) {
      const p = obj(raw); exactFields(p,['key','label','basis','mapping','current','previous','alignment','comparisons']);
      str(p.key); str(p.label); must(!pointKeys.has(p.key)); pointKeys.add(p.key);
      must(['commercial_date','session_elapsed','outside_session_wall'].includes(String(p.basis)));
      const a = alignment(p.alignment);
      must(p.current !== null || p.previous !== null);
      if (!base.comparison.available) must(p.previous === null && !a.available && a.reason === 'root_comparison_unavailable');
      let cm: Indicators | null = null, pm: Indicators | null = null;
      for (const side of ['current','previous'] as const) {
        if (p[side] === null) continue;
        const item = obj(p[side]); exactFields(item,['interval','metrics']);
        const range = side === 'current' ? base.period : base.period.comparable;
        must(range !== null); interval(item.interval,range,asOf,intervalKeys);
        const metrics = metricGroup(item.metrics); if (side === 'current') cm = metrics; else pm = metrics;
      }
      const mapping = obj(p.mapping);
      if (p.basis === 'commercial_date') {
        exactFields(mapping,['kind','days'],['sessions']); must(mapping.kind === 'date_offset' && Number.isSafeInteger(mapping.days));
        if (p.current && p.previous) {
          const ci = obj(obj(p.current).interval), pi = obj(obj(p.previous).interval);
          must(dateOffset(String(ci.startDate),String(ci.endDate),String(pi.startDate),String(pi.endDate),Number(mapping.days)));
        }
        if (mapping.sessions !== undefined) for (const pair of arr(mapping.sessions).map(obj)) {
          exactFields(pair,['currentSessionId','previousSessionId','ordinal']);
          str(pair.currentSessionId); str(pair.previousSessionId); count(pair.ordinal); must(pair.ordinal > 0);
          must(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(pair.currentSessionId) && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(pair.previousSessionId));
        }
      } else if (p.basis === 'session_elapsed') {
        exactFields(mapping,['kind','ordinal','startSeconds','endSeconds']);
        must(mapping.kind === 'session_elapsed'); count(mapping.ordinal); must(mapping.ordinal > 0);
        for (const field of ['startSeconds','endSeconds']) { str(mapping[field]); must(/^(0|[1-9]\d*)(\.\d{1,6})?$/.test(mapping[field] as string)); }
        must(secondsMicros(String(mapping.endSeconds))>secondsMicros(String(mapping.startSeconds)));
      } else {
        exactFields(mapping,['kind','wallStart','wallEnd','timezone']); must(mapping.kind === 'wall_clock');
        for (const field of ['wallStart','wallEnd']) must(typeof mapping[field] === 'string' && /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d\.\d{6}$/.test(mapping[field] as string));
        str(mapping.timezone); new Intl.DateTimeFormat('en',{timeZone:mapping.timezone});
      }
      if (a.available) {
        must(cm !== null && pm !== null);
        if (p.basis === 'commercial_date') {
          const c = obj(obj(p.current).interval), previous = obj(obj(p.previous).interval);
          const currentSlices = arr(c.slices).map(obj), previousSlices = arr(previous.slices).map(obj);
          const pairs = mapping.sessions === undefined ? [] : arr(mapping.sessions).map(obj);
          const currentIds = new Set<string>(), previousIds = new Set<string>();
          for (const pair of pairs) {
            exactFields(pair,['currentSessionId','previousSessionId','ordinal']);
            str(pair.currentSessionId); str(pair.previousSessionId); count(pair.ordinal); must(pair.ordinal > 0);
            must(!currentIds.has(pair.currentSessionId) && !previousIds.has(pair.previousSessionId));
            currentIds.add(pair.currentSessionId); previousIds.add(pair.previousSessionId);
            const cs = currentSlices.find(s => s.sessionId === pair.currentSessionId), ps = previousSlices.find(s => s.sessionId === pair.previousSessionId);
            must(cs !== undefined && ps !== undefined);
            must(dateOffset(String(cs.commercialDate),String(cs.commercialDate),String(ps.commercialDate),String(ps.commercialDate),Number(mapping.days)));
            must(cs.timezone === ps.timezone && cs.endInclusive === ps.endInclusive && equalExposure(String(cs.start),String(cs.end),String(ps.start),String(ps.end)));
          }
          must(currentSlices.filter(s => s.sessionId !== null).every(s => currentIds.has(String(s.sessionId))));
          must(previousSlices.filter(s => s.sessionId !== null).every(s => previousIds.has(String(s.sessionId))));
          const cs = currentSlices.filter(s => s.sessionId === null), ps = previousSlices.filter(s => s.sessionId === null);
          must(cs.length === ps.length && cs.length <= 1);
          if (cs.length) must(cs[0].timezone === ps[0].timezone && cs[0].endInclusive === ps[0].endInclusive && equalExposure(String(cs[0].start),String(cs[0].end),String(ps[0].start),String(ps[0].end)));
        }
        if (p.basis !== 'commercial_date') {
          const c = obj(obj(p.current).interval), previous = obj(obj(p.previous).interval);
          must(arr(c.slices).length === 1 && arr(previous.slices).length === 1);
          const cs = obj(arr(c.slices)[0]), ps = obj(arr(previous.slices)[0]);
          must(cs.timezone === ps.timezone && cs.endInclusive === ps.endInclusive);
          must(equalExposure(String(cs.start),String(cs.end),String(ps.start),String(ps.end)));
        }
      }
      comparisons(p.comparisons,cm,pm,a); decoded.push(p as unknown as SeriesPoint);
    }
    const total = alignment(s.totalAlignment);
    if (total.available) must(base.comparison.available && decoded.every(p => p.alignment.available));
    if (!base.comparison.available) must(!total.available && total.reason === 'root_comparison_unavailable');
    if (s.resolution !== 'hour') for (const side of ['current','previous'] as const) {
      const range = side === 'current' ? base.period : (base.comparison.available ? base.period.comparable : null);
      if (!range) continue;
      const ranges = decoded.flatMap(p => p[side] ? [p[side]!.interval] : []).sort((a,b)=>a.startDate.localeCompare(b.startDate));
      must(ranges.length > 0 && ranges[0].startDate === range.startDate && ranges[ranges.length-1].endDate === range.endDate);
      for (let i=1;i<ranges.length;i++) must(dateOffset(ranges[i-1].endDate,ranges[i-1].endDate,ranges[i].startDate,ranges[i].startDate,1));
      must(decoded.every(p=>p.basis==='commercial_date'));
    }
    comparisons(s.totalComparisons,base.metrics,base.previousMetrics,total);
    if (s.resolution === 'hour') {
      must(decoded.every(p => p.basis !== 'commercial_date'));
      // Group by explicit session identity and nominal elapsed coordinate. Array
      // order is irrelevant; this verifies coverage, never creates correspondence.
      const lanes = new Map<string,Array<{ lo: bigint; hi: bigint; opening: bigint; end: bigint; inclusive: boolean }>>();
      let nominalStep: bigint | null = null;
      for (const p of decoded) if (p.mapping.kind === 'session_elapsed') {
        for (const side of ['current','previous'] as const) {
          const item = p[side]; if (!item) continue;
          must(item.interval.slices.length === 1);
          const slice = item.interval.slices[0]; must(slice.sessionId !== null);
          const lo = secondsMicros(p.mapping.startSeconds), hi = secondsMicros(p.mapping.endSeconds);
          const hour = BigInt(3600000000); must((hi-lo)%hour === BigInt(0));
          if (nominalStep !== null) must(hi-lo === nominalStep); else nominalStep=hi-lo;
          const opening = instantMicros(slice.start)-lo, end = instantMicros(slice.end);
          must(end-instantMicros(slice.start) <= hi-lo);
          const key = `${side}:${slice.sessionId}:${item.interval.startDate}:${p.mapping.ordinal}`;
          lanes.set(key,[...(lanes.get(key)??[]),{lo,hi,opening,end,inclusive:slice.endInclusive}]);
        }
      }
      for (const windows of lanes.values()) {
        windows.sort((a,b)=>a.lo<b.lo?-1:a.lo>b.lo?1:0);
        must(windows[0].lo === BigInt(0));
        for (let i=0;i<windows.length;i++) {
          must(windows[i].opening === windows[0].opening);
          if (i>0) must(windows[i].lo === windows[i-1].hi);
          if (i<windows.length-1) must(!windows[i].inclusive && windows[i].end === windows[i].opening+windows[i].hi);
          else must(windows[i].inclusive);
        }
      }
      if (nominalStep !== null) {
        const hour = BigInt(3600000000);
        const maximum = [...lanes.values()].reduce((n,windows)=>{
          const duration = windows[windows.length-1].end-windows[0].opening;
          return duration>n?duration:n;
        },BigInt(0));
        must(nominalStep <= (maximum+hour-BigInt(1))/hour*hour);
      }
    }
    // Global unassigned coverage is counted once at the root, not summed by point.
    for (const side of ['current','previous'] as const) {
      const root = side === 'current' ? base.metrics : base.previousMetrics; if (!root) continue;
      const historical = side === 'current' ? base.coverage.historicalWithoutDate : 0;
      for (const key of keys) {
        const ms = decoded.flatMap(p => p[side] ? [p[side]!.metrics[key]] : []);
        must(ms.reduce((n,m)=>n+BigInt(m.knownCount),BigInt(0)) === BigInt(root[key].knownCount));
        must(ms.reduce((n,m)=>n+BigInt(m.unknownCount)-BigInt(historical),BigInt(0))+BigInt(historical) === BigInt(root[key].unknownCount));
        if (key !== 'averageTicket' && root[key].value !== null) {
          must(ms.reduce((n,m)=>n+(m.value === null ? BigInt(0) : cents(m.value)),BigInt(0)) === cents(root[key].value!));
        }
      }
    }
    return { ...base, series: s as unknown as ComparativeSeries };
  } catch (error) {
    if (error instanceof StatisticsSeriesReadError) throw error;
    throw new StatisticsSeriesReadError('invalid_response');
  }
}
export async function readStatisticsSeries(client: StatisticsReadClient,args: StatisticsRpcArgs,principal: { businessId: string; role: string }): Promise<StatisticsSeriesResponse> {
  return decodeStatisticsSeriesResponse(await readStatistics(client,args,principal),principal.businessId);
}
