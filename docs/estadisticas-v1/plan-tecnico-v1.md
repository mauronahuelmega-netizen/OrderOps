# OrderOps — Auditoría y plan técnico de Estadísticas V1

> Documento histórico de auditoría y propuesta inicial. Las decisiones posteriores B1–B6 y el plan aprobado están en `plan-definitivo.md`. Este archivo no autoriza implementar ni sustituye los contratos definitivos.

Fecha: 12 de octubre de 2026, America/Buenos_Aires.
Estado: propuesta para revisión; implementación NO autorizada.
Fuente funcional: especificación V1 adjunta por el usuario el 12/10/2026.
Worktree: `OrderOps-Estadisticas`; rama: `codex/estadisticas-v1`.
HEAD auditado: `0e430b08342b638b02392927ed560ea5e0950403`.

## 1. Resumen ejecutivo

Estadísticas V1 es viable con la arquitectura existente, pero no como una reutilización de las cifras actuales del dashboard. El nuevo módulo necesita un contrato de finalización comercial, conservación histórica de identidad/categoría y reconciliación del importe comercial. Estas son dependencias de integridad, no nuevas funciones de producto.

La interfaz y el motor determinístico pueden desarrollarse en carpetas propias. Para datos fiables a futuro se recomienda persistencia aditiva y transaccional de hechos comerciales y snapshots, con consultas agregadas en PostgreSQL. El historial sin evidencia no debe completarse por inferencia. La interfaz podrá informar cobertura parcial; esto no equivale a cumplir íntegramente V1 sobre todo el historial.

Hay decisiones que requieren aprobación: importe comercial y envío, clasificación de upsells, jornadas y comparaciones, matriz de acceso, y cambios compartidos/migraciones. No se escribió código ni SQL de implementación, no se aplicaron migraciones ni se modificaron datos. Este documento es el entregable de planificación.

## 2. Estado actual verificado

### 2.1 Alcance y métodos

Se revisaron rutas, loaders, permisos, tipos, contratos de personalización y migraciones del worktree autorizado, más la auditoría antecedente. No se modificó ni se inspeccionó el contenido del worktree de Cursor. `git worktree list` confirmó ambas ramas sobre el commit solicitado al comenzar.

Se consultó `supabase_db_OrderOps` con `psql -X`, `ON_ERROR_STOP=1` y transacciones `BEGIN READ ONLY … COMMIT`. Se confirmó `transaction_read_only=on`. Solo se leyeron catálogos, definiciones y conteos agregados; no se ejecutaron RPC de negocio, seeds, tests SQL ni migraciones. Las transacciones sucesivas no constituyen un snapshot global único.

Hay además contenedores `orderops-ledger-rebuild`; no se los usó ni se asumió que sean un entorno aislado disponible para esta tarea. El worktree no contiene `.env.local` ni `node_modules`; el contenedor auditado es la instancia local antecedente, no un backend cuya conexión con un runtime de este worktree se haya verificado. No se validaron producción, pantallas autenticadas, responsive ni permisos mediante sesiones reales.

Estado inicial de Git: `docs/audits/` ya estaba untracked. Se conserva sin modificar. No se encontraron instrucciones `AGENTS.md` aplicables en la búsqueda del árbol de proyectos; se revisó `.cursorrules` como referencia arquitectónica.

### 2.2 Inventario y evidencia

