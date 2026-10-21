import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
const dir='docs/estadisticas-v1/p03-f1';fs.mkdirSync(dir,{recursive:true});
const git=(...args)=>execFileSync('git',['--no-optional-locks',...args],{encoding:'utf8'}).trim();
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const files=()=>git('ls-files','--cached','--others','--exclude-standard','-z').split('\0').filter(p=>p&&fs.existsSync(p));
const mode=process.argv[2];
if(mode==='baseline'){
 assert.equal(git('branch','--show-current'),'codex/estadisticas-v1');
 const prior=files().filter(p=>!p.startsWith(dir+'/')&&!p.startsWith('scripts/statistics-v1/p03-f1-'));
 const migrations=prior.filter(p=>/^supabase\/migrations\/20261013/.test(p)).map(p=>({path:p,sha256:sha(p)}));
 fs.writeFileSync(`${dir}/baseline.json`,JSON.stringify({at:new Date().toISOString(),head:git('rev-parse','HEAD'),branch:git('branch','--show-current'),status:git('status','--short'),files:Object.fromEntries(prior.map(p=>[p,sha(p)])),migrations,live:null},null,2));console.log(`PASS baseline ${prior.length} preexisting files`);
}else if(mode==='finish'){
 const b=JSON.parse(fs.readFileSync(`${dir}/baseline.json`));for(const [p,h]of Object.entries(b.files))assert.equal(sha(p),h,`Preexisting changed ${p}`);assert.equal(git('rev-parse','HEAD'),b.head);
 const own=files().filter(p=>p.startsWith(dir+'/')||p.startsWith('scripts/statistics-v1/p03-f1-')).filter(p=>p!==`${dir}/evidence.json`);
 const before=JSON.parse(fs.readFileSync(`${dir}/before.json`)),after=JSON.parse(fs.readFileSync(`${dir}/after.json`));
 assert.deepEqual(before.catalog.functions,after.catalog.functions);assert.deepEqual(before.catalog.indexes,after.catalog.indexes);assert.deepEqual(before.catalog.counts,after.catalog.counts);
 b.live={isolation:before.isolation,settings:before.catalog.settings,indexes:before.catalog.indexes,plannerStatistics:before.catalog.plannerStatistics,columnStatistics:before.catalog.columnStatistics,counts:before.catalog.counts,resources:before.resources};fs.writeFileSync(`${dir}/baseline.json`,JSON.stringify(b,null,2));
 fs.writeFileSync(`${dir}/evidence.json`,JSON.stringify({at:new Date().toISOString(),head:b.head,preservedFiles:Object.keys(b.files).length,preexistingPreserved:true,functionsAndIndexesUnchanged:true,countsUnchanged:true,before:before.isolation,after:after.isolation,inventory:own.map(p=>({path:p,sha256:sha(p)})),writes:'Synthetic INSERT/UPDATE in isolated transactions followed by rollback; no DDL, grants, migrations, persistent functions or indexes; no commits'},null,2));console.log('PASS files/catalog/counts preserved');
}else throw Error('baseline|finish');
