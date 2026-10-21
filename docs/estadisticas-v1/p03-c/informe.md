# Estadísticas V1 — Cierre P03-C

**Veredicto: PASS_WITH_LIMITATIONS.** Se implementó y verificó la capa propia de transporte, estado, períodos, presentación y lectura comercial. No se implementaron pantallas, rutas, acciones públicas ni navegación. La limitación de rendimiento documentada en P03-B.1 sigue vigente; este resultado no aprueba integración ni lanzamiento.

Worktree `OrderOps-Estadisticas`, rama `codex/estadisticas-v1`, HEAD `923300265323d411c5c91b7935472d5423d228d2`. Cero commits nuevos. Los archivos propios nuevos permanecen sin seguimiento para revisión. Se conservaron los cambios preexistentes, incluidos `next-env.d.ts` y `fase-01-evidencia.json`; los hashes de preservación constan en `verification.json`.

## Inventario propio

| Archivo | Responsabilidad |
|---|---|
| `lib/statistics/summary-server.ts` | Entrada exclusiva de servidor sobre el cliente SSR existente, autenticado por cookies y sin service role. |
| `lib/statistics/summary-transport.ts` | Autenticación verificada, perfil original, única RPC extendida, decoders existentes y errores seguros. |
| `lib/statistics/summary-period.ts` | Ocho períodos, validación de URL, serialización y clave canónica de consulta. |
| `lib/statistics/summary-query.ts` | Estado por pantalla autenticada, deduplicación de solicitudes pendientes y descarte de respuestas tardías. |
| `lib/statistics/summary-presenter.ts` | Cuatro KPI, decimales exactos, variaciones, puntos explícitos, avisos y lectura descriptiva determinista. |
| `lib/statistics/summary.verify.ts` | Pruebas offline con mocks y fixtures sintéticos existentes. |
| `lib/statistics/summary-isolated.verify.ts` | Integración HTTP de solo lectura con las doce identidades sintéticas y dos negocios aislados. |
| `scripts/statistics-v1/p03-c-eslint.config.mjs` | Lint TypeScript propio, independiente de la configuración compartida de Next.js. |
| `scripts/statistics-v1/p03-c-static.verify.mjs` | Comprobación de alcance, hashes anteriores y superficies protegidas; genera manifiesto. |
| `docs/estadisticas-v1/p03-c/*` | Este informe, ejemplos completos/parciales/error/vacío, evidencias offline/live y manifiesto SHA-256. |

No se editaron contratos, decoders, SQL, escritores operativos, archivos de Commercial Core/Promotores ni superficies compartidas. La comprobación estática verifica ambos `permissions.ts`, `admin-nav-config.ts` y `admin-nav-list.tsx` contra HEAD, y preserva los archivos documentados en el manifiesto P03-B.1.

## Contratos y arquitectura

`getStatisticsSummary(search)` es la entrada `server-only`, lista para el futuro punto de integración. Reutiliza `createSupabaseServerClient()` sin modificar su implementación. No se publica como ruta o acción ni se importará directamente desde un componente cliente. El adaptador futuro deberá ser autenticado, dinámico y sin caché compartida; su wiring pertenece a la autorización siguiente.

`readAuthenticatedSummary(client, search)` verifica el usuario mediante `auth.getUser()`, consulta únicamente su perfil (`business_id,role`) y acepta el rol original `owner`, `manager` o `admin`. No utiliza la normalización ni el fallback a admin del contexto administrativo existente. Niega `operator`, `viewer`, `super_admin`, roles nulos y perfiles sin negocio. El negocio se obtiene del perfil verificado, nunca de la URL o JSON del cliente. RLS y autorización de la RPC siguen siendo la barrera efectiva del backend.

El resultado es una unión discriminada:

```ts
{ ok: true, scope: { userId, businessId }, periodKey, data: StatisticsSeriesResponse }
// o
{ ok: false, code, message, retryable }
```

Los errores son `unauthenticated`, `forbidden`, `invalid_period`, `timeout`, `query_failed`, `invalid_response` o `series_unavailable`. Los mensajes no incluyen SQL, credenciales ni detalles internos. No se sustituyen errores por respuestas vacías o valores cero.

