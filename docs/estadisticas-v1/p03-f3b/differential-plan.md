# Equivalencia de tres lectores preparada, no ejecutada

Referencias: public.statistics_v1_summary original extendida, private.statistics_v1_summary_candidate A+B, private.statistics_v1_summary_d1_candidate D1. Usar BEGIN ISOLATION LEVEL REPEATABLE READ y un SELECT con tres invocaciones para cada entrada; mismos parámetros/asOf/actor y datos. Preservar igualdad original=A+B=D1 JSONB completo, arrays en orden, números y strings exactos; sin quitar series/campos/reasons ni reconstruir outputs. La igualdad JSONB no prueba igualdad textual de orden de keys: ese orden no pertenece al contrato. Decoders existentes se usan sin cambio sobre los tres outputs.

Ejecutable preparado: differential-three-readers.sql, incluye96 comparaciones iniciales (6actores autorizados ×8períodos ×2sorts), nextCursor solo cuando exista/no sea JSONnull, errores SQLSTATE+mensaje. Ejecutar con distintas variantes de fixture; esto no cubre por sí solo la matriz completa. Instrumentation.sql prepara los contadores; no instalar funciones de prueba.

| Escenario/fixture | Entradas y aserciones adicionales obligatorias |
|---|---|
| Base50/100 | F1fixture, 8períodos, límites1/5/20, sorts units/amount; JSON completo y decode |
| Productos/categorías | F2B products, varias identidades y NULL; suficientes filas para dos páginas; reutilizar mismo nextCursor en tres lectores, paginar hasta final con asOf fijo |
| Finanzas | F2B shapes: agreed_total, copy_total_price, unresolved/missing/reconciliación parcial, ajustes/descuentos/envío identificables, adicional/upsell/modificador; comparación exacta sin reinterpretar NULL |
| Ciclo de vida | F2B state-tests: captura, pending(reapertura), cancel, completed(recompletado), cambio agreement/composición; triple comparación después de CADA checkpoint y constraints inmediatos; no solo estado final |
| Nocturnas/partial | F2B temporal fixture; custom fechas exactas del fixture, apertura±1us, interno±1us, cierre±1us, asOf±1us; current3/previous3 en parcial; misma construcción requestKey/revision/offset del test F2B |
| DST/zonas | F2B dst-tests Lord_Howe2026-04-05 y2026-10-04, Kathmandu; custom días del fixture; gap/fold, previous cutoffNULL, razones y ausencia de rama inválida; no limitar al custom last30d |
| Calidad/histórico | F2B shapes: completado sin captura/fecha confiable, outsideSession fiable y NULL, source_conflict/monetary_conflict y mainUnitsNULL; historical global fuera de período debe mantenerse |
| Vacío/configuración | Ningún pedido, período sin facts, timezone ausente dentro de transacción; no point_metrics con configuración requerida; comparar exact/partial/unavailable por indicador |
| Errores | Invalid period/sort/limit/range, JSONnull cursor, time inválido, future/nonfinite asOf, stale revision/requestKey, offset inválido; mismos SQLSTATE y mensaje; no comparar errores como datos |
| Multi-tenant | F2B two-business shapes, seis roles, direct helpers; claims metadata falsos, sin sesión/perfil/negocio; outputs solo negocio de perfil, failclosed |
| Sesiones/200puntos | Múltiples/nocturnas/cortas/desiguales,199/200, período parcial; mapeo/intervalos/quality/cantidad y pertenencia exactamente iguales |
| Concurrencia | Reader RR compara tres mientras writer sintético cambia estado/finanzas sin commit y con commit en transacción distinta; no mezcla dentro del snapshot, nuevo snapshot ve cambio. Fixtures writer selectivamente limpiados tras aprobar diseño; nunca rollback global/reset |

Antes de probar, adaptar en archivos propios el harness F2B de pares a triples, incluir tercera respuesta en todos los checkpoints, y validar expectativas del fixture (cuenta/fechas) para evitar tests vacuos. Este paquete no contiene un runner live automático; instalación y adaptación live requieren aprobación posterior. No ejecutar los scripts F2B que instalan o sobrescriben evidencias previas.

Contadores: activar track_functions=all LOCAL solo tras seed/warmup; consultar pg_stat_xact_user_functions antes/después de CADA ejecución y restar por función; separar inclusive/self, no sumar padres e hijos. Desactivar para benchmark normal; nested auto_explain solo si ya preloaded, sin LOAD/DDL ni cambios persistentes. Identificar descriptores y contar ca/pa disponibles desde metadata/plan, contrastar con llamadas metrics descontando buckets/resumen/checks. Con F3A21puntos se estiman ~67 frente235; es predicción de diseño, no resultado medido. Conservar una source_items por elegible no conflictivo y checks independientes. Variar ambos lados ausentes/presentes, partial/no comparison/DST para demostrar que CASE no evalúa ramas inválidas.

Fallo: guardar parámetros/actorfixture/outputs completos/SQLSTATE y caso mínimo dentro de artefactos nuevos; detener certificación. No normalizar divergencias ni cambiar decoder.

