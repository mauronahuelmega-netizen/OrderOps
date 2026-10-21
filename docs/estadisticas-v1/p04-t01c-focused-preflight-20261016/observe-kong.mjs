// Read-only observations in the exact original Kong. Never reads xattr values.
import fs from 'node:fs';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
const d='docs/estadisticas-v1/p04-t01c-focused-preflight-20261016/';
const pins=JSON.parse(fs.readFileSync('docs/estadisticas-v1/p04-t01c-executor-audit-20261016/pins.json'));
const pin=pins.targets.find(x=>x.kind==='kong');const hash=b=>createHash('sha256').update(b).digest('hex');
function run(args,input){const r=spawnSync('docker',args,{input,encoding:'utf8',timeout:20000,maxBuffer:2e6,windowsHide:true});assert.equal(r.status,0,'Read-only Docker operation failed; output suppressed');return r.stdout;}
try{
 const c=JSON.parse(run(['inspect',pin.id]))[0];assert.equal(c.Id,pin.id);assert.equal(c.Name,pin.name);assert.equal(c.Image,pin.image);assert.equal(hash(JSON.stringify(c.Config)),pin.configHash);assert.equal(hash(JSON.stringify(c.HostConfig)),pin.hostHash);assert.equal(c.State.Health.Status,'healthy');assert.equal(c.NetworkSettings.Networks[pins.networkName].NetworkID,pins.networkId);
 const paths=['/home','/home/kong','/usr','/usr/local','/usr/local/kong'];
 const lua=String.raw`local ffi=require('ffi')
assert(ffi.arch=='x64','Direct syscall numbers only approved for x86_64')
ffi.cdef[[long llistxattr(const char*,char*,unsigned long); long listxattr(const char*,char*,unsigned long); long lgetxattr(const char*,const char*,void*,unsigned long); long syscall(long,const char*,char*,unsigned long);]]
local function emit(s) print(s) end
local function names(b,n) local out={} if n>0 then for name in ffi.string(b,n):gmatch('([^%z]+)%z') do out[#out+1]=name:match('^[%w_.:-]+$') and name or 'NONSTANDARD_NAME_REDACTED' end end table.sort(out); return table.concat(out,',') end
local function probe(p,method,f)
 ffi.errno(0);local n=tonumber(f(p,nil,0));local e=ffi.errno()
 local capacity=n>0 and n or 65536; local b=ffi.new('char[?]',capacity);ffi.errno(0);local actual=tonumber(f(p,b,capacity));local ae=ffi.errno()
 local fixed=ffi.new('char[65536]');ffi.errno(0);local fr=tonumber(f(p,fixed,65536));local fe=ffi.errno()
 emit('LIST|'..p..'|'..method..'|'..n..'|'..e..'|'..actual..'|'..ae..'|'..fr..'|'..fe..'|'..(actual>=0 and names(b,actual) or '')..'|'..(fr>=0 and names(fixed,fr) or ''))
end
local attr={'trusted.overlay.origin','trusted.overlay.impure','trusted.overlay.opaque','trusted.overlay.redirect','trusted.overlay.metacopy','user.overlay.origin','user.overlay.impure','user.overlay.opaque','security.capability','security.selinux','system.posix_acl_access','system.posix_acl_default'}
for _,p in ipairs(arg) do
 probe(p,'libc_llist',function(p,b,n)return ffi.C.llistxattr(p,b,n)end)
 probe(p,'libc_list',function(p,b,n)return ffi.C.listxattr(p,b,n)end)
 probe(p,'syscall_llist_195',function(p,b,n)return ffi.C.syscall(195,p,b,n)end)
 for _,name in ipairs(attr)do ffi.errno(0);local n=tonumber(ffi.C.lgetxattr(p,name,nil,0));emit('NAMED|'..p..'|'..name..'|'..n..'|'..ffi.errno())end
end
local f=io.open('/proc/self/status','r');for line in f:lines()do if line:match('^Cap') or line:match('^NoNewPrivs:') or line:match('^Seccomp:')then emit('CONTEXT|'..line)end end;f:close()
local f=io.open('/proc/self/mountinfo','r');for line in f:lines()do if line:match(' / / ')then local t=line:match(' %- ([^ ]+)');emit('ROOTFS|'..tostring(t))end end;f:close()
`;
 const out=run(['exec','-i','--user','0',pin.id,'/usr/local/bin/luajit','-',...paths],lua);
 const lists=[],named=[],context=[];let rootfs;
 for(const line of out.trim().split(/\r?\n/)){const p=line.split('|');if(p[0]==='LIST'){lists.push({path:p[1],method:p[2],advertised:Number(p[3]),advertisedErrno:Number(p[4]),returned:Number(p[5]),returnedErrno:Number(p[6]),fixedBufferReturned:Number(p[7]),fixedBufferErrno:Number(p[8]),visibleNames:p[9]?p[9].split(','):[],fixedBufferNames:p[10]?p[10].split(','):[]});}else if(p[0]==='NAMED')named.push({path:p[1],name:p[2],size:Number(p[3]),errno:Number(p[4])});else if(p[0]==='CONTEXT')context.push(p[1]);else if(p[0]==='ROOTFS')rootfs=p[1];else throw Error('Unexpected output');}
 assert.equal(lists.length,15);assert.equal(named.length,60);
 fs.writeFileSync(d+'kong-attributes.json',JSON.stringify({at:new Date().toISOString(),containerId:pin.id,image:pin.image,methods:'libc list/llist and direct syscall 195, sized and independent 64KiB buffers; named sizes only',lists,named,context,rootfs,xattrValuesRead:false,containerFilesWritten:0,sqlConnections:0},null,2)+'\n');
 console.log(JSON.stringify({result:'OBSERVED',rootfs,lists,namedSummary:named.filter(x=>x.size>=0||x.errno!==61),context}));
}catch{console.log('BLOCKED_KONG_OBSERVATION; raw errors suppressed');process.exitCode=1;}
