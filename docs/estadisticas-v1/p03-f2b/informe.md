# Estadísticas V1 — P03-F.2B validación experimental

**Resultado de rendimiento: PERFORMANCE_IMPROVED_WITH_LIMITATIONS.** Instalación PASS; seguridad y equivalencia de los casos ejecutados PASS; preservación PASS. El candidato mejora las latencias medidas, pero no cumple el objetivo p95 de 100 pedidos y no queda aprobado para adopción pública/lanzamiento.

## Instalación y estado activo

Hash instalado exactamente autorizado: `fd88de8c0ec3f4a87d8a6782650d63cf4779d8170033a4c5b4f37edbd489faf9`.

Se instalaron exclusivamente `private.statistics_v1_read_core_candidate`, `private.statistics_v1_summary_base_candidate` y `private.statistics_v1_summary_candidate`. Firma común `(text,date,date,text,integer,jsonb)`, defaults NULL/NULL/units/5/NULL, STABLE SECURITY INVOKER y search_path fijo. Las ACL efectivas conceden execute a authenticated y al propietario, sin execute a PUBLIC/anon/service_role. Catálogo real completo en installed-catalog.json, con definitions/defaults/search_path/ACL/volatility.

**public.statistics_v1_summary continúa usando las funciones originales.** No se reemplazó summary_base/series_response, redirigió tráfico ni activó menú. Los nuevos helpers privados se invocaron solo por el arnés aislado. Ledger pasó de 123 a 124, añadiendo únicamente 20261013005000; las fuentes originales del ledger se conservaron.

Aplicación directa psql de la transacción exacta autorizada, con registro del ledger en la misma transacción. No se utilizó herramienta que aplique archivos pendientes. check_function_bodies estaba on; CREATE FUNCTION compiló las tres funciones y las invocaciones de pruebas ejecutaron sus expresiones SQL. No hubo error de compilación ni modificación del candidato. El parser existente en el runtime propio validó además sintaxis externa y equivalencia de las fuentes instaladas: F.2A solo había comprobado dependencias raíz, sin encontrar este runtime heredado.

## Preflight e identidad

Worktree OrderOps-Estadisticas, rama codex/estadisticas-v1, HEAD `923300265323d411c5c91b7935472d5423d228d2`. baseline.json registra estado Git, todos los hashes preexistentes y catálogo antes de instalación. Las cuatro migraciones propias originales conservan sus SHA de F.1. Las 119 base y cuatro originales instaladas se compararon mediante AST contra sus fuentes aprobadas, incluyendo migraciones vacías.

Verificador adversarial/live PASS antes de escritura y al cerrar: proyecto `orderops-statistics-v1-test-74718de66a41`, API `127.0.0.1:56321`, DB `127.0.0.1:56322`, cinco contenedores saludables, red y dos volúmenes exclusivos con IDs del manifest. Marca privada y ledger coincidentes. No se inició, reinició, reparó o eliminó contenedor/servicio. No se conectó a Cursor, producción, Majo Pastelería u otra base. No se usó service role de aplicación; setup/inspección fueron psql del contenedor exclusivo y lecturas medidas authenticated con principal sintético explícito.

## Seguridad antes de benchmarks

| Caso | Resultado / alcance |
|---|---|
| owner/manager/admin originales, ambos negocios | PASS en cada uno de los tres helpers candidatos. |
| operator/viewer/super_admin | PASS, 42501 en cada helper; sin normalización ni bypass. |
| Doce actores × tres helpers | PASS, 36 combinaciones por cohorte de seguridad. |
| Perfil sin negocio | PASS, super_admin sintético temporalmente sin business_id, rollback. Roles autorizados sin negocio no son estados admitidos por check existente. |
| Rol NULL/desconocido | Constraints rechazaron modificaciones sintéticas con 23502/23514; no se alteró schema para fabricar esos estados. Claims desconocidos con perfil inexistente también denegados. |
| Sin sesión/perfil | Claims ausentes o sub sin profile: 42501 en los tres helpers. Prueba SQL, no login HTTP nuevo. |
| Claims metadata owner/foreign business manipulados | No ampliaron rol o negocio original del profile; core bundle/JSON devolvió solo negocio autorizado. |
| Aislamiento con datos A y B | PASS, cohorte shapes de cinco pedidos por negocio y dos líneas por pedido. Lecturas y RLS analíticas excluyen el otro negocio. |
| RLS y ACL | RLS enabled en las once tablas operativas/analíticas comprobadas; policies/grants originales exactos. Checks directos de las seis superficies analíticas y helpers; anon/service_role sin execute candidato. |

