import fs from 'node:fs';
const src=fs.readFileSync('scripts/statistics-v1/p03-f3a-profile.mjs','utf8');
let head=src.slice(0,src.indexOf('const beforeGate=gate()')).replaceAll('docs/estadisticas-v1/p03-f3a','docs/estadisticas-v1/p03-f3c');
head=head.replace('throw new Error(`${bin} diagnostic command failed`);','throw Object.assign(new Error(`${bin} diagnostic command failed`),{stderr:r.stderr,stdout:r.stdout});');
const full=src.slice(src.indexOf('const fullCatalog='),src.indexOf('\nconst previous='));
const tail=fs.readFileSync('scripts/statistics-v1/p03-f3c-runner.fragment.txt','utf8');
fs.writeFileSync('scripts/statistics-v1/p03-f3c-validate.mjs',head+full+tail);
