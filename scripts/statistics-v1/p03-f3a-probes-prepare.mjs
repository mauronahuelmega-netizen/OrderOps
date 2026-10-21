import fs from 'node:fs';
const s=fs.readFileSync('scripts/statistics-v1/p03-f3a-profile.mjs','utf8');
const header=s.slice(0,s.indexOf('const beforeGate=gate()'));
const parser=s.slice(s.indexOf('function parseMeasurements'),s.indexOf('async function sample'));
const tail=`
const prior=JSON.parse(readFileSync(resolve(dir,'baseline.json'),'utf8'));
for(const [p,h]of Object.entries(prior.files))assert.equal(sha(p),h,p);
const isolation=gate(),before=JSON.parse(read(catalogQuery)),resourceBefore=resources();
assert.ok(Object.values(before.counts).every(x=>x===0));
assert.ok(Number.parseFloat(resourceBefore.dbStats.CPUPerc)<=35 && Number.parseFloat(resourceBefore.dbStats.MemPerc)<=40);
${parser}
let body=\`SET statistics.test_token='\${m.token}';\`+readFileSync(resolve(root,'scripts/statistics-v1/p03-f1-fixture.sql'),'utf8').replaceAll('__N__','100');
body+=\`SET LOCAL statement_timeout='15s';SET LOCAL ROLE authenticated;
SELECT set_config('statistics.f3a.probe_bundle',private.statistics_v1_read_core_candidate('today')::text,true) IS NOT NULL;
\`;
const facts=\`jsonb_populate_recordset(null::public.statistics_v1_effective_facts,current_setting('statistics.f3a.probe_bundle')::jsonb->'effectiveFacts')\`;
const probes={
 historical:\`SELECT count(*) FROM public.orders o WHERE o.business_id=(SELECT business_id FROM public.profiles WHERE id=auth.uid()) AND o.status='completed' AND NOT EXISTS(SELECT 1 FROM public.order_statistics_completions c WHERE c.order_id=o.id AND c.active AND c.commercial_date IS NOT NULL AND c.timezone IS NOT NULL AND NOT c.date_conflict)\`,
 jsonRoundtrip:\`SELECT count(*),sum(effective_sales),sum(effective_units) FROM \${facts} f\`,
 jsonReaggregate:\`SELECT jsonb_agg(to_jsonb(f)) FROM \${facts} f\`
};
for(let i=0;i<6;i++)for(const [name,q]of Object.entries(probes))body+=\`SELECT 'MEASURE:\${name}:\${i===0?'warmup':i}';EXPLAIN(ANALYZE,BUFFERS,SETTINGS,FORMAT JSON) \${q};\\n\`;
body+='RESET ROLE;ROLLBACK;';
const result=sql(body);assert.ok(result.trim().endsWith('ROLLBACK'));
const after=JSON.parse(read(catalogQuery));for(const key of ['functions','indexes','counts','deadlocks'])assert.deepEqual(after[key],before[key]);
for(const [p,h]of Object.entries(prior.files))assert.equal(sha(p),h,p);
writeFileSync(resolve(dir,'component-probes.json'),JSON.stringify({isolation,orders:100,resourceBefore,resourceAfter:resources(),measurements:parseMeasurements(result),rollback:true,catalogUnchanged:true,method:'Controlled SELECT probes. JSON reads transaction-local GUC populated from an authorized candidate core; GUC string parsing is included. Historical count has scalar authenticated-profile parameter; planner can differ from PL/pgSQL cached query. No change to installed SQL or persistent settings.'},null,2)+'\\n');
console.log('PASS controlled component SELECT probes, rollback and preservation verified.');
`;
fs.writeFileSync('scripts/statistics-v1/p03-f3a-probes.mjs',header+tail);
