// Enumerate attribute counts, never values. Existing runtimes only; no files written in containers.
import fs from 'node:fs';import {spawnSync} from 'node:child_process';
const dir='docs/estadisticas-v1/p04-t01c-loopback-harness-20261016/';const d=JSON.parse(fs.readFileSync(dir+'dry-run.json'));const results=[];
const python="import os,sys,json\nr=[]\nfor p in sys.argv[1:]:\n try:\n  a=os.listxattr(p,follow_symlinks=False);r.append({'path':p,'count':len(a),'posixAclPresent':any(x.startswith('system.posix_acl_') for x in a),'status':'OK'})\n except OSError as e:r.append({'path':p,'count':None,'status':'NOT_AVAILABLE','errno':e.errno})\nprint(json.dumps(r))";
const lua=`local ffi=require('ffi')
ffi.cdef[[long llistxattr(const char *path, char *list, unsigned long size);]]
for i=1,#arg do
 local n=tonumber(ffi.C.llistxattr(arg[i],nil,0))
 if n<0 then print(i.."|NOT_AVAILABLE|"..ffi.errno())
 else
  local count=0;local acl=false;local actual=0
  if n>0 then local b=ffi.new('char[?]',n);local read=tonumber(ffi.C.llistxattr(arg[i],b,n));if read<0 or read>n then error('attribute enumeration unavailable') end;actual=read
   local s=ffi.string(b,actual);for name in s:gmatch('([^%z]+)%z') do count=count+1;if name:match('^system%.posix_acl_') then acl=true end end
  end
  print(i.."|"..count.."|"..tostring(acl).."|"..n.."|"..actual)
 end
end`;
for(const kind of ['db','kong']){
 const paths=d.layers.filter(x=>x.kind===kind&&['PRESERVE_ARCHIVE','DIRECTORY_METADATA'].includes(x.disposition)).map(x=>x.path);
 const command=kind==='db'?['python3','-B','-c',python,...paths]:['/usr/local/bin/luajit','-',...paths];
 const r=spawnSync('docker',['exec','-i','--user','0','supabase_'+kind+'_orderops-statistics-v1-test-74718de66a41',...command],{input:kind==='kong'?lua:undefined,encoding:'utf8',windowsHide:true,timeout:20000,maxBuffer:1e6});
 let rows=[];
 try{if(r.status!==0)throw Error();rows=kind==='db'?JSON.parse(r.stdout):r.stdout.trim().split(String.fromCharCode(10)).map(line=>{const [i,count,acl,advertised,returned]=line.split('|');return {path:paths[Number(i)-1],count:count==='NOT_AVAILABLE'?null:Number(count),posixAclPresent:acl==='true',advertisedBytes:Number(advertised),returnedBytes:Number(returned),sizeChanged:Number(advertised)!==Number(returned),status:count==='NOT_AVAILABLE'?'NOT_AVAILABLE':'OK'};});if(rows.length!==paths.length)throw Error();}catch{rows=paths.map(path=>({path,count:null,status:'NOT_AVAILABLE'}));}
 results.push({kind,rows,allEnumerated:rows.every(x=>x.status==='OK'),allZero:rows.every(x=>x.status==='OK'&&x.count===0),attributeValuesRead:false,limitations:'Kernel listxattr visibility for container-root current capabilities; not a forensic proof about hidden unsupported namespaces'});
}
const output={at:new Date().toISOString(),result:results.every(x=>x.allEnumerated&&x.allZero)?'PASS_VISIBLE_ATTRIBUTES_ABSENT':'NEEDS_ATTRIBUTE_PRESERVATION_REVIEW',results,sql:0,containerFilesWritten:0,packagesInstalled:0};fs.writeFileSync(dir+'xattr-audit.json',JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify({result:output.result,targets:results.map(x=>({kind:x.kind,count:x.rows.length,allEnumerated:x.allEnumerated,allZero:x.allZero}))}));
