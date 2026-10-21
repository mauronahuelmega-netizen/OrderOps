# Estadísticas V1 — P03-B reanudado

**Veredicto: PASS_WITH_LIMITATIONS.** La migración comparativa del hash aprobado se instaló exclusivamente en el Supabase local independiente. Pasaron las pruebas SQL, igualdad JSON runtime, RLS/autorización, decoder sobre HTTP real, concurrencia, rollback y conservación de hechos. La medición acotada muestra latencias de aproximadamente 2–2,63 segundos con 200 pedidos y requiere revisión de rendimiento antes de una integración. No se autoriza ni se inició ninguna fase posterior.

Este informe sustituye el resultado del intento bloqueado por Docker, conservado en `informe-preflight-bloqueado.md` y `preflight.json`. La evidencia vigente está en `live-before.json`, `installation.json`, `sql-tests.json`, `paired-series.json`, `concurrency.json`, `performance-summary.json`, `api.json`, `api-decoder.json`, `live-after.json` y `verification.json`.

## Instalación e identidad antes/después

Worktree `OrderOps-Estadisticas`, rama `codex/estadisticas-v1`; HEAD `923300265323d411c5c91b7935472d5423d228d2`. Cero commits nuevos. No se modificaron los cambios preexistentes, archivos compartidos ni otros worktrees.

Migración instalada: `20261013004000_statistics_v1_comparative_series.sql`.

SHA-256 del archivo antes, durante y después:

```text
b10c330adff70b803d9d25165f07830e90d4cd092aa4ba2cf3d0120a43f95219
```

La transacción contiene el SQL aprobado y la inserción del ledger antes del COMMIT final, para registrar esquema y versión atómicamente. El contenido original exacto queda almacenado en el ledger y su hash se verificó después. Antes de instalar se ejecutó ese mismo DDL dentro de una transacción que terminó intencionadamente con división por cero: se comprobó igualdad del catálogo anterior/posterior y ausencia del registro de migración. La instalación posterior pasó. Ninguna versión alternativa se aplicó.

| Condición obligatoria | Resultado |
|---|---|
| Escenarios adversariales offline | PASS |
| Proyecto live y marca privada | PASS: `orderops-statistics-v1-test-74718de66a41` |
| Cinco contenedores exclusivos | PASS: DB, Kong, Auth, REST y Storage, ejecutándose y saludables |
| Red y dos volúmenes | PASS; IDs y pertenencia iguales a los registrados, sin recursos ajenos adjuntos |
| Endpoints | PASS: API `127.0.0.1:56321`, PostgreSQL `127.0.0.1:56322` |
| 119 base + tres Phase 02 | PASS: versiones exactas y comparación estructural SQL de fuentes instaladas contra archivos aprobados |
| Migración histórica vacía | PASS: `20261009020527_commercial_phase03_separation.sql`, registro sin sentencias acorde con su archivo vacío |
| Colisión de versión | PASS en archivos y referencias Git locales conocidas; sin actualizar remotos |
| Ledger posterior | PASS: 123 versiones, solo una nueva versión P03-B |
| Aislamiento final | PASS: mismos cinco IDs, red y dos volúmenes, salud y marca privada |

No se inició, reinició, recreó o eliminó ningún contenedor. No se ejecutaron resets ni operaciones sobre Cursor, OrderOps, Majo Pastelería o producción. Solo se utilizaron manifest, firmante JWT y credenciales/configuración exclusivos del proyecto aislado. La verificación Docker necesitó ejecución fuera del sandbox; esa escalación no cambió el destino autorizado.

## Catálogo real, permisos y compilación

El inventario final contiene **18 funciones de Estadísticas**, cinco tablas analíticas con RLS, cinco políticas y ocho triggers Phase 02 existentes. P03-B agregó cuatro funciones privadas y reemplazó aditivamente la RPC pública; no agregó tablas, triggers ni políticas, ni modificó escritores comerciales.

| Función afectada | Firma de tipos | Lenguaje / volatilidad |
|---|---|---|
| `private.statistics_v1_summary_base` | `(text,date,date,text,integer,jsonb) → jsonb` | PL/pgSQL / STABLE |
| `private.statistics_v1_series_response` | `(text,date,date,text,integer,jsonb) → jsonb` | PL/pgSQL / STABLE |
| `public.statistics_v1_summary` | `(text,date,date,text,integer,jsonb) → jsonb` | SQL / STABLE |
| `private.statistics_v1_series_delta` | `(jsonb,jsonb,boolean,text) → jsonb` | SQL / IMMUTABLE |
| `private.statistics_v1_series_instant` | `(timestamptz) → text` | SQL / STABLE |

