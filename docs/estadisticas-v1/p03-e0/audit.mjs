// P03-E.0: filesystem/Git reads and review artifacts only. No database/network calls.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { execFileSync, spawnSync } from 'node:child_process';
const root=process.cwd(), cursor=path.resolve(root,'../OrderOps');
const out=path.join(root,'docs/estadisticas-v1/p03-e0');
const require=createRequire(path.join(root,'package.json')), ts=require('typescript');
const git=(dir,...args)=>execFileSync('git',['-c',`safe.directory=${dir.replaceAll('\\','/')}`,'--no-optional-locks','-C',dir,...args],{encoding:'utf8'}).trim();
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=(dir,p)=>fs.readFileSync(path.join(dir,p),'utf8');
const normalized=s=>s.replaceAll('\r\n','\n');
const files=dir=>git(dir,'ls-files','--cached','--others','--exclude-standard','-z').split('\0').filter(Boolean);
const snapshot=dir=>Object.fromEntries(files(dir).filter(p=>!p.startsWith('docs/estadisticas-v1/p03-e0/')).filter(p=>fs.existsSync(path.join(dir,p))).map(p=>[p,hash(fs.readFileSync(path.join(dir,p)))]));
const before={own:snapshot(root),cursor:snapshot(cursor)};
const status=dir=>({branch:git(dir,'branch','--show-current'),head:git(dir,'rev-parse','HEAD'),status:git(dir,'status','--short')});
const initial={own:status(root),cursor:status(cursor)};
if(initial.own.branch!=='codex/estadisticas-v1'||initial.cursor.branch!=='cursor/commercial-core-v1-integration') throw Error('Unexpected branch');
fs.mkdirSync(out,{recursive:true});
const paths=['lib/admin/permissions.ts','components/admin/admin-nav-config.ts','components/admin/layout/admin-nav-list.tsx'];
const bases=Object.fromEntries(paths.map(p=>[p,read(cursor,p)]));
const proposed={...bases};
proposed[paths[0]]=bases[paths[0]].replace('  | "viewOrders"','  | "viewStatistics"\n  | "viewOrders"').replace('export function canViewOrders', 'export function canViewStatistics(role: ProfileRole) {\n  return role === "owner" || role === "manager" || role === "admin";\n}\n\nexport function canViewOrders').replace('    case "viewOrders":','    case "viewStatistics":\n      return canViewStatistics(role);\n    case "viewOrders":');
proposed[paths[1]]=bases[paths[1]].replace('  requiredPermission?: AdminPermission;', '  requiredPermission?: AdminPermission;\n  releasePending?: boolean;').replace('    href: "/admin/settings",','    href: "/admin/statistics",\n    label: "Estadísticas",\n    matchPrefixes: ["/admin/statistics"],\n    requiredPermission: "viewStatistics",\n    releasePending: true\n  },\n  {\n    href: "/admin/settings",').replace('(item) => !item.requiredPermission || hasAdminPermission(role, item.requiredPermission)','(item) => !item.releasePending && (!item.requiredPermission || hasAdminPermission(role, item.requiredPermission))').replace('  if (!item.requiredFeatureFlag) {','  if (item.releasePending) {\n    return false;\n  }\n\n  if (!item.requiredFeatureFlag) {');
proposed[paths[2]]=bases[paths[2]].replace('  ClipboardList,','  BarChart3,\n  ClipboardList,').replace('  "/admin/settings": Settings','  "/admin/statistics": BarChart3,\n  "/admin/settings": Settings');
let patch='';
for(const p of paths){
  proposed[p]=normalized(proposed[p]).replaceAll('\n',bases[p].includes('\r\n')?'\r\n':'\n');
  const base=path.join(out,'base',p+'.txt'),post=path.join(out,'proposed',p+'.txt');
  for(const file of [base,post])fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(base,bases[p]);fs.writeFileSync(post,proposed[p]);
  const diff=spawnSync('git',['diff','--no-index','--ignore-space-at-eol','--',base,post],{encoding:'utf8'});
  if(diff.status!==1)throw Error(`Expected proposed diff: ${p}`);
  const lines=diff.stdout.split('\n');
  patch+=lines.map(l=>l.startsWith('diff --git ')?`diff --git a/${p} b/${p}`:l.startsWith('--- ')?`--- a/${p}`:l.startsWith('+++ ')?`+++ b/${p}`:l).join('\n');
}
fs.writeFileSync(path.join(out,'navigation-permissions.proposed.patch'),patch);
const compile=source=>ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX},reportDiagnostics:true});
const load=(source,imports={})=>{const mod={exports:{}};const compiled=compile(source);if(compiled.diagnostics?.length)throw Error('Transpile diagnostics');vm.runInNewContext(compiled.outputText,{exports:mod.exports,module:mod,require:id=>imports[id]??(()=>{throw Error(`Unexpected import ${id}`)})()});return mod.exports;};
const permissions=load(proposed[paths[0]]),oldPermissions=load(bases[paths[0]]);
const nav=load(proposed[paths[1]],{'@/lib/admin/permissions':permissions}),oldNav=load(bases[paths[1]],{'@/lib/admin/permissions':oldPermissions});
const assertions=[];
const check=(name,ok)=>{assertions.push({name,result:ok?'PASS':'FAIL'});if(!ok)throw Error(name);};
for(const role of ['owner','manager','admin','operator','viewer','super_admin',null,undefined,'unknown']){
  check(`raw role ${String(role)}`,permissions.hasAdminPermission(role,'viewStatistics')===['owner','manager','admin'].includes(role));
  if(typeof role==='string'&&role!=='unknown'){
    check(`existing permissions unchanged ${role}`,JSON.stringify(permissions.getAdminPermissions(role))===JSON.stringify(oldPermissions.getAdminPermissions(role)));
    check(`existing visible navigation unchanged ${role}`,JSON.stringify(nav.getAdminNavItemsForRole(role))===JSON.stringify(oldNav.getAdminNavItemsForRole(role)));
  }
  check(`unreleased statistics hidden ${String(role)}`,!nav.getAdminNavItemsForRole(role).some(i=>i.href==='/admin/statistics'));
}
const item=nav.adminNavItems.find(i=>i.href==='/admin/statistics');
check('pending item disabled independently of business settings',!nav.isAdminNavItemFeatureEnabled(item,null,false));
check('active exact path',nav.isAdminNavItemActive('/admin/statistics',item));
check('active nested query path',nav.isAdminNavItemActive('/admin/statistics/query',item));
check('no prefix false positive',!nav.isAdminNavItemActive('/admin/statistics-other',item));
check('TSX proposal syntax',!(compile(proposed[paths[2]]).diagnostics?.length));
check('installed icon export',typeof require('lucide-react').BarChart3!=='undefined');
// Hypothetical future release: mutate only the in-memory test object, never source.
item.releasePending=false;
for(const role of ['owner','manager','admin','operator','viewer','super_admin',null])check(`hypothetical release raw role ${String(role)}`,nav.getAdminNavItemsForRole(role).some(i=>i.href==='/admin/statistics')===['owner','manager','admin'].includes(role));
item.releasePending=true;
check('patch applicability only (not applied)',spawnSync('git',['apply','--check',path.join(out,'navigation-permissions.proposed.patch')],{cwd:root}).status===0);
const ownMigrations=files(root).filter(p=>/^supabase\/migrations\/\d.*\.sql$/.test(p));
const cursorMigrations=files(cursor).filter(p=>/^supabase\/migrations\/\d.*\.sql$/.test(p));
const migrationRows=ownMigrations.map(p=>({path:p,sha256:before.own[p],cursorSha256:before.cursor[p]??null,identical:before.own[p]===before.cursor[p],contentEquivalent:before.cursor[p]?normalized(read(root,p))===normalized(read(cursor,p)):false}));
const baseRows=migrationRows.filter(p=>p.cursorSha256);
check('all common migration text equivalent (EOL only)',baseRows.every(p=>p.contentEquivalent));
check('119 baseline migrations',baseRows.length===119&&cursorMigrations.length===119);
check('authorized comparative migration hash',before.own['supabase/migrations/20261013004000_statistics_v1_comparative_series.sql']==='b10c330adff70b803d9d25165f07830e90d4cd092aa4ba2cf3d0120a43f95219');
const union=[...new Set([...ownMigrations,...cursorMigrations])];
const versions=new Map();for(const p of union){const v=path.basename(p).split('_')[0];versions.set(v,[...(versions.get(v)??[]),p]);}
const collisions=[...versions].filter(([,p])=>p.length>1);check('no known migration version collision',collisions.length===0);
const common=Object.keys(before.cursor).filter(p=>Object.hasOwn(before.own,p));
const differences=common.filter(p=>before.cursor[p]!==before.own[p]);
const trackedCursor=git(cursor,'ls-files','-z').split('\0').filter(Boolean);
const trackedDifferences=trackedCursor.filter(p=>before.own[p]!==before.cursor[p]);
const trackedContentDifferences=trackedDifferences.filter(p=>!before.own[p]||normalized(read(root,p))!==normalized(read(cursor,p)));
const final={own:status(root),cursor:status(cursor)};
const after={own:snapshot(root),cursor:snapshot(cursor)};
check('all own preexisting files preserved',JSON.stringify(before.own)===JSON.stringify(after.own));
check('effective Cursor files preserved',JSON.stringify(before.cursor)===JSON.stringify(after.cursor));
check('both HEADs unchanged',initial.own.head===final.own.head&&initial.cursor.head===final.cursor.head);
const evidence={at:new Date().toISOString(),verdict:'READY_WITH_LIMITATIONS',initial,final,mergeBase:git(root,'merge-base',initial.own.head,initial.cursor.head),assertions,trackedCursorFiles:trackedCursor.length,trackedDifferences,trackedContentDifferences,commonFiles:common.length,effectiveCommonDifferences:differences,ownMigrations:ownMigrations.length,cursorMigrations:cursorMigrations.length,migrations:migrationRows,collisions,baseHashes:Object.fromEntries(paths.map(p=>[p,{own:before.own[p],cursor:before.cursor[p],proposed:hash(proposed[p])}])),operations:{database:false,network:false,servers:false,containers:false,sharedEdits:false,commits:false,patchApplied:false},preservation:{ownFiles:Object.keys(before.own).length,cursorFiles:Object.keys(before.cursor).length}};
fs.writeFileSync(path.join(out,'evidence.json'),JSON.stringify(evidence,null,2)+'\n');
fs.writeFileSync(path.join(out,'preexisting-hashes.json'),JSON.stringify(before,null,2)+'\n');
const artifacts=[];
function inventory(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())inventory(file);else if(entry.name!=='artifacts.sha256.json')artifacts.push({path:path.relative(root,file).replaceAll('\\','/'),sha256:hash(fs.readFileSync(file))});}}
inventory(out);
fs.writeFileSync(path.join(out,'artifacts.sha256.json'),JSON.stringify({at:evidence.at,files:artifacts},null,2)+'\n');
console.log(JSON.stringify({verdict:evidence.verdict,assertions:assertions.length,trackedContentDifferences,eolOnly:trackedDifferences.length-trackedContentDifferences.length,migrations:[ownMigrations.length,cursorMigrations.length],cursor:initial.cursor,ownPreserved:evidence.preservation.ownFiles,cursorPreserved:evidence.preservation.cursorFiles},null,2));
