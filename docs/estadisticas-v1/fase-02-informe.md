# Fase 02 — captura, métricas y comparaciones: revisión previa a ejecutar SQL

Estado histórico de preparación. La autorización posterior de ejecución SQL aislada y sus resultados se documentan en `validacion-sql-informe.md`; las restricciones y resultados de este documento describen el punto de control anterior.

Fecha: 12/10/2026. Worktree **OrderOps-Estadisticas**, rama **codex/estadisticas-v1**. Base auditada `0e430b08342b638b02392927ed560ea5e0950403`. Cursor mantiene su rama `cursor/commercial-core-v1-integration`; su worktree no se modifica. B1–B6 permanecen vigentes.

**Punto de control alcanzado: código propio, SQL y pruebas preparados. Ninguna migración de Estadísticas aplicada; ninguna prueba de escritura ejecutada. La captura/RLS/RPC no tienen todavía validación runtime. Fase 03 no iniciada.** Esta entrega no autoriza integrar, aplicar SQL, hacer merge/rebase/push ni desplegar.

## 1. Inventario revisable y contratos implementados

Las versiones siguientes son propuestas, no una reserva coordinada con Cursor; comprobar nuevamente unicidad al autorizar ejecución/integración.

| Archivo nuevo | Responsabilidad | Ejecución actual |
|---|---|---|
| supabase/migrations/20261013001000_statistics_v1_structures.sql | Cinco estructuras, índices/checks/FK, gate original de roles, RLS habilitada y revocaciones inmediatas | NO aplicado |
| supabase/migrations/20261013002000_statistics_v1_capture.sql | Captura/invalidation, composición/identidad, sesiones, acuerdo, revisión diferida, helper de reparto explícito | NO aplicado |
| supabase/migrations/20261013003000_statistics_v1_reads_security.sql | Políticas SELECT, helpers de métricas/fechas, vista invoker y RPC agregada | NO aplicado |
| supabase/tests/statistics-v1/capture-metrics.sql | Captura, métricas, historia, ciclos/rollback, cantidades e importes | NO ejecutado |
| supabase/tests/statistics-v1/security-money.sql | Dos negocios/seis roles, RLS/escritura, conciliación/céntimos/DST | NO ejecutado |
| supabase/tests/statistics-v1/concurrency-fixture.sql | Preparación sintética de pedidos/sesión para conexiones concurrentes | NO ejecutado |
| supabase/tests/statistics-v1/concurrency-cleanup.sql | Limpieza por IDs exactos del fixture de concurrencia | NO ejecutado |

El conjunto SQL/pruebas/runner tiene hashes SHA-256 por archivo y hash conjunto en `fase-02-evidencia.json`; `node scripts/statistics-v1/review-bundle.mjs` permite comprobarlo. Un cambio posterior invalida el recibo de aprobación propuesto.

Código propio en `lib/statistics`: `contracts.ts`, `money.ts`, `quality.ts`, `periods.ts`, `comparisons.ts`, `read.ts`, `server.ts`; pruebas `domain.verify.ts`, `read.verify.ts`. Fixture documental específico `fixtures/statistics-v1/phase02-cases.json`. No se modifica `types/database.ts`, permisos, rutas, navegación, acciones comerciales ni UI. El cliente server reutiliza contexto/Supabase existentes mediante interfaz RPC estrecha propia y decoder runtime, sin extender contratos compartidos.

Contrato `statistics.v1`: unión `ready`/`configuration_required`; negocio efectivo del perfil, moneda ARS, timezone, revisión, período/asOf, cobertura, cuatro indicadores, período anterior comparable, segmentos de sesión, buckets, productos, categorías y pendientes no atribuidos. Decimales como strings, cálculos puros con BigInt en centavos. Cantidades agregadas desconocidas como null; contadores JSON fuera del entero seguro rechazan la respuesta en lugar de perder precisión. Calidad `exact`, `partial`, `unavailable`, `empty`, con motivos y cantidades conocidas/desconocidas. El subtotal conocido parcial no se presenta como total completo; ticket promedio requiere el mismo universo íntegro.

Ocho presets, semanas desde lunes, rangos móviles consecutivos, custom inclusivo, máximo año9999, comparables sin solapamiento. Mes actual contra igual número de días del anterior; si el anterior no alcanza, comparación no disponible. Días de calendario con zona IANA, sin asumir días físicos de24h. Gaps y horas ambiguas DST se rechazan como corte civil; sesiones se comparan por tiempo físico desde apertura. Cambio de rango/sort/revisión/zona/asOf invalida cursor. Primera página5, límite20; RPC hace agregación SQL sin devolver pedidos/clientes individuales. La proyección de productos/categorías y evidencia prepara datos; no se implementan pantallas ni el motor de oportunidades de fases posteriores.