| Área | Estado | Evidencia verificada |
|---|---|---|
| Arquitectura | Implementada en código | Next App Router, React, TypeScript estricto, Supabase SSR; versiones declaradas en `package.json`: Next ^16.2.9, React ^19.2.7, TS ^5.8.3. No son versiones runtime certificadas. |
| Admin y tenant | Implementados en código | `lib/admin/context.ts`: usuario autenticado → perfil → `business_id`; layout protegido y shell existentes. |
| Navegación | Implementada en código | `components/admin/admin-nav-config.ts`: Pedidos, Cocina condicional, Asistencia, Productos, Configuración. No existe Estadísticas. |
| Dashboard | Implementado, semántica distinta | Loader `lib/orders/admin.ts:91`; ventanas en `lib/orders/analytics.ts:279,358`; usa creación y sesión activa/última cerrada/fallback. |
| Ventas y ticket actuales | Implementados, incompatibles con V1 | `analytics.ts:444,450`: todos los no cancelados, incluidos activos. Ranking actual `:460` agrupa nombres y raíces del árbol. |
| Estado de pedidos | Implementado | pending/preparing/ready/completed/cancelled; `transition_order_status` actualiza estado y stock. |
| Fecha comercial | Inexistente como columna autoritativa | Esquema vivo y SQL sin `orders.completed_at` ni relación persistida de pedido con sesión; `settled_at` pertenece al cierre financiero. |
| Timeline | Parcial para análisis histórico | Action de estado → RPC → inserción separada de evento (`orders/[id]/actions.ts:188,271`). El error del evento no revierte la transición. Loader de detalle limita 30 eventos. |
| Finanzas de pedidos | Implementadas en SQL/base; frontend incompleto | `order_financials.agreed_total`, estados y ledger presentes; tipos públicos no incluyen esta tabla ni `composition_status`/timezone. |
| Nulabilidad | Desalineación comprobada | SQL/base permiten `total_price`, teléfono y entrega nulos bajo contratos históricos; `types/database.ts:446` y loader aún declaran valores obligatorios. |
| Personalizaciones | Implementadas | Padres product, hijos upsell, extras dentro del precio padre, snapshots V1/V2 con producto y precio. No contienen categoría histórica. |
| Identidad | Parcial | `product_id` nullable y FK SET NULL al borrar; snapshot de personalización preserva ID en algunas líneas. Sin identidad histórica universal para todas las líneas. |
| Categorías históricas | Inexistentes en líneas auditadas | Hay categoría actual de catálogo; no snapshot de categoría en `order_items` ni en los tipos de personalización. |
| Jornadas | Operación implementada; histórico analítico pendiente | `store_sessions` conserva apertura/cierre; fallback de analytics usa Date local del proceso. No es un contrato IANA de días estadísticos. |
| Descuentos/envío | Sin componentes separados localizados | `create_order` suma `unit_price × quantity` de padres/hijos. No se encontró tarifa de envío ni descuento global en su contrato; `agreed_total` puede diferir del total técnico. |
| Comparaciones, gráfico V1, oportunidades | Inexistentes | No hay módulo Estadísticas, selector histórico, agregados V1 ni motor de sus seis reglas. |
| Tests | Infraestructura parcial | Scripts `*.verify.ts` con node:assert/tsx, SQL de Commercial; `package.json` no tiene un comando general de tests. No hay librería de gráficos declarada. |

### 2.3 Corte de base observado

- 119 migraciones registradas y 119 archivos locales; última versión `20261012030000`. Se leyeron versiones; no se certificó igualdad de cuerpos/checksums ni reproducibilidad de un rebuild.
- Dos pedidos, ambos pending; cero eventos de pedidos y cero operaciones financieras.
- Dos líneas, una sin `product_id`; ninguna con customization snapshot.
- Dos registros financieros open.
- Dos configuraciones de negocio, una sin timezone.
- `authenticated` tiene SELECT en `order_financials`; existe RLS por miembro del negocio. Las revocaciones iniciales del SQL se siguen de grants de lectura: no interpretar la revocación aislada como ausencia de acceso.
- Las definiciones vivas de create_order y transition_order_status no referencian completed_at ni order_events.

Estos agregados privilegiados verifican estructura y muestra, no acceso de usuarios. No hay completados para contrastar ventas, reaperturas, descuentos o distribución histórica.

La auditoría antecedente corresponde a `3a3abb43…`, otra copia y 118 migraciones al cierre. Sus decisiones históricas P1–P16 no reemplazan la especificación actual. En particular, P11 sobre envío y las reglas de jornadas se deben reconciliar expresamente. No se encontró en las fuentes revisadas un contrato ejecutable de reparto proporcional de descuentos de pedido.

## 3. Brechas y viabilidad

| Brecha | Consecuencia | Propuesta nueva |
|---|---|---|
| Finalización no atómica/persistida | No se puede ubicar con confianza un completado en un período | Hecho de finalización capturado en la misma transacción del cambio de estado. |
| Reapertura y nueva finalización | Recuento incorrecto si se usa primer evento | Invalidar finalización vigente al salir de completed; registrar nueva finalización al volver. |
| Valores financieros mutables | Leer agreed_total actual puede reescribir períodos antiguos | Congelar valor/composición y fuente del importe en cada finalización válida. |
| Falta identidad/categoría de venta | Borrados/renombrados/reclasificaciones distorsionan ranking | Snapshot inmutable al crear línea, independiente de FK de catálogo. |
| Importes desconocidos | Cero aparente y ticket sesgado | Calidad por métrica; no convertir null en cero ni dividir subtotal por todos los pedidos. |
| Timezone faltante | Corte temporal incorrecto | Estado de configuración pendiente; sin fallback silencioso a UTC o Buenos Aires. |
| Jornadas no documentadas históricamente | Sesiones cruzando medianoche sin día comercial definido | Acordar la política y persistir su versión; no reconstruir historia con horarios actuales. |
| Loader operativo sin agregación/paginación histórica | Truncamiento por `max_rows=1000` y carga de datos personales | Una RPC agregada específica, sin el loader de pedidos ni timeline de 30 eventos. |
| Tipos desalineados | Conversión errónea de legacy y de importes | Tipos locales para el módulo y actualización quirúrgica de tipos compartidos aprobada. |

El bloque visual es viable. La certificación integral depende de resolver estas brechas y disponer de base aislada para las pruebas de escritura.

## 4. Contratos comerciales propuestos

Todo este apartado es diseño nuevo pendiente de aprobación; no describe cálculos ya implementados.

### 4.1 Universo y finalización