security.json y security-shapes.json conservan resultados. El candidato no elimina los bypass operativos preexistentes ajenos a Estadísticas; sus propios guards deniegan super_admin y su dataset queda sujeto a RLS/invoker. No se presenta la prueba de metadata como falsificación de firma JWT ni el test SQL como nueva verificación SSR, ya aceptada en E.1.

## Equivalencia diferencial

Todas las comparaciones usaron SELECT pareada original/candidato en una sentencia, snapshot y statement_timestamp comunes. También se compararon legacy original/base_candidate y original extendida sin series contra legacy; arrays/campos se mantuvieron completos, sin ordenarlos ni excluir asOf/cursor/reasons/calidad. No hubo divergencia registrada de datos del candidato.

| Cohorte / prueba | Resultado |
|---|---|
| Diez finalizaciones capturadas, ocho períodos × units/amount | PASS, 16 comparaciones de cuatro lectores por cohorte. |
| Diez productos/categorías con identidades | PASS: productos, categorías, rankings y ruleEvidence completos. |
| Paginación / nextCursor / asOf | PASS en la suite ampliada cuando existe cursor; requestKey/revision/offset conservados. |
| Nocturnos current/previous, apertura, cierre y límites ±1µs | PASS; comparación parcial congelada en una hora conservó tres hechos por lado. |
| DST gap/fold Lord Howe y timezone fraccional Kathmandu | PASS: respuestas completas de sesiones DST sintéticas y primitivas horarias de los helpers originales. |
| Main/upsell/modifier metadata y reconciliación parcial | PASS; unidades de main y dinero no duplicado; dataset de ambos negocios. |
| Reapertura, cancelación y recompletado | PASS tras transiciones de captura reales del fixture; lector original/candidato preserva ciclos activos/exclusiones. |
| Cambio de agreed_total 10→9,99 y composición post-finalización | PASS con flags/NULL/reasons; sin repartir diferencia ni introducir finanza alternativa. |
| Acuerdo ausente al recompletar | PASS, fuente NULL y calidad correspondiente; no zero fallback. |
| Histórico explícito sin finalización fiable | PASS, coverage global 1, sin asociarlo retrospectivamente a sesión. |
| Errores/SQLSTATE | PASS: cursor JSON null 22023, preset/sort/limit inválidos y timestamp inválido con mismo SQLSTATE. |
| Decoders existentes sobre respuestas reales exportadas | PASS: pairs-temporal.json (DST) y pairs-shapes.json (parcial/estados), exportados por SELECT pareada; no se modificaron decoders. |

Temporal fixture: capturas reales primero y fechas/association analíticas situadas luego en instantes de fábrica explícitos exclusivamente sintéticos, como las pruebas temporales previas; no son evidencia histórica real ni backfill inferido. Acuerdos/reconciliación incluyeron ajustes de total y evidencia ausente; no se certifica toda combinación posible de escritores de descuentos/envío tarifado. El constructor de metadata de modificador no acredita UI/writer de configuración completa. Ocho períodos/custom cubren fechas corrientes y escenarios temporales, no todos los rangos extremos admitidos.

Los arrays sin orden declarado pasaron para estos datasets, incluida identidad conocida, pero no se convierten en prueba universal frente a todos los planes/cardinalidades. No se relajaron comparadores/decoders para obtener PASS.

## Concurrencia y MVCC

concurrency.json PASS: dos conexiones acotadas, reader repeatable-read con fixture capturado no confirmado y writer de timezone sintético no confirmado. Reader conservó igualdad completa original/candidato y no vio el cambio sin commit. Ambas conexiones terminaron en rollback, cero conexiones propias restantes y fingerprint de settings idéntico; deadlocks 0 antes/después.

Es una prueba de MVCC con metadata concurrente, **no** certificación de carreras de commit entre escritores de pedidos/finanzas ni prueba de estrés. Transiciones financieras/de estado se probaron secuencialmente. Ese alcance y concurrencia de múltiples lectores a volúmenes altos quedan pendientes de adopción; no se atribuye rendimiento concurrente al benchmark serial.

## Benchmark efectivo