## 2. Las cinco estructuras analíticas

| Estructura | Clave, datos y autoridad | Integridad/índices |
|---|---|---|
| business_statistics_state | PK negocio; inicio observable de instrumentación, versión y revisión opaca. No contiene ventas alternativas. | FK negocio; revisión positiva; bloqueo por negocio diferido hasta commit. Revisión puede incrementarse varias veces por transacción, no es contador de ventas. |
| store_session_statistics_snapshots | PK sesión; negocio, apertura/timezone/jornada congelados, cierre observado, calidad/política. Solo altas nuevas; no backfill. | FK sesión/negocio; unique(sesión,negocio) propio. Eliminación de sesión elimina este snapshot, desvincula session_id en hechos; session_key/apertura/jornada ya capturadas se conservan. |
| order_item_statistics_snapshots | UUID; referencia a línea viva, pedido/negocio, generación/activa, identidad y nombres de producto/categoría al alta o sustitución real. | FK línea y compuesto pedido/negocio; unique(línea,generación); unique parcial línea activa. Al borrar línea se eliminan estos snapshots vivos; copias de finalización subsisten. Sin FK de catálogo histórico. |
| order_statistics_completions | UUID; pedido/negocio/ciclo, fecha real de transición, sesión y clasificación fecha, acuerdo/desglose/evidencia/composición congelados, vigencia e invalidación, flags de divergencia. | FK compuesto pedido/negocio y sesión/negocio propio; unique(pedido,ciclo), unique parcial pedido activo; índice negocio/jornada/finalización. Importes compatibles numeric14,2 y checks. Eliminación de pedido/negocio elimina hechos, conforme a la política operativa existente. |
| order_statistics_completion_items | PK finalización/línea; negocio, padre analítico, identidades/nombres congelados, principal/upsell, cantidad/precio/bruto/neto. | FK compuesto finalización/negocio; FK padre en la misma finalización diferida. Sin FK a línea operativa o catálogo: evita bloqueo inverso y conserva identidad ante borrado. Índice negocio/producto. |

`statistics_v1_effective_facts` es una **vista**, no una sexta estructura ni otra autoridad de ventas. Solo proyecta vigentes con pedido todavía completado y evidencia que coincide con fuentes actuales. Digest MD5 determinista detecta divergencias de composición; no es firma criptográfica de procedencia. El origen monetario sigue siendo `order_financials.agreed_total`; estado sigue siendo `orders.status`.

Identidad histórica se conserva aunque cambien nombre/categoría. No reconstruir categoría actual para líneas anteriores a instrumentación. Producto sin identidad conserva label de línea y agrupación por ID de línea, nunca fusionar por texto; categoría ausente aparece como «Sin categoría histórica». El cambio explícito de producto genera otra identidad de línea sin reescribir ciclos anteriores. SET NULL de catálogo conserva identidad histórica existente.

## 3. Triggers y superficies operativas afectadas

El diff propuesto sobre superficies compartidas consiste exclusivamente en **ocho CREATE TRIGGER nuevos dentro de migraciones propias**; todavía no existe en DB. No hay ALTER de columnas operativas ni reemplazo de RPC/trigger existente.

| Trigger | Tabla/eventos | Efecto analítico |
|---|---|---|
| statistics_v1_order_capture | orders AFTER INSERT / UPDATE OF status | INSERT completado no prueba fecha. Cambio real: invalidar ciclo anterior al salir de completed; capturar nuevo al entrar. |
| statistics_v1_item_capture | order_items AFTER INSERT/UPDATE/DELETE | Identidad/categoría de alta, generaciones ante sustitución; conflictos por cambios reales después de finalización. Valida tenant/padre y rechaza mover una línea entre pedidos. |
| statistics_v1_session_capture | store_sessions AFTER INSERT/UPDATE | Apertura/zona/jornada congeladas, observar cierre; cambios de apertura/negocio o cierre incompatible marcan conflicto. |
| statistics_v1_agreement_capture | order_financials AFTER INSERT/UPDATE/DELETE | Cambios efectivos de acuerdo invalidan calidad monetaria del activo; no reescribe montos ni ciclo. |
| statistics_v1_order_revision | orders AFTER INSERT/UPDATE/DELETE, constraint diferido | Revisión por negocio al terminar trabajo operativo. |
| statistics_v1_item_revision | order_items, mismos eventos, diferido | Igual; lookup de negocio por pedido. |
| statistics_v1_financial_revision | order_financials, mismos eventos, diferido | Igual; no tomar lock de pedido/sesión. |
| statistics_v1_session_revision | store_sessions, mismos eventos, diferido | Igual. |

