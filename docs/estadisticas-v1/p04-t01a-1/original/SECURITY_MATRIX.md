# Matriz de seguridad, atribución y validación posterior

| Invariante | Diseño / prueba requerida |
|---|---|
|Autorización|auth.uid + perfil original porid,owner/manager/admin; operador/viewer/super_admin/NULL/unknown/sinnegocio/sinsesión42501. Publicwrapper yprivatereader directos; claimsbusiness no autoridad.|
|RLS|Invokerview/tablascompletions/items/snapshots/orders/finance/statestate/sessions; policies intactas, ejecutarcomo authenticated, no certificar solopostgres.|
|Cardinalidad|facts.idunique, itemsPKcompletion+line,joinbizcomp; proofLATERALlimit1 no multiplica, snapshotproof no nuevos importes; agrupar IDsno labels.|
|Finanzas|net_amount verificable+effective_sales, sin prorrateo; alteradoagreement/calidad/composition quedanNULL. Upsells propia identidad, personalizaciónyaenprecio, no dobleSUM.|
|Unidad|Soloitem_kindproduct yeffective_units conocido; invalidcantidad/fracción fuera esquema no coercesilenciosa.|
|Categoría|UUID y nombre capturados verifican lookup de tenant; UUID sin nombre no prueba atribución. Proof exacto para ausencia; falta resultado≠ausencia. Borrado de línea/snapshot conserva completion desconocido; renames/múltiples generaciones y categorías históricas.|
|Denominador|Todas líneas conocidas delperíodo, no sliceTop5; specialunknown cuantificadoincluido si conocido; histórico/uncaptured afectan coverage, no monetary%inferido.|
|Temporal|Expresionescopiadasoriginal8periods, timezone/reference/asOf ynocturna; frontera≤asOf única, datescomerciales incluentes. No temporal-product compare.|
|Reapertura|Active/status canonical yúltimo completion/cycle; no dobleconteo ni backfill.|
|Paging|Knownpositive antesrow_number, descvalue+UUIDstable, limit20 ycursor/revision/key/asOf; cambiosort/range/business invalida.|
|Detalle|Fila+refs delmismo envelope, sin evolución/fetchcatactual; ambas métricas/calidades.|
|SuperficieRPC|Nuevo publicProductos propuesto expuesto solo por ACL/RLS si instalado; gateHTTP no lo desactiva. No instalarfuera aislado.|

Funciones/campos compartidos existentes sin diff: estadísticas originales, can_read, captura yfinanzas. No uso A+B/D1/C ni alterarpage/navglobal. Standalonecandidate duplica period resolverexacto, reusa vistaefectivaoriginal; diffnewObjectsOnly enfunctions.diff. Nuevoshelpermetricgrants sonpropuesta dentroSQLnoejecutado, no autorización para cambiosdegrants preexistentes.

Riesgos: lateral por línea/callsviewRLS costosas, fullcategories crecer, current_asOf no congela estado financiero de sesiones entre consultas sino el filtro deevento yrevision; sourceitem deleted/policy puede limitarprovenance; snapshots máximo generación no equivale a actualcatalogcategory. Memoria CTEmaterialized/JSON crece conventana; no índice/cache/job nuevo. No performance claimni optimización avanzada, deudaenstaging sigue pendiente.

Pruebas T01B: compilar3funciones/defaults/search_path/ACL invoker; políticas/catálogo antes/después; autenticación todosroles/dosnegocios/helpers/claims. Differential universo/asOf/revision/quality contra fuentes originalesmismosnapshot; rankingdosmétricas/>100rows/empates/páginas,cursorinvalid; categoryNULLcon/sinproof,deletedsnapshot, sameIDrenamed,multiplecategories; descuentos/envío/modificador/upsells,monetaryNULL/zero, pedidosnolíneas. Datosmicrosegundos/DST/nocturnos/reopen/cancel/recomplete/histnoDate. JSON completo ydecoderestricto; shares/categoríassumanconservaciónexacta. No arraysnormalizadas paraPASS.

Recursosaislados/timeouts15s/lock3s; perfil/benchmark ulterior soloautorizado yprogressivo, no medirp95 aquí. Cualquierdiscrepancia/seguridadFAIL detiene; no reparar candidato hashdistinto sin nuevaaprobación.
