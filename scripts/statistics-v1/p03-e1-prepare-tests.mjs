// Reuse accepted suites without overwriting their historical evidence or source.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
const runtime=resolve('supabase/statistics-v1-test/.runtime/p03-e1-pure');mkdirSync(runtime,{recursive:true});
mkdirSync('docs/estadisticas-v1/p03-e1/regression/fixtures',{recursive:true});
for(const phase of ['p03-a','p03-a-corrective','p03-c','p03-d'])mkdirSync(`docs/estadisticas-v1/p03-e1/regression/${phase}`,{recursive:true});
for(const name of ['domain','read','series','series-sizing','summary','summary-ui']){
 const source=readFileSync(`lib/statistics/${name}.verify.ts`,'utf8')
  .replace(/from '(\.\/[^']+)'/g,(_,p)=>`from '${resolve('lib/statistics',p).replaceAll('\\','/')}'`)
  .replaceAll('docs/estadisticas-v1/p03-c','docs/estadisticas-v1/p03-e1/regression/p03-c')
  .replaceAll('docs/estadisticas-v1/p03-d','docs/estadisticas-v1/p03-e1/regression/p03-d')
  .replaceAll('docs/estadisticas-v1/p03-a','docs/estadisticas-v1/p03-e1/regression/p03-a')
  .replaceAll("writeFileSync('lib/statistics/fixtures/p03-d-responses.json'","writeFileSync('docs/estadisticas-v1/p03-e1/regression/fixtures/p03-d-responses.json'");
 writeFileSync(resolve(runtime,`${name}.verify.ts`),source);
}
for(const name of ['qa-server','e2e','auth-session']){
 if(existsSync(`scripts/statistics-v1/p03-e1-${name}.mjs`))continue;
 const source=readFileSync(`scripts/statistics-v1/p03-d-${name}.mjs`,'utf8').replaceAll('p03-d','p03-e1').replaceAll('P03-D','P03-E.1').replaceAll('lib/statistics/fixtures/p03-e1-responses.json','lib/statistics/fixtures/p03-d-responses.json');
 writeFileSync(`scripts/statistics-v1/p03-e1-${name}.mjs`,source);
}
console.log('Prepared isolated copies; historical evidence remains untouched');
