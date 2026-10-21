// Generates only an owned diagnostic script. No SQL execution or source modifications.
import fs from 'node:fs';
import assert from 'node:assert/strict';
fs.mkdirSync('docs/estadisticas-v1/p03-f1/plans',{recursive:true});
let source=fs.readFileSync('scripts/statistics-v1/p03-b1-diagnose.mjs','utf8').replaceAll('p03-b1','p03-f1').replaceAll('P03-B.1','P03-F.1');
source=source.replace("const fixture=readFileSync(resolve(root,'supabase/tests/statistics-v1/p03-b-performance.sql'),'utf8').split('set local role authenticated;')[0];","const fixture=readFileSync(resolve(root,'scripts/statistics-v1/p03-f1-fixture.sql'),'utf8');");
source=source.replaceAll('repeat<4','repeat<6').replaceAll('[1-3]','[1-5]').replaceAll('samplesPerMode:3','samplesPerMode:5');
source=source.replace('profileOnly?[200]:[50,200,500,1000]','profileOnly?[200]:[50,100,200,500,1000,5000]');
source=source.replace("fixture.replaceAll('generate_series(1,200)','generate_series(1,'+n+')').replaceAll('count(*)=200','count(*)='+n)","fixture.replaceAll('__N__',String(n))");
source=source.replace('if(cpu>50 || memory>60)','if(cpu>35 || memory>40)').replace('<10000','<5000');
source=source.replace("'track_functions','shared_preload_libraries'","'track_functions','shared_preload_libraries','effective_cache_size','random_page_cost','seq_page_cost','default_statistics_target','max_connections'");
source=source.replace("'deadlocks',(SELECT deadlocks", "'plannerStatistics',(SELECT json_agg(row_to_json(s)) FROM pg_stat_all_tables s WHERE schemaname='public' AND relname IN ('orders','order_items','order_financials','order_statistics_completions','order_statistics_completion_items','order_item_statistics_snapshots')),'columnStatistics',(SELECT json_agg(json_build_object('table',tablename,'column',attname,'nullFrac',null_frac,'distinct',n_distinct)) FROM pg_stats WHERE schemaname='public' AND tablename IN ('orders','order_items','order_financials','order_statistics_completions')),'deadlocks',(SELECT deadlocks");
assert.ok(!/create\s+(?:temporary|temp|function)/i.test(fs.readFileSync('scripts/statistics-v1/p03-f1-fixture.sql','utf8')));
fs.writeFileSync('scripts/statistics-v1/p03-f1-diagnose.mjs',source);
console.log('Prepared serial diagnostic, five measured repeats, no fixture DDL');
