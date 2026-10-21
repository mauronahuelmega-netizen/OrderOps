import fs from 'node:fs';import assert from 'node:assert/strict';import {save,dir} from './p03-f4a-common.mjs';
const load=f=>JSON.parse(fs.readFileSync(`${dir}/${f}`)),md=(f,s)=>fs.writeFileSync(`${dir}/${f}`,s+'\n');
const stability=load('stability-benchmarks.json'),scaling=load('scaling-benchmarks.json'),resource=load('resource-profile.json'),http=load('http-results.json');
save('concurrency-results.json',{result:'NOT_EXECUTED',reason:'Serial batch3 N100 stopped at original9570.334ms>=5000ms advance gate; D1 stability gate also fails. Do not increase concurrent read load after incomplete serial safety gate.',preparedScript:'scripts/statistics-v1/p03-f4a-concurrency.mjs',financialWriterReopenRecomplete:'NOT_EXECUTED_THIS_PHASE',MVCCReference:'F3C bounded MVCC remains prior accepted evidence, not a new F4A result.'});
fs.mkdirSync(`${dir}/plans`,{recursive:true});
for(const c of stability.cohorts)for(const p of c.plans)save(`plans/batch-${c.batch}-${c.orders}-${p.reader}.json`,p.plan);
const profile=load('profile/volume-50.json'),before=profile.functionStats.extended,after=profile.functionStats.d1;
const delta=Object.fromEntries(Object.entries(after).map(([k,v])=>[k,Object.fromEntries(Object.entries(v).map(([f,n])=>[f,Number((n-(before[k]?.[f]??0)).toFixed(6))]))]));
for(const [i,p]of profile.nestedPlans.entries())save(`plans/profile-50-${i}.json`,p);
const walk=n=>[n,...(n.Plans??[]).flatMap(walk)];const spillNodes=stability.cohorts.flatMap(c=>c.plans.flatMap(p=>p.plan.flatMap(x=>walk(x.Plan)))).filter(n=>(n['Temp Written Blocks']??0)>0||n['Sort Space Type']==='Disk');
const peaks=resource.samples.reduce((p,x)=>({containerRawCPUPercent:Math.max(p.containerRawCPUPercent,parseFloat(x.container?.CPUPerc)||0),containerMemoryPercent:Math.max(p.containerMemoryPercent,parseFloat(x.container?.MemPerc)||0),backendVmHWMKiB:Math.max(p.backendVmHWMKiB,x.backendMemoryKiB?.VmHWM??0)}),{containerRawCPUPercent:0,containerMemoryPercent:0,backendVmHWMKiB:0});
resource.summary={...peaks,cpuNormalizedPercentOf4EngineCPUs:peaks.containerRawCPUPercent/4,observedSamples:resource.samples.length,spillNodesInCollectedPlans:spillNodes.length,waitKinds:[...new Set(resource.samples.flatMap(x=>(x.ownedActivity??[]).map(a=>`${a.waitType}:${a.wait}`)))],limitations:['Sampled CPU not continuous host attribution; container includes background processes.','Kernel HWM sampled for owned backend lifetime includes shared mapped memory, not private heap.','Collected post-benchmark plans show no spills; no plan for9.57s outlier, no absence guarantee between samples.','No exact per-query start/end timeline in normal sample records; resource correlation at cohort level only.']};resource.separateInstrumentedProfile={orders:50,d1FunctionDeltas:delta,sourceItemsOncePerOrder:delta['private.statistics_source_items'].calls===50,inclusiveWarning:'Do not add parent/child times. Source_items includes some statistics_can_read time.'};save('resource-profile.json',resource);
const fmt=x=>x===undefined?'—':x.toFixed(3),rows=stability.cohorts.map(c=>`|${c.batch}|${c.orders}|${['original','AB','D1'].map(k=>`${c.readers[k]?.n??0} / ${fmt(c.readers[k]?.p50)} / ${fmt(c.readers[k]?.p95)} / ${fmt(c.readers[k]?.max)}`).join('|')}|${c.status}|`).join('\n');
const httpStats=rows=>{const a=rows.filter(r=>!r.warmup).map(r=>r.rpcHttpMs??r.sqlPsqlWireMs).sort((a,b)=>a-b);return{n:a.length,p50:a[Math.ceil(a.length*.5)-1],p95:a[Math.ceil(a.length*.95)-1],max:a.at(-1)};};http.summaries={publicEmptyA:httpStats(http.samples.filter(s=>s.business==='a')),publicEmptyB:httpStats(http.samples.filter(s=>s.business==='b')),privateHarnessN5:http.privateSamples.length?httpStats(http.privateSamples):null};save('http-results.json',http);
md('limitations.md',`# Limitaciones efectivas

- No estabilidad demostrada: 100 pedidos D1 p95=476.775ms y606.202ms en las tandas completas. Tercera incompleta:18D1/17AB/18original, máximo original9570.334ms activó gate5s. Cuantiles del lote incompleto son exploratorios; no sirven para declarar objetivo niPASS.
- 200/500/1000/5000 omitidos por gate; concurrencia/MVCC financiero/reapertura/recompletado de F4A no ejecutados después del fallo serial. Script preparado, no ejecutarlo por inercia. F3C no cuenta como nueva ejecución.
- Tres conexiones independientes por volumen no significan caché fría: no reiniciar, vaciar cachés, analizar ni cambiar configuración persistente. El orden50/100 se contrabalanceó; asOf fijo y JSON igual en cada lectura eliminan deriva temporal de la cohorte.
- Método normal realSELECT y timing psql: incluye ejecución, serialización y wire localUnix. F3C midió ExecutionTime deEXPLAIN; no comparar esos números como si fueran la misma instrumentación. EXPLAIN/perfil de F4A están separados de cuantiles normales.
- Observador de5s añade consultas de actividad/proc/Docker, idéntica política para lectores. CPU/raw container149.62% equivale37.405% de4CPUdelmotor; no atribuir a un operador concreto. VmHWM incluye shared mappings. No Windows-host profiling ni timeline exacto por query.
- Sin spills en planes recogidos ni lock-waits en snapshots; no existe plan del outlier9.57s ni prueba de ausencia de contención entre muestras. No demostrar causa de dispersión solo por coincidencia temporal de CPU.
- Perfil acotadoN50: no extrapolar dominancia o costos a100/5000. Core/RLS/composición/rankings son evidencias de costo residual; materializaciónD1 sigue funcionando.
- HTTP público con datos comprometidos vacíos, porque los fixtures se mantienen uncommitted yrollback. Harness privadoD1 es cliente local que verifica identidad porAuthHTTP y ejecutaSQL autenticado, sin endpointD1, no medición de una rutaHTTPD1.
- JWTstateless con claveES256 exclusiva: firma/expiración/roles verificados sin crear sesiones ni cambiarAuthusers. No login/cookieSSR, refresh ni revocación de una sesiónAuthemitida. No service role de aplicación.
- Primera ejecución normalN50 con20muestras se conserva en initial-explain-parser-failure.json: el fallo fueparser deEXPLAIN posterior, noSQL. Corregido en archivo propio; nuevas tandas fijan asOf. No mezclar esa prueba con las tandas repetidas ni descartar sus valores. Primer intento del harnessHTTP falló al compilar top-level await en.tsCJS; se cambió extensión.mts antes de cualquier request.
- Sin SLA ni aprobación de lanzamiento/adopción. Ninguna función/índice/RLS/grant/migración modificados.
`);
md('recommendation.md',`# Recomendación

**PERFORMANCE_IMPROVED_WITH_LIMITATIONS; no READY_FOR_ADOPTION_REVIEW.** Mantener RPC pública original y D1 privada. No se logró cumplimiento reproducible de100<=500ms ni completar escalabilidad segura. D1 mejora p50/p95 frenteA+B en los cinco lotes completos, pero el sexto es incompleto y no certificable.

El perfil separadoN50 midióD1 total279.339ms, núcleo210.061ms inclusivos, statistics_can_read3976llamadas/124.868ms propios, source_items50llamadas/44.868ms inclusivos/26.574ms propios, metrics73/41.839ms inclusivos (23puntos esta vez). No sumar tiempos inclusivos. Macro current_facts/product_lines/products/categories83.017ms/5050shared hits; eligible/digests54.986ms, historical_count35.682ms, series47.265ms. El trabajo relacional/RLS es el siguiente frente medido; no basta con invocaciones numerosas para concluirlo: tiempos y planes lo sustentan.

Siguiente experimento propuesto, sin implementar: varianteC del núcleo, relaciones autorizadas MATERIALIZED para completion_items/rankings/categorías, orders/finanzas y conjunto fiable de cobertura histórica. Preservar invoker/RLS por tabla y perfil original; filtrar por negocio verificado y cohortes/IDs autorizados, conservar cobertura global sinasOf/período inventado, LEFTJOIN yNULL, cardinalidad/completion+line-key, ordenarrays/cursor, agreed_total y digest. No quitar policy checks ni usarSECURITYDEFINER. Medir primero una variante solo completion_items y después historical/joins, para atribuir efecto; no agrupar un refactor general.

Antes de prepararSQL nuevo requiere autorización: mapa exacto de expresiones+diff, comparación original/AB/D1/nuevo en mismo snapshot, dosnegocios/seisroles, dinero/NULL/reopen/cancel/recomplete/nocturnas/DST/microsegundos, decoders intactos. Solo aplicar nuevohash aprobado luego de revisión. Mantener15s/3s y metas100500ms/5001000ms/10001500ms/50003000ms.

Para investigar la dispersión: registrar inicio/fin de cada query y actividad/memoria/CPU propia, planes anidados tempranos/tardíos en conexión aparte; repetir el ordencontrabalanceado y asOf fijo. Explorar plan_cache_mode/JIT LOCAL solo como experimento autorizado y separado, sin usarlo para declararPASS con límites cambiados. Hoy no hay causa demostrada para eloutlier9.57s ni para variación de host/caché.
`);
md('informe.md',`# P03-F.4A — Estabilidad y escalabilidadD1

**PERFORMANCE_IMPROVED_WITH_LIMITATIONS**. No adopción pública ni integración. EquivalenciaJSON se sostuvo en casos ejecutados; rendimiento100 no fue estable y el gate interrumpió el último lote.

## Tandas normales

20muestras porlector cuando se completó el lote;1warmup separado, ordenrotativo y orden de cohortes50/100,100/50,50/100. MismoRRdataset y asOf fijado porcursor; comparaciónJSON completa en cada SELECT. Cada celda:n /p50/p95/máximo ms. p50/p95 rango más próximo, todos outliers conservados.

|Tanda|Pedidos|Original|A+B|D1|Estado|
|---:|---:|---:|---:|---:|---|
${rows}

Tanda3N100 incompleta:NO PASS, no cumplimiento objetivo con18muestras. La llamada original9570.334ms excedió gate5s; ningún timeoutSQL15s ni aumento de límite. Escalamiento200→500→1000→5000 y concurrencia no iniciados. Gate de variabilidadD1 también falló (CV>0.5 en tanda2N100 y tanda3N50). Meta100p95<=500 cumplida solo en primera tanda completa, incumplida en segunda; metas superiores no medidas.

## Perfil, recursos y causa pendiente

PerfilN50 separado: auth/RLS124.868ms propios/3976calls; source_items50evaluaciones; metrics73por23puntos; core210.061ms yRPC279.339ms inclusivos. Dominancia relacional/autorizar apoyada por tiempos/planes, no solo conteos. rankings/categorías83.017ms y5050hits; cobertura35.682ms; series47.265ms. Fuente/captura/finanzas no cambiadas. No identificar causa deloutlier individual sin plan/timeline; no afirmar caché/JIT/otrosproyectos como explicación demostrada.

58snapshots recurso: CPUcontenedor máximo149.62% (37.405% sobre4CPUdelmotor), memoria2.15%, backendVmHWM76736KiB. CPU activa superó el gate normalizado35% en una muestra; no ampliar carga. Esperas muestreadas ClientRead y sinwait, sin spills en planes guardados; no prueba exhaustiva de ausencia de contención. Observer5s yHWM incluyen overhead/memoria compartida. resource-profile.json yplans/contienen evidencia.

## HTTP y pruebas omitidas

HTTP autenticado público original:20muestras porowner de cada negocio, datos comprometidos vacíos. Firma/expiraciónJWT y roles owner/manager/admin admitidos,operator/viewer/super_admin403, anónimo/expirado denegados; metadata falsa ignorada. Clave exclusiva aislada+anonAPIkey, sinserviceRole, sin sesiones nuevas. Harness privado verifica authHTTP y luegoD1SQLN5 conrollback; no endpoint/ruta/servidor público alternativo. Separados AuthHTTP/RPCwall/parse/decode/SQLwire/bridgewall; elRPCwall incluye servidor/transporte y no permite descomposición exacta por resta.

Concurrencia/MVCC, cambios financieros/reapertura/recompletado en paralelo deF4A:NOT_EXECUTED porgate serial. F3C fue referencia previa, no prueba nueva. Detalles completos enhttp-results.json,concurrency-results.json ylimitations.md.

## Preservación

Preflight y cierre:worktreeOrderOps-Estadisticas,branchcodex/estadisticas-v1; proyectoorderops-statistics-v1-test-74718de66a41,API127.0.0.1:56321,DB127.0.0.1:56322,cinco contenedores/red/dosvolúmenes delmanifest; ledger124; fuentesD1SHA9e8b793df40de1aeb6ecbb71c1ce4e828c717498e62340341d8784726ee78070 yABSHAfd88de8c0ec3f4a87d8a6782650d63cf4779d8170033a4c5b4f37edbd489faf9. Catálogo/grants/RLS/triggers/índices e hashes preexistentes preservados. RPCoriginalactiva, ningúnDDL/commit/servicio iniciado/frontendmodificado ni Cursor/producción/Majo tocados. Fixtures propiosrollback y fingerprintsAuth intactos; WAL/secuencias/estadísticas físicas puedenavanzar sin reset.

EntregablesJSON requeridos yscripts inventariados en evidence.json; recommendation.md propone revisar una varianteC relacional bajoRLS sinimplementarla. DetenciónF4A:esperar autorización expresa.
`);
console.log('Prepared report: instability and incomplete cohort explicit; no adoption or scaling PASS.');
