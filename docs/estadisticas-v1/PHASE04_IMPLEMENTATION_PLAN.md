# Phase04 — Plan T00–T06 propuesto, sin implementación

Veredicto actual **BLOCKED** por contrato analítico incompleto y baseline Phase03 sin cierre formal. Este plan permite revisar próximos permisos; no autoriza SQL, interfaz, adopción optimizada ni publicación. P-V01–P-V10 y opciónA son vinculantes. No evolución individual, comparación por producto, series/endpoints de evolución ni placeholder vacío. Phase05 fuera de alcance.

## Arquitectura y secuencia segura

1. Aceptar descubrimiento y resolver D04-01/02/03; confirmar base Phase03 y tratamiento release default-closed. No condicionar Productos a adoptar A+B/D1/C: investigación suspendida, deuda en staging.
2. Autorizar T01 primero como contratos/diseño SQL propio **sin aplicación**, con revisión de diff, firmas, ACL/RLS/cardinalidad y alcance de captura si indispensable. No numerar migración contra inventario viejo: Cursor comprometido alcanza20261013070000; revalidar versiones actuales de ambos árboles antes de reservar una nueva.
3. Solo con autorización separada aplicar SQL aprobado en aislado y pruebas de contrato. No migraciones compartidas/públicas ni datos reales.
4. Autorizar T02–T05 código propio y diffs mínimos de componentes compartidos estadísticos; T06 QA aislado por permiso expreso. Menú/publicación siguen cerrados; no tocar permisos/nav/comercial por iniciativa.
5. Cierre documental con evidencia; propietario decide integración/lanzamiento. No iniciarPhase05 ni commits/merges automáticos.

## T00 — Descubrimiento y contrato

**Objetivo:** fijar universo, atribución y alcance P-V antes de código. Entrega de esta autorización: auditoría fuente/spec, readiness y plan; no contrato backend final aprobado.

**Dependencias:** especificación actual, B1–B6, fuente original/catálogo F.4C, Phase03 estable aceptada, revisión D04-01/02/03. **Archivos:** cuatro documentos presentes, PROGRESS propio y append memoria; evidencia phase04-discovery. Sin esquema.

**Contrato:** propuesta de ranking/categories/detail/coverage/keys/cursor descrita en DATA_CONTRACT_AUDIT. Fijar denominadores y provenance, publicación server, filtro de métricas desconocidas antes de pagination. **Tareas:** resolver campo-nullcategory, ingresos solo subconjunto comprobado, arquitectura aditiva propia sin series versus extensión RPC, matriz de compatibilidad efectiva de Cursor bajo permiso adicional/inventario del propietario.

**Pruebas:** auditoría estática, typecheck/lint actuales, verificación de hashes/estado y tests previos vs fuente. **Aceptación:** nada inventado, todas brechas localizadas, P-V01–10 mapeadas, opciónA ratificada y owners de cambios identificados. **Riesgos:** creer que referenceHEAD contiene untracked; asumir catálogo live o base Cursor actual. **GateT01:** contrato y baseline aceptados expresamente; si requiere escritor compartido, diff separado autorizado primero.

## T01 — Modelo de métricas y transporte

**Objetivo:** agregados verificables que alimenten paneles independientes y detalle sin consulta de evolución. **Dependencias:** T00, acceso SSR rawperfil, universo/periodo original; revisión SQL/autorización aislada en etapas distintas.

**Archivos propuestos nuevos:** lib/statistics/products-contracts.ts, products-read.ts, products-server.ts, products-query.ts, products-presenter.ts, fixtures/products-responses.json; SQL/migración propia con nombre pendiente de inventario y supabase/tests/statistics/products_*.sql solo tras aprobación. Endpoint agregado propuesto app/admin/(protected)/statistics/products/query/route.ts si se eligeRPC propia; no endpoint individual ni serie de producto. **Existentes previstos:** summary-principal, summary-period, money/read solo reutilización; cualquier refactor original/helper requiere diff previo, no getStatistics/server.ts fallback.

**Contrato:** envelope versionado con periodo/asOf/revision/biz; ranking paginado known>0 ordenestable, metadatosdenominador global, calidad individual y categorías completas por ambasmétricas, detalle enriquecido por fila; availability porpanel, razones/cobertura. **Esquema:** preferir solo funciones/RPC invoker/read-only y reuse fuentes; no tablas/índices/cache/jobs ni nueva captura salvo necesidaddemostrada/autorización. No adoptar candidatos suspendidos.

**Tareas:** SQL autorizado tenant-scoped, parents versus upsells sin duplicar, unidades exactas, fechas, composición y reconciliación originales, proof categoría explícito; separar financialunavailable; decoder estricto/errores; principal+release gate trustedserver para page/endpoint; abort/dedup scopeusuario-negocio, período, orden y cursor y descarte tardías. Inicialuna consulta agregada/periodo, ranking sort/page puede pedirotra agregada necesaria; categorías metric/selección/detalle usan respuesta ya obtenida. Nunca RPC por sector/point; no polling/caché compartida; coherenciaasOf al paginar y revision cambia invalida páginas. No cargar todaspáginas para calcular denominador.

