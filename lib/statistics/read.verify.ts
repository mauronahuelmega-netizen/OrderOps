import assert from 'node:assert/strict';
import { indicators } from './quality';
import { resolvePeriod } from './periods';
import { canReadStatistics, decodeStatisticsResponse, readStatistics, StatisticsReadError } from './read';
import type { StatisticsReadyResponse, StatisticsReadClient } from './contracts';

const businessId = '00000000-0000-0000-0000-000000000001';
const value: StatisticsReadyResponse = {
  contractVersion: 'statistics.v1', status: 'ready', businessId, currency: 'ARS', timezone: 'UTC', revision: '1',
  period: resolvePeriod({ preset: 'today' }, { asOf: '2026-10-12T12:00:00Z', timezone: 'UTC' }),
  coverage: { historicalWithoutDate: 0, outsideSession: 0, instrumentedAt: null },
  metrics: indicators([]), previousMetrics: null, comparison: { available: false, reason: 'unmatched_sessions', segments: [] },
  buckets: [], products: { items: [], nextCursor: null }, categories: [], unattributed: { pendingAgreedTotal: null, unresolvedOrders: 0 }, ruleEvidence: { products: [] },
};
assert.equal(decodeStatisticsResponse(value, businessId).status, 'ready');
assert.throws(() => decodeStatisticsResponse(value, 'foreign'), StatisticsReadError);
for (const role of ['operator', 'viewer', 'super_admin', 'promoter', 'commercial', '']) assert.equal(canReadStatistics(role), false);
for (const role of ['owner', 'manager', 'admin']) assert.equal(canReadStatistics(role), true);
let calls = 0;
const client: StatisticsReadClient = { rpc: async name => { calls++; assert.equal(name, 'statistics_v1_summary'); return { data: value, error: null }; } };
async function verify() {
  for (const role of ['operator', 'viewer', 'super_admin']) await assert.rejects(readStatistics(client, { p_period: 'today' }, { role, businessId }), StatisticsReadError);
  assert.equal(calls, 0);
  assert.equal((await readStatistics(client, { p_period: 'today' }, { role: 'owner', businessId })).status, 'ready');
  const broken = structuredClone(value); broken.metrics.sales.value = 'NaN'; assert.throws(() => decodeStatisticsResponse(broken, businessId));
  const mixed = structuredClone(value); mixed.comparison.available = true; assert.throws(() => decodeStatisticsResponse(mixed, businessId));
  assert.throws(() => decodeStatisticsResponse({ ...value, contractVersion: 'unsupported' }, businessId));
  const rejected: StatisticsReadClient = { rpc: async () => ({ data: null, error: { code: '42501', message: 'database details' } }) };
  await assert.rejects(readStatistics(rejected, { p_period: 'today' }, { role: 'owner', businessId }), e => e instanceof StatisticsReadError && e.code === 'forbidden' && !e.message.includes('database details'));
  await assert.rejects(readStatistics(client, { p_period: 'custom', p_start_date: '2026-02-30', p_end_date: '2026-03-01' }, { role: 'owner', businessId }));
  console.log('PASS: owned read contract, original-role denial, tenant validation and malformed/foreign/stale-safe responses. No database calls.');
}
void verify().catch(error => { console.error(error); process.exitCode = 1; });