Un pedido entra si pertenece al tenant autorizado, tiene estado actual completed y finalización comercial autoritativa dentro de `[inicio, fin)`. Pending/preparing/ready/cancelled quedan fuera. Completar sin transición real es idempotente y no cambia la fecha. Salir de completed invalida el hecho vigente; recompletar genera fecha y snapshot nuevos. No se usa creación, entrega, cierre de sesión, pago ni settled_at como sustituto.

Propuesta preferida: tabla propia de hechos por pedido/ciclo y trigger aditivo sobre transición real de estado, que cubra tanto RPC como escrituras directas. Conservar hechos previos para trazabilidad, pero agregar solo el vigente y completed. Captura con reloj de PostgreSQL y orden por ciclo, no por UUID aleatorio. No aceptar timestamps comerciales suministrados por el cliente. Un pedido debe aportar como máximo un hecho vigente.

La captura debe cubrir INSERT completed/importaciones: no asignar ahora a un completado histórico importado. Esas vías requieren evidencia explícita o quedan sin fecha confirmada. La marca de inicio de instrumentación se documenta; no backfill por created_at ni por MAX de eventos sin demostrar integridad del ciclo.

### 4.2 Importe y reconciliación

Propuesta: Ventas = suma de valores comerciales conocidos y congelados al completar, incluyendo envío solo si su componente está explícitamente identificado. Mantener productos netos y envío distinguibles en el contrato. Esto conserva la intención antecedente de incluir envío sin atribuirlo a productos; la decisión final requiere aprobación.

Para pedido itemized nativo: base de productos `B = Σ(quantity × unit_price)` sobre todas las líneas monetarias, con extras ya integrados en el padre. Si hay contrato financiero, agreed_total conocido es candidato a valor comercial acordado, no a cobro. Si no hay registro financiero y la composición es íntegra, el total técnico generado por create_order es candidato válido. Si existe contrato financiero con agreed_total desconocido, no reemplazarlo silenciosamente con el total técnico. Para legacy_unknown con valor acordado conocido puede conocerse Ventas, pero no unidades ni productos.

Una diferencia entre agreed_total y B no demuestra por sí sola descuento ni envío. Antes de distribuirla debe quedar confirmada como ajuste de productos o separarse su componente de envío. En ausencia de esa evidencia, la atribución monetaria se marca no reconciliable; no se inventa una categoría para un importe cuya naturaleza es desconocida.

Una vez identificados: `V = P + E`, donde P es venta neta de productos y E envío. Reparto de P por peso de importe bruto de línea: `P_i = P × B_i / ΣB_i`. Redondear en unidades monetarias mínimas y distribuir el residuo por mayor resto fraccionario, desempate por ID de línea. Ejemplo B de 1.000 + 2.000 y P de 2.700: 900 + 1.800. Si ΣB=0 y P>0, no repartir; informar importe sin atribución verificable. P=0 admite atribución cero. No aplicar reparto a componentes desconocidos.

Pagos, saldo, señas, reembolsos de caja, transferencias y liberaciones no se suman/restan automáticamente de Ventas. Un reembolso no es una modificación comercial del precio. Una corrección comercial autorizada requerirá contrato separado y versionado de la venta; V1 no crea esa acción. Suscripciones y comisiones de OrderOps nunca participan.

Usar numeric en PostgreSQL y cantidades monetarias exactas/serializadas en el transporte; convertir para presentación con límites seguros. No agregar dinero con floats. Confirmar moneda del negocio antes de mostrar símbolos; la UI actual formatea es-AR pero eso no demuestra un campo de moneda multiempresa.

### 4.3 Indicadores y calidad

| Indicador | Definición |
|---|---|
| Ventas | ΣV de completados del período; exacto solo si todos tienen importe verificable. |
| Pedidos completados | Count distinto de pedidos con finalización vigente en período. |
| Ticket promedio | Ventas / pedidos completados sobre el mismo universo, únicamente con importes completos. Sin pedidos: null y «Sin pedidos completados». |
| Unidades vendidas | Σquantity de líneas de productos principales; extras/modificadores no aportan unidades. |

Propuesta de upsells: sus cantidades no aportan unidades principales; su importe sí integra la venta y se muestra bajo la identidad del producto vendido en el ranking por importe. Explicar esta diferencia en ambos criterios. Requiere confirmación porque un upsell es un producto real asociado y la especificación no define su tratamiento exacto.

Separar `exact`, `partial`, `unavailable` y `empty`. Si falta importe de un pedido fechado, mostrar subtotal como «Ventas con importe conocido», no como total exacto, y ticket no disponible. Unidades parciales se rotulan como conocidas. Fecha desconocida impide asignar el pedido a períodos: informar cobertura histórica a nivel negocio, sin afirmar que pertenezca al rango consultado. Comparaciones/oportunidades se deshabilitan cuando la calidad afecta los datos implicados. Cero se usa solo para ausencia verificada de actividad con cobertura suficiente.

### 4.4 Períodos, jornadas y comparables

Reglas recomendadas para fechas civiles, sujetas al contrato bloqueante de jornada:

