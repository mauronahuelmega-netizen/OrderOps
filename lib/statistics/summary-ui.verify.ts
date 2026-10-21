import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import fixtures from './fixtures/series-responses.json';
import { decodeStatisticsSeriesResponse } from './series-read';
import { cents,decimal } from './money';
import { presentStatisticsSummary } from './summary-presenter';
import { summaryChartGeometry } from './summary-chart';

// Test-only monetary stress fixture. This generator is never imported by the application.
const long=structuredClone(fixtures.complete);
const factor=BigInt('1000000000000000');
const scale=(v:string|null)=>v===null?null:decimal(cents(v)*factor);
const metrics=(m:{sales:{value:string|null};averageTicket:{value:string|null}})=>{m.sales.value=scale(m.sales.value);m.averageTicket.value=scale(m.averageTicket.value);};
metrics(long.metrics);metrics(long.previousMetrics);for(const b of long.buckets)metrics(b.metrics);
for(const key of ['sales','averageTicket'] as const)long.series.totalComparisons[key].absolute=scale(long.series.totalComparisons[key].absolute)!;
for(const point of long.series.points){if(point.current)metrics(point.current.metrics);if(point.previous)metrics(point.previous.metrics);for(const key of ['sales','averageTicket'] as const)point.comparisons[key].absolute=scale(point.comparisons[key].absolute)!;}
for(const p of long.products.items)p.netAmount=scale(p.netAmount)!;for(const c of long.categories)c.amount=scale(c.amount)!;
const decoded=decodeStatisticsSeriesResponse(long,long.businessId);if(decoded.status!=='ready')throw new Error('Fixture invalid');
const view=presentStatisticsSummary(decoded);
assert.equal(view.kpis[0].valueText,'$ 200.000.000.000.000.000');
const chart=summaryChartGeometry(view.series,true);
assert.ok(chart.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.currentY)&&Number.isFinite(p.previousY)));
assert.equal(chart.currentPath.includes('NaN'),false);
assert.deepEqual(chart.points.map(p=>p.key),view.series.map(p=>p.key));
const gap=structuredClone(view.series);gap[0].current!.metric.exactValue=null;
assert.equal(summaryChartGeometry(gap,true).points[0].currentY,null);
assert.ok(summaryChartGeometry(gap,true).currentPath.trim().startsWith('M'));
const zero=structuredClone(view.series);for(const p of zero){if(p.current)p.current.metric.exactValue='0.00';if(p.previous)p.previous.metric.exactValue='0.00';}
assert.ok(summaryChartGeometry(zero,true).points.every(p=>p.currentY===238));
writeFileSync('lib/statistics/fixtures/p03-d-responses.json',JSON.stringify({long_amount:long},null,2)+'\n');
writeFileSync('docs/estadisticas-v1/p03-d/pure-ui.json',JSON.stringify({result:'PASS',assertions:7,scope:'Strict long-amount fixture, exact text, bounded finite SVG geometry, explicit point keys, null gaps, known zero',databaseConnections:0},null,2)+'\n');
console.log('PASS 7 P03-D chart/fixture assertions; no DB/API connections.');
