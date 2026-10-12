import type { Metric, StatisticsReadClient, StatisticsResponse, StatisticsRpcArgs } from './contracts';
import { cents } from './money';
import { instant, parseDate } from './periods';
export class StatisticsReadError extends Error {
  constructor(public readonly code: 'forbidden' | 'invalid_request' | 'stale_cursor' | 'query_failed' | 'invalid_response') {
    super(code === 'forbidden' ? 'No tenés permisos para consultar Estadísticas.' : 'No pudimos consultar las estadísticas.');
  }
}
function object(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new StatisticsReadError('invalid_response');
  return value as Record<string, unknown>;
}
function integer(value: unknown) { if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new StatisticsReadError('invalid_response'); }
function text(value: unknown): asserts value is string { if (typeof value !== 'string') throw new StatisticsReadError('invalid_response'); }
function amount(value: unknown, nullable = true) { if (value === null && nullable) return; text(value); cents(value); }
function metrics(value: unknown) {
  const group = object(value);
  for (const name of ['sales', 'completedOrders', 'averageTicket', 'mainUnits']) {
    const m = object(group[name]); amount(m.value); integer(m.knownCount); integer(m.unknownCount);
    if (!['exact', 'partial', 'unavailable', 'empty'].includes(String(m.quality)) || !Array.isArray(m.reasons) || !m.reasons.every(r => typeof r === 'string')) throw new StatisticsReadError('invalid_response');
    if (m.value === null && m.quality === 'exact') throw new StatisticsReadError('invalid_response');
  }
}
function array(value: unknown): unknown[] { if (!Array.isArray(value)) throw new StatisticsReadError('invalid_response'); return value; }
export function decodeStatisticsResponse(value: unknown, businessId: string): StatisticsResponse {
  try {
    const response = object(value);
    if (response.contractVersion !== 'statistics.v1' || response.businessId !== businessId) throw new StatisticsReadError('invalid_response');
    if (response.status === 'configuration_required') {
      if (response.reason !== 'missing_timezone') throw new StatisticsReadError('invalid_response');
      return value as StatisticsResponse;
    }
    if (response.status !== 'ready' || response.currency !== 'ARS') throw new StatisticsReadError('invalid_response');
    text(response.timezone); new Intl.DateTimeFormat('en', { timeZone: response.timezone });
    text(response.revision); if (!/^\d+$/.test(response.revision)) throw new StatisticsReadError('invalid_response');
    const period = object(response.period);
    if (!['today','yesterday','this_week','this_month','previous_month','last_7_days','last_30_days','custom'].includes(String(period.preset)) || period.timezone !== response.timezone) throw new StatisticsReadError('invalid_response');
    for (const k of ['startDate', 'endDate', 'referenceDate']) { text(period[k]); parseDate(period[k]); }
    if (String(period.startDate) > String(period.endDate)) throw new StatisticsReadError('invalid_response');
    if (period.comparable !== null) {
      const range=object(period.comparable);text(range.startDate);text(range.endDate);parseDate(range.startDate);parseDate(range.endDate);
      if (range.startDate>range.endDate) throw new StatisticsReadError('invalid_response');
    }
    if (period.comparableReason !== null) text(period.comparableReason);
    text(period.asOf); instant(period.asOf);
    if (typeof period.partial !== 'boolean' || !['hour', 'day', 'week', 'month'].includes(String(period.granularity))) throw new StatisticsReadError('invalid_response');
    const coverage = object(response.coverage); integer(coverage.historicalWithoutDate); integer(coverage.outsideSession);
    if (coverage.instrumentedAt !== null) { text(coverage.instrumentedAt); instant(coverage.instrumentedAt); }
    metrics(response.metrics); if (response.previousMetrics !== null) metrics(response.previousMetrics);
    const comparison = object(response.comparison); if (typeof comparison.available !== 'boolean') throw new StatisticsReadError('invalid_response');
    if (comparison.reason !== null) text(comparison.reason);
    array(comparison.segments).forEach(v => { const s = object(v); text(s.currentSessionId); text(s.previousSessionId); text(s.currentUntil); text(s.previousUntil); instant(s.currentUntil); instant(s.previousUntil); });
    if (comparison.available !== (response.previousMetrics !== null)) throw new StatisticsReadError('invalid_response');
    const buckets = array(response.buckets); if (buckets.length > 200) throw new StatisticsReadError('invalid_response');
    buckets.forEach(v => { const b = object(v); text(b.label); metrics(b.metrics); });
    const products = object(response.products);
    array(products.items).forEach(v => { const p = object(v); text(p.label); if (p.identity !== null) text(p.identity); if (p.mainUnits !== null) integer(p.mainUnits); amount(p.netAmount); if (!['exact', 'partial', 'unavailable', 'empty'].includes(String(p.quality))) throw new StatisticsReadError('invalid_response'); });
    if (products.nextCursor !== null) {
      const cursor = object(products.nextCursor); integer(cursor.offset); text(cursor.revision); text(cursor.requestKey); text(cursor.asOf);
      if (cursor.revision !== response.revision || !/^[a-f0-9]{32}$/.test(cursor.requestKey)) throw new StatisticsReadError('invalid_response'); instant(cursor.asOf);
    }
    array(response.categories).forEach(v => { const c = object(v); if (c.identity !== null) text(c.identity); text(c.label); amount(c.amount, false); amount(c.percentage); });
    const unattributed = object(response.unattributed); amount(unattributed.pendingAgreedTotal); integer(unattributed.unresolvedOrders);
    array(object(response.ruleEvidence).products).forEach(v => { const p = object(v); text(p.identity); if (p.currentMainUnits !== null) integer(p.currentMainUnits); if (p.previousMainUnits !== null) integer(p.previousMainUnits); });
    return value as StatisticsResponse;
  } catch (error) { if (error instanceof StatisticsReadError) throw error; throw new StatisticsReadError('invalid_response'); }
}
export function canReadStatistics(role: string): boolean { return ['owner', 'manager', 'admin'].includes(role); }
export async function readStatistics(client: StatisticsReadClient, args: StatisticsRpcArgs, principal: { businessId: string; role: string }): Promise<StatisticsResponse> {
  if (!canReadStatistics(principal.role) || !principal.businessId) throw new StatisticsReadError('forbidden');
  if (!['today', 'yesterday', 'this_week', 'this_month', 'previous_month', 'last_7_days', 'last_30_days', 'custom'].includes(args.p_period)
    || (args.p_product_sort !== undefined && !['units', 'amount'].includes(args.p_product_sort))
    || (args.p_limit !== undefined && (!Number.isInteger(args.p_limit) || args.p_limit < 1 || args.p_limit > 20))) throw new StatisticsReadError('invalid_request');
  if (args.p_period === 'custom') {
    try { if (!args.p_start_date || !args.p_end_date || parseDate(args.p_start_date) > parseDate(args.p_end_date)) throw new Error('range'); }
    catch { throw new StatisticsReadError('invalid_request'); }
  }
  const result = await client.rpc('statistics_v1_summary', args);
  if (result.error) throw new StatisticsReadError(result.error.code === '42501' ? 'forbidden' : result.error.message.includes('STALE_CURSOR') ? 'stale_cursor' : 'query_failed');
  return decodeStatisticsResponse(result.data, principal.businessId);
}
export function exactMetric(value: Metric): boolean { return value.quality === 'exact' || value.quality === 'empty'; }
