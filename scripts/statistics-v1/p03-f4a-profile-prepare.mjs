import fs from 'node:fs';
let s=fs.readFileSync('scripts/statistics-v1/p03-f3c-benchmark.mjs','utf8');
s=s.replace("const mode=process.argv[2];assert.ok(['profile','benchmark'].includes(mode));const profileOnly=mode==='profile';","const mode='profile';const profileOnly=true;");
s=s.replace("'docs/estadisticas-v1/p03-f3c/'+mode","'docs/estadisticas-v1/p03-f4a/profile'");
s=s.replace("!p.startsWith('docs/estadisticas-v1/p03-f3c/')&&!p.startsWith('scripts/statistics-v1/p03-f3c-')","!p.startsWith('docs/estadisticas-v1/p03-f4a/')&&!p.startsWith('scripts/statistics-v1/p03-f4a-')");
s=s.replaceAll('p03-f3c-${mode}-${n}','p03-f4a-profile-${n}').replaceAll('p03-f3a-${n}','p03-f4a-profile-${n}');
s=s.replace("fixture.replaceAll('__N__',String(n))","fixture.replaceAll('__N__',String(n)).replace(\"statement_timeout='30s'\",\"statement_timeout='15s'\")");
s=s.replace('for(const n of [50,100])','for(const n of [50])');
fs.writeFileSync('scripts/statistics-v1/p03-f4a-profile.mjs',s);