Las capturas ejecutan en la transacción operativa incluso si el operador no puede consultar Estadísticas. Un error de integridad del trigger revierte el cambio operativo: requiere aprobación expresa de estas nuevas superficies y regresión de cada escritor antes de integración. Solo la nueva migración crea hooks; no se edita ningún archivo de Cursor.

## 4. Bloqueos y deadlocks

Orden propuesto de finalización: **UPDATE operativo del pedido → SHARE de sesión abierta verificable → insertar/invalidate hecho e hijos propios → revisión de negocio al commit**. Se toma `clock_timestamp()` después de resolver el lock de sesión. Acuerdo y composición se leen juntos en un SELECT MVCC, sin FOR UPDATE/SHARE sobre financials o líneas. El estado del pedido y unique parcial serializan sus ciclos; no usar max(cycle)+1 fuera de esa serialización.

Escritor financiero: **fila financiera y locks que ya tome su RPC → flag del hecho propio → revisión diferida**. No se agrega lock de orders/session desde este trigger. Mutación de línea: **línea operativa → snapshot/flag propio → revisión diferida**. Cierre de sesión: **sesión operativa → snapshot/flags propios → revisión diferida**; no bloquea orders desde nuestros helpers.

La revisión inmediata habría introducido un ciclo concreto: creación obtiene revisión y luego espera stock; cancelación obtiene stock y al capturar espera revisión. Se eliminó esa adquisición temprana mediante cuatro constraint triggers DEFERRABLE INITIALLY DEFERRED. No se altera stock ni el orden de locks existente. La FK del hijo analítico apunta al hecho, no a línea viva, para evitar hecho→línea frente a línea→hecho. Lectura financiera MVCC evita pedido→financial frente a financial→pedido.

**No se afirma ausencia total de deadlocks.** Quedan por ejecutar schedules reales de creación/stock/cancelación y RPC financieras, los schedules inversos, alta concurrencia y árbol combinado. Transacciones con múltiples negocios, otros triggers diferidos que bloqueen después de la revisión o `SET CONSTRAINTS ALL IMMEDIATE` pueden romper el orden esperado. Baseline revisado solo fuerza restricciones específicas de catálogo, no ALL. Exigir escritores por un negocio o revisión de orden determinista al integrar, y manejo existente de deadlock/serialización con retry de la transacción completa y clave idempotente; no inventar reintentos que dupliquen cobros.

Un cambio financiero concurrente puede quedar fuera del snapshot de finalización. La vista vuelve a comparar el acuerdo vivo y el digest y devuelve desconocido/conflicto cuando difieren, evitando publicar venta reconciliada con datos mezclados. El flag conserva divergencia observada (incluido ABA) hasta nueva finalización. La evidencia auditada de inicialización se usa conservadoramente; cambios de fuente posteriores no actualizan snapshots silenciosamente. Revisión diferida puede serializar commits del mismo negocio; medir latencia y número de eventos antes de producción.

## 5. Idempotencia, reapertura, cancelación e historia

- Mismo status no genera ciclo ni venta nueva. Dos finalizaciones concurrentes del mismo pedido se serializan en su fila; unique(ciclo) y unique activo son defensa adicional.
- Al salir de completed, el vigente pasa a inactive con fecha/motivo. Reapertura deja cero activos; refinalización captura acuerdo/composición/identidad/fecha de ese instante y nuevo ciclo; solo el último vigente aporta métricas. Cancelación excluye; no crea venta negativa ni revierte ledger desde Estadísticas.
- Fuente y hechos se confirman o revierten juntos, incluidos flags y revisión. Un rollback no deja finalizaciones ni revisión publicada. No existe writer RPC de Estadísticas para clientes.
- INSERT ya completed/importación no convierte created_at/updated_at/delivery_date en fecha de finalización. Pedidos completados sin evidencia capturada se excluyen de períodos y generan cobertura histórica desconocida global, incluso si no se puede determinar el rango afectado.
- Sesión verificable: snapshot instrumentado, tenant correcto, apertura consistente/no futura, abierta en el instante de transición. Jornada y timezone de esa apertura permanecen congeladas. No buscar sesiones históricas cercanas. Sesiones preexistentes sin snapshot no se rellenan a posteriori.
- Finalización fiable sin sesión verificable: fecha local y clasificación outside_session, presentación «Fuera de sesión verificada». Sin zona fiable se guarda finalización pero no fecha de período; RPC exige configurar zona y advierte cobertura cuando corresponde. Nunca usar zona por defecto como evidencia.