- Zona IANA del negocio; intervalos semiabiertos UTC derivados de límites locales. Semana inicia lunes. Fecha final personalizada inclusiva en UI, exclusiva como inicio del día siguiente en consulta.
- Hoy: inicio local → corte único de consulta; Ayer: día local anterior completo. Esta semana/mes: inicio lunes/día 1 → corte.
- Últimos 7/30 días: incluyen el día actual y los 6/29 anteriores, hasta el corte; etiqueta indica que incluyen un día en curso.
- Mes anterior: mes calendario completo. Personalizado: rechazar fechas futuras, inválidas o invertidas; si incluye hoy, truncar al corte y rotular parcial. Sin límite histórico arbitrario; límite de buckets y timeout protege consultas.
- Hoy contra igual tramo del día anterior; semana contra mismo tramo desde el lunes anterior; mes contra mismo tramo desde el día 1 del mes anterior. Usar tiempo local transcurrido, resolviendo DST explícitamente. Si el mes anterior no admite el tramo por tener menos días, conservar íntegro el período seleccionado y mostrar «Sin período anterior de duración equivalente»; no comparar duraciones distintas ni recortar silenciosamente el KPI actual.
- Mes anterior completo contra un intervalo inmediatamente anterior de igual cantidad de días civiles, indicando fechas concretas; no contra un mes de diferente duración sin aclaración. Rango cerrado personalizado y ventanas móviles: intervalo contiguo anterior con igual duración comercial; en móviles desplazar por 7/30 días el corte y el inicio.
- Comparación cerrada: mismos días comerciales completos. Comparación parcial: mismos días y tiempo local transcurridos. Los cambios de hora requieren pruebas; no multiplicar simplemente por 86.400 segundos.

Para jornadas que cruzan medianoche no se puede asumir este calendario: falta decisión histórica verificable sobre atribución. Recomendación a revisar: asignar la venta por su última finalización y conservar jornada/sesión y fecha comercial de esa finalización; usar límites comerciales estables y versionados para períodos, sin filtrar exclusivamente por sesión actualmente abierta. Confirmar si fecha comercial es la apertura de sesión o un corte configurado. Si no hay evidencia de una jornada histórica, mantener «Jornada no confirmada» y suspender concentración por jornadas; no fabricar una sesión por proximidad temporal.

No aprobar fórmulas temporales como definitivas hasta resolver esta elección. Sesiones manuales de duración desigual no son comparables por el simple número de sesiones: se requieren ventanas transcurridas equivalentes o estado sin comparación.

Granularidad propuesta: Hoy/Ayer por hora; 2–31 días por día; 32–180 por semana; más de 180 por mes. Máximo 200 buckets: agrupar meses si hace falta. Incluir intervalos vacíos como cero solo con cobertura exacta. Horas repetidas por DST se distinguen por offset. Buckets inicial/final parciales rotulados. Σventas/pedidos/unidades coincide con tarjetas; ticket de cada bucket se divide, nunca se suma ni promedia sin ponderación.

Variación absoluta `actual − anterior`; porcentaje solo si anterior >0. Base cero: «Sin base comparable», con diferencia absoluta si válida. Sin ticket válido en cualquiera de los períodos no calcular variación. No atribuir causalidad ni convertir todo aumento en señal positiva.

## 5. Dependencias con Cursor y estrategia de conflictos

| Área compartida | Intervención propuesta | Coordinación |
|---|---|---|
| `types/database.ts` | Tipos de RPC/hechos y nulabilidad necesaria | Patch pequeño revisado; no regeneración masiva que invada tipos commercial. |
| `components/admin/admin-nav-config.ts`, `lib/admin/permissions.ts` | Entrada Estadísticas y capacidad sobre roles existentes | Acordar matriz y patch mínimo. |
| `supabase/migrations/` | Archivos nuevos aditivos, identificadores únicos | Reservar versiones con Cursor; revisar antes de aplicar. |
| Pedidos/catálogo/finanzas públicos | Hooks transaccionales y snapshots, sin reemplazar RPC completas | Aprobar contratos y verificar todas las vías de escritura. |
| `lib/orders/analytics.ts`, componentes del dashboard | Sin cambio previsto | Métricas nuevas en `lib/statistics/`, no alterar operación. |
| Memoria global | Sin cambio previsto | Documentación concentrada aquí. |
| `lib/commercial/`, `app/commercial/`, `app/promoter/`, esquema commercial | Sin cambio ni dependencia de cálculo | Mantener propiedad de Cursor. |

No merge/rebase/cherry-pick/push/deploy. La aprobación del plan no debe interpretarse como autorización para aplicar migraciones en la base compartida o integrar ramas. Antes de integración comparar HEADs y revisar diff de áreas compartidas. Una contribución existente de Commercial Core en el commit base no convierte ese esquema en fuente de las ventas gastronómicas.

## 6. Arquitectura propuesta

### 6.1 Frontend

