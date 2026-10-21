/** Offline review checks. No DB, API, application writes or shared-file edits. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';
import { decodeStatisticsResponse } from '../../../lib/statistics/read';
import { delta } from '../../../lib/statistics/comparisons';
import { dayDistance } from '../../../lib/statistics/periods';
import type { Metric } from '../../../lib/statistics/contracts';
import type { ProposedReadyResponse } from './contract.proposed';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = process.cwd();
const business = '11111111-1111-4111-8111-111111111111';
let checks = 0;
function check(value: unknown, message: string): asserts value { assert.ok(value, message); checks++; }
function verify(r: ProposedReadyResponse) {
  decodeStatisticsResponse(r, business);
  check(r.series.version === 'statistics.series.v1', 'extension version');
  check(r.series.snapshot.revision === r.revision && r.series.snapshot.asOf === r.period.asOf, 'one snapshot');
  check(r.series.points.length <= 200, 'point limit');
  check(new Set(r.series.points.map(p => p.key)).size === r.series.points.length, 'unique match keys');
  check(r.series.coverage.historicalWithoutDate === r.coverage.historicalWithoutDate, 'global coverage');
  check(r.comparison.available === (r.series.previousRange !== null), 'root admission');
  check(r.series.totalAlignment.available === (r.series.totalAlignment.reason === null), 'total alignment reason');
  check(!r.series.totalAlignment.available || (r.comparison.available && r.series.points.every(p => p.alignment.available)), 'complete exposure');
  if (r.comparison.available) assert.deepEqual(r.series.previousRange, r.period.comparable);
  for (const p of r.series.points) {
    check(p.current !== null || p.previous !== null, 'not an empty pair');
    if (!r.comparison.available) check(p.previous === null && !p.alignment.available, 'no inferred previous');
    check(p.alignment.available === (p.alignment.reason === null), 'temporal reason');
    if (p.alignment.available) check(p.current !== null && p.previous !== null, 'verified pair');
    check(['date_offset','session_elapsed','wall_clock'].includes(p.mapping.kind), 'structured correspondence');
    if (p.mapping.kind === 'date_offset' && p.current && p.previous) {
      assert.equal(dayDistance(p.current.interval.startDate, p.previous.interval.startDate), p.mapping.days); checks++;
      assert.equal(dayDistance(p.current.interval.endDate, p.previous.interval.endDate), p.mapping.days); checks++;
    }
    for (const side of ['current', 'previous'] as const) {
      const item = p[side]; if (!item) continue;
      check(item.interval.startDate <= item.interval.endDate, 'date interval');
      for (const slice of item.interval.slices) {
        check(Number.isFinite(Date.parse(slice.start)) && Number.isFinite(Date.parse(slice.end)), 'UTC timestamps');
        check(slice.start < slice.end, 'positive interval');
        check(slice.commercialDate >= item.interval.startDate && slice.commercialDate <= item.interval.endDate, 'logical attribution');
        check(Date.parse(slice.end) <= Date.parse(r.period.asOf), 'not future');
        new Intl.DateTimeFormat('en', { timeZone: slice.timezone });
      }
    }
    for (const key of ['sales', 'completedOrders', 'averageTicket', 'mainUnits'] as const) {
      const c = p.comparisons[key];
      check(c.available === (c.reason === null), 'comparison reason');
      if (!c.available) {
        check(c.absolute === null && c.percentage === null && c.percentageReason === null, 'unknown is not zero');
      } else {
        check(p.alignment.available, 'alignment before delta');
        const current = p.current!.metrics[key], previous = p.previous!.metrics[key];
        const trusted = (m: Metric) => ['exact', 'empty'].includes(m.quality) && m.value !== null;
        check(trusted(current) && trusted(previous), 'metric gates');
        const expected = delta(current, previous);
        assert.equal(c.absolute, expected.absolute); assert.equal(c.percentage, expected.percentage);
        assert.equal(c.percentageReason, expected.reason === 'no_base' ? 'no_base' : null);
        checks += 3;
      }
    }
  }
  for (const key of ['sales','completedOrders','averageTicket','mainUnits'] as const) {
    const comparison = r.series.totalComparisons[key];
    check(comparison.available === (comparison.reason === null), 'total comparison reason');
    if (comparison.available) {
      check(r.series.totalAlignment.available && r.previousMetrics !== null, 'total gate');
      const expected = delta(r.metrics[key], r.previousMetrics![key]);
      check(expected.absolute !== null, 'known total values');
      assert.equal(comparison.absolute, expected.absolute); assert.equal(comparison.percentage, expected.percentage);
      assert.equal(comparison.percentageReason, expected.reason === 'no_base' ? 'no_base' : null); checks += 3;
    } else check(comparison.absolute === null && comparison.percentage === null, 'neutral total');
  }
  for (const side of ['current', 'previous'] as const) {
    const total = side === 'current' ? r.metrics : r.previousMetrics;
    if (!total) continue;
    for (const key of ['sales', 'completedOrders', 'mainUnits'] as const) {
      const values = r.series.points.map(p => p[side]?.metrics[key].value ?? null).filter((v): v is string => v !== null);
      if (total[key].value !== null) {
        const units = (s: string) => BigInt(s.includes('.') ? s.replace('.', '').padEnd(s.split('.')[0].length + 2, '0') : s + '00');
        assert.equal(values.reduce((n, v) => n + units(v), BigInt(0)), units(total[key].value)); checks++;
      }
    }
  }
}
function patched(file: string, patch: string) {
  const start = patch.indexOf(`diff --git a/${file} b/${file}\n`);
  check(start >= 0, 'patch file');
  const end = patch.indexOf('diff --git ', start + 1);
  const block = patch.slice(start, end === -1 ? undefined : end);
  const lines = fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n').split('\n');
  let offset = 0;
  for (const hunk of block.split(/^@@ /m).slice(1)) {
    const [header, ...body] = hunk.split('\n');
    const match = /^-(\d+)(?:,\d+)? \+\d+(?:,\d+)? @@/.exec(header)!;
    const removed = body.filter(s => s.startsWith(' ') || s.startsWith('-')).map(s => s.slice(1));
    const added = body.filter(s => s.startsWith(' ') || s.startsWith('+')).map(s => s.slice(1));
    const index = Number(match[1]) - 1 + offset;
    assert.deepEqual(lines.slice(index, index + removed.length), removed);
    lines.splice(index, removed.length, ...added); offset += added.length - removed.length;
  }
  return lines.join('\n');
}
function loadModule(source: string, requireFn = (_name: string): unknown => { throw new Error('unexpected runtime import'); }) {
  const exports: Record<string, (...args: never[]) => unknown> = {};
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  vm.runInNewContext(compiled.outputText, { exports, require: requireFn });
  return exports as Record<string, (...args: string[]) => unknown>;
}
const examples = JSON.parse(fs.readFileSync(path.join(dir, 'examples.json'), 'utf8'));
for (const r of Object.values(examples)) {
  const response = decodeStatisticsResponse(r, business);
  if (response.status === 'ready') verify(r as ProposedReadyResponse);
}
const invalid = (mutate: (r: ProposedReadyResponse) => void) => {
  const r = structuredClone(examples.complete) as ProposedReadyResponse; mutate(r);
  assert.throws(() => verify(r)); checks++;
};
invalid(r => { r.series.snapshot.revision = '43'; });
invalid(r => { r.series.points[1].key = r.series.points[0].key; });
invalid(r => { r.series.points[1].comparisons.sales.absolute = '999.00'; });
invalid(r => { r.series.points[1].current!.metrics.sales.value = null; });
invalid(r => { r.comparison.available = false; r.previousMetrics = null; });
invalid(r => { r.series.totalAlignment.available = false; r.series.totalAlignment.reason = 'duration_mismatch'; });
invalid(r => { r.series.points[1].mapping = { kind: 'date_offset', days: -1 }; });

const patch = fs.readFileSync(path.join(dir, 'navigation.proposed.patch'), 'utf8');
const permissionFile = 'lib/admin/permissions.ts';
const before = loadModule(fs.readFileSync(permissionFile, 'utf8'));
const after = loadModule(patched(permissionFile, patch));
const roles = ['owner','manager','admin','operator','viewer','super_admin'];
const permissions = ['viewOrders','updateOrders','manageNotifications','manageTeam','manageProducts','managePublicSettings'];
for (const role of roles) {
  for (const permission of permissions) {
    assert.equal(after.hasAdminPermission(role, permission), before.hasAdminPermission(role, permission)); checks++;
  }
  assert.equal(after.normalizeBusinessAdminRole(role), before.normalizeBusinessAdminRole(role)); checks++;
  assert.equal(JSON.stringify(after.getAdminPermissions(role)), JSON.stringify(before.getAdminPermissions(role))); checks++;
  assert.equal(after.hasAdminPermission(role, 'viewStatistics'), ['owner','manager','admin'].includes(role)); checks++;
}
const navFile = 'components/admin/admin-nav-config.ts';
const originalNav = loadModule(fs.readFileSync(navFile, 'utf8'), () => before);
const proposedNav = loadModule(patched(navFile, patch), () => after);
for (const role of roles) {
  const oldItems = originalNav.getAdminNavItemsForRole(role) as { href: string }[];
  const newItems = proposedNav.getAdminNavItemsForRole(role) as { href: string }[];
  assert.equal(JSON.stringify(newItems.filter(i => i.href !== '/admin/statistics')), JSON.stringify(oldItems)); checks++;
  assert.equal(newItems.some(i => i.href === '/admin/statistics'), ['owner','manager','admin'].includes(role)); checks++;
}
execFileSync('git', ['apply','--check',path.join(dir,'navigation.proposed.patch')], { cwd: root }); checks++;
const shared = [permissionFile,navFile,'components/admin/layout/admin-nav-list.tsx'];
const fingerprints = Object.fromEntries(shared.map(file => [file, {
  sha256: createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
  headBlob: execFileSync('git',['rev-parse',`HEAD:${file}`],{encoding:'utf8'}).trim(),
  cursorLocalBlob: execFileSync('git',['rev-parse',`cursor/commercial-core-v1-integration:${file}`],{encoding:'utf8'}).trim()
}]));
const evidence = {
  at: new Date().toISOString(), checks, result: 'PASS_OFFLINE_REVIEW_CHECKS', examples: Object.keys(examples),
  branch: execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),
  head: execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  shared: fingerprints, patch: 'git apply --check only; evaluated in memory',
  sql: 'design only; no parsing/compilation/application/runtime tests',
  databaseConnections: 0, limitation: 'This is a review-fixture checker, not the future production series decoder or temporal planner.'
};
fs.writeFileSync(path.join(dir,'verification.json'), JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify(evidence,null,2));
