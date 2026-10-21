# Estadísticas V1 — P03-F.2A candidato SQL sin aplicación

**Veredicto: READY_WITH_LIMITATIONS.** SQL candidato completo y paquete de revisión preparados. Se comprobaron alcance, estructura, traslados textuales, preservación y decoders offline; no hubo conexión a bases, instalación, compilación PLpgSQL ni equivalencia/performance runtime. No aprobar aplicación automáticamente por este veredicto.

## Candidato y baseline

Migración nueva `supabase/migrations/20261013005000_statistics_v1_read_core_candidate.sql`; copia idéntica candidate.sql en este directorio.

**SHA-256: `fd88de8c0ec3f4a87d8a6782650d63cf4779d8170033a4c5b4f37edbd489faf9`.** Es el hash de este entregable para revisión, no una autorización de aplicación.

Rama codex/estadisticas-v1, HEAD `923300265323d411c5c91b7935472d5423d228d2`. Se leyó el inventario efectivo de versiones de OrderOps/Cursor sin modificarlo: HEAD `0e430b08342b638b02392927ed560ea5e0950403`, 119 migraciones; Estadísticas tenía 123 antes del candidato y última 04000. Versión 05000 sin colisión conocida. baseline.json registra inventarios y SHA de **2.104 archivos preexistentes**, incluyendo cambios del usuario, E.1, F.1 y las cuatro migraciones propias. evidence.json confirma preservación de todos los hashes y HEAD; cero commits y operaciones Git de integración.

## Funciones y routing

| Nueva función privada | Firma / defaults | Resultado |
|---|---|---|
| statistics_v1_read_core_candidate | `(p_period text,p_start_date date=NULL,p_end_date date=NULL,p_product_sort text='units',p_limit integer=5,p_cursor jsonb=NULL)` | Bundle interno legacy/effectiveFacts. Verifica principal y prepara cohort/digest. |
| statistics_v1_summary_base_candidate | Misma firma | Legacy completo extraído del core, sin fields de bundle. |
| statistics_v1_summary_candidate | Misma firma | Respuesta extendida candidata. Guard propio, llama core una sola vez y reutiliza datos. |

Las tres son STABLE SECURITY INVOKER con search_path fijo. Se revoca execute a PUBLIC/anon/authenticated/service_role únicamente en los nuevos objetos y se concede a authenticated; no cambia ACL de ningún original. Ninguna nueva tabla/datos persistentes, tipo, vista, índice, job o caché. Helpers originales de captura/digest/métricas/series siguen intactos.

**La migración no reemplaza ni redirige public.statistics_v1_summary, summary_base o series_response instaladas.** Conserva todas las firmas/defaults/contratos públicos y los originales para comparación. La aprobación futura de F.2B permitiría instalar y validar candidatos, no cambiar el tráfico de aplicación. Una adopción pública posterior exige un diff autorizado separado. No se modificó frontend/nav/permissions, incluyendo releasePending true.

## Diseño A+B y mapa semántico

El core copia la resolución temporal, sesiones/comparaciones, historical count y ensamblador legacy originales. Un eligible MATERIALIZED conserva active/status/tenant/fechas/cortes parciales, hace los joins financieros canónicos y aplica RLS. digests MATERIALIZED llama source_items/digest una vez por completion elegible no conflicted. La proyección effective conserva CASE de units/sales/reasons, reemplazando únicamente el digest repetido y referencia al acuerdo actual.

La relación se serializa una vez a bundle JSONB request-local. Los consumidores recuperan el composite existente mediante jsonb_populate_recordset: ventas, calidad, rankings/productos/categorías, buckets legacy y series. No usan snapshot histórico como fuente actual; siguen contrastándolo. La serie no llama al ensamblador legacy original ni vuelve a escanear effective_facts. El tramo desde count v_cn/v_pn hasta el final de la función de series está textualmente igual al original: temporalidad, microsegundos, pairing, sizing≤200, membership/conservación y validación de cohort intactos.

semantic-map.md documenta cada bloque/expresión financiera, temporal, calidad/cursor y JSON. functions.diff muestra originales/propuestos completos; candidate.sql no contiene placeholders. No se redujo contrato a los cuatro KPI ni se reinterpretaron descuentos, ajustes, upsells/envío/NULL. Las mejoras son hipótesis de ahorro, no resultados.

## Límites semánticos y de seguridad para revisión