- Ruta `app/admin/(protected)/statistics/page.tsx`, entrada visible «Estadísticas», inmediatamente después de Pedidos en navegación. Reutilizar shell, AdminPageLayout, cabecera y tokens.
- Componentes nuevos en `components/admin/statistics/`, cada uno con CSS module: StatisticsView, PeriodSelector, MetricCard, EvolutionChart, ProductRanking, CategoryDistribution, OpportunityCard y CoverageNotice.
- Estado compartido de período/sección en URL; apertura predeterminada Resumen/Esta semana. Métrica del gráfico y orden del ranking conservados mientras sean compatibles. Rango personalizado se aplica al confirmar ambas fechas.
- Server Component resuelve contexto y carga inicial; GET propio `statistics/data/route.ts` para actualizaciones. Cancelación con AbortController y comprobación de requestKey; una respuesta vieja nunca reemplaza un período nuevo.
- Renderizar tarjetas, gráfico y oportunidades del mismo payload/version. Estado de carga local, error con reintento, acceso denegado sin datos, vacío y calidad parcial explícitos. Durante cambio de rango ocultar o marcar como anteriores los datos previos, sin nuevas fechas con cifras viejas.
- SVG propio para el único gráfico; cuatro controles, tooltip/foco y tabla textual equivalente. No dependencia nueva necesaria para V1. Barras accesibles para categorías y ranking. Valores y flechas/textos además del color; navegación teclado, focus visible, contrastes y objetivos táctiles.

### 6.2 Dominio y backend

Módulos nuevos: `lib/statistics/{contracts,periods,comparisons,opportunities,presenter}.ts` y `server.ts` server-only. La respuesta tipada contiene período y comparable resueltos, timezone, política/versiones, generatedAt/asOf, calidad/cobertura por métrica, cuatro indicadores, deltas, buckets, ranking paginado y categorías. Las oportunidades se calculan de ese mismo conjunto de agregados actuales/anteriores.

RPC nueva de lectura `public.statistics_v1_summary`, estable, con agregado sobre fuentes comerciales; una sentencia/snapshot consistente para todas las secciones. No descargar pedidos personales ni todos los eventos al navegador. SQL preagrega líneas a pedido antes de joins para evitar multiplicar importes/recuentos. Usar left joins para no desaparecer completados sin líneas/finanzas. Incluir productos ausentes en el actual/anterior con ceros verificables para detectar caídas hasta cero.

La RPC valida auth.uid, rol permitido y tenant derivado del perfil, y valida límites temporales. El businessId no se confía al cliente. Usar SECURITY INVOKER y RLS para lecturas; helpers/trigger de captura con privilegios mínimos, search_path fijo, sin grants de escritura al usuario sobre snapshots. Si el acceso owner/manager no coincide con las policies de lectura general actuales, aplicar guard también dentro de la RPC y RLS específica en tablas nuevas. No usar service_role en el endpoint de estadísticas.

Persistencia preferida: tablas nuevas `order_statistics_completions` y `order_item_statistics_snapshots`, con business_id, FKs compuestas/validaciones de tenant, identidad UUID conservada independiente del catálogo, categoría y nombres de venta, importes exactos, fuente/calidad y versión temporal. Nombres definitivos en diseño SQL posterior. Índices tenant/fecha comercial/estado vigente y tenant/pedido; unicidad del hecho vigente. Snapshot de categoría al alta de línea, no al completar si ya pudo cambiar de categoría.

No volver a leer el catálogo actual para reclasificar ventas. El nombre de agrupación puede ser el snapshot de la venta más reciente del rango, con orden estable; misma identidad aunque renombrada. IDs ausentes no se fusionan por nombre: filas/bloque «Sin identidad histórica confirmada», sin reglas de crecimiento para ellos. No hay modelo de variantes independientes con parent_product_id verificado; agrupar configuraciones bajo ID principal ya disponible, sin inferir familias por texto.

Distribución por categorías: denominator P, venta neta de productos; envío separado y nunca categoría. Categoría histórica ausente → «Sin categoría histórica» con importe verificable, incluida en el denominador. Componentes no atribuibles se rotulan aparte. Σcategorías + importe de productos sin distribución = P; P + envío = Ventas, solo cuando los tres componentes son conocidos. Si P=0, participación no calculable. No publicar porcentajes de totalidad si solo se conoce un subconjunto.

Ranking inicial cinco; «Ver más» con cursor y orden estable por métrica e identidad. Página hasta 20; el motor de oportunidades analiza todos los productos agregados, no solo los cinco visibles. Una página adicional debe conservar corte/version o provocar recarga coherente si el snapshot cambió.

Inicialmente sin caché compartida entre usuarios ni actualización realtime global. Consultar al entrar/cambiar rango/reintentar; indicar fecha de actualización. Medir EXPLAIN y payload sobre dataset aislado representativo. Meta propuesta p95 de backend <1 s con 100.000 pedidos por tenant; si no se cumple, optimizar índices/consulta antes de añadir infraestructura. Presupuestar timeout y error explícito, nunca truncar resultados silenciosamente.

### 6.3 Matriz de acceso propuesta