## 6. Reconciliación de importes, descuentos, upsells y envío

Regla objetivo: **V autoritativo = P neto identificado + E envío identificado**; bruto de líneas incluye precio efectivo de principales con modificadores incorporados y upsells reales una vez. Unidades solo `item_kind=product`; customization_snapshot no crea unidades o importe adicional. No sumar saldo cobrado/depositado, nominal y acuerdo entre sí.

El baseline tiene productor comprobable para inicialización financiera `mode=copy_total_price`, evento de auditoría y acuerdo. La implementación exige evento correcto y acuerdo coincidente, ausencia de cambios auditados de acuerdo, composición itemizada válida y **V=B=orders.total_price**. Solo entonces captura P=V/E=0, y netos por línea iguales al bruto. La mera igualdad de importes sin procedencia no demuestra desglose.

**Dependencia no resuelta por inferencia:** no hay contrato aprobado que identifique descuentos/ajustes/envío de otros productores. Si existe acuerdo pero no esa evidencia completa, el hecho conserva V, pero P/E/netos son null y ventas reconciliadas quedan parciales/no disponibles; pendientes exponen suma del acuerdo vivo de los pedidos no reconciliados. No repartir V−B como descuento, no declarar envío0 por ausencia de campo y no convertir importes desconocidos en cero.

`statistics_allocate_products` y la función pura homóloga aceptan **solo un neto de productos explícitamente identificado** y líneas conocidas. Reparto proporcional exacto en centavos, piso más residuos ordenados por resto y ID, suma conservada. Rechazan bases inexistentes, entradas inválidas/duplicadas/NaN/infinito. No se conectan automáticamente a acuerdos desconocidos. Fixture de descuento27 sobre bruto10+20 valida9+18; fixture de envío4 mantiene pendiente la integración del productor. Incorporar ese productor requiere presentar su contrato/diff, evidencia de procedencia y aprobación; no se modificó Commercial Core para crearlo.

Cantidad de producto o evidencia de período desconocida permanece null también en ranking/evidencia para reglas; cero se reserva a ausencia confirmada en universo conocido. Categorías reflejan solo importes conocidos; porcentajes se ocultan cuando la cobertura monetaria es parcial. No emitir ticket promedio ni variaciones porcentuales sobre universos incompletos. Base comparable0 devuelve delta porcentual no disponible, nunca infinito.

## 7. RPC, permisos y RLS

`public.statistics_v1_summary(p_period text, p_start_date date=null, p_end_date date=null, p_product_sort text='units', p_limit integer=5, p_cursor jsonb=null) → jsonb`.

SECURITY INVOKER, STABLE, search_path fijo. No parámetro libre de negocio: obtiene auth.uid/profile/role original. Permite owner/manager/admin del propio negocio; operator/viewer/super_admin excluidos, sin normalización. Tablas con RLS SELECT authenticated mediante gate privado, sin políticas/grants de DML. Anon/service_role sin EXECUTE del RPC ni SELECT de estructuras propias. Triggers/helpers escritores SECURITY DEFINER con referencias calificadas y ejecución revocada a PUBLIC/anon/authenticated/service_role; los helpers SELECT que requieren la vista se conceden solo authenticated y restringen tenant internamente. La cuenta postgres de infraestructura conserva autoridad administrativa, fuera del flujo de aplicación.

Vista `security_invoker=true, security_barrier=true` respeta RLS de fuentes y propias; gate de roles propio impide aprovechar bypass heredado de fuentes. Aun si fuentes compartidas concedieran lectura amplia, helpers de composición exigen el tenant original. Ningún payload expone nombres/teléfonos/direcciones de clientes.

