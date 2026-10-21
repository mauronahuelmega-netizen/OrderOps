import fs from 'node:fs';
const src=fs.readFileSync('scripts/statistics-v1/p03-f3c-benchmark.mjs','utf8');
let head=src.slice(0,src.indexOf("assert.equal(sha('docs/estadisticas-v1/p03-f3b"));
head=head.replace("const mode=process.argv[2];assert.ok(['profile','benchmark'].includes(mode));const profileOnly=mode==='profile';",'');
head=head.replace("'docs/estadisticas-v1/p03-f3c/'+mode","'docs/estadisticas-v1/p03-f4a'");
const full=src.slice(src.indexOf('const fullCatalog='),src.indexOf('\nconst previous='));
fs.writeFileSync('scripts/statistics-v1/p03-f4a-common.mjs',head+full+`
const d1File='docs/estadisticas-v1/p03-f3b/candidate-d1.sql',d1Hash='9e8b793df40de1aeb6ecbb71c1ce4e828c717498e62340341d8784726ee78070';
const extra=()=>JSON.parse(read(\`SELECT json_build_object('settings',(SELECT md5(string_agg(to_jsonb(t)::text,',' ORDER BY business_id)) FROM public.business_settings t),'state',(SELECT md5(string_agg(to_jsonb(t)::text,',' ORDER BY business_id)) FROM public.business_statistics_state t),'products',(SELECT count(*) FROM public.products),'categories',(SELECT count(*) FROM public.categories),'stock',(SELECT count(*) FROM public.stock_movements),'triggers',(SELECT json_agg(json_build_object('table',tgrelid::regclass::text,'name',tgname,'def',pg_get_triggerdef(oid)) ORDER BY tgrelid,tgname) FROM pg_trigger WHERE NOT tgisinternal))\`));
function verify(){
 assert.equal(sha(d1File),d1Hash);const isolation=gate(),catalog=fullCatalog();
 const previous=JSON.parse(readFileSync(resolve(root,'docs/estadisticas-v1/p03-f3c/installed-catalog.json'),'utf8')).catalog;
 for(const key of ['functions','policies','indexes','constraints','counts','profileFingerprint','ledger'])assert.deepEqual(catalog[key],previous[key],key);
 const previousExtra=JSON.parse(readFileSync(resolve(root,'docs/estadisticas-v1/p03-f3c/preservation.json'),'utf8')).extra;assert.deepEqual(extra(),previousExtra);
 for(const f of JSON.parse(readFileSync(resolve(root,'docs/estadisticas-v1/p03-f1/baseline.json'),'utf8')).migrations)assert.equal(sha(f.path),f.sha256);
 return {at:new Date().toISOString(),isolation,catalog,extra:previousExtra,resources:resources(),diagnosticCatalog:JSON.parse(read(catalogQuery))};
}
const save=(file,data)=>writeFileSync(resolve(dir,file),JSON.stringify(data,null,2)+'\\n');
export {root,dir,runtime,project,args,m,sha,sql,read,run,gate,fullCatalog,resources,extra,verify,save,d1Hash,d1File};
`);