| Principal | Estadísticas V1 |
|---|---|
| owner | Sí, negocio del perfil. |
| manager | Sí, negocio del perfil. |
| admin legacy | Sí, equivalente owner existente. |
| operator / viewer | No por defecto; decisión a aprobar. |
| super_admin | Solo si tiene perfil asociado al negocio y autorización explícita de esta ruta; sin selector/bypass de tenants. |
| Commercial/promotor/anon | Sin acceso por esa identidad; necesitarían además un perfil de negocio autorizado existente. |

No crear roles. Recomendación: capacidad `viewStatistics` sobre la matriz actual, aplicada al menú, página, endpoint y RPC. El RLS actual permite lectura operativa más amplia; ocultar el menú por sí solo no restringe la consulta nueva.

## 7. Plan por cinco fases

Las siguientes tareas están planificadas; solo se realizó la inspección y documentación de Fase 01. Las fases no autorizan su ejecución.

| Fase | Tareas concretas | Entregable y condición de salida |
|---|---|---|
| 01. Auditoría y contratos | Ratificar este diagnóstico; resolver decisiones de §10; revisar vías de alta/transición/importación y corrección de importes; coordinar snapshots y tipos con Cursor; acordar base aislada. | Contratos de importe, finalización, jornada, identidad, calidad y permiso aprobados. Esta auditoría no certifica runtime ni toda vía de escritura. |
| 02. Métricas y comparaciones | Escribir diseño SQL y tipos; preparar migraciones aditivas para revisión; implementar captura/fuentes en entorno aislado autorizado; resolver períodos; RPC y pruebas de reconciliación/calidad. | Cuatro métricas, períodos y comparables reproducibles; pruebas de ciclos/tenant exactas; SQL revisado y sin modificación de base compartida. |
| 03. Resumen | Ruta/entrada; selector y validaciones; cuatro tarjetas; gráfico único y tabla; interpretaciones; estados; concurrencia; responsive. | CA-01–06 y CA-12 trazados con fixtures de lectura y backend aislado. |
| 04. Productos y categorías | Agregación por identidad histórica; snapshots; reparto y residuos; ranking por ambos criterios, top 5/continuación; categorías y desconocidos. | CA-07/08/10/14; sumas reconciliadas con productos/envío y cobertura explícita. |
| 05. Oportunidades y validación | Seis reglas, umbrales y deduplicación; máximo tres y destaque; pruebas de acceso, end-to-end, rendimiento y regresiones. | CA-09/11/13/15 y aceptación integral; informe de evidencia y limitaciones, revisión antes de integración/despliegue. |

No estimar una fecha de finalización fiable antes de aprobar las brechas de persistencia e historia. La interfaz no puede certificar métricas mientras el contrato comercial esté abierto.

## 8. Pruebas y criterios de aceptación

### 8.1 Pruebas unitarias y de propiedades

Usar el patrón existente assert/tsx para funciones puras, con reloj inyectado y fixtures sin datos reales. Casos:

- Fecha límite exacta, UTC/IANA, DST, medianoche, lunes, febrero bisiesto, mes anterior corto, rangos parciales/futuros/invertidos, jornada cruzando fecha según contrato aprobado.
- Pending/preparing/ready excluidos; cancelar completed; completar/reabrir/recompletar; transición idempotente; fecha inválida/ausente; eventos incompletos no aceptados como verdad.
- Venta conocida/desconocida, cero válido, composition legacy_unknown; un importe desconocido inhibe ticket, pero no el count fiable.
- Extras no duplicados, padres/hijos y política de upsells; producto borrado, renombrado y reclasificado; nombre igual con IDs distintos.
- Reparto exacto con céntimos/residuos, bases cero, ajuste positivo/negativo y envío fuera del producto. Invariantes de no pérdida/duplicación de importe.
- Σbuckets = agregados aditivos; ticket ponderado; comparación cero/ausente; calidad diferente entre períodos.
- Motor de reglas en cada umbral, insuficiencia de muestra, producto sin actual o anterior, empates, deduplicación y tope tres.

### 8.2 Integración y seguridad — exclusivamente base aislada

Crear dos negocios con usuarios de cada rol y fixtures locales. Probar por ruta y RPC con JWT reales: anónimo, expirado, operator/viewer, owner/manager, tenant ajeno manipulando parámetros, acceso directo a tablas nuevas y snapshots de otro tenant. Probar RLS y guard de rol; consulta privilegiada no sustituye estas pruebas.

Probar atomicidad: rollback de transición revierte hecho, falla del antiguo timeline no pierde finalización, estados concurrentes generan único vigente, escritura directa cubierta, alta/importación completed no inventa fecha, actualización de catálogo no cambia snapshots, edición contractual posterior no reescribe venta sin contrato. Comprobar que triggers no alteren stock, ledger, eventos ni firmas de RPC.

