import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const out='docs/estadisticas-v1/p03-e1';fs.mkdirSync(out,{recursive:true});
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const git=(...args)=>execFileSync('git',['--no-optional-locks',...args],{encoding:'utf8'}).trim();
const shared=['lib/admin/permissions.ts','components/admin/admin-nav-config.ts','components/admin/layout/admin-nav-list.tsx'];
const owned=['lib/statistics/summary-route-server.ts','lib/statistics/summary-transport.ts'];
const expected=new Set([...shared,...owned,'scripts/statistics-v1/p03-e1-evidence.mjs']); // This tool was created before its own baseline.
const mode=process.argv[2];
if(mode==='baseline'){
 const prior=JSON.parse(fs.readFileSync('docs/estadisticas-v1/p03-e0/evidence.json','utf8'));
 assert.equal(git('branch','--show-current'),'codex/estadisticas-v1');assert.equal(git('rev-parse','HEAD'),prior.initial.own.head);
 for(const p of shared)assert.equal(sha(p),prior.baseHashes[p].own,`Changed base ${p}`);
 const files=git('ls-files','--cached','--others','--exclude-standard','-z').split('\0').filter(p=>p&&!p.startsWith(out+'/')&&fs.existsSync(p));
 fs.writeFileSync(`${out}/baseline.json`,JSON.stringify({head:git('rev-parse','HEAD'),branch:git('branch','--show-current'),status:git('status','--short'),files:Object.fromEntries(files.map(p=>[p,sha(p)])),sharedValidated:true},null,2));
 console.log('PASS branch, HEAD and all three exact P03-E.0 base hashes');
}else if(mode==='finish'){
 const baseline=JSON.parse(fs.readFileSync(`${out}/baseline.json`));
 const changes=[];for(const [p,h]of Object.entries(baseline.files)){if(sha(p)!==h){assert.ok(expected.has(p),`Unapproved change ${p}`);changes.push(p);}}
 for(const p of shared){const proposal=fs.readFileSync(`docs/estadisticas-v1/p03-e0/proposed/${p}.txt`,'utf8');assert.equal(fs.readFileSync(p,'utf8').replaceAll('\r\n','\n'),proposal.replaceAll('\r\n','\n'));}
 assert.equal(git('rev-parse','HEAD'),baseline.head);
 const files=git('ls-files','--cached','--others','--exclude-standard','-z').split('\0').filter(p=>p&&fs.existsSync(p));
 const added=files.filter(p=>!Object.hasOwn(baseline.files,p));
 const prior=JSON.parse(fs.readFileSync('docs/estadisticas-v1/p03-e0/preexisting-hashes.json','utf8'));
 const cursor=path.resolve('../OrderOps');const cursorDifferences=Object.entries(prior.cursor).filter(([p,h])=>!fs.existsSync(path.join(cursor,p))||sha(path.join(cursor,p))!==h).map(([p])=>p);
 const inventory=[...changes,...added].map(p=>({path:p,sha256:p===`${out}/preservation.json`?null:sha(p)})); // No self-referential digest.
 const qa=path.resolve('supabase/statistics-v1-test/.runtime/p03-e1-app');
 const qaFiles=[...shared,'lib/statistics/summary-principal.ts',...owned,'lib/statistics/summary-server.ts','app/admin/(protected)/statistics/page.tsx','app/admin/(protected)/statistics/query/route.ts'];
 for(const p of qaFiles)assert.equal(sha(p),sha(path.join(qa,p)),`QA source mismatch ${p}`);
 fs.writeFileSync(`${out}/preservation.json`,JSON.stringify({at:new Date().toISOString(),head:baseline.head,baselineFiles:Object.keys(baseline.files).length,approvedExistingChanges:changes,newFiles:added,inventory,cursorObservedDifferences:cursorDifferences,sharedPatchTextExact:true,qaSourceMatches:qaFiles,commits:0},null,2));
 console.log(`PASS preservation; ${changes.length} approved existing files changed`);
}else throw Error('baseline|finish');
