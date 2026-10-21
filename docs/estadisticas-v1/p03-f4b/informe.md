# P03-F.4B — Auditoría Docker/WSL2

Veredicto: **INCONCLUSIVE** respecto de la causa de la variabilidad y de la estabilidad actual bajo carga. El aislamiento y la preservación pasaron. Hay evidencia de variación del trabajo lógico de PostgreSQL y de presión ambiental de CPU en WSL2; no hay medición sincronizada que permita atribuir a Docker, a un proceso ajeno o a JIT el outlier de 9.570,334 ms.

Worktree/branch/HEAD aprobados: OrderOps-Estadisticas / codex/estadisticas-v1 / 923300265323d411c5c91b7935472d5423d228d2. Preflight adversarial offline y live PASS: proyecto orderops-statistics-v1-test-74718de66a41, API127.0.0.1:56321, DB127.0.0.1:56322, cinco contenedores propios sanos, red/dos volúmenes exclusivos, identidad privada, ledger124, hashes A+B/D1 y migraciones originales. Catálogo/ACL/RLS/constraints/grants iguales a la referencia instalada. RPC pública original: private.statistics_v1_series_response. C no está instalada. Evidencia completa: preflight.json y live-preservation.json.

Hallazgos:

- Docker Desktop4.56.0 (214940), engine29.1.3, WSL2/kernel6.18.54.1; motor4CPU/7,70GiB compartidos, 41 contenedores/26 running. PostgreSQL sin cuota dedicada, sin CPU throttling u OOM registrados en su cgroup.
- Linux PSI CPU some avg10=9,09–16,51% en las tres observaciones de reposo, mientras el contenedor PostgreSQL marcó 0,00–0,01% CPU. Existe presión de scheduling ambiental en la VM. No demuestra que afectó una consulta histórica concreta.
- Memoria disponible Linux≈3,59GiB y host≈4,21GiB en snapshots; contenedor1,57% del motor, swap Linux usada≈464KiB/2GiB. PSI memoria avg10=0. No hay evidencia actual de OOM o presión intensa de memoria; no puede reconstruirse el pasado con estas cifras.
- Volumen PostgreSQL local/ext4 dentro del motor; no bind mount de PGDATA al worktree Windows. PSI I/O distinto de cero, pero los planes F.4A recopilados muestran cero shared reads y cero temp blocks. No hay plan ni I/O por consulta para el outlier.
- A50, lector original: buffers hits post-benchmark12.268→111.112→110.486, con EXPLAIN660,740→1.545,237→1.387,663ms entre tandas. También crecen hits de A+B/D1. Es evidencia de trabajo lógico variable; el nodo externo Result no muestra cuál plan interno cambió. No se atribuye a caché fría de disco.
- D1 a100: p95 476,775ms y606,202ms en tandas completas; tercera incompleta. Las mediciones previas no certifican estabilidad ni meta≤500ms. Tabla de todos los lectores, muestras y outliers: latency-table.md y measurement-results.json.

No se repitió una batería sintética: el análisis existente y tres snapshots nuevos respondieron preguntas concretas sin crear fixtures. Faltan CPU total/disk counters Windows fiables (campos null), planificación/JIT anidados durante consultas lentas, timeline consulta↔recursos y ubicación física del VHDX. Se identifican explícitamente como no disponibles, sin reemplazarlos por ceros.

Recomendación: **antes de F.5B, un experimento breve de observabilidad**, sin instalar C ni cambiar infraestructura. Capturar por consulta start/end UTC, latencia normal y un perfil anidado separado en las mismas cohortes50/100, junto con PSI y deltas I/O/cpu cgroup. Diferenciar aumento de lecturas lógicas, plan interno y presión ambiental. No requiere detener Cursor, limpiar cachés ni alterar configuración. Mantener metas p95 como exploratorias, sin aprobar SLA ni redefinirlas.

Preservación: hashes de archivos preexistentes y ocho logs privados, catálogo y datos registrados antes/después intactos. Sin SQL instalado/DDL/DML/fixtures, configuración persistente, reinicios, commits o modificaciones compartidas. El auditor corrigió una suposición de nombre de lector interno; la definición completa coincide con la referencia aprobada. No fue un cambio SQL ni discrepancia del entorno.

Inventario exacto y SHA-256 en evidence.json. Scripts adicionales propios: p03-f4b-audit.mjs (solo lectura live/host) y p03-f4b-report.mjs (offline). Detención de F.4B; F.5B no iniciada.
