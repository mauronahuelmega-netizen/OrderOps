# Pruebas y secuencia definitiva propuesta

## Matriz de pruebas pendientes: SQL y decoder de extensión

Todos los datos serán sintéticos. Esta revisión ejecuta únicamente validaciones offline de ejemplos y patch; ninguna de las pruebas SQL de esta tabla se ejecutó ahora.

| ID | Caso | Aserción obligatoria |
|---|---|---|
| T01 | Jornada 22:00–04:00, semana anterior 21:00–03:00 | Finalizaciones 01:00 quedan en fecha de apertura; parejas por tiempo transcurrido; UTC y etiquetas correctos |
| T02 | Abierta con 4h30 de exposición, previa cerrada de 6h | Último bin de 30 min con previo de 30 min; no comparar con una hora entera |
| T03 | Previa de 3h frente a actual abierta 4h | Gate raíz incompleto; previousMetrics/serie anterior null; ni extrapolación ni ceros |
| T04 | Cerradas de duración desigual | Conservar ambos totales; ventanas comunes válidas y cola explícita no comparable |
| T05 | Dos sesiones por fecha / cierre y apertura simultáneos | Correspondencia por IDs y ordinal estable; filtros de membership excluyentes; no duplicación |
| T06 | Sesión eliminada, apertura reemplazada, fuente no exacta | No inventar exposición; preservar snapshot/fecha y advertir unverified_session |
| T07 | Fuera de sesión con finalización fiable / sin fecha | Carril propio y etiqueta aprobada; sin sesión retrospectiva; sin fecha fuera del rango con aviso global |
| T08 | America/New_York 2026-03-08 y 2026-11-01 | Gap y doble 01:00 conservan eventos; ambiguo no comparable; offsets en claves |
| T09 | Australia/Lord_Howe cambio de 30 min; Asia/Kathmandu +05:45 | Ninguna suposición de offsets enteros ni días siempre de 24h |
| T10 | Cambio de zona negocio Buenos Aires → New York | Fecha/zone histórica no se recalculan; correspondencia civil incompatible neutral |
| T11 | Fin personalizado a mitad de mes, febrero corto, año bisiesto | Date mapping explícito cubre cada día exactamente una vez; mes demasiado corto mantiene gate legacy |
| T12 | Rango año 1/9999 y máximo admitido, muchas sesiones | Cálculo de factor antes de generate_series; ≤200 puntos sin truncar cohortes ni overflow |
| T13 | Evento exacto en boundary interno, asOf, cierre, microsegundo anterior/siguiente | Una pertenencia; final inclusivo mantiene sumas legacy; JS no cambia el cutoff |
| T14 | Empty observado vs ausencia de counterpart vs importe null | 0.00 solo vacío conocido; previous ausente null; ticket vacío null; unknown no se vuelve cero |
| T15 | Una venta reconciliada y una sin desglose | Ventas partial y sin delta; pedidos/unidades pueden comparar si exactos; ticket unavailable |
| T16 | Descuentos, ajuste, envío desconocidos; upsell y modificador | Sin nuevos reconocimientos monetarios; upsell una vez en dinero, excluido de mainUnits; delta no distribuye residual |
| T17 | Base previa cero / enormes numeric / decrease / igualdad | Absolute firmado correcto; percentage null/no_base; redondeo SQL decimal; no pérdida por Number |
| T18 | Finalizar/reabrir/cancelar/recompletar e idempotencia Phase 02 | Solo última finalización activa; efecto en revisión y serie; sin duplicados; snapshots coherentes |
| T19 | 2 tenants × owner/manager/admin/operator/viewer/super_admin | JWT reales: solo primeros tres del propio negocio; no negocio libre/cross-tenant ni bypass service_role/anon |
| T20 | Manipular p_cursor/asOf/revision y helper p_base | Stale/future/forged context rechazado o recalculado; nunca ampliar cohorte por JSON del cliente |
| T21 | Reapertura/finanzas/stock concurrentes contra lecturas | Cada respuesta internamente consistente; lectura anterior o posterior completa; sin combinación de snapshots |
| T22 | Rollback de captura y de DDL fallido, lock_timeout | No snapshot fantasma; DDL falla atómicamente; grants/endpoint anteriores conservados |
| T23 | 10k y 100k completados, varios negocios, hasta 200 puntos | EXPLAIN ANALYZE BUFFERS sintético; registro latencia p50/p95, filas/relecturas; presupuesto candidato p95≤1s en equipo documentado, sujeto a medición |
| T24 | JSON extension inválida, duplicate keys, referencias/rangos distintos | Decoder nuevo rechaza, sin fallback zip; decoder legacy acepta extras válidos |
| T25 | Sumatorias por ambos lados y granularity/coarsening | Importes/órdenes/unidades conservados; media calculada de cohorte, no suma de tickets |
| T26 | Cambio de revisión durante paginación | Cursor legacy falla stale; nueva serie y totals mismo revision/asOf |