Las cinco son SECURITY INVOKER. El catálogo registra firmas, defaults, ACL y definiciones completas. En los tres lectores, se preservan fechas opcionales NULL, orden `units`, límite 5 y cursor NULL. `check_function_bodies=on`; la creación fue aceptada por PostgreSQL y las funciones se invocaron en las ramas y casos descritos abajo. Esto acredita compilación e invocación de los caminos ejercitados, no una prueba exhaustiva de todos los planes posibles.

En las cinco funciones, el privilegio EXECUTE efectivo es verdadero para `authenticated` y falso para `anon` y `service_role`. Los lectores siguen validando el perfil original: owner/manager/admin autorizados solo sobre su negocio; operator/viewer/super_admin rechazados sin bypass. Los helpers puros de formato/delta solo calculan argumentos suministrados y no acceden a hechos por identificadores JSON. Las políticas y tablas anteriores permanecieron sin cambios.

## Pruebas individuales y evidencia

| Prueba | Resultado / alcance |
|---|---|
| Instalación de hash exacto | PASS |
| Rollback atómico de instalación ante error | PASS: catálogo igual y ledger ausente tras transacción fallida |
| `phase03-series.sql` | PASS, 13.114 ms; dos tenants, seis roles, ocho períodos, snapshot/revisión, grants, puntos, aritmética y DST |
| Igualdad JSON legacy runtime | PASS: `new - 'series' = old` en el mismo SELECT, 48 combinaciones de roles permitidos/tenant/período, más casos no vacíos completo/parcial y lote de rendimiento |
| `capture-metrics.sql` | PASS, 1.141 ms: captura, idempotencia, reapertura/recompletado, cancelación, cambios financieros, upsell una vez, identidad congelada, desconocidos y fuera de sesión |
| `security-money.sql` | PASS, 866 ms: autorización, RLS y dinero |
| `regression.sql` | PASS, 1.835 ms: RPC comerciales existentes, stock, finanzas, períodos y configuración ausente |
| Serie nocturna no vacía | PASS: tres intervalos físicos, reparto `[2,2,1]`, apertura/cierre y límite interno ±1µs, conservación de ambos cohorts y comparaciones por punto |
| Duraciones desiguales | PASS: cuatro puntos, cola anterior con lado actual ausente, cinco hechos conservados por lado |
| Período parcial no vacío | PASS: cursor sintético explícito, correspondencia verificada y tres hechos por lado; igualdad exacta con `asOf` admitida y `asOf + 1µs` excluida |
| 199/200 sesiones | PASS en RPC real: 199 sesiones por lado de duración 1µs generan 199 puntos; con 200 pasan a un punto diario antes de generación horaria |
| Dimensionamiento aritmético SQL | PASS: 597 combinaciones en la suite preparada, duraciones extremas y techo con residuo de microsegundo |
| DST / zonas | PASS: gap/fold New York; gap/fold de 30 minutos Lord Howe; Kathmandu +05:45 |
| Cinco escenarios de concurrencia | PASS: completar/completar; reabrir/recompletar; finanzas/completar; cerrar sesión/completar; crear pedido/cancelar con stock |
| Bloqueos reales | PASS: esperas observadas en PostgreSQL mediante barreras; ciclos únicos 1–4, un activo, stock final 19 y un restock |
| Deadlocks | PASS: contador 0 antes y después |
| HTTP RPC | PASS: doce perfiles sintéticos en dos tenants; 200 para owner/manager/admin, 403 para los otros tres roles; anónimo rechazado |
| Decoder estricto | PASS: seis respuestas HTTP reales del entorno aislado decodificadas offline |
| Parser SQL / ESLint / TypeScript | PASS para archivos nuevos y comprobación TypeScript sin emisión |