Cada consulta efectiva ejecuta una sola llamada pública a `statistics_v1_summary`. `readStatisticsSeries` reutiliza los decoders legacy y extendido aprobados sobre esa misma respuesta; no llama adicionalmente a la RPC legacy. Se comprueba negocio, versión, calidad, claves, conservación y correspondencia del preset/fechas solicitados. El controlador vuelve a validar tenant y período al aceptar el resultado del transporte. Las comprobaciones financieras internas del decoder aprobado se conservan; el presenter no calcula ventas, ticket ni diferencias financieras.

## Períodos y estado

URL: `period=today`, `yesterday`, `this_week`, `this_month`, `previous_month`, `last_7_days`, `last_30_days` o `custom&start=YYYY-MM-DD&end=YYYY-MM-DD`. Solo la ausencia de selección usa `this_week`. Los valores desconocidos, repetidos, fechas inexistentes, rangos invertidos o fechas junto a un preset no personalizado se rechazan explícitamente. La serialización conserva parámetros ajenos, incluido el futuro tab global.

La URL selecciona fechas comerciales o preset; el servidor resuelve zona horaria, jornada, sesiones nocturnas, DST, corte `asOf` y límites admitidos. El frontend no convierte fechas civiles en jornadas ni fabrica intervalos. La clave canónica usa únicamente preset y fechas validadas; negocio y usuario delimitan cada instancia del controlador.

Estados de consulta: `idle`, `loading`, `error`, `ready`. La presentación distingue `configuration_required`, `complete`, `partial`, `empty`, período temporalmente parcial y comparación no disponible. Una carga/error no conserva KPI antiguos como si pertenecieran al nuevo período. Cambiar usuario o negocio invalida datos y solicitudes anteriores. Secuencia y generación impiden que una respuesta tardía sobrescriba el período vigente.

Solo se deduplican solicitudes pendientes y se reutiliza la última respuesta lista para el mismo período. Volver a un período aún pendiente reutiliza esa solicitud. Una actualización explícita solicita datos nuevos, salvo que ya exista una consulta equivalente pendiente. No hay polling, caché global, persistencia en localStorage ni caché de períodos completados por otros usuarios. El descarte de respuestas no promete cancelar consultas ya iniciadas en PostgreSQL.

## Presentación y ejemplos

Los cuatro KPI son Ventas comerciales, Pedidos completados, Ticket promedio y Unidades vendidas. La presentación usa strings decimales y BigInt: conserva centavos y valores mayores que `Number.MAX_SAFE_INTEGER`. Las sumas y comparaciones provienen exclusivamente de la respuesta aprobada. Un cero conocido se diferencia de un importe desconocido, ticket no calculable y cobertura parcial.

Cada punto conserva su `key`, `mapping`, `basis`, intervalos, slices con precisión temporal original, zona y sesiones. El punto anterior procede de su asociación explícita en el backend y solo se presenta cuando la comparación del indicador seleccionado es válida. No se emparejan arrays por posición. El cambio de KPI o punto actualiza estado local; no llama a la RPC.

La lectura comercial devuelve observación, evidencia, significado y sugerencia prudente para el indicador/punto seleccionado. Usa las diferencias válidas entregadas, sin explicar causas ni anticipar Oportunidades. Con calidad insuficiente, comparación inválida o ambos lados sin hechos conocidos devuelve una lectura neutral. Si la base anterior es cero y el backend permite la diferencia absoluta, esta se muestra; no se inventa un porcentaje.

| Caso demostrado | Resultado |
|---|---|
| Fixture completo | Ventas `$ 200`, variación `+25%`, lectura respaldada por los valores recibidos. |
| Importe desconocido | Ventas conocidas `$ 100` con cobertura parcial; ticket `No disponible`; lectura neutral. |
| Corte temporal parcial | Marca temporal separada de calidad de cada indicador. |
| Sin comparación | Valor actual conservado; anterior/deltas no comparables no se dibujan ni describen como válidos. |
| Sin pedidos en entorno aislado | Estado vacío; cero conocido donde corresponde; ticket no calculable y lectura neutral. |
| Timeout | Error explícito, reintento manual permitido; sin KPI ficticios ni ceros. |
| Falta de timezone | `configuration_required` con explicación específica. |

Los objetos completos se entregan en `examples.json` y `empty-example.json`. Carga, error, invalidación y respuestas tardías se verifican en las pruebas del controlador. Los avisos de cobertura histórica sin fecha y pedidos fuera de sesión permanecen separados; no se incorporan hechos históricos inferidos.

