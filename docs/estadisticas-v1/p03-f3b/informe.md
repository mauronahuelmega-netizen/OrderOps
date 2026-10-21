# P03-F.3B — D1 propuesta sin instalación

**READY_FOR_SQL_REVIEW.** Nueva función privada única private.statistics_v1_summary_d1_candidate, reutiliza private.statistics_v1_read_core_candidate A+B. SQL completo en candidate-d1.sql; no es una migración aplicada ni se encuentra en supabase/migrations.

SHA-256: **9e8b793df40de1aeb6ecbb71c1ce4e828c717498e62340341d8784726ee78070**.

Dos diferencias frente al lector A+B: nombre nuevo y point_metrics AS MATERIALIZED. Firma/defaults/cuerpo restante idénticos; igualdad textual reversible comprobada. No se cambia fuente financiera, captura, membership, sizing200, límitesmicrosegundos, cursores/asOf, salidaJSON o decoder. CASEca/pa intactos evita ejecutar metrics para lado ausente; el momento de evaluación/materialización exige pruebas runtime de errores y partial.

Pruebas offline: rama/HEAD/root, hashes de cuatro originales+A+B, copia exacta inversa, parseAST del candidato/propuestas/testsSQL, sintaxisNode, comprobaciones invoker/search_path/guard/núcleo/ACLnuevo. **No compilación PL/pgSQL, equivalencia runtime, ACL efectivos ni benchmark D1 ejecutados.** Ninguna conexiónDB/Docker/API, servicios, instalación o commits. Último catálogo live corresponde a F3A; no afirmar identidad live nueva.

Preparado: diferencial triple de8períodos/2sorts/6actores, cursor y errores; instrumentación separada porlector; matriz completa para finanzas/adicionales/quality/NULL/histórico/reapertura/cancel/recomplete/nocturnas/DST/microsegundos/dosnegocios/concurrencia. Falta adaptación y ejecución del harness live para checkpoints ricos, solo después de autorizar instalación. Expectativa~67metrics en fixtureF3A21puntos frente235 no es medición ni garantía p95.

Seguridad: SECURITYINVOKER/STABLE, search_path fijo, rawprofile auth.uid/negocio, owner/manager/admin únicamente, guard núcleo repetido y tenantcheck. SQL concedeEXECUTE únicamente en objetoD1nuevo; no altera RLS/grants anteriores. Público original sigueintacto y no hay adopción del A+B.

Artefactos obligatorios: informe.md, candidate-d1.sql, functions.diff, semantic-map.md, differential-plan.md, security-audit.md, performance-risks.md, application-plan.md, evidence.json. Complementos inventariados: reference-ab-function.sql, proposed-d1-function.sql, baseline-preexisting.json, static-audit.json, differential-three-readers.sql e instrumentation.sql y scripts propios build/docs/evidence. Evidencia contiene hashes de TODOS nuevos archivos y preservación de preexistentes.

Detención: esperar revisión y autorización expresa del SHA antes de cualquier aplicación SQL. Sin optimizaciones C/A/B ni frontend/navegación/permisos, sin Phase04/05.

