import fs from 'node:fs';
let source=fs.readFileSync('scripts/statistics-v1/p03-f1-diagnose.mjs','utf8')
 .replace('profileOnly?[200]:[50,100,200,500,1000,5000]','[100]')
 .replace('if(n===200 && nestedAvailable)','if(n===100 && nestedAvailable)')
 .replace('repeat<6','repeat<1')
 .replace('repeat<=3','repeat<=0'); // Warmups then one measured instrumented pair; no repeated heavy run.
fs.writeFileSync('scripts/statistics-v1/p03-f1-profile-diagnose.mjs',source);
console.log('Prepared bounded 100-order nested profiling only');