**Pruebas:** differential Resumen íntegro/mismosnapshot, monetaryexact/NULL/descuentos sin reparto, provenance/homónimos/eliminados, >100productos/paginación/cursor, two-tenants/rawroles y helper directo, sesiones/nocturnas/DST/microsegundos/reaperturas. **Aceptación:** subset fiable explícito, denominador demostrado,ningún desconocido convertido en cero, categoríasunitse ingresos correctas y seguras, RPC Resumen no alterada/no seriesindividuales. **Riesgos:** scans repetidas, duplicar filas, metadata ambigua, insuficiencia categoría histórica. **GateT02:** SQL revisado/aplicado solo por permiso expreso aislado y tests contrato/seguridad PASS; no PASS incompleto por UI disponible.

## T02 — Shell y ranking

**Objetivo:** Productos comparte identidad/período, Top5 horizontal y exploración. **Dependencias:** T01 funcional, publicación cerrada, aprobación diff mínimo extracción shell propio.

**Archivos nuevos previstos:** components/admin/statistics/statistics-shell.tsx, products-screen.tsx, products-ranking.tsx, products.module.css; página /admin/statistics/products propia. **Existentes:** statistics-summary.tsx extracción cabecera/filtros/tabs, statistics.module.css solo tokens compartidos si necesario, summary-period reutilizado. No admin-nav/permisos/shellglobal modificados.

**Contrato:** period URL8presets/quick3/custom/defaultthis_week, sort localranking, productKey, cursor y selection. **Esquema:** ninguno. **Tareas:** linktabs periodo conservado, Oportunidadesdisabled; rankingTop5, Ver más5→siguiente página/Ver menos sin scrollinterno, cifrasexactas/barrasratiomaxvisible(geometría acotadaúnicamente), participaciónseparada condenominadorhonesto; filasbutton teclado/foco/borde. Sort cambia no categoriesmetric/período; limpiar valoresviejose inmediato.

**Pruebas:** ocho presets/backforward, empatesidentificador y nombres largos, cero3prod noVerMás, >100, rango inválido, sorting/selection, stale/dedup y una peticiónporacciónnecesaria. **Aceptación:** P-V01/03/04/10, no Top5 rellenado, no falsepercentage ni frontendfinance, Resumen idéntico. **Riesgos:** shellactual embebido, extracciónregresiva/perderURL, paginationfalseorden. **GateT03:** testscontrol y regresiónResumenPASS; diffs solo propios autorizados.

## T03 — Categorías

**Objetivo:** dona/leyenda coherentes, independientes delranking. **Dependencias:** T01: categorías completas, calidad y prueba de atribución, shell de T02.

**Archivos:** products-categories.tsx nuevo; presenter/productsCSS/tests propios. **Contrato:** valor/mainUnits o attributedRevenue, denominator/scope/quality, identityKind explícita, full taildesglose. **Esquema:** ninguno fueraT01.

**Tareas:** Top5categorías reales, Otrascategorías remainder/desglosable, gruposSin categoría y Sin atribución fiable siempre visibles fuera de la cola; solo segmentosconocidos comparables y positivos. Cero/unknownsin donut; totalcentro representadodelpanel, noVentasResumen. Leyendaexacta accesible, porcentajesredondeadossin alterarimporte; móvil dona centrada/leyenda debajo, selectedtoggle propio noalteraranking. Paletteestable conalternativatextual.

**Pruebas:** 0/2/>10categorías, categoría llamadaOtrasreal, ambosgruposespeciales, NULLquantía, parcialfinancial, roundings/sumexact, nombrerenombrado/multiplehistoricalcategories, teclado ymetricesindependientes. **Aceptación:** P-V02/03/04/06/07, leyenda/dona mismouniverso, cobertura100no engañosa. **Riesgos:** omitirunknown dentroOtras y falsaSinCategoría por NULL. **GateT04:** contractcoverage y sumasprobadas, fixturesincluyen3semánticas separadas.

## T04 — Detalle y lectura determinista

**Objetivo:** selección contextual y descripción verificable delperíodo. **Dependencias:** ranking T02 y categorías T03 y fila enriquecida de T01.

**Archivos:** products-detail.tsx, products-reading.tsx, products-reading.ts/presenter propios. **Contrato:** identidadúnica, nombre histórico, units/revenue/participación válida, categoría(s), estado soloverificable yperiodo/cobertura. Opcionales imagen/descripción sin nuevas consultas como requisito. **Esquema:** ninguno.

**Tareas:** inicialsin detalleo invitacióncompacta; desktopdebajodos paneles, móvil ranking→detalle→categorías; cierre/selecciónfoco, invalidación segura período u orden. Lectura observación+evidencia+significado descriptivo; explicitar métricasdiferentes ranking/categorías, neutral enqualityinsuficiente/errorpanel. Sin causas/stock/promos/margen/recomendaciones ni evolución individual.

