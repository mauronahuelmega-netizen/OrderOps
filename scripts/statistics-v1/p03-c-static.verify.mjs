/** Static preservation evidence only; no database or Docker calls. */
import assert from 'node:assert/strict';
import { readFileSync,existsSync,writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const sha=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const git=(...args)=>{const r=spawnSync('git',args,{encoding:'utf8'});assert.equal(r.status,0);return r.stdout.trim();};
assert.equal(git('branch','--show-current'),'codex/estadisticas-v1');
assert.ok(git('rev-parse','--show-toplevel').replaceAll('\\','/').endsWith('/OrderOps-Estadisticas'));
const prior=JSON.parse(readFileSync('docs/estadisticas-v1/p03-b1/verification.json','utf8'));
const preserved=[...(prior.files??[]),...prior.preexistingChangesPreserved];
for(const {file,sha256} of preserved)assert.equal(sha(file),sha256,`Preexisting file changed: ${file}`);
const migration='supabase/migrations/20261013004000_statistics_v1_comparative_series.sql';
assert.equal(sha(migration),'b10c330adff70b803d9d25165f07830e90d4cd092aa4ba2cf3d0120a43f95219');
const sourceNames=['period','presenter','query','server','transport'];
const source=sourceNames.map(name=>readFileSync(`lib/statistics/summary-${name}.ts`,'utf8')).join('\n').replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,'');
assert.ok(!/\b(?:service.?role|setInterval|localStorage|normalizeBusinessAdminRole|readStatistics\()/i.test(source));
assert.ok(!/\.from\(['"](?:orders|order_items|order_financials)/.test(source));
assert.ok(readFileSync('lib/statistics/summary-server.ts','utf8').startsWith("import 'server-only';"));
const shared=git('ls-files').split(/\r?\n/).filter(f=>/(?:permissions\.ts|admin-nav-config\.ts|admin-nav-list\.tsx)$/.test(f));
assert.equal(shared.length,4); // Includes Commercial Core's permissions.ts as an additional protected surface.
git('diff','--exit-code','HEAD','--',...shared);
for(const file of shared){const r=spawnSync('git',['show',`HEAD:${file}`],{encoding:'utf8'});assert.equal(r.status,0);assert.equal(r.stdout.replaceAll('\r\n','\n'),readFileSync(file,'utf8').replaceAll('\r\n','\n'),`Shared navigation changed: ${file}`);}
const files=[...sourceNames.map(name=>`lib/statistics/summary-${name}.ts`),'lib/statistics/summary.verify.ts','lib/statistics/summary-isolated.verify.ts','scripts/statistics-v1/p03-c-eslint.config.mjs','scripts/statistics-v1/p03-c-static.verify.mjs','docs/estadisticas-v1/p03-c/informe.md','docs/estadisticas-v1/p03-c/examples.json','docs/estadisticas-v1/p03-c/empty-example.json','docs/estadisticas-v1/p03-c/pure-evidence.json','docs/estadisticas-v1/p03-c/isolated-evidence.json'];
for(const file of files)assert.ok(existsSync(file),`Missing deliverable: ${file}`);
writeFileSync('docs/estadisticas-v1/p03-c/verification.json',JSON.stringify({at:new Date().toISOString(),verdict:'PASS_WITH_LIMITATIONS',branch:git('branch','--show-current'),head:git('rev-parse','HEAD'),newCommits:0,files:files.map(file=>({file,sha256:sha(file)})),preserved,sharedUnchanged:shared.map(file=>({file,sha256:sha(file)})),migrationUnchanged:{file:migration,sha256:sha(migration)},tests:{pure:JSON.parse(readFileSync('docs/estadisticas-v1/p03-c/pure-evidence.json','utf8')),isolated:JSON.parse(readFileSync('docs/estadisticas-v1/p03-c/isolated-evidence.json','utf8')).assertions},stop:'P03-C only; await express P03-D/E authorization'},null,2)+'\n');
console.log(`PASS own P03-C static scope; ${preserved.length} prior files preserved; all three shared navigation files and installed migration unchanged.`);