1. **Arrays sin ORDER BY:** legacy incluye agregados con orden no declarado. Reorganizar el plan puede cambiar arrays manteniendo métricas. No se normalizan/ordenan arrays en el test para ignorarlo: igualdad completa debe pasar o habrá que corregir el candidato/pedir decisión.
2. **Rol NULL:** se añade IS NULL a guards originales. NOT IN con NULL no deniega por sí solo; el baseline define profiles.role NOT NULL y check, por lo que el estado no es admitido actualmente. Se presenta el hardening expresamente; si el catálogo destino permite NULL, cambia comportamiento y requiere revisión específica, no afirmación de equivalencia. No se altera una constraint para ensayar ese caso.
3. **Barrera de vista:** original effective_facts sigue intacta, pero el core prepara desde sus tablas y utiliza solo su tipo. La barrera de esa vista no se ejecuta en eligible. RLS de cada tabla y statistics_can_read, invoker, guard propio y MATERIALIZED siguen presentes; la arquitectura debe validarse en planes y direct helpers. No se anuncia eliminación de checks RLS como ganancia.
4. **Evaluaciones omitidas:** composición conflicted no ejecuta digest; previous fuera del corte puede filtrarse antes de composición. STABLE/IMMUTABLE y constraints sostienen valores equivalentes, pero excepciones/definiciones futuras/volatility distinta requieren pruebas. No esconder divergencias de SQLSTATE.
5. **JSON/composite:** pendiente demostrar precisión/escala textuales, timestamp microsegundos, NULL, array order y cardinalidad en ejecución. No se modifican decoders para tolerarlas.

Estos puntos motivan READY_WITH_LIMITATIONS. La aplicación requiere revisión expresa del SQL/hash y de estas condiciones.

## Verificaciones ejecutadas y preparadas

- p03-f2a-static.verify.mjs PASS: tres funciones nuevas, seis delimitadores emparejados, paréntesis léxicos balanceados, invoker/STABLE, un único call site source_items, ausencia de DML/DDL de datos y reemplazo de originales, grants limitados a nuevos nombres, tramo temporal idéntico, candidate copy/hash y preservación de 2.104 fuentes. No es parser SQL ni compilador PLpgSQL.
- p03-f2a-decode.verify.ts --fixtures PASS: decoders actuales de legacy/series, comparación JSON y tenant extranjero rechazado, **sobre fixture sintético existente**. No es respuesta SQL de un candidato.
- Revisión de generación encontró/corrigió referencia financiera residual f y escape de delimitador dólar en el generador nuevo antes de sellar hash; auditoría posterior PASS. No se modificó original ni se ejecutó una versión defectuosa.
- TypeScript completo offline: resultado registrado en typescript-check.txt. No altera generated files al usar noEmit/incremental false.
- differential.sql preparado, no ejecutado: ocho períodos, sorts, cursores, dos tenants/roles, misma SELECT/snapshot para cuatro lectores y denegación de helpers. No tiene fixtures DDL ni commit; exige transacción sintética/marca/lista de actores explícitos. Matriz ampliada/agenda de concurrencia y export/decoder en differential-plan.md; no se presenta esa matriz como cobertura ejecutada.

No había parser PostgreSQL offline instalado entre las dependencias comprobadas; no se instaló tooling ni se contactó servidor para sustituirlo. Compilación, ACL/RLS runtime, todos los casos diferenciales y benchmarks son condiciones de F.2B, no conclusiones de esta auditoría.

## Riesgos de rendimiento y condiciones de avance

performance-risks.md detalla memoria O(cohort), JSON request-local no necesariamente limitado por work_mem, materializaciones/spills, joins correlacionados/estimaciones, cardinalidad y costo legacy. Reducir lecturas no garantiza eliminar trabajo cuadrático ni cumplir p95. No se midió velocidad candidata ni se cambió SQL/settings instalado, índices o timeout de consulta.

application-rollback.md establece gate adversarial/live, archivos/catálogo/hashes, instalación transaccional exclusiva autorizada, equivalencia/seguridad antes de benchmarks, progresión 50/100/200/500/1000/5000 con 15s de consulta, criterios de detención y reversión forward. Se conserva el timeout de instalación60s como presupuesto DDL distinto, no para declarar éxito de consultas. Objetivos p95 originales sin cambios.

Rollback candidate-only no requiere drops/datos/ledger: dejar de usar el candidato, originales activos. Si una adopción futura cambia wrappers, la reversión forward restaura únicamente definiciones propias aprobadas, preservando captura/historia. No integra ramas ni modifica Cursor.

## Inventario y detención

Nuevos: una migración, tres scripts p03-f2a (build/static/decode) y este directorio de revisión: baseline/generation/evidence JSON, candidate/original/proposed SQL, functions.diff, differential.sql/plan, decoder-tests, semantic-map, security-audit, performance-risks, application-rollback, typescript-check e informe. Lista exacta y SHA-256 en evidence.json, excluyendo hash autorreferencial de evidence.

No conecté ninguna base, inicié contenedores/servicios, ejecuté DDL/migraciones/SQL candidato ni realicé commits/merge/rebase/cherry-pick/push/deploy. **Detención P03-F.2A. Esperar autorización expresa de hash/SQL antes de aplicar siquiera en Supabase aislado.**
