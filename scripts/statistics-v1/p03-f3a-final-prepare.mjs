import fs from 'node:fs';
const s=fs.readFileSync('scripts/statistics-v1/p03-f3a-profile.mjs','utf8');
const head=s.slice(0,s.indexOf('const beforeGate=gate()'));
const full=s.slice(s.indexOf('const fullCatalog='),s.indexOf('\nconst previous='));
fs.writeFileSync('scripts/statistics-v1/p03-f3a-final.mjs',head+full+`
const baseline=JSON.parse(readFileSync(resolve(dir,'baseline.json'),'utf8'));
const isolation=gate(),catalog=fullCatalog();
for(const key of ['functions','policies','indexes','constraints','counts','profileFingerprint','ledger','deadlocks'])assert.deepEqual(catalog[key],baseline.catalog[key],key);
for(const [p,h]of Object.entries(baseline.files))assert.equal(sha(p),h,p);
writeFileSync(resolve(dir,'final-preservation.json'),JSON.stringify({at:new Date().toISOString(),isolation,catalogUnchanged:true,preexistingFileCount:Object.keys(baseline.files).length,preexistingFileHashesUnchanged:true,counts:catalog.counts,deadlocks:catalog.deadlocks,ledgerCount:catalog.ledger.length,candidateSha256:sha(migration),publicOriginalActive:true,policiesAndACLUnchanged:true,resources:resources()},null,2)+'\\n');
console.log('PASS final live identity, full catalog/ACL/policies/ledger/data/file preservation.');
`);