No se emparejaron arrays por posición. La prueba nocturna verifica la correspondencia explícita y el reparto esperado sobre ambos lados. La fábrica temporal es **exclusivamente sintética**: genera capturas por los triggers reales y coloca campos analíticos propios en instantes de prueba explícitos. No constituye evidencia histórica, backfill inferido ni una intervención en datos reales. El ciclo de captura se valida separadamente sin esas modificaciones temporales de fixture.

## Rendimiento medido

Lote máximo: **200 pedidos sintéticos**, una transacción con rollback. Tres consultas secuenciales, `statement_timeout=30s`, `lock_timeout=5s`; no generador de carga ni conexiones masivas. Se verificaron ventas exactas 2.000,00, 200 unidades principales, igualdad legacy y conservación en puntos.

| Período | Ejecución PostgreSQL | Shared hit blocks | Lecturas / escritura temporal |
|---|---:|---:|---:|
| Hoy | 2.012,458 ms | 71.908 | 0 / 0 |
| Últimos 7 días | 2.346,342 ms | 71.909 | 0 / 0 |
| Últimos 30 días | 2.634,475 ms | 71.906 | 0 / 0 |

Plan externo: `Result`. `EXPLAIN ANALYZE` mide el coste total, pero no muestra los planes internos PL/pgSQL. El tiempo del lote, creación/validación y consultas fue 12.451 ms. Son muestras únicas sobre caché caliente, sin SLA aprobado; no acreditan escalabilidad ni rendimiento en producción. La latencia y el número de hits justifican una revisión posterior de las consultas internas antes de integrar; no se optimizó ni cambió el SQL autorizado.

## Fixtures y limpieza

Las suites de unidad, temporal y rendimiento terminaron con ROLLBACK. Los fixtures durables de los cinco escenarios de concurrencia se limpiaron con los scripts acotados preparados y sus IDs propios. La suite temporal llegó a 402 sesiones y diez pedidos dentro de su transacción; la de rendimiento, a 200 pedidos en otra transacción. No hubo solapamiento entre esas suites.

Inventario final: **0 pedidos, sesiones, productos, categorías, items, financials, completions, completion items, item snapshots, session snapshots, stock movements y audit events**. Permanecen las dos empresas y doce perfiles sintéticos originales. Las revisiones analíticas pueden avanzar con los escenarios durables de concurrencia; no se resetearon para simular un estado previo. Las claves y respuestas API sin secretos permanecen únicamente en runtime ignorado.

## Errores de preparación y correcciones

El runner local reconstruyó inicialmente las sentencias del ledger sin separadores y trató un registro NULL de la migración histórica vacía como array. Se corrigió el verificador propio antes de cualquier escritura; luego pasó la comparación de todas las fuentes instaladas. El parser offline también detectó alias reservados de un fixture nuevo y se corrigieron antes de ejecutarlo.

El primer intento del fixture de rendimiento falló por `orders_order_code_format_chk`: el código sintético tenía longitud/caracteres inválidos. La conexión terminó y su transacción revirtió; se corrigió el fixture para producir códigos únicos de seis caracteres del alfabeto permitido. La repetición pasó. No se alteró el constraint, el escritor financiero ni ningún SQL de migración.

## Archivos y detención

Nuevos archivos propios: `scripts/statistics-v1/p03-b-validation.mjs`, `p03-b-concurrency.mjs`, `p03-b-api.verify.mjs`; `supabase/tests/statistics-v1/p03-b-performance.sql`, `p03-b-paired-series.sql`; `lib/statistics/p03-b-api.verify.ts`; informes y evidencias en esta carpeta. Los runners derivados conservan el comportamiento de pruebas previo, pero usan recibo y evidencias exclusivos P03-B; no sobrescriben informes Phase 02. El recibo local ignorado registra la autorización humana P03-B y el hash exacto.

El manifiesto contiene hashes del inventario y de la migración. Los cambios preexistentes en `fase-01-evidencia.json`, `next-env.d.ts`, auditorías y adjuntos se preservaron. No se hicieron commits, merge, rebase, push ni deploy.

Limitaciones restantes: rendimiento con volumen mayor y planes internos; mayor cobertura combinatoria de TZ/DST/cortes; referencias remotas de Cursor no actualizadas; ninguna validación contra su worktree o base. No se acredita integración con Commercial Core, producción ni interfaz.

**P03-B finalizado y detenido para revisión.** P03-C/D/E, navegación, interfaz, integración y despliegue requieren autorización expresa posterior.
