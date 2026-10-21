# Trabajo lógico y planes

Datos por consulta normal: tableCounterDeltas en synchronized-measurements.json y cpu-psi-correlation.json. Provienen de pg_stat_xact_user_tables antes/después en la misma transacción; no se activó track_functions/auto_explain en las muestras normales. Scans/tuples son trabajo lógico observado, no buffers ni CPU tiempo. Los contadores de la lectura de estadísticas no incluyen nuevas scans de tablas de negocio en esas vistas; no son fingerprint exhaustivo de todos los operadores.

| N | Lector | orders seq scans/tuples | financials seq scans/tuples | completion_items scans/tuples |
|---|---|---|---|---|
|50|Original|1.051 /48.875|150 /3.825|50seq /2.500|
|50|A+B y D1|151 /6.325|50 /1.275|50seq /2.500|
|100|Original|2.101 /195.250|300 /15.150|100index /100|
|100|A+B y D1|301 /25.150|100 /5.050|100index /100|

Dentro de cada grupo las tres muestras normales tienen los mismos contadores completos, incluidos profiles/indexes. No hay evidencia de más recorridos de tablas para el normal lento dentro del grupo. No excluye cambios de operadores, CPU por fila, plan cache o trabajo no cubierto por estos contadores.

Perfiles separados: original source_items450/900calls a50/100; A+B/D1:50/100. can_read original4.976/2.601 y A+B/D13.976/601. A50 original profiles6.336 index fetches frente a4.132; a1005.311 frente a907. completion_items deja el camino secuencial por un acceso indexado al variar la cohorte. Se confirma por scans internos capturados, no por inferencia de llamadas. No se identifica el número de pedidos como única variable causal; estadísticas, huella física, planificación y caché de consultas pueden influir.

Métricas: en esta ventana los contadores statistics_metrics son26 por original/A+B y10 por D1. Ambos períodos tienen2 puntos de serie y2 buckets legacy, con comparación disponible. El asOf temprano de hoy difiere de F.4A: no comparar estos contadores con73 métricas/23puntos de la ventana anterior como si fuese idéntico contrato temporal. response-shapes.json conserva período, asOf y hashes de outputs completos.

Buffers de perfiles a50: original16.900hits; A+B/D1≈8.977–8.990. A100 original≈23.654–23.658hits; A+B/D1≈4.030–4.051. Cero shared reads y temp blocks en los planes registrados. Un hit puede repetirse sobre la misma página. No convertirlo en bytes únicos, no atribuirlo a una muestra normal no instrumentada.

Plan-differences.json contiene diffs de consultas con el mismo Query Text entre los dos perfiles de cada lector/cohorte. Original: constantes de negocio/fechas/asOf pasan a $8/$14/$11 y otros parámetros; aparecen Result gates de ramas de comparación. Compatible con planificación custom→generic bajo auto tras invocaciones repetidas. Esto es evidencia real de diferencias del plan, sin que todos sus caminos ejecutados aumenten trabajo. A+B/D1: consultas compartidas observadas con shapes coincidentes entre perfiles. El logger registra solo sentencias≥10ms: 9 versus36 nested notices en original100 no implica36sentencias nuevas, sino muchas ejecuciones que superaron threshold bajo instrumentación. No sumar duraciones anidadas.

Original100 perfil1/2: ExecutionTime1.221,560→2.500,113ms, llamadas source_items900 y can_read2.601 constantes, buffers prácticamente iguales. Presión CPU del intervalo13,54→40,19%. Los tiempos propios/inclusivos también aumentan, pero son elapsed time instrumentado, no CPU pura; el mayor logging y cambio de plan confunden la comparación. No usar perfil2 como benchmark normal ni como prueba exclusiva de infraestructura.

Residuo C: evidencia a50 respalda relación autorizada materializada para evitar repeated seq scans/RLS; a100 la base ya usa índices y puede ganar mucho menos o empeorar al forzar materialización. Preparación de C intacta; este diagnóstico no la adopta ni corrige automáticamente. F.5B deberá mostrar equivalencia completa y beneficio real en ambos caminos.
