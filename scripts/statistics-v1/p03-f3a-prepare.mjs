// Generate an independent diagnostic; do not overwrite previous evidence or installed SQL.
import fs from 'node:fs';
let s=fs.readFileSync('scripts/statistics-v1/p03-f1-profile-diagnose.mjs','utf8');
s=s.replace("const profileOnly=process.argv[2]==='profile';","const profileOnly=true;");
s=s.replace("profileOnly?'docs/estadisticas-v1/p03-f1/profile':'docs/estadisticas-v1/p03-f1'","'docs/estadisticas-v1/p03-f3a'");
s=s.replaceAll('p03-f1-${n}', 'p03-f3a-${n}');
s=s.replace("hash='b10c330adff70b803d9d25165f07830e90d4cd092aa4ba2cf3d0120a43f95219'","hash='fd88de8c0ec3f4a87d8a6782650d63cf4779d8170033a4c5b4f37edbd489faf9'");
s=s.replaceAll('20261013004000_statistics_v1_comparative_series.sql','20261013005000_statistics_v1_read_core_candidate.sql').replaceAll("'20261013004000'","'20261013005000'").replace("),'123');", "),'124');");
const old=fs.readFileSync('scripts/statistics-v1/p03-f2b-validate.mjs','utf8');
const full=old.slice(old.indexOf('const catalog=()=>read(`'),old.indexOf('\nconst originals='));
const guards=`
${full.replace('const catalog=()=>read(', 'const fullCatalog=()=>JSON.parse(read(').replace(/`\);$/, '`));')}
const previous=JSON.parse(readFileSync(resolve(root,'docs/estadisticas-v1/p03-f2b/installed-catalog.json'),'utf8')).catalog;
const beforeFull=fullCatalog();
for(const key of ['functions','policies','indexes','constraints','counts','profileFingerprint','ledger'])assert.deepEqual(beforeFull[key],previous[key],key);
assert.equal(beforeFull.ledger.length,124);
const originalFiles=JSON.parse(readFileSync(resolve(root,'docs/estadisticas-v1/p03-f1/baseline.json'),'utf8')).migrations;
for(const f of originalFiles)assert.equal(sha(f.path),f.sha256);
const fileList=run('git',['--no-optional-locks','ls-files','--cached','--others','--exclude-standard','-z']).split('\\0').filter(p=>p&&!p.startsWith('docs/estadisticas-v1/p03-f3a/')&&!p.startsWith('scripts/statistics-v1/p03-f3a-'));
const files=Object.fromEntries(fileList.map(p=>[p,sha(p)]));
writeFileSync(resolve(dir,'baseline.json'),JSON.stringify({at:new Date().toISOString(),branch:run('git',['branch','--show-current']),head:run('git',['rev-parse','HEAD']),status:run('git',['--no-optional-locks','status','--short']),isolation:beforeGate,catalog:beforeFull,diagnosticCatalog:before,files,candidateSha256:hash},null,2)+'\\n');
`;
s=s.replace("writeFileSync(resolve(dir,'before.json')", guards+"\nwriteFileSync(resolve(dir,'before.json')");
s=s.replace('const legacy="private.statistics_v1_summary_base(\'today\')",extended="public.statistics_v1_summary(\'today\')";', 'const legacy="public.statistics_v1_summary(\'today\')",extended="private.statistics_v1_summary_candidate(\'today\')";');
s=s.replace('repeat<1','repeat<6');
s=s.replace('if(n===100 && nestedAvailable)','if(nestedAvailable)');
s=s.replace('for(const n of [100])','for(const n of [50,100])');
s=s.replace('return Math.max(...defaultSamples.map(x=>x.executionMs))<5000;', 'return defaultSamples.length===10 && Math.max(...item.measurements.map(x=>x.executionMs))<5000;');
s=s.replace("const afterGate=gate()", `const afterFull=fullCatalog();for(const key of ['functions','policies','indexes','constraints','counts','profileFingerprint','ledger','deadlocks'])assert.deepEqual(afterFull[key],beforeFull[key],key);for(const [p,h]of Object.entries(files))assert.equal(sha(p),h,p);writeFileSync(resolve(dir,'preservation.json'),JSON.stringify({at:new Date().toISOString(),catalogUnchanged:true,preexistingFilesUnchanged:Object.keys(files).length,fixturesAbsent:true,publicOriginalActive:true,ledgerCount:afterFull.ledger.length},null,2)+'\\n');\nconst afterGate=gate()`);
fs.writeFileSync('scripts/statistics-v1/p03-f3a-profile.mjs',s);
console.log('Prepared independent F3A diagnostic. No database calls.');
