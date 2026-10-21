// Invokes the exact approved runner once; contains no SQL, Docker calls or retry.
// Child stdout/stderr kept in memory; only expected sanitized summary retained.
import fs from 'node:fs';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
const d='docs/estadisticas-v1/p04-t01c-readonly-validation-20261016/';const source='docs/estadisticas-v1/p04-t01c-focused-preflight-20261016/';
const pins=JSON.parse(fs.readFileSync(d+'authorization-pins.json'));const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(const [name,h]of Object.entries(pins.approved))assert.equal(sha(source+name),h);
assert.ok(!fs.existsSync(source+'sql-readonly-observed.json'),'Existing result prohibits another run');
const file=d+'execution-envelope.json';const fd=fs.openSync(file,'wx');
const intent={startedUtc:new Date().toISOString(),invocations:1,runner:source+'readonly-verification.proposed.mjs',approvedHashes:pins.approved,mode:'--execute-readonly',state:'INTENT_RECORDED_NO_AUTOMATIC_RETRY',sqlProcessLimitsUnchanged:{statementMs:15000,lockMs:3000,processMs:90000}};
fs.writeSync(fd,JSON.stringify(intent,null,2)+'\n');fs.fsyncSync(fd);fs.closeSync(fd);
const r=spawnSync(process.execPath,[intent.runner,intent.mode],{encoding:'utf8',windowsHide:true,maxBuffer:2e6});
let summary=null;try{const parsed=JSON.parse(r.stdout.trim());if(Object.keys(parsed).every(k=>['status','rollbackObserved','sqlStates','referenceUpdates'].includes(k)))summary=parsed;}catch{}
const result={...intent,endedUtc:new Date().toISOString(),exitCode:r.status,signal:r.signal??null,clientErrorCode:r.error?.code??null,summary,state:r.status===0&&summary?.status==='PASS_READONLY_INTEGRITY'?'PASS_SINGLE_APPROVED_RUN':'BLOCKED_NO_RETRY',rawChildOutputPersisted:false,observedFileExists:fs.existsSync(source+'sql-readonly-observed.json')};
if(result.observedFileExists)result.observedFileSha256=sha(source+'sql-readonly-observed.json');
fs.writeFileSync(file,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({state:result.state,exitCode:result.exitCode,summary,observedFileExists:result.observedFileExists,invocations:1}));
if(result.state!=='PASS_SINGLE_APPROVED_RUN')process.exitCode=1;
