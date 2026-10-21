# Propuesta priorizada para revisión P03-F.2

**Recomendación: refactor propio de lectura A+B, con composición/digest único y conjunto efectivo compartido por respuesta.** No ejecutar ni instalar en P03-F.1.

## Superficie propuesta

- Una futura migración aditiva propia, con versión nueva acordada después de inventariar las versiones efectivas de Cursor; ninguna edición de las cuatro migraciones existentes.
- Núcleo privado de lectura STABLE SECURITY INVOKER, firmas explícitas y autorización por auth.uid/perfil/negocio en cada entrada ejecutable. wrappers `public.statistics_v1_summary(text,date,date,text,integer,jsonb)` y legacy conservan firmas/defaults/campos.
- Source_items original y todos los triggers/writers de captura permanecen intactos. Nuevo núcleo prepara elegibles y digest actual una vez por pedido; se utiliza en ventas, unidades y reasons. Una relación local sirve para totales legacy/rankings y series actuales/anteriores. Preservar todas las RLS/grants originales y sus comprobaciones independientes.
- Sin tablas, caché persistente, jobs, nuevos índices, nueva fuente financiera ni cambios de transporte/UI/nav. Ningún helper recibe principal en JSON como autoridad.

## Secuencia propuesta

1. Sellar hashes/versiones/catálogo originales y revisar un diff SQL completo de lectores; documentar cada expresión trasladada. Conservar política MVCC y cursor/asOf original. No introducir SECURITY DEFINER para eludir policies.
2. Preparar tests del equivalence-plan, fixtures selectivos sin DDL y decoders. Comparar originales y candidato en la misma sentencia/snapshot. El ensamblador legacy debe permanecer completo aunque la UI solo consuma cuatro KPI.
3. Obtener aprobación específica del SQL candidato y de su aplicación aislada. La aprobación de diseño F.1 no autoriza ni implementación ni migración.
4. Aplicar únicamente en aislamiento verificado, bajo autorización posterior; ejecutar equivalencia, direct helper auth, RLS y concurrencia antes del benchmark. Si aparece necesidad de modificar operativas, políticas o contratos financieros, detener esa superficie y presentar diff.
5. Medir con warmup y ≥20 muestras seriales por cohorte solo si recursos/tiempo permiten; p95 nearest-rank e intervalos/variación reportados. Primero 50/100, luego 200/500/1000/5000 progresivamente. No reemplazar los umbrales ni elevar timeout para conseguir PASS.
6. Si quedan cuellos de botella demostrados, estudiar C (composición set-based) en un cambio separado. Índices/policies únicamente con evidencia adicional y aprobación específica.
7. Presentar comparación exactitud/latencias/memoria/buffers/locks y detenerse. No integrar con Cursor, lanzar ni abrir menú automáticamente.

## Objetivos y viabilidad

Los objetivos del propietario se conservan: p95 extendida 100≤500ms, 500≤1000ms, 1000≤1500ms, 5000≤3000ms. La implementación original incumple el objetivo de 100 en las muestras de F.1. Los otros umbrales no se midieron en esta fase por detención segura. Reducir lecturas ~9N de composición a N es una meta de diseño verificable, no un speedup garantizado: RLS, historical count, líneas, ranking y serialización permanecen. A 5000 la memoria/estadísticas/concurrencia son incertidumbres importantes. No extrapolar linealmente un p95 de cinco muestras, ni descartar outliers del lote de 200.

Si A+B no cumplen objetivos, emitir evidencia de incumplimiento y pedir decisión sobre otra optimización. No modificar unilateralmente límites, calidad, rango, puntos, defaults o contratos. No ocultar latencia filtrando pedidos ni convirtiendo desconocidos a cero.

## Reversión y migraciones

Conservar cuerpos originales y hashes antes del candidato. Revertir únicamente wrappers/lectores propios mediante una migración forward revisada a las definiciones originales; verificar grants/invoker/search_path y equivalencia del baseline. Sin borrar snapshots, capturas, ciclos, acuerdos, índices operativos o ledger; sin scripts down globales, reset ni backfill. Rollback de UI no altera historia ni captura. No reutilizar una versión instalada ni editar el hash comparativo autorizado. La integración con Cursor y cualquier base externa siguen exigiendo autorizaciones separadas.
