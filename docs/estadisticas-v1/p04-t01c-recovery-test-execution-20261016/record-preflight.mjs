// Filesystem-only record of the stopped preflight. No Docker or SQL calls.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const prior='docs/estadisticas-v1/p04-t01c-recovery-kong-decision-20261016/';
const out='docs/estadisticas-v1/p04-t01c-recovery-test-execution-20261016/';
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=p=>fs.readFileSync(p);
const json=p=>JSON.parse(read(p));
const save=(n,v)=>fs.writeFileSync(out+n,JSON.stringify(v,null,2)+'\n');
const manifestHash='790960c137c57c70d725cde4a7113165b15c6369662b2e2a52387623093dfd3f';
assert.equal(sha(read(prior+'recovery-approval-manifest.json')),manifestHash);
const manifest=json(prior+'recovery-approval-manifest.json');
for(const f of manifest.runtimeAndProcedureFiles)assert.equal(sha(read(f.path)),f.sha256,f.path);
assert.equal(sha(read(manifest.backup.path)),manifest.backup.sha256);
const baseline=json(prior+'file-baseline.json').files;
for(const f of baseline)assert.equal(sha(read(f.path)),f.sha256,f.path);
const historical=json(prior+'evidence.json');
for(const f of historical.inventory)assert.equal(sha(read(f.path)),f.sha256,f.path);
const branch=execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim();
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
assert.equal(branch,'codex/estadisticas-v1');
assert.equal(head,'923300265323d411c5c91b7935472d5423d228d2');
const status=execFileSync('git',['status','--short','--untracked-files=no'],{encoding:'utf8'});
assert.equal(status.trim(),json(prior+'preservation.json').trackedStatus.join('\n').trim());
const preflight={
 at:new Date().toISOString(),phaseP04T01C:'BLOCKED',result:'RECOVERY_INCOMPLETE',
 executionStage:'HALTED_BEFORE_RESOURCE_CREATION',restorationAttempted:false,
 approvedManifestSha256:manifestHash,approvedArtifactHashesVerified:13,
 branch,head,worktree:process.cwd(),
 backup:{...manifest.backup,hashVerified:true},
 observations:[
  {control:'sandboxAccess',result:'NOT_AVAILABLE_IN_SANDBOX',detail:'CIM and Docker named pipe denied; superseded only by authorized read-only elevated preflight, not treated as zero resource use'},
  {control:'hostCapacity',utc:'2026-10-16T17:37:21.4675534Z',cpuPercent:26,maximumCpuPercent:35,availableMemoryGiB:1.036,totalMemoryGiB:15.888,minimumAvailableMemoryGiB:4,result:'FAIL_RESOURCE_GATE'},
  {control:'newNameCollision',name:'orderops-statistics-recovery-20261016-a',command:'docker --host npipe:////./pipe/docker_engine ps -aq --filter name=^/orderops-statistics-recovery-20261016-a$',exitCode:0,matchedIds:[],result:'PASS_NAME_ABSENT'},
  {control:'imageMetadata',image:manifest.prerequisites.image,result:'NOT_CONFIRMED',error:'template parsing error: .Config.Volumes: map has no entry for key Volumes',automaticRetry:false},
  {control:'pressureOomAndFullImageValidation',result:'NOT_EXECUTED_AFTER_GATE_FAILURE'}
 ],
 newResourceIds:[],resourcesCreated:0,labResourcesActive:[],
 sqlExecutions:0,restores:0,dockerMutations:0,cleanupExecuted:false,
 comparison:'NOT_EXECUTED',objectsRolesExtensionsAndDataRestored:'NOT_VERIFIED',
 sourceCorruptionOrRestoreFailureDemonstrated:false,
 originalSqlConnections:0,originalLifecycleOperations:0,
 authorization:'Sequence halted; no automatic retry. New human decision required before resuming.',
 pgStopStep:'NOT_EXECUTED; later human prohibition on stopping laboratory takes precedence over proposed post-success pg_ctl step'
};
save('preflight-results.json',preflight);
save('preservation.json',{
 at:new Date().toISOString(),result:'PASS_CHECKED_FILE_PRESERVATION',
 baselineFiles:baseline.length,baselineHashesUnchanged:true,
 previousPackageInventoryFiles:historical.inventory.length,previousPackageHashesUnchanged:true,
 approvedArtifactsUnchanged:true,sourceDumpUnchanged:true,
 trackedGitStatusUnchanged:true,trackedStatus:status.trimEnd().split('\n'),
 originalContainerMutations:0,originalSqlConnections:0,labResourcesCreated:0,
 historicalVerdictsRewritten:false,commits:0,
 limitation:'No fresh live catalog or data queries were executed. Preservation claims are filesystem hashes and absence of mutation operations, not a new SQL audit.'
});
fs.writeFileSync(out+'informe.md',`# Prueba independiente de recuperabilidad — detenida en preflight

**Resultado: RECOVERY_INCOMPLETE. P04-T01C = BLOCKED.**

La autorización fue leída y se verificó el manifest SHA-256 \`${manifestHash}\`, sus 13 artefactos y el respaldo fuente sin modificar. Rama \`${branch}\`, HEAD \`${head}\`, worktree OrderOps-Estadisticas.

## Gate de recursos y detención

A las 2026-10-16T17:37:21.4675534Z se observaron CPU 26% y **1,036 GiB de memoria disponible**, sobre 15,888 GiB físicos. El plan exige CPU ≤35% y memoria disponible ≥4 GiB. **El gate de memoria falla y prohíbe crear/iniciar recursos.** No se esperó una condición favorable ni se repitió la medición para obtener PASS.

El acceso CIM/pipe inicial estaba restringido por el sandbox. Se efectuó únicamente una comprobación elevada de solo lectura. Los valores nulos/cero derivados del acceso denegado inicial no son mediciones del host. No hubo rechazo del revisor automático.

La consulta de colisión del nombre devolvió cero IDs. La inspección seleccionada de la imagen terminó con el error de plantilla «map has no entry for key Volumes»; no constituye una aceptación del digest/Volumes ni prueba de un volumen inesperado. No se corrigió el comando ni se repitió. Con el gate fallido no se continuó con otros controles ni etapas.

## Resultado y cobertura

| Etapa | Resultado |
|---|---|
|Manifest, 13 hashes y dump|PASS|
|Rama, HEAD y hashes anteriores|PASS|
|CPU disponible respecto del límite|PASS de la observación puntual|
|Memoria disponible|FAIL del gate; detener|
|Colisión de nombre nuevo|PASS, sin IDs coincidentes|
|Imagen/Volumes y presión/OOM|Sin confirmación completa|
|Creación/arranque/staging/initdb/roles/restore|NO EJECUTADOS|
|Comparación de objetos, roles, ACL, extensiones y 108 bloques/738 filas|NO EJECUTADA; inventario del dump previo no equivale a restauración|
|SQL, Auth, original, Kong, firewall, bindings|Sin operaciones|

No hay fallo demostrado del respaldo ni recuperación demostrada. RECOVERY_INCOMPLETE expresa ensayo no realizado por falta de capacidad y control pendiente; no es PASS ni evidencia de que el archivo sea irrecuperable. Se conserva la distinción entre contenido del dump y recuperación integral de Supabase. No se tocaron bases de otros proyectos.

## Recursos y limpieza

**IDs nuevos: ninguno. Recursos creados: cero. Laboratorios activos de esta prueba: ninguno.** No hay recursos de este ensayo que limpiar. No se detuvo PostgreSQL ni ningún contenedor. La autorización humana más reciente excluye detener el laboratorio; tampoco se ejecutó el paso de parada de PG propuesto en el paquete.

Si en una futura prueba se crea un laboratorio, la limpieza requerirá autorización separada con su ID íntegro y nueva comprobación de layout. Solo tras ella se propondrá detener/eliminar ese ID, sin -v/prune ni tocar imágenes, redes o volúmenes originales. No se ejecutó limpieza alguna ahora.

## Preservación y siguiente decisión

Se verificaron nuevamente ${baseline.length} archivos del baseline anterior y ${historical.inventory.length} archivos inventariados del paquete previo, los 13 artefactos autorizados y el dump. El estado rastreado Git coincide con la referencia previa; no hubo commits. No se modificaron fuentes, manifest ni evidencias históricas. Los resultados nuevos y sus hashes están en este directorio.

Recomendación: mantener BLOCKED y solicitar una nueva decisión humana antes de retomar. Hace falta capacidad verificable ≥4 GiB y autorizar la lectura robusta de metadata de la misma imagen para confirmar Volumes/digest, sin modificar el paquete aprobado ni aflojar límites. No cerrar otros servicios por iniciativa propia, no reintentar ni crear otro destino automáticamente. No reabrir SQL original, instalar QA, sustituir Kong o iniciar T02.
`);
const names=fs.readdirSync(out).filter(n=>n!=='evidence.json');
save('evidence.json',{
 at:new Date().toISOString(),result:'RECOVERY_INCOMPLETE',phaseP04T01C:'BLOCKED',
 approvalManifestSha256:manifestHash,sourceDumpSha256:manifest.backup.sha256,
 resourcesCreated:0,sqlExecuted:0,restores:0,containerMutations:0,
 newFilesOnlyInOwnedExecutionDirectory:true,
 inventory:names.map(n=>({path:out+n,bytes:fs.statSync(out+n).size,sha256:sha(read(out+n))})),inventoryExcludesSelf:true
});
console.log(JSON.stringify({result:'RECOVERY_INCOMPLETE',phaseP04T01C:'BLOCKED',filesPreserved:baseline.length,previousPackageFilesPreserved:historical.inventory.length,resourcesCreated:0,restores:0,evidenceSha256:sha(read(out+'evidence.json'))}));
