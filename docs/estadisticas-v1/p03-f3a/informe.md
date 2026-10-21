# P03-F.3A — Perfilado del costo residual

Veredicto **READY_WITH_LIMITATIONS**. Recomendación concreta: materializar point_metrics en una futura función privada paralela, antes de una reescritura amplia de JSON; evaluar por separado materialización de joins/conteo histórico y composición set-based.

Preflight y cierre: rama codex/estadisticas-v1, HEAD 923300265323d411c5c91b7935472d5423d228d2; proyecto exclusivo orderops-statistics-v1-test-74718de66a41, API127.0.0.1:56321 y DB127.0.0.1:56322, cinco contenedores sanos, red y dos volúmenes del manifest. Ledger124; candidato SHA fd88de8c0ec3f4a87d8a6782650d63cf4779d8170033a4c5b4f37edbd489faf9, fuentes/funciones/ACL/policies/constraints/índices iguales a F2B. RPC pública original activa. Ver baseline y final-preservation para identidad y catálogo completos.

| Pedidos | Original p50 ms | Original máximo ms | Candidato p50 ms | Candidato máximo ms |
|---:|---:|---:|---:|---:|
| 50 | 900.452 | 1343.508 | 287.770 | 651.807 |
| 100 | 1507.338 | 2054.178 | 288.888 | 307.580 |

Cada valor usa cinco muestras normales seriales, warmup separado y timeout15s. p95 exploratorio coincide con máximo; no es certificación de objetivos. Funciones instrumentadas y planes anidados están separados en function-profile.json y plans/.

Hallazgos: candidato logra 50/100 composiciones para50/100 pedidos frente450/900 originales. En100 la composición inclusiva cuesta115.770ms y la consulta de series101.772ms; metrics se evalúa235veces independientemente del volumen. Núcleo156.945ms incluye composición y joins: no sumar al anterior. Scans de orders y finanzas100loops demuestran repetición. Historical count tiene sensibilidad al plan; candidato50=46.213ms, candidato100 por debajo del umbral10ms, mientras sonda100=135.693–163.316ms con plan diferente. JSONB proxies2.631–7.593ms: no prioridad inicial.

Pruebas ejecutadas: adversarial offline, identidad live por cohorte y cierre, catálogo124/candidato/original, dos transacciones fixture con14EXPLAIN cada una (2warmup+10normal+2instrumentadas), transacción de sondas100 con18EXPLAIN (3warmup+15normal). Queries autenticadas con usuario owner sintético; configuración track/auto_explain/jit solo LOCAL, sin persistencia ni instalación. Rollback y conteos vacíos comprobados tras cada cierre. Todas completaron sin timeout/error/deadlock.

No200+: alcance acotado50/100 suficiente para perfil; omisión deliberada, no atribuir a gate fallido. No estrés, HTTP ni múltiples lectores. No pico de memoria de backend; no spills observados en planes. No nuevas pruebas de equivalencia funcional ni seguridad completa: sin cambios SQL que certificar; deberán ejecutarse antes de adoptar otra variante. Fixture actual una línea producto sin identidad, misma jornada, comparación previa sin hechos; costos de categorías/ruleEvidence ricos y DST/períodos grandes siguen inciertos. No recuperar causalmente el outlierF2B ni declarar resuelto p95.

Preservación: cambios solo en documentación/scripts propios F3A y archivos runtime locales ignorados. Sin migraciones/DDL/grants/RLS, sin modificación de funciones instaladas ni RPC pública, sin commits ni servicios iniciados/reparados. Archivos anteriores hash-preservados, datos sintéticos rollback. Inventario completo y SHA en evidence.json; planes crudos y perfiles permanecen reproducibles, sin tokens ni credenciales en documentos.

Artefactos: baseline.json, function-profile.json, plans/, residual-cost-analysis.md, alternatives.md, recommendation.md, evidence.json; complementos before/after/results/volume50/100/component-probes/preservation/final-preservation. Scripts propios inventariados en evidence; reutilización de fixture F1 sin cambiarlo. Detención al finalizar F3A: ninguna adopción pública ni nueva optimización autorizada.

