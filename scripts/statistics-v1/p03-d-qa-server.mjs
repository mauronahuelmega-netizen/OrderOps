/** Own QA launcher: verify identity first, never load a foreign Supabase config or service key. */
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, openSync, closeSync, cpSync, mkdirSync, existsSync, symlinkSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import net from 'node:net';
const root=process.cwd(),runtime=resolve(root,'supabase/statistics-v1-test/.runtime');
for(const script of ['isolation-policy.verify.mjs','assert-isolated-target.mjs']) {
  const r=spawnSync(process.execPath,[resolve(root,'scripts/statistics-v1',script)],{encoding:'utf8',timeout:180000});assert.equal(r.status,0,'Isolation verification failed');
}
const m=JSON.parse(readFileSync(resolve(runtime,'manifest.json'),'utf8'));assert.equal(m.projectId,'orderops-statistics-v1-test-74718de66a41');
const r=spawnSync('supabase',['status','--workdir',runtime,'-o','json'],{encoding:'utf8',timeout:30000});assert.equal(r.status,0);
const config=JSON.parse(r.stdout);assert.equal(config.API_URL,'http://127.0.0.1:56321');assert.equal(new URL(config.DB_URL).port,'56322');
await new Promise((accept,reject)=>{const socket=net.createServer();socket.once('error',reject);socket.listen(3037,'127.0.0.1',()=>socket.close(accept));});
const env={...process.env,NEXT_PUBLIC_SUPABASE_URL:config.API_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY:config.ANON_KEY,SUPABASE_SERVICE_ROLE_KEY:'',NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY:'',WEB_PUSH_VAPID_PRIVATE_KEY:'',NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:''};
for(const name of Object.keys(env))if(/^(?:DATABASE_URL|PGHOST|PGPORT|PGUSER|PGPASSWORD|SUPABASE_ACCESS_TOKEN|SUPABASE_DB_PASSWORD)$/.test(name))delete env[name];
// A private source mirror keeps Next's lock, types, generated next-env and compilation away
// from the user's running dev server. It is not another checkout or a modified shared config.
const qa=resolve(runtime,'p03-d-app');mkdirSync(qa,{recursive:true});
for(const name of ['app','components','lib','types','public','next.config.ts','tsconfig.json','next-env.d.ts','package.json'])cpSync(resolve(root,name),resolve(qa,name),{recursive:true});
const modules=resolve(qa,'node_modules');if(!existsSync(modules))symlinkSync(resolve(root,'node_modules'),modules,'junction');assert.equal(realpathSync(modules),realpathSync(resolve(root,'node_modules')));
const log=openSync(resolve(runtime,'p03-d-next.local.log'),'w');
const child=spawn(process.execPath,[resolve(root,'node_modules/next/dist/bin/next'),'dev','--webpack','--hostname','127.0.0.1','--port','3037'],{cwd:qa,env,stdio:['ignore',log,log],windowsHide:true});closeSync(log);
writeFileSync('docs/estadisticas-v1/p03-d/qa-server.json',JSON.stringify({at:new Date().toISOString(),pid:child.pid,projectId:m.projectId,app:'http://127.0.0.1:3037',api:config.API_URL,db:'127.0.0.1:56322',serviceRole:false,identityVerifiedBeforeStart:true,sourceMirror:qa,originalDevServerUntouched:true},null,2)+'\n');
console.log('QA process started: application 127.0.0.1:3037; exclusive API 56321 / DB 56322; no service role.');
child.on('exit',code=>{console.log('QA stopped; original checkout generated files untouched.');process.exitCode=code??0;});
process.on('SIGINT',()=>{child.kill('SIGINT');});process.on('SIGTERM',()=>{child.kill('SIGTERM');});