PostgreSQL EXPLAIN (ANALYZE,BUFFERS,SETTINGS,FORMAT JSON), consultas seriales en una transacción sintética por N, roles autenticados equivalentes y mismo cohort inmutable. Original es RPC pública extendida; candidato es helper privado extendido. Orden alternado, un calentamiento por lector excluido y **20 muestras por lector/cohorte**. Timeout por consulta 15s sin aumentar; lock timeout3s; gates de identidad/salud/CPU≤35%/memoria≤40%. No hay caché persistente ni polling/servicio de carga. p95 nearest-rank (19.ª muestra ordenada de 20); max/outliers conservados. No son tiempos HTTP, SLA de producción ni intervalos estadísticos de confianza.

| Pedidos | Lector | p50 ms | p95 ms | Máximo ms | σ ms | N |
|---:|---|---:|---:|---:|---:|---:|
| 50 | Original | 841,428 | 1.530,059 | 2.853,457 | 487,624 | 20 |
| 50 | Candidato | 329,708 | 888,111 | 1.129,900 | 223,886 | 20 |
| 100 | Original | 4.052,753 | 5.430,673 | 5.690,953 | 926,839 | 20 |
| 100 | Candidato | 581,483 | 1.251,597 | 1.728,800 | 314,229 | 20 |
| 200/500/1000/5000 | Ambos | — | — | — | — | No ejecutados |

Reducción exploratoria de p95: ~42% a 50 y ~77% a 100. A 100 el candidato **no cumple ≤500ms**; el resto de umbrales se mantiene y no está evaluado. No certificar lanzamiento por mejorar media/p50 ni por observar reducción relativa.

El máximo original a 100 superó el criterio de detención5s de escalamiento; el lote completó sus 20 parejas bajo el hard limit15s, luego no se avanzó. No hubo timeout de consulta en estos benchmarks, ni se descartaron outliers. La condición de avance se comprueba al finalizar cada lote; no se presenta como cancelación instantánea en5s. Recursos registrados before/after, no memoria peak/CPU peak ni capacidad libre global del host compartido. Stats/bloat/cache y planificación transaccional sintética limitan extrapolación.

benchmarks.json conserva valores individuales, warmups, recursos, errores y escenarios omitidos; planes completos en plans/ y benchmark/volume-N.json. No se realizó profile/counters nuevo para asegurar 9N→N en ejecución; la mejora observada no demuestra atribución exclusiva ni eliminación del costo cuadrático de joins/auth/historical count. El diseño aun serializa JSON local ancho y consulta source_items por pedido.

## Errores del arnés y correcciones

- La primera ampliación temporal trató JSON null de nextCursor como cursor válido: la original devolvió STATISTICS_INVALID_CURSOR antes de la llamada candidata. Se conservó temporal-harness-error.json; se corrigió solo el test para excluir JSON null y comparar ese mismo error por SQLSTATE. No fue divergencia original/candidato ni cambio del hash instalado.
- El generador de benchmark dirigió los artefactos a un directorio nuevo propio con nombre distinto. Se corrigió la generación futura y se trasladaron los resultados nuevos a benchmark/ después de cerrar la corrida, verificando ambos paths dentro del workspace y sin sobrescribir carpeta preexistente. No se alteraron medidas ni archivos originales.

No hubo defecto SQL candidato corregido automáticamente. Todo el SQL instalado conserva el hash autorizado; ninguna migración adicional fue aplicada.

## Preservación, archivos y siguiente decisión

preservation.json/evidence.json: hashes preexistentes y HEAD preservados; fuentes/ACL/functions originales, policies, índices, constraints y ledger original exactos. Candidatos posteriores iguales a los instalados. Fixtures de órdenes/items/finanzas/audit/completions/sesiones/identidades vuelven a counts iniciales; productos/categorías/stock_movements cero. Fingerprint profiles intacto; en concurrencia settings intactos. Sin nuevos deadlocks. No rollback destructivo: candidatos permanecen instalados sin routing público.

Archivos nuevos únicamente de diagnóstico/documentación: p03-f2b-validate.mjs y SQL security/differential/temporal-fixture/state-tests/dst-tests, generador/ejecutor/análisis de benchmark, concurrencia y evidencia. Lista exacta y SHA-256 en evidence.json; candidato/migraciones/frontend/nav/permisos preexistentes intactos. Cero commits, merge, rebase, cherry-pick, push, deploy o habilitación real.

No se aprueba adopción: falta cumplir rendimiento, validar escenarios/volúmenes pendientes y ampliar pruebas de concurrencia financiera según necesidad. Toda modificación del candidato exige diff y nueva autorización de hash; redirigir RPC pública requiere aprobación separada. **Detención al terminar P03-F.2B.**
