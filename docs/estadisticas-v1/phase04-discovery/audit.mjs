// Documentation-only audit: own worktree/ref blobs, no DB, Cursor filesystem, build or services.
import fs from 'node:fs';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
const dir='docs/estadisticas-v1/phase04-discovery/';
const sha=b=>createHash('sha256').update(b).digest('hex');
const git=(...args)=>{const r=spawnSync('git',['--no-optional-locks',...args],{encoding:'utf8',maxBuffer:16*1024*1024});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
const targets=['docs/estadisticas-v1/PERFORMANCE_DEBT.md','docs/estadisticas-v1/FUNCTIONAL_READINESS.md','docs/estadisticas-v1/PHASE04_IMPLEMENTATION_PLAN.md','docs/estadisticas-v1/PHASE04_DATA_CONTRACT_AUDIT.md','docs/estadisticas-v1/PROGRESS.md'];
const memory='ORDEROPS_LIVING_MEMORY.md';
fs.mkdirSync(dir,{recursive:true});
if(process.argv[2]==='baseline'){
 const files=git('ls-files','--cached','--others','--exclude-standard','-z').split('\0').filter(p=>p&&!p.startsWith(dir)&&!targets.includes(p)&&p!==memory);
 const before=Object.fromEntries(files.map(p=>[p,sha(fs.readFileSync(p))]));
 const memoryBytes=fs.readFileSync(memory);fs.writeFileSync(dir+'memory-before.bin',memoryBytes);
 const spec='.codex-remote-attachments/01a13159-9e39-7e72-b660-fea44fad1d6c/c7b8a383-3522-40bc-bbbf-18c29210764a/1-ORDEROPS_ESTADISTICAS_V1_PHASE04_PRODUCTOS_SPEC-1.md';
 const specText=fs.readFileSync(spec,'utf8');assert.ok(specText.includes('Fin de especificación'));assert.ok(specText.includes('No reservar espacio vacío'));
 const tracked=git('ls-files','-z').split('\0').filter(Boolean),untracked=git('ls-files','--others','--exclude-standard','-z').split('\0').filter(Boolean);
 const cursorRef='cursor/commercial-core-v1-integration';
 const common=['lib/admin/permissions.ts','components/admin/admin-nav-config.ts','components/admin/layout/admin-nav-list.tsx','lib/admin/context.ts','lib/supabase/server.ts','package.json','package-lock.json','middleware.ts'];
 const comparisons=common.map(p=>{const blob=git('show',cursorRef+':'+p),own=fs.readFileSync(p,'utf8');return {path:p,ownSha256:sha(fs.readFileSync(p)),cursorCommittedTextSha256:sha(blob),textEqualsIgnoringLineEndings:own.replaceAll('\r\n','\n').trim()===blob.replaceAll('\r\n','\n'),scope:'Committed Cursor ref only, current Cursor worktree not inspected'};});
 const migrations=fs.readdirSync('supabase/migrations').filter(p=>p.endsWith('.sql')).map(p=>({name:p,version:p.split('_')[0],sha256:sha(fs.readFileSync('supabase/migrations/'+p)),tracked:tracked.includes('supabase/migrations/'+p)}));
 const prior=JSON.parse(fs.readFileSync('docs/estadisticas-v1/p03-f4c/preservation.json'));
 fs.writeFileSync(dir+'baseline.json',JSON.stringify({at:new Date().toISOString(),branch:git('branch','--show-current'),head:git('rev-parse','HEAD'),status:git('status','--porcelain=v1','--untracked-files=all'),trackedFiles:tracked,untrackedFiles:untracked,preexistingHashes:before,memoryBeforeSha256:sha(memoryBytes),spec:{path:spec,sha256:sha(fs.readFileSync(spec)),lines:specText.split('\n').length,readThroughEnd:true},cursor:{ref:cursorRef,head:git('rev-parse',cursorRef),comparedOnlyCommittedRef:true,comparisons,changesSinceOwnHEAD:git('diff','--name-only','HEAD',cursorRef,'--',...common,'supabase/migrations').split('\n').filter(Boolean)},migrations,lastRecordedLive:{source:'docs/estadisticas-v1/p03-f4c/preservation.json',at:prior.at,ledger:prior.ledger,candidateCAbsent:prior.cNotInstalled,scope:'Recorded; no live DB connection in this audit'}},null,2)+'\n');
 console.log('Offline baseline captured.');
}else{
 const baseline=JSON.parse(fs.readFileSync(dir+'baseline.json'));
 for(const[p,h]of Object.entries(baseline.preexistingHashes))assert.equal(sha(fs.readFileSync(p)),h,p);
 const old=fs.readFileSync(dir+'memory-before.bin'),current=fs.readFileSync(memory);assert.ok(current.subarray(0,old.length).equals(old),'Memory historical bytes preserved');
 assert.equal(git('rev-parse','HEAD'),baseline.head);assert.equal(git('branch','--show-current'),baseline.branch);
 const output=targets.concat(memory);for(const p of output)assert.ok(fs.existsSync(p));
 const e1=JSON.parse(fs.readFileSync('docs/estadisticas-v1/p03-e1/preservation.json'));
 const evidenceMatch=e1.inventory.filter(x=>x.path.startsWith('lib/statistics/')||x.path.startsWith('components/admin/statistics/')||x.path.startsWith('app/admin/')).map(x=>({path:x.path,currentMatchesRecorded:fs.existsSync(x.path)&&sha(fs.readFileSync(x.path))===x.sha256}));
 const artifacts=[];function walk(p){for(const d of fs.readdirSync(p,{withFileTypes:true})){const f=p+d.name;if(d.isDirectory())walk(f+'/');else if(!f.endsWith('evidence.json'))artifacts.push({path:f,sha256:sha(fs.readFileSync(f))});}}walk(dir);
 fs.writeFileSync(dir+'evidence.json',JSON.stringify({at:new Date().toISOString(),verdict:'BLOCKED',branch:baseline.branch,head:baseline.head,preservation:{preexistingFileCount:Object.keys(baseline.preexistingHashes).length,hashesUnchanged:true,memoryHistoricalBytesPreserved:true,memoryChange:'Append-only authorized decision note'},appEvidenceMatch:evidenceMatch,currentVerification:{typecheck:'PASS: node node_modules/typescript/bin/tsc --noEmit --incremental false',lint:'PASS: P03-E1 ESLint config and seven security/nav files; no fix',newE2E:'NOT_EXECUTED',productionBuild:'NOT_EXECUTED',databaseConnections:0},noImplementation:true,noSQL:true,noCommits:true,inventory:output.map(p=>({path:p,sha256:sha(fs.readFileSync(p)),kind:p===memory?'modified-append-only':'created'})).concat(artifacts),inventoryExcludesSelf:true},null,2)+'\n');
 console.log('Preservation PASS; documentation evidence written.');
}
