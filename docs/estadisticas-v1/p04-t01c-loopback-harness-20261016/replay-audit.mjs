// Offline inspection of sealed payloads only. No shell scripts from containers are executed.
import fs from 'node:fs';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {createDecipheriv} from 'node:crypto';
import {PROJECT,sha} from './policy.mjs';
const out='docs/estadisticas-v1/p04-t01c-loopback-harness-20261016/';
try {
const report=JSON.parse(fs.readFileSync(out+'dry-run.json'));assert.ok(report.privateBundle.path.startsWith('supabase/statistics-v1-test/.runtime/loopback-bundles/'));
const bytes=fs.readFileSync(report.privateBundle.path);assert.equal(sha(bytes),report.privateBundle.sha256);const sealed=JSON.parse(bytes);
const ps="Add-Type -AssemblyName System.Security; $v=[Convert]::FromBase64String([Console]::In.ReadToEnd()); [Convert]::ToBase64String([Security.Cryptography.ProtectedData]::Unprotect($v,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser))";
const r=spawnSync('powershell.exe',['-NoLogo','-NoProfile','-NonInteractive','-Command',ps],{encoding:'utf8',input:sealed.protectedKey,windowsHide:true,timeout:15000});assert.equal(r.status,0);
const key=Buffer.from(r.stdout.trim(),'base64');const dec=createDecipheriv('aes-256-gcm',key,Buffer.from(sealed.iv,'base64'));dec.setAAD(Buffer.from(PROJECT+':'+sealed.runId));dec.setAuthTag(Buffer.from(sealed.tag,'base64'));
const payload=JSON.parse(Buffer.concat([dec.update(Buffer.from(sealed.ciphertext,'base64')),dec.final()]));key.fill(0);
function regularData(tar){let off=0;while(off+512<=tar.length){const h=tar.subarray(off,off+512);off+=512;const size=parseInt(h.subarray(124,136).toString().replace(/\0.*$/s,'').trim()||'0',8);const type=h.subarray(156,157).toString();const data=tar.subarray(off,off+size);off+=Math.ceil(size/512)*512;if(type==='0'||type==='\0')return data;}throw Error('No regular data');}
const results=[];
for(const t of payload.targets){
 const scripts=[...(t.originalInspect.Config.Entrypoint??[]),...(t.originalInspect.Config.Cmd??[])].filter(s=>s.includes('cat <<'));
 const writes=[];
 for(const s of scripts){const lines=s.split('\n');const first=lines.findIndex(x=>/cat\s+<</.test(x));assert.ok(first>=0);let last=first;while(lines[last]?.trimEnd().endsWith('\\'))last++;
  const head=lines.slice(first,last+1).join('\n');const headers=[...head.matchAll(/cat\s+<<'([A-Za-z0-9_]+)'\s*(>>?)\s*(\/[A-Za-z0-9_./-]+)/g)];assert.ok(headers.length);
  let pos=last+1;
  for(const [,delim,op,path]of headers){const end=lines.indexOf(delim,pos);assert.ok(end>=pos);const content=Buffer.from(lines.slice(pos,end).join('\n')+'\n');pos=end+1;
   const captured=t.archives.find(a=>a.path===path);assert.ok(captured,'Entrypoint target not in layer capture');
   const matched=sha(content)===captured.entries[0].contentSha256;
   const appendWhitespaceOnly=op==='>>'?content.toString().trim()==='':null;
   let appendAudit=null;if(op==='>>'){const current=regularData(Buffer.from(captured.tarBase64,'base64'));assert.equal(sha(current),captured.entries[0].contentSha256);const active=content.toString().split('\n').map(x=>x.trim()).filter(x=>x&&!x.startsWith('#'));const onlyAssignments=active.every(x=>/^[a-z_][a-z0-9_.]*\s*=/.test(x));appendAudit={alreadyExactSuffix:current.subarray(-content.length).equals(content),onlyAssignmentLines:onlyAssignments,noActiveLines:active.length===0,assignmentNames:onlyAssignments?active.map(x=>x.match(/^([a-z_][a-z0-9_.]*)\s*=/)[1]):[],expectedPostStartSha256:sha(Buffer.concat([current,content])),runtimeValidated:false};}
   writes.push({path,operation:op==='>'?'overwrite_literal':'append_literal',embeddedContentMatchesCapturedFile:matched,literalSha256:sha(content),capturedSha256:captured.entries[0].contentSha256,appendWhitespaceOnly,appendAudit,expectedAfterReplay:op==='>'?(matched?'same_content':'DIFFERENCE_REQUIRES_REVIEW'):appendWhitespaceOnly?'byte_change_expected_whitespace_only; not identical file':'byte_change_expected_append; must compare effective config, not certify unchanged file'});
  }
 }
 results.push({kind:t.kind,parsedQuotedHeredocs:writes,allOverwriteLiteralsMatch:writes.filter(x=>x.operation==='overwrite_literal').every(x=>x.embeddedContentMatchesCapturedFile),appendTargets:writes.filter(x=>x.operation==='append_literal').map(x=>x.path),scriptsExecuted:false,entrypointAndCmdHashesPreserved:true,runtimeReplay:'NOT_EXECUTED; post-start verification required'});
}
fs.writeFileSync(out+'replay-analysis.json',JSON.stringify({at:new Date().toISOString(),result:'STATIC_REPLAY_ANALYSIS_ONLY',results,plaintextWritten:false,commandsExecutedFromPayload:0},null,2)+'\n');console.log(JSON.stringify({result:'STATIC_REPLAY_ANALYSIS_ONLY',targets:results.map(x=>({kind:x.kind,heredocs:x.parsedQuotedHeredocs.length,allOverwriteLiteralsMatch:x.allOverwriteLiteralsMatch,appendTargets:x.appendTargets}))}));
}catch{console.log('BLOCKED replay analysis; sensitive error suppressed');process.exitCode=1;}