Rebuild y comparación de esquema solo en instancia nueva, con puertos/proyecto/volúmenes propios confirmados; revisar si las migraciones heredadas exigen deploy intermedio nullable-aware. No ejecutar `supabase db reset` apuntando a la instancia compartida. Fixtures y seeds únicamente en esa instancia. Restaurar/desechar ese entorno según autorización, sin tocar el de Cursor.

### 8.3 UI, flujo completo y regresión

- Entrar en Resumen/Esta semana; cambiar los ocho presets y personalizado; mantener período entre secciones y métrica del gráfico; cambiar rápidamente rangos con respuestas fuera de orden.
- Tabla accesible/tooltip, teclado/foco, 320–390 px y escritorio; ranking sin scroll horizontal; selector usable; errores/reintento/empty/partial/forbidden.
- Mismos datos en tarjetas/gráfico/productos/oportunidades, máximo tres y destaque idéntico a la prioridad de sección.
- Recorrido navegador → endpoint → RPC → pedidos/snapshots → payload y valores visuales, con sumas conocidas de fixtures.
- Typecheck, lint de cambios y build en entorno de prueba; verificaciones existentes del dashboard y personalizaciones. SQL de Commercial/Promotores solo con revisión de sus efectos y base aislada; no invocar su suite sobre la base compartida.
- Registrar baseline antes de modificar para distinguir fallos previos. Este encargo no ejecutó builds ni pruebas de implementación porque no cambió código y no tiene dependencias instaladas.

### 8.4 Motor de oportunidades propuesto

Condición global: ambos períodos comparables, calidad exacta de las métricas implicadas y cobertura temporal confirmada. Umbrales iniciales conservadores y constantes versionadas, no configurables por el usuario en V1:

| Regla | Umbral / muestra | Sugerencia |
|---|---|---|
| Caída de ventas | ≤−15%; ≥20 completados en base y ≥10 actuales; venta base >0. | Revisar productos, volumen de pedidos y composición. |
| Caída de pedidos | ≤−15% y al menos 5 pedidos menos; ≥20 base. Permite caída actual a cero con cobertura completa. | Revisar demanda y acciones comerciales. |
| Cambio de ticket | Magnitud ≥15%; ≥20 completados en ambos; tickets válidos y base >0. | Analizar composición de pedidos, sin afirmar mejora por aumento. |
| Producto en crecimiento | ≥25% y ≥5 unidades más; ≥10 unidades base, identidad fiable y ≥20 completados en ambos períodos. | Evaluar disponibilidad y visibilidad. |
| Producto en caída | ≤−25% y ≥5 unidades menos; ≥10 base, identidad fiable, ≥20 pedidos base y universo actual exacto, incluido cero actual. | Revisar presentación, disponibilidad y propuesta. |
| Concentración por jornada | ≥40% de ventas conocidas en una jornada; período cerrado con ≥7 jornadas completas, ≥30 completados, ≥5 jornadas con actividad y ≥10 pedidos en la dominante. | Evaluar preparación operativa para esos períodos. |

La regla de concentración usa jornada verificada según §4.4; no reemplazarla por día civil silenciosamente. Si falta contrato/datos, la regla no se activa. Umbrales propuestos requieren aceptación dentro del plan, no son decisiones previamente aprobadas.

Cada oportunidad contiene título, observación, evidencia actual/anterior/fechas, interpretación prudente y sugerencia orientativa. No IA ni acciones automáticas.

Priorización propuesta: score = magnitud normalizada del cambio × peso de relevancia (ventas 3; pedidos 2; ticket/productos/concentración 1), saturando magnitud a 1; desempate por muestra y después ID de regla/producto. Concentración usa exceso de cuota sobre 40%. Evidencia se evalúa antes del score. Si ventas y pedidos caen juntos, consolidar en una tarjeta con ambas evidencias, en lugar de duplicar. Máximo una regla de producto por identidad y una observación de concentración; seleccionar tres como máximo. Candidatos adicionales no se muestran. Resumen usa el mismo primer elemento; sin candidatos, mensaje neutral aprobado.

| Criterios | Validación principal |
|---|---|
| CA-01/02/03 | Ruta, roles, navegación y ocho períodos. |
| CA-04/05/06 | Fixtures reconciliados, parciales/base cero y buckets accesibles. |
| CA-07/08/14 | Identidad, ranking, distribución y sumas exactas. |
| CA-09 | Seis reglas, evidencia, muestras y máximo tres. |
| CA-10 | Historial ausente/corrupto, sin imputación artificial. |
| CA-11 | JWT/RLS y tenant adversario en entorno aislado. |
| CA-12 | Móvil/escritorio y teclado con QA visual. |
| CA-13 | Regresión de pedidos/catálogo/finanzas y revisión de Commercial/Promotores. |
| CA-15 | Diff y revisión de alcance: sin IA, exportación, inventario, campañas ni notificaciones. |

## 9. Riesgos y límites