**Pruebas:** homónimosIDs, histórico eliminado, categoría múltiple, ingresosNo disponible, sin selección, cambioselección/período, partialpanel, texto distinto toggles, cero vsunknown. **Aceptación:** P-V05/06/08, detalle usaaggregate obtenido sinRPCporselección, sin espacios/series fueraalcance. **Riesgos:** interpretar catálogoactual comohistórico, lecturaespeculativa o stale. **GateT05:** prueba de no llamadasindividuales, lectura determinista yerror neutral.

## T05 — Estados, responsive y accesibilidad

**Objetivo:** estadoscontextuales fiables yusabilidadambostemas. **Dependencias:** T02–T04, panelavailabilityT01.

**Archivos:** products-states.tsx, products.module.css, testscomponent/controller propios; reutilizaciónstylesResumen soloapproveddiff. **Contrato:** loading/empty/partial/error/unsupported/configuration, selectionintent, requestgeneration. **Esquema:** ninguno.

**Tareas:** skeletons, retrylocal mantienefiltros/métricas, globalqueryfallida amboserror; no prometertransporterrorindependiente si unaRPC falla indivisible. Errores dedecodificaciónpanelaislable solosi envelopeválido scope/periodo seguro; no rescatar JSONcross-tenant. Mismoperíodo actualización puede mostrarstale marcado; distintoperíodo neutralizar de inmediato. Contraste/foco/ARIA, touchlongnames/es-AR/moneyexact, zoom200%, screenreader yreducedmotion.

**Pruebas:** raceHoy→Mes→Ayer, errorranking/categorías/global, retriesdedup, requestscopeuser/biz cambia,1280/768/390/320 ytextzoom, dark/light, keyboardfullflow yscrollhorizontal. **Aceptación:** P-V07/09/10 ysin falsoscero/stale, ambosselectoresindependientes. **Riesgos:** errorpartialfingido enRPCglobal o cachécompartida. **GateT06:** pruebascomponent/estados yaccessmanual sin bloqueos críticos.

## T06 — Verificación y aceptación

**Objetivo:** demostrarP-V01–10, integridad/regresión ylimits. **Dependencias:** todoanterior, permisoQA explícito, Supabaseisolatedidentitylive y servidorQA3037/API56321/DB56322; nada producción.

**Archivos:** testsSQL/RLS propios, verifyTS/controller/component, scriptsQA privados; docs/phase04-evidence/ ycapturas. BuildNext en espejoaislado, configuracióndeproducción-forma peroURL/credenciales sintéticas exclusivas; noenvproducción niworkspace.nextwrites. **Contrato:** matrizaceptación de spec ycontratosaprobados; unknown/errors/SQLSTATE yfullJSONResumen.

**Tareas/pruebas:**20casosmínspec+límites/dos negocios/seis roles/NULL/unknown, cookiesAuthrefresh/expiryreal, persistedsyntheticnonempty fixtures concleanupselectivepreviamenteaprobado; aisladosRESTservidor sin intercept enE2Edatos sintéticos persistidos; regresióndeResúmenocho periods/KPI/series, default-closedserver/menu, a11y/manual+automated, screenshotsdesktop/mobiledarklightestados. TestSQLrollbackunitno sustituyeQAHTTPpersistido. Registrarcomandos/results/hashes de fuentes/versiones/datafingerprints antes/después.

**Aceptación:** P-V mapeadas a implementación y evidencia, sin endpoints ni gráfico de evolución, sin fuga entre tenants y con RLS efectivo, sinattributioninventada, tsc/lint/buildpass o discrepanciasbloqueantes explícitas; límitesaceptados porpropietario. **Riesgos:** blankliveQA falsoPASS, acceso publicpendingdefaultfalse inexistente, Cursoravanzó/refnoWC. **Gatefinal:** entregarinformePASS/PASS_WITH_LIMITATIONS/BLOCKED según evidencia; esperarintegración/lanzamientopropietario. Phase05noiniciada.

## Matriz P-V vinculante

| Decisión | Tarea | Evidencia de aceptación futura |
|---|---|---|
|P-V01|T02|Barras/ordinal/exacto/keyboard|
|P-V02|T03|Dona/leyenda/denominador|
|P-V03|T02/T03|Togglesindependientes|
|P-V04|T01/T02/T03|Top5/cursor/taildesglose|
|P-V05|T04|Detalleúnico/cierre/ordenresponsive|
|P-V06|T01/T03/T04|Identidad/provenance/cobertura|
|P-V07|T03/T05|Móvilvertical sin overflow|
|P-V08|T04|Lecturadescriptiva sinacciones|
|P-V09|T05|Estados/race/retry|
|P-V10|T02/T05/T06|Shell/período/temas yregresiónResumen|

Mockups recibidos:4JPG (dosdesktop, móvilclaro compuesto yestadoscompuestos), mientras spec referenciaM01…M06. No afirmar seisarchivos individuales recibidos. Generar QA de todasvistasrequeridas propias; el materialno autoriza evolución, Últimos3meses, navmobileglobal ni matemática ilustrativa.
