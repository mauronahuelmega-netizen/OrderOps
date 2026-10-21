import fs from 'node:fs';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
const alphabet='23456789';const codes=new Set();
for(let n=1;n<=5000;n++){const code='P'+[4096,512,64,8,1].map(step=>alphabet[Math.floor(n/step)%8]).join('');assert.match(code,/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/);assert.ok(!codes.has(code));codes.add(code);}
for(const name of ['fixture','shapes-fixture']){const sql=fs.readFileSync(`scripts/statistics-v1/p03-f1-${name}.sql`,'utf8');assert.ok(!/\b(?:create|alter|drop|truncate|grant|revoke|vacuum|analyze)\b/i.test(sql));assert.ok(sql.includes('ISOLATED_TOKEN_REQUIRED'));assert.ok(sql.includes('md5(\'P03F1:synthetic:\''));}
const scripts=fs.readdirSync('scripts/statistics-v1').filter(p=>p.startsWith('p03-f1-')&&p.endsWith('.mjs'));
for(const script of scripts)assert.equal(spawnSync(process.execPath,['--check',`scripts/statistics-v1/${script}`]).status,0,script);
fs.writeFileSync('docs/estadisticas-v1/p03-f1/static-tests.json',JSON.stringify({at:new Date().toISOString(),result:'PASS',uniqueSixCharacterCodes:5000,fixturesNoDdl:true,syntaxScripts:scripts,connections:0},null,2));console.log('PASS synthetic codes, DML-only fixture guards and all diagnostic script syntax');
