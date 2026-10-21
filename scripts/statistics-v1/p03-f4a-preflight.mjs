import fs from 'node:fs';import assert from 'node:assert/strict';import {verify,save,dir,run,sha,d1Hash} from './p03-f4a-common.mjs';
const state=verify(),branch=run('git',['branch','--show-current']),head=run('git',['rev-parse','HEAD']);
const paths=run('git',['--no-optional-locks','ls-files','--cached','--others','--exclude-standard','-z']).split('\0').filter(p=>p&&!p.startsWith('docs/estadisticas-v1/p03-f4a/')&&!p.startsWith('scripts/statistics-v1/p03-f4a-'));
const files=Object.fromEntries(paths.map(p=>[p,sha(p)]));
if(process.argv[2]==='finish'){
 const before=JSON.parse(fs.readFileSync(`${dir}/baseline.json`));assert.equal(head,before.head);assert.equal(branch,before.branch);for(const [p,h]of Object.entries(before.files))assert.equal(sha(p),h,p);assert.equal(state.catalog.deadlocks,before.catalog.deadlocks);
 save('preservation.json',{result:'PASS',...state,head,branch,preexistingFileCount:Object.keys(before.files).length,preexistingHashesUnchanged:true,candidateHash:d1Hash,publicOriginalActive:true,noDDL:true,noCommits:true});console.log('PASS final preservation.');
}else{assert.ok(!fs.existsSync(`${dir}/baseline.json`),'Do not overwrite baseline');save('baseline.json',{...state,branch,head,files,candidateHash:d1Hash,status:run('git',['--no-optional-locks','status','--short'])});console.log('PASS preflight: exact isolated identity,ledger124,original/AB/D1 catalog and source hashes.');}