Schedules de concurrencia propuestos: A finaliza mientras B lee; A modifica acuerdo mientras B lee; A reabre/cancela mientras B lee; A toma lock financiero y B operativo en orden inverso permitido para detectar ciclos; ambos negocios independientes; A aborta después de captura; lector largo contra DDL con timeout. Barreras deterministas en dos conexiones exclusivas aisladas, log pg_locks/SQLSTATE y timeouts, sin reiniciar servicios. No forzar un orden nuevo de escritura en la extensión. Reejecutar cinco schedules Phase 02 y agregar inversos, estrés moderado y SET CONSTRAINTS ALL IMMEDIATE. Cero deadlocks detectados no demuestra ausencia universal.

## Pruebas de interfaz futuras, trazadas al alcance

| Alcance | Verificación |
|---|---|
| R01/V01 | Hero ventas con mayor área real que un secundario, tres agrupados; captura escritorio claro/oscuro |
| R02/V04 | Desktop 2/3 gráfico + 1/3 lectura, móvil debajo; cuatro campos descriptivos y estado neutral |
| R03/V02 | Cualquier KPI/selector actualiza métrica única, gráfico/escala/lectura; período intacto; foco y aria-pressed |
| R04/V03 | Hover/foco/touch selecciona key backend; tooltip desktop, detalle móvil persistente; tabla accesible; huecos no conectados como cero |
| R05/D3 | Ocho períodos y tres accesos rápidos, esta semana inicial; URL validada persiste; próximas pestañas sin links |
| R06 | Avisos por indicador, importe parcial/unknown explícito; histórico sin fecha aparte; fuera sesión etiquetado |
| R07 | Ventas full-width, secundarios dos columnas, tercero última fila; touchtargets y tooltip sin overflow |
| R08 | Loading/error/empty/config_required/no_comparison; race A→B rápida no muestra datos A bajo título B; retry contextual |
| V05 | Shell real, branding negocio, tipografía/tokens/temas existentes; acento violeta local; sin cambios globales |

## Secuencia y gates

### P03-A — Contrato y SQL propios

Objetivo: producir puntos comparables verificables conservando Phase 02. Entrada: aprobación de este contrato/diseño y autorización de implementación backend, baseline/versión vigentes. Dependencias: snapshots/effective_facts, funciones de métricas/cutoff, contrato financiero actual. Archivos nuevos futuros: `lib/statistics/series-contracts.ts`, `series-read.ts`, `series.verify.ts`, migración propia completa con versión revalidada, fixtures/tests SQL propios. Existentes propios: `lib/statistics/read.ts`/contratos si requieren composición estrecha; no tipos compartidos. Esquema: helpers nuevos y wrapper propio; ninguna tabla/trigger nueva.

Tareas: extracción base verificada; implementar planner/membership/series/deltas; decoder estricto y pruebas negativas; preservar campos legacy por deep equality sin series; permisos privados y guards. Pruebas T01–T17/T20/T24–26, inicialmente estáticas/puras. Riesgo: horas/DST y costo de materialización. Aceptación: SQL completo revisable, contratos y ejemplos coherentes, sin placeholders/guard de pliego ni cambios fuera de scope. Salida: informe del SQL ejecutable con grants, hashes, versión y diff; **no aplicarlo sin autorización aislada explícita**.

### P03-B — Validación backend aislada

Objetivo: probar captura/métricas/series integradas. Entrada: aprobación del SQL final y ejecución aislada, verifier adversarial y live aprobados. Dependencias: API56321/DB56322 exclusivos, contenedores/red/volúmenes identificados, baseline119+3 verificado, cero colisiones de versión. Archivos: solo scripts/fixtures/tests/evidencia propios. No escritura fuera de esa instancia ni migraciones históricas editadas.