RPC corta por asOf congelado y jornada fiable antes de agregar; paginación ligada a revisión y requestKey. Comparación parcial exige sesiones verificadas emparejadas por ordinal/jornada y duración suficiente del período anterior, con corte equivalente desde apertura. Fuera de sesión se usa corte civil comparable sin ambigüedad. Sesiones no verificadas o cobertura histórica desconocida impiden comparación. Bucket horario incluye la hora corriente y puede extenderse tras medianoche para sesión nocturna; diaria/semanal/mensual se agrupa para máximo200. Sumas de buckets/paginación y performance todavía requieren prueba runtime.

## 8. Matriz de conflictos potenciales con Cursor

| Superficie | Diff de esta entrega | Riesgo / condición de integración |
|---|---|---|
| supabase/migrations | Solo3 archivos nuevos; sin reemplazo de históricos | Versiones únicas, mismos tipos/columnas base y revisión de hooks; reconstruir árbol combinado en tercera instancia propia. |
| orders; create_order; transition_order_status; stock | Nuevos triggers propuestos, no aplicados; ninguna RPC fuente editada | Latencia/lock order/validaciones; regresión de estado/stock/cancelación/importación y todos los escritores. |
| order_items/customization/product catalog | Snapshot/flags propuestos | Padre/tenant, reemplazo de producto, FK SET NULL, JSON de modificadores. Los rechazos nuevos requieren revisar paths de importación. |
| order_financials; initialize/set_agreed_total; finance_audit_events | Trigger de flags + lectura de evidencia; sin edición de contrato comercial | Cambios de procedencia auditada, total/acuerdo/desglose o locks invalidan prueba conservadora. Contrato de descuento/envío pendiente. No leer ledger como ventas. |
| store_sessions; lib/store-sessions/admin.ts | Hooks nuevos propuestos; ninguna edición de operación | Apertura/cierre, writers que actualicen apertura/tenant, sesiones legacy no verificadas, DELETE mantiene clasificación histórica. |
| products/categories; Promotores | Solo lectura al alta y copias propias; ninguna edición de sus archivos | Rename/reclasificación/borrado no reconstruyen historia; test catálogo integrado obligatorio. |
| types/database.ts | SIN DIFF | Adaptador propio evita regenerar shared types. Generación futura requiere patch mínimo revisado. |
| lib/admin/permissions.ts/context.ts; shared Supabase clients | SIN DIFF, reutilización en wrapper propio | Gate utiliza role original. Cambios futuros de modelo multi-negocio/contexto requieren nueva revisión. |
| navegación/shell/layout/actions/settings/dashboard/CSS | SIN DIFF | UI y permisos compartidos solo en fase posterior aprobada. |
| package.json/lock/tsconfig/eslint raíz | SIN DIFF | Parser SQL instalado en runtime ignorado; ESLint propio. No arreglar configuración raíz compartida en esta tarea. |
| supabase/config.toml; .env; scripts/commercial-core; Docker Cursor | SIN DIFF / sin operaciones de escritura | Nunca ejecutar gate comercial ni reset/restart/seed en proyecto de Cursor. |
| docs/audits | Untracked preexistente, excluido de commits | No atribuir ni modificar trabajo ajeno. |

El inventario completo de archivos compartidos previstos para fases posteriores permanece en `dependencias-cursor.md`. No se realizó comunicación a otro chat ni cambios sobre Cursor. Antes de integrar: fijar HEADs, revisar diffs/firmas/RLS/locks, aprobar productores faltantes y probar rebuild/upgrade del árbol combinado en **otra** instancia aislada. No derivar permiso de integración de esta autorización.

## 9. Pruebas y condiciones de ejecución

**Ejecutadas sin escribir DB:** pruebas puras de dominio (1111 casos de conservación monetaria más períodos/DST/calidad/cortes/cero), decoder/adapter con cliente falso (roles, tenant, payload inválido, errores sanitizados); TypeScript `--noEmit --incremental false`; ESLint de scripts propios; gate de aislamiento adversarial; prueba negativa del runner que rechaza recibo ausente antes de Docker/SQL; parser offline PostgreSQL17 de67 sentencias exteriores de migración,7 cuerpos LANGUAGE SQL y4 archivos SQL de pruebas. Detecta cinco tablas/ocho triggers y rechaza DML/backfill top-level/ALTER de fuentes/reemplazos compartidos y escrituras de fuentes dentro de los helpers. El parser **no compila los7 cuerpos PL/pgSQL**, no valida resolución de tablas/tipos/privilegios ni garantiza semántica DB.

