import fs from 'node:fs';import assert from 'node:assert/strict';
const dir='docs/estadisticas-v1/p03-f2b';
for(const name of ['security','differential','differential-products','differential-shapes','differential-temporal'])assert.equal(JSON.parse(fs.readFileSync(`${dir}/${name}.json`)).result,'PASS',`Gate ${name}`);
assert.equal(JSON.parse(fs.readFileSync(`${dir}/differential-temporal.json`)).actualResponseDecoders,'PASS');
let source=fs.readFileSync('scripts/statistics-v1/p03-f1-diagnose.mjs','utf8').replaceAll('p03-f1','p03-f2b-performance');
source=source.replaceAll('docs/estadisticas-v1/p03-f2b-performance','docs/estadisticas-v1/p03-f2b/benchmark').replace('scripts/statistics-v1/p03-f2b-performance-fixture.sql','scripts/statistics-v1/p03-f1-fixture.sql');
source=source.replace("const legacy=\"private.statistics_v1_summary_base('today')\",extended=\"public.statistics_v1_summary('today')\";","const legacy=\"public.statistics_v1_summary('today')\",extended=\"private.statistics_v1_summary_candidate('today')\";");
source=source.replaceAll('repeat<6','repeat<21').replaceAll('repeat<=3','repeat<=0').replaceAll('[1-5]','(?:[1-9]|1[0-9]|20)').replace('samplesPerMode:5','samplesPerMode:20');
source=source.replace("SELECT count(*) FROM supabase_migrations.schema_migrations\"),'123'", "SELECT count(*) FROM supabase_migrations.schema_migrations\"),'124'");
source=source.replaceAll("['legacy',legacy]","['original',legacy]").replaceAll("['extended',extended]","['candidate',extended]");
source=source.replace("const records=[];", "const candidateFile='supabase/migrations/20261013005000_statistics_v1_read_core_candidate.sql';assert.equal(sha(candidateFile),'fd88de8c0ec3f4a87d8a6782650d63cf4779d8170033a4c5b4f37edbd489faf9');const records=[];");
// Report progress without changing or filtering any measurement.
source=source.replace("child.stdout.on('data',x=>{stdout+=x;});","child.stdout.on('data',x=>{stdout+=x;for(const match of String(x).matchAll(/MEASURE:(?:original|candidate):(5|10|15|20)\\r?\\n/g))console.log('Volume '+n+' measured repeat '+match[1]);});");
fs.writeFileSync('scripts/statistics-v1/p03-f2b-benchmark.mjs',source);
console.log('PASS gates; prepared serial 20-sample original/candidate comparison, 15s timeout unchanged');