1. Histórico irrecuperable: no existe evidencia suficiente para asignar algunos completados/identidades/categorías. La instrumentación futura no corrige el pasado. Comunicar inicio/cobertura sin inventar backfill.
2. Semántica financiera: agreed_total mutable y nullable, falta desglose de diferencias/envío. Resolver antes de atribuir por producto; no usar cierre financiero como finalización operativa.
3. Tiempo: timezone ausente, jornadas largas/solapadas y horarios cambiantes. Versionar política y suspender comparaciones engañosas.
4. Datos y performance: límites de PostgREST, joins multiplicadores, demasiados eventos. Agregación/indexación y snapshot único; no cargar datos personales.
5. Compatibilidad: triggers nuevos pueden interactuar con importaciones y RPC/stock. Probar todas las rutas en base aislada y revisar contratos públicos con Cursor.
6. Seguridad: normalización de super_admin y políticas de lectura existentes tienen alcance diferente. Requerir perfil tenant y guard específico de Estadísticas en todas sus superficies.
7. Cambios simultáneos: evidencia de base/esquema podría variar después de este corte. Revalidar HEAD y definiciones al inicio de implementación y antes de integración.

No se declara PASS end-to-end. Ausencia de datos de muestra no demuestra que un contrato financiero no exista; las brechas de columnas/snapshots sí están verificadas en el corte consultado.

## 10. Decisiones bloqueantes para aprobación

| ID | Decisión necesaria | Recomendación concreta |
|---|---|---|
| B1 | Fuente de valor comercial y tratamiento de diferencias/envío | Total comercial acordado conocido y congelado; fallback técnico solo sin contrato financiero y composición íntegra; productos/envío separados y reparto únicamente sobre ajuste identificado. Confirmar política de corrección posterior. |
| B2 | Cantidades y atribución de upsells | Unidades principales excluyen upsell; su importe se atribuye al producto upsell real, con explicación en ranking. |
| B3 | Jornada, timezone y comparables | Finalización más reciente como fecha de hecho; confirmar apertura de sesión vs corte comercial como día, semana lunes y reglas de §4.4. Sin timezone: configuración pendiente. Localizar/ratificar decisiones históricas antes de fijar esta política. |
| B4 | Acceso según roles actuales | owner/manager/admin; operator/viewer excluidos por defecto; super_admin sin bypass automático. Aprobar capacidad viewStatistics sin crear roles. |
| B5 | Contratos compartidos e historia | Autorizar persistencia aditiva/trigger/snapshots y patches mínimos de tipos/permisos/nav; conservar historial desconocido sin imputarlo. Confirmar que falta de cobertura antigua se comunique, no se presente como V1 íntegra sobre todo el histórico. |
| B6 | Entorno de validación | Proveer/autorizar instancia nueva aislada con puertos y volúmenes propios y ejecución de migraciones/pruebas allí; no utilizar automáticamente ledger-rebuild ni base compartida. |

No requieren una decisión adicional de producto: carpetas propias, CSS modules, SVG accesible, cancelación de requests, tipo de paginación y tests puros. Quedan incluidos como elecciones técnicas propuestas en el plan.

## 11. Criterios para iniciar implementación

- Aprobación expresa de este plan, con resolución B1–B6 y aceptación de umbrales/granularidad/calidad propuestos.
- Patches compartidos y estrategia de migración revisados/coordinados con Cursor por el usuario; esta tarea no envió mensajes a Cursor.
- Instancia aislada confirmada y autorización diferenciada para sus migraciones y fixtures; ninguna autorización implícita sobre la base compartida.
- Contratos temporales y monetarios cerrados, o bloqueos explícitos de las partes dependientes sin prometer V1 completa anticipadamente.
- Revalidar rama/HEAD, estado de archivos y esquema objetivo antes de ejecutar.

Al terminar esta entrega se detiene el trabajo y se espera autorización expresa. No hay autorización de merge, push, deploy ni aplicación de migraciones por aprobar simplemente la planificación.

### Referencias principales

Además de las referencias por línea anteriores: `lib/admin/{context,permissions}.ts`; `components/admin/admin-nav-config.ts`; `app/admin/(protected)/{layout,dashboard/page}.tsx`; `lib/orders/{admin,analytics,events.server}.ts`; `lib/store-sessions/admin.ts`; `lib/product-customization/{order-types,order-snapshot}.ts`; `types/database.ts`; `supabase/config.toml`.

Migraciones revisadas: familias t3/admin_rls/super_admin/business_roles/order_events/store_sessions; `20260717140000_product_stock_restock_cancel_1.sql`; `20260827234500_add_orders_order_code.sql`; `20260916180000_products_removal_lifecycle.sql`; `20260926010000_shared_core_expand.sql`; `20260926011000_order_financials.sql`; `20260926016000_finance_security.sql`; `20260926017000_order_contract_finalize.sql`; `20260926191000_finance_order_contract_rpcs.sql`; `20260926193000_finance_order_reads_security.sql`; `20261003010000_m2_shared_read_contracts.sql`; `20261004010000_m3_historical_import_provenance.sql`.

Antecedente: `docs/audits/dashboard-functional-audit-for-analytics-v1.md`, leído como auditoría de otro corte, sin modificar.