## Pruebas y evidencia

| Verificación | Resultado |
|---|---|
| `tsx lib/statistics/summary.verify.ts` | PASS: 142 aserciones; cero conexiones a DB/API. |
| `tsx lib/statistics/summary-isolated.verify.ts` | PASS: 81 aserciones, Auth GET + perfil GET + RPC de lectura HTTP, dos negocios/seis roles originales. |
| `tsc --noEmit --incremental false` | PASS sobre el proyecto completo. |
| ESLint con config propia P03-C | PASS sobre los siete archivos TypeScript nuevos. |
| `tsx lib/statistics/read.verify.ts` | PASS: regresión de lectura, roles originales, tenant y respuestas inválidas. |
| `tsx lib/statistics/domain.verify.ts` | PASS: períodos/DST/sesiones/calidad/comparaciones y 1.111 casos de conservación monetaria. |
| Verificación estática P03-C | PASS: superficies protegidas, hashes previos y migración intacta. |

La primera ejecución live detectó una lectura descriptiva para dos períodos sin pedidos. Se corrigió únicamente el presenter propio y se agregó regresión offline; la repetición live terminó PASS. Durante la preparación se corrigieron estrechamientos de tipos en las pruebas y se reforzó la validación del período también en el controlador. No se corrigió ni modificó SQL.

## Aislamiento y conservación

El gate adversarial offline y el gate live pasaron antes de conectar y después de las pruebas. Proyecto exclusivo `orderops-statistics-v1-test-74718de66a41`; API `127.0.0.1:56321`, DB `127.0.0.1:56322`; cinco contenedores saludables, red `supabase_network_orderops-statistics-v1-test-74718de66a41`, dos volúmenes exclusivos DB/Storage y marca privada coincidente.

El inventario en transacciones `READ ONLY` confirmó las 119 versiones base, tres Phase 02 y una comparativa: 123 versiones idénticas antes/después. Se cotejó el contenido instalado de la comparativa con el archivo autorizado. Su SHA-256 sigue siendo `b10c330adff70b803d9d25165f07830e90d4cd092aa4ba2cf3d0120a43f95219`.

Se reutilizaron exclusivamente las doce identidades sintéticas existentes; no hubo login ni creación de sesiones Auth. Pedidos, sesiones comerciales, completados e items permanecieron en cero. No se crearon fixtures persistentes: no hay limpieza destructiva pendiente. La prueba no carga `.env`, no usa service role ni endpoints externos, y verifica el origen de todas sus solicitudes. El firmante exclusivo se lee de la configuración local ignorada y nunca se imprime. No se iniciaron/reiniciaron recursos ni se aplicó ninguna migración.

## Límites y siguiente autorización

- La integración HTTP prueba la capa independiente con un adaptador equivalente, no el wiring de cookies real de una pantalla Next.js. La entrada SSR fue revisada y compilada; su recorrido navegador/servidor, logout y cambio real de negocio debe verificarse al autorizar integración visual.
- Los casos completos/parciales con importes se probaron con fixtures offline estrictos. La integración live de esta fase utiliza datasets vacíos; no reejecuta fixtures SQL de escritura ni las pruebas de captura de P03-B.
- El rendimiento de P03-B.1 no cambia: en 200 pedidos la RPC extendida había medido aproximadamente 2 segundos y en 500 alcanzó el límite diagnóstico de 15 segundos. No se optimizó ni se agregó caché para ocultarlo. Integración y lanzamiento continúan condicionados a resolver ese riesgo; P03-C no certifica un SLA.
- No hay diseño visual ni comportamiento renderizado de R01–R08/V01–V05 todavía. Se prepararon los contratos de presentación sin cambiar su alcance. Accesibilidad, responsividad, temas, navegación y pruebas E2E visuales requieren la fase autorizada correspondiente.
- El controller no crea timers de refresco ni TTL: el producto posterior deberá decidir la actualización manual/por cambio de período usando esta API, sin polling ni compartición de respuestas.

P03-C queda detenido. P03-D/E, navegación, optimizaciones SQL e integración con Cursor requieren autorización expresa independiente. No hubo merge, rebase, push, despliegue ni conexión a producción.