Tareas: ejecutar transacción nueva, catalogar funciones/grants/RLS/triggers sin diferencias operativas; T01–T26, regresión completa Phase 02, decoder por API real; benchmark y plan; cleanup sintético revisado. Pruebas de autorización con anon/service_role y perfiles originales de los dos negocios. Riesgos: deadlocks/timeouts/rendimiento/cursores; registrar límites de evidencia. Aceptación: sumas conservadas y gates respetados, no fuga tenant/rol, rollback atómico, no duplicados, respuesta consistente bajo concurrencia. Salida: PASS o PASS_WITH_LIMITATIONS justificadas aceptadas; fallos de seguridad/datos → FAIL. No abrir UI si series no pasa contrato.

### P03-C — Lectura y estado de período propios

Objetivo: D2 y período global sin motor oportunidades. Entrada: autorización expresa de interfaz Phase 03 y backend B aceptado. Nuevos archivos propios: `lib/statistics/commercial-reading.ts`, `period-url.ts` y verificadores; futuros `components/admin/statistics/statistics-controller.tsx`. Contratos: descripción pura de indicador+total válido; estado por negocio/período/metricKey/pointKey. Sin esquema nuevo.

Tareas: reglas descriptivas exactas, neutral, formato es-AR seguro, URL saneada de ocho períodos, requestKey/race discard, resets de selección incompatible. Riesgos: caché cross-tenant/estado viejo. Pruebas: los cuatro indicadores, zero/null/partial/no-base, cambio rápido de período/negocio, navegación atrás. Aceptación: ningún texto causal ni dato mezclado; selección persiste según D3. Salida: pruebas puras y contrato de estado aprobados.

### P03-D — Resumen visual propio

Objetivo: R01–R08/V01–V05. Entrada: C aceptada y autorización visual. Archivos nuevos previstos: `app/admin/statistics/page.tsx`; `components/admin/statistics/{statistics-summary,sales-hero-card,metric-card,sales-chart,point-detail,commercial-reading-panel,period-selector,data-notices,statistics-states}.tsx` y CSS module local. Reusar layout/shell sin editarlo. Contratos: DTO decodificado; gráfico SVG propio y tabla accesible, sin librería nueva; period/metric/point state único.

Tareas: estructura hero/agrupados; gráfica con claves/intervalos backend, escalas por indicador y comparación válida; estados/accessibilidad/temas; pestañas próximas. Pruebas de matriz visual anterior, viewport móvil/tablet/escritorio, teclado/lector de pantalla, overflow y contrastes. Riesgos: mockup contradictorio V01 y precisión formato. Aceptación: evidencia visual clara/oscura en anchos representativos, métricas y avisos correctos, sin efectos sobre navegación existente. Salida: ruta protegida y usable por URL directa.

### P03-E — Parche administrativo e integración controlada

Objetivo: acceso real en menú con B4. Entrada: autorización de los tres diffs, referencia Cursor efectiva/hashes sin conflicto, ruta D y backend listos. Archivos existentes: **solo** los tres del patch; no getAdminPermissions/contexto/normalizaciones compartidos. Contratos: viewStatistics por rol original y negocio en servidor; mantener permisos preexistentes. Sin cambios de DB.

Tareas: revalidar patch sobre base actual, aplicar solo autorizado, matriz antigua de permisos y snapshots de nav; sidebar/drawer y deep-link denies; pruebas Commercial Core/Promotores disponibles en baseline. Riesgo: cambios paralelos no publicados. Aceptación: exactamente 3 roles permitidos sobre su negocio, demás denied; permisos/flags anteriores intactos. Salida: informe Phase 03, commits propios/verificables según autorización; **no merge/push/deploy ni Phase 04/05**.

## Integración posterior con Commercial Core

Solo tras autorización separada de integración: referencia real y estado compartido acordados, inventario unión de migraciones/versiones sin colisiones, revisión de productores del acuerdo/desglose y ciclo de estados, orden de locks/FKs/triggers comparado, compilación y regresión en **otra base sintética independiente construida con la unión aprobada**, prueba roles/tenants e idempotencia, snapshot/cursor/series equivalencia, plan de despliegue y rollback aprobado. Las 119 base no prueban compatibilidad con la versión final de Cursor. Si un productor monetario nuevo necesita extender reconocimiento o si cambia un contrato compartido, presentar diff y aprobación: no adaptar silenciosamente ni convertir unknown a cero.

La revisión actual termina con la entrega del paquete. No se aplica el patch, no se ejecuta el pliego SQL y no se inicia ninguna de estas etapas automáticamente.