**Preparadas, NO ejecutadas:** suite SQL de captura/monetaria/ciclos/rollback y suite de permisos con filas no vacías en ambos tenants; runner de concurrencia con procesos PostgreSQL independientes y barreras de espera real para cuatro schedules. Las pruebas unitarias SQL revierten todas sus escrituras. Concurrencia requiere persistir temporalmente IDs sintéticos exactos; limpia solo tras éxito y terminación de sesiones, preserva fallo para inspección.

**Pendientes y necesarias para garantía completa:** compilar/aplicar el conjunto aprobado; ejecutar dichas suites; schedules inversos/estrés; integridad compuesta y borrados/cambios de identidad; fechas/zonas faltantes y cambios posteriores; cursors, varios segmentos comparables, suma de buckets, datos legacy y rollback de migración; performance/EXPLAIN y regresiones de RPC reales de stock/Commercial Core. Su detalle está en el README de pruebas y fixture Phase02. No se ejecutó build que requiera conexiones o variables compartidas, ni E2E/UI de fases posteriores. ESLint raíz tiene el problema heredado descrito en Fase01; no se modificó para ocultarlo.

Condiciones para autorizar operaciones: revisar el hash exacto y las superficies/triggers; aprobación expresa de SQL **y** pruebas de escritura; repetir gate de identidad; verificar119 baseline y versiones libres; registrar hashes y aplicar solo3 archivos en orden con parada ante error; verificar objetos/grants/policies y registro de versiones antes de tests. No usar `supabase db reset`, db push, configuración raíz ni conexión remota. Runner requiere recibo local ignorado de aprobación/alcance/hash/proyecto; hoy no existe. No aplica migraciones automáticamente.

## 10. Evidencia de aislamiento y secuencia segura

Proyecto exclusivo `orderops-statistics-v1-test-74718de66a41`: **API http://127.0.0.1:56321 / DB127.0.0.1:56322**; cinco contenedores y dos volúmenes propios DB/Storage, red y etiquetas verificadas; no volumen/red compartidos con recursos ajenos. Configuración propia mantiene seeds/migraciones automáticos desactivados; signer exclusivo. Runtime y credenciales ignorados. La evidencia sanitizada no incluye claves/tokens de acceso.

Verificación actual vía SELECT dentro de BEGIN READ ONLY: **119 migraciones base,0 migraciones de Estadísticas,0 de las cinco tablas nuevas y0 pedidos**, identidad privada coincide. No se hizo login Auth, seed, smoke de escritura, reinicio ni cambios en base compartida/producción. El gate Docker solo inspecciona recursos y SQL de identidad/conteos del contenedor propio.

Secuencia futura, solo tras autorización:

1. Aprobación expresa del conjunto exacto, interfaces operativas afectadas y pruebas de escritura; fijar commit/hash y comprobar que Cursor no introdujo colisión de versiones/contratos.
2. Repetir gate de solo lectura, conservar evidencia/configuración119 y comprobar que no hay fixtures anteriores en el proyecto exclusivo.
3. Aplicar y registrar cada nueva migración revisada en orden; ante error detener la operación y revisar rollback, sin modificar escritor compartido ni desactivar triggers.
4. Compilar/inspeccionar objetos y permisos, ejecutar suites SQL rollback y concurrencia; después completar matriz runtime/regresiones/performance. Fallos invalidan la garantía y se documentan; correcciones de superficies compartidas exigen diff aprobado.
5. Entregar resultados runtime y solicitar autorización separada para Fase03. Integración con Cursor/Commercial Core requiere condiciones de la matriz y permiso independiente; no merge/push/despliegue automático.

## Estado Git y límite de entrega

Los commits locales se separan en dominio/contratos/fixtures, SQL propuesto, pruebas/tooling propio, e informe/evidencia. El detalle de hashes se entrega en el chat y puede comprobarse en `git log`. `docs/audits/` permanece untracked y fuera de commits. Ningún cambio de archivos comerciales, Promotores o contratos compartidos. Esta entrega termina en el punto de revisión SQL; **esperar autorización expresa para aplicar y probar escrituras**, sin avanzar automáticamente a Fase03.

Commits de preparación: `313fbe4` dominio/contratos, `4d5f8f7` SQL no aplicado, `72937b9` suites/tooling. Hash del conjunto SQL y pruebas revisable: `65b3d9499ce6ad60e3da40dd2b0278330d98ae7225c4aef926b0e7d379869f64`. El commit de este informe/evidencia se identifica en la entrega final.
